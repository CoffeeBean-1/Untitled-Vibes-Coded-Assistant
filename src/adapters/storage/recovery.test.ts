import { openDB } from 'idb';
import { describe, expect, it, vi } from 'vitest';
import { IndexedDbWorkspace } from './indexedDb';
import { createInitialState } from '../../domain/model';
import { stateSchema as legacyStateSchema } from '../../domain/legacyModel';
import { createBackup } from '../../domain/backup';

const clock = { now: () => new Date('2026-10-26T15:00:00Z') };
describe('migration and recovery transactions', () => {
  it('upgrades an actual version-one database without losing tasks, prefs or schedules', async () => {
    const name = crypto.randomUUID();
    const old = legacyStateSchema.parse({ ...createInitialState(clock.now()), schemaVersion: 1 });
    old.tasks[0].title = 'Owner-entered task'; old.tasks[0].revision = 7; old.preferences.satire = false;
    const db = await openDB(name, 1, { upgrade(database) { database.createObjectStore('workspace'); } });
    await db.put('workspace', old, 'synthetic'); db.close();
    const repo = new IndexedDbWorkspace(name, clock); const next = await repo.load();
    expect(next.schemaVersion).toBe(3); expect(next.tasks[0].title).toBe('Owner-entered task');
    expect(next.tasks[0].revision).toBe(7); expect(next.preferences.satire).toBe(false);
    expect(await repo.listRecoveries()).toHaveLength(1); await repo.close();
  });
  it('saves a recoverable snapshot before replace and can restore it with increasing revisions', async () => {
    const repo = new IndexedDbWorkspace(crypto.randomUUID(), clock); const original = await repo.load();
    const bundle = createBackup(createInitialState(clock.now()), clock.now(), true); bundle.tasks = [bundle.tasks[0]];
    const restored = await repo.restore(bundle, { mode: 'replace', conflicts: 'replace' }, original.revision);
    expect(restored.tasks).toHaveLength(1); expect(await repo.listRecoveries()).toHaveLength(1);
    const snapshot = (await repo.listRecoveries())[0]; const recovered = await repo.recover(snapshot.id, restored.revision);
    expect(recovered.tasks).toHaveLength(3); expect(recovered.revision).toBeGreaterThan(restored.revision);
    expect(await repo.listRecoveries()).toHaveLength(2); await repo.close();
  });
  it('aborts restoration on snapshot failure and detects changes after preview', async () => {
    const repo = new IndexedDbWorkspace(crypto.randomUUID(), clock); const original = await repo.load();
    const bundle = createBackup(createInitialState(clock.now()), clock.now(), true);
    const nativePut = IDBObjectStore.prototype.put;
    const spy = vi.spyOn(IDBObjectStore.prototype, 'put').mockImplementation(function (this: IDBObjectStore, value: unknown, key?: IDBValidKey) {
      if (this.name === 'recovery') throw new DOMException('No space for safety snapshot', 'QuotaExceededError');
      return nativePut.call(this, value, key);
    });
    await expect(repo.restore(bundle, { mode: 'replace', conflicts: 'replace' }, original.revision)).rejects.toThrow();
    spy.mockRestore(); expect(await repo.load()).toEqual(original);
    await repo.dispatch({ type: 'complete', operationId: 'changed', id: 'demo-brief', expectedRevision: 1, done: true });
    await expect(repo.restore(bundle, { mode: 'merge', conflicts: 'keep' }, original.revision)).rejects.toThrow('changed after the preview');
    await repo.close();
  });
});
