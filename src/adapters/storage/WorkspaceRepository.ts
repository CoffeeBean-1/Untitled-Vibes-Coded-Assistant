import { openDB, type IDBPDatabase } from 'idb';
import { applyCommand, createInitialState, DomainError, migrateState, stateSchema, type Command, type State } from '../../domain/model';
import { backupFingerprintData, backupSchema, restoreBackup, type Backup, type RestoreOptions } from '../../domain/backup';
import { cancelReminder } from '../../domain/reminders';
import { systemClock, type Clock } from '../../shared/clock';

export interface RecoveryEntry { id: string; createdAt: string; reason: string }
export interface WorkspaceRepository {
  load(): Promise<State>;
  dispatch(command: Command): Promise<State>;
  restore?(backup: Backup, options: RestoreOptions, expectedRevision: number): Promise<State>;
  listRecoveries?(): Promise<RecoveryEntry[]>;
  recover?(id: string, expectedRevision: number): Promise<State>;
  releaseCoordinator?(ownerId: string): Promise<void>;
  close(): Promise<void>;
}

export class IndexedDbWorkspace implements WorkspaceRepository {
  private connection?: Promise<IDBPDatabase>;
  constructor(private name = 'cai-synthetic-v1', private clock: Clock = systemClock) {}
  private database() {
    if (!this.connection) this.connection = openDB(this.name, 3, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) db.createObjectStore('workspace');
        if (oldVersion < 2) db.createObjectStore('recovery');
        if (oldVersion < 3) db.createObjectStore('coordination');
      },
      blocking: () => { void this.close(); },
      terminated: () => { this.connection = undefined; },
    }).catch((error: unknown) => { this.connection = undefined; throw error; });
    return this.connection;
  }
  async load(): Promise<State> {
    const db = await this.database(); const tx = db.transaction(['workspace', 'recovery'], 'readwrite');
    try {
      const existing: unknown = await tx.objectStore('workspace').get('synthetic');
      const state = existing === undefined ? createInitialState(this.clock.now()) : migrateState(existing);
      const upgraded = existing !== undefined && typeof existing === 'object' && existing !== null && 'schemaVersion' in existing && existing.schemaVersion !== 3;
      if (upgraded) await tx.objectStore('recovery').put({ id: `migration-${crypto.randomUUID()}`, createdAt: this.clock.now().toISOString(), reason: 'Before workspace upgrade', state: existing }, `migration-${crypto.randomUUID()}`);
      if (existing === undefined || upgraded) await tx.objectStore('workspace').put(state, 'synthetic');
      await tx.done; return state;
    } catch (error) { try { tx.abort(); } catch { /* Preserve original error. */ } await tx.done.catch(() => undefined); throw error; }
  }
  async dispatch(command: Command): Promise<State> {
    const db = await this.database(); const tx = db.transaction(['workspace', 'coordination'], 'readwrite');
    try {
      const state = stateSchema.parse(await tx.objectStore('workspace').get('synthetic'));
      if (command.type === 'reconcile') {
        const ownerId = command.ownerId ?? 'direct-domain-client';
        const lease = await tx.objectStore('coordination').get('foreground');
        const now = this.clock.now().getTime();
        if (lease && lease.ownerId !== ownerId && lease.expiresAt > now) { await tx.done; return state; }
        if (!lease || lease.ownerId !== ownerId || lease.expiresAt - now < 6000) await tx.objectStore('coordination').put({ ownerId, expiresAt: now + 10000 }, 'foreground');
      }
      const next = applyCommand(state, command, this.clock.now());
      if (next !== state) await tx.objectStore('workspace').put(next, 'synthetic');
      await tx.done; return next;
    } catch (error) { try { tx.abort(); } catch { /* Preserve original error. */ } await tx.done.catch(() => undefined); throw error; }
  }
  async restore(raw: Backup, options: RestoreOptions, expectedRevision: number): Promise<State> {
    const backup = backupSchema.parse(raw);
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(backupFingerprintData(backup)));
    const fingerprint = [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, '0')).join('');
    const db = await this.database(); const tx = db.transaction(['workspace', 'recovery'], 'readwrite');
    try {
      const state = stateSchema.parse(await tx.objectStore('workspace').get('synthetic'));
      const alreadyImported = state.importedBundles.some((item) => item.id === backup.bundleId);
      if (!alreadyImported && state.revision !== expectedRevision) throw new DomainError('Your workspace changed after the preview. Select the file again to review the latest differences.');
      const next = restoreBackup(state, backup, options, fingerprint);
      if (next !== state) {
        const id = crypto.randomUUID();
        const snapshot = { id, createdAt: this.clock.now().toISOString(), reason: options.mode === 'replace' ? 'Before replacing workspace' : 'Before merging backup', state };
        await tx.objectStore('recovery').put(snapshot, id);
        const verified = await tx.objectStore('recovery').get(id);
        if (!verified || verified.state.revision !== state.revision) throw new DomainError('The recovery snapshot could not be verified. Nothing was restored.');
        await tx.objectStore('workspace').put(next, 'synthetic');
      }
      await tx.done; return next;
    } catch (error) { try { tx.abort(); } catch { /* Preserve original error. */ } await tx.done.catch(() => undefined); throw error; }
  }
  async listRecoveries(): Promise<RecoveryEntry[]> {
    const db = await this.database();
    const values: { id: string; createdAt: string; reason: string }[] = await db.getAll('recovery');
    return values.map(({ id, createdAt, reason }) => ({ id, createdAt, reason })).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  async recover(id: string, expectedRevision: number): Promise<State> {
    const db = await this.database(); const tx = db.transaction(['workspace', 'recovery'], 'readwrite');
    try {
      const current = stateSchema.parse(await tx.objectStore('workspace').get('synthetic'));
      if (current.revision !== expectedRevision) throw new DomainError('Your workspace changed. Review recovery again before continuing.');
      const snapshots: { id: string; state: unknown }[] = await tx.objectStore('recovery').getAll();
      const snapshot = snapshots.find((item) => item.id === id);
      if (!snapshot) throw new DomainError('That recovery snapshot is no longer available.');
      const next = migrateState(snapshot.state);
      next.namespaceId = current.namespaceId; next.revision = current.revision + 1; next.undo = null;
      next.reminders.forEach(item => cancelReminder(item, 'Recovered; review before scheduling again')); 
      const safetyId = crypto.randomUUID();
      await tx.objectStore('recovery').put({ id: safetyId, createdAt: this.clock.now().toISOString(), reason: 'Before recovering workspace', state: current }, safetyId);
      await tx.objectStore('workspace').put(stateSchema.parse(next), 'synthetic');
      await tx.done; return next;
    } catch (error) { try { tx.abort(); } catch { /* Preserve original error. */ } await tx.done.catch(() => undefined); throw error; }
  }
  async releaseCoordinator(ownerId: string) {
    const db = await this.database(); const tx = db.transaction('coordination', 'readwrite');
    const lease = await tx.store.get('foreground');
    if (lease?.ownerId === ownerId) await tx.store.delete('foreground');
    await tx.done;
  }
  async close() { const connection = this.connection; this.connection = undefined; if (connection) (await connection).close(); }
}
