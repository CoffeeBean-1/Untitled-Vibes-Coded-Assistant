import { openDB } from 'idb';
import { describe, expect, it, vi } from 'vitest';
import { IndexedDbWorkspace } from './WorkspaceRepository';

const start = new Date('2026-10-27T15:00:00.000Z');
const task = { title: 'Persistent alarm', status: 'todo' as const, priority: 'normal' as const, due: { kind: 'none' as const } };
describe('reminder transactions and foreground lease', () => {
  it('elects one owner, fails over after expiry and does not bump workspace revisions for heartbeats', async () => {
    let now = start; const clock = { now: () => now }; const name = crypto.randomUUID();
    const first = new IndexedDbWorkspace(name, clock); const second = new IndexedDbWorkspace(name, clock);
    await first.load();
    await first.dispatch({ type: 'create', operationId: 'create', id: 'task', task, reminderDelay: 1000 });
    const owned = await first.dispatch({ type: 'reconcile', operationId: 'claim', ownerId: 'first' });
    now = new Date(start.getTime() + 2000);
    expect((await second.dispatch({ type: 'reconcile', operationId: 'blocked', ownerId: 'second' })).history).toHaveLength(0);
    expect((await first.load()).revision).toBe(owned.revision);
    now = new Date(start.getTime() + 11000);
    const fired = await second.dispatch({ type: 'reconcile', operationId: 'takeover', ownerId: 'second' });
    expect(fired.history).toHaveLength(1);
    expect((await first.dispatch({ type: 'reconcile', operationId: 'old-owner', ownerId: 'first' })).history).toHaveLength(1);
    await second.releaseCoordinator('first');
    const db = await openDB(name, 3); expect((await db.get('coordination', 'foreground')).ownerId).toBe('second');
    await second.releaseCoordinator('second'); expect(await db.get('coordination', 'foreground')).toBeUndefined();
    db.close(); await first.close(); await second.close();
  });
  it('serializes task completion with competing send-time reconciliation and blocks obsolete schedules', async () => {
    let now = start; const clock = { now: () => now }; const name = crypto.randomUUID();
    const first = new IndexedDbWorkspace(name, clock); const second = new IndexedDbWorkspace(name, clock);
    await first.load(); await first.dispatch({ type: 'create', operationId: 'create', id: 'task', task, reminderDelay: 1000 });
    now = new Date(start.getTime() + 2000);
    const complete = first.dispatch({ type: 'complete', operationId: 'complete', id: 'task', expectedRevision: 1, done: true });
    const reconcile = second.dispatch({ type: 'reconcile', operationId: 'send', ownerId: 'second' });
    await Promise.all([complete, reconcile]);
    const current = await first.load(); expect(current.reminders[0].status).toBe('cancelled'); expect(current.history).toHaveLength(0);
    await first.close(); await second.close();
  });
  it('rolls back a compound task/reminder mutation before commit and deduplicates retry after lost acknowledgement', async () => {
    const repo = new IndexedDbWorkspace(crypto.randomUUID(), { now: () => start }); await repo.load();
    const before = await repo.dispatch({ type: 'create', operationId: 'create', id: 'task', task, reminderDelay: 1000 });
    const command = { type: 'complete' as const, operationId: 'complete', id: 'task', expectedRevision: 1, done: true };
    const nativePut = IDBObjectStore.prototype.put;
    const spy = vi.spyOn(IDBObjectStore.prototype, 'put').mockImplementation(function (this: IDBObjectStore, value: unknown, key?: IDBValidKey) {
      const result = nativePut.call(this, value, key);
      if (this.name === 'workspace') this.transaction.abort();
      return result;
    });
    await expect(repo.dispatch(command)).rejects.toThrow(); spy.mockRestore();
    expect(await repo.load()).toEqual(before);
    const committed = await repo.dispatch(command); // Pretend the caller lost this acknowledgement.
    expect(await repo.dispatch(command)).toEqual(committed);
    expect(committed.tasks.find(item => item.id === 'task')?.revision).toBe(2);
    expect(committed.reminders).toHaveLength(1); expect(committed.reminders[0].status).toBe('cancelled');
    await repo.close();
  });
  it('atomically migrates an actual version-two database and retains a recoverable original', async () => {
    const name = crypto.randomUUID();
    const seed = new IndexedDbWorkspace(crypto.randomUUID(), { now: () => start }); const current = await seed.load(); await seed.close();
    const { pickups: _pickups, reminderSettings: _settings, ...fields } = current; void _pickups; void _settings;
    const old = { ...fields, schemaVersion: 2, reminders: [{ id: 'legacy', taskId: current.tasks[0].id, fireAt: '2026-10-28T15:00:00.000Z', status: 'scheduled' }] };
    const db = await openDB(name, 2, { upgrade(database) { database.createObjectStore('workspace'); database.createObjectStore('recovery'); } });
    await db.put('workspace', old, 'synthetic'); db.close();
    const repo = new IndexedDbWorkspace(name, { now: () => start }); const migrated = await repo.load();
    expect(migrated.schemaVersion).toBe(3); expect(migrated.reminders[0]).toMatchObject({ id: 'legacy', status: 'scheduled', revision: 1 });
    expect(await repo.listRecoveries()).toHaveLength(1);
    const upgraded = await openDB(name, 3); const snapshots = await upgraded.getAll('recovery'); expect(snapshots[0].state).toEqual(old);
    upgraded.close(); await repo.close();
  });
});
