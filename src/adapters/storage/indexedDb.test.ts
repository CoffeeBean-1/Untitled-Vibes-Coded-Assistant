import { openDB } from 'idb';
import { describe, expect, it } from 'vitest';
import { IndexedDbWorkspace } from './indexedDb';

const clock = { now: () => new Date('2026-10-26T15:00:00Z') };

describe('IndexedDB repository', () => {
  it('persists tasks, preferences, reminders and history through a new connection', async () => {
    const name = crypto.randomUUID();
    const first = new IndexedDbWorkspace(name, clock);
    await first.load();
    await first.dispatch({ type: 'create', operationId: 'add', id: 'task', task: { title: 'Stored task', status: 'todo', priority: 'normal', due: { kind: 'none' } }, reminderDelay: 10000 });
    await first.dispatch({ type: 'preferences', operationId: 'prefs', preferences: { theme: 'dark', satire: false } });
    await first.close();
    const second = new IndexedDbWorkspace(name, { now: () => new Date('2026-10-26T15:00:11Z') });
    const loaded = await second.load();
    expect(loaded.tasks.at(-1)?.title).toBe('Stored task');
    expect(loaded.preferences).toEqual({ theme: 'dark', satire: false });
    expect((await second.dispatch({ type: 'reconcile', operationId: 'fire' })).history).toHaveLength(1);
    await second.close();
  });
  it('preserves stored data after validation failure inside a write transaction', async () => {
    const repo = new IndexedDbWorkspace(crypto.randomUUID(), clock);
    const original = await repo.load();
    await expect(repo.dispatch({ type: 'create', operationId: 'invalid', id: 'invalid', task: { title: '', status: 'todo', priority: 'normal', due: { kind: 'none' } }, reminderDelay: 10000 })).rejects.toThrow();
    expect(await repo.load()).toEqual(original);
    await repo.close();
  });
  it('does not reset an unsupported or corrupt persisted schema', async () => {
    const name = crypto.randomUUID();
    const repo = new IndexedDbWorkspace(name, clock);
    await repo.load();
    await repo.close();
    const db = await openDB(name, 3);
    const unsupported = { schemaVersion: 999, keep: 'synthetic recovery evidence' };
    await db.put('workspace', unsupported, 'synthetic');
    await expect(repo.load()).rejects.toThrow();
    expect(await db.get('workspace', 'synthetic')).toEqual(unsupported);
    db.close(); await repo.close();
  });
  it('serializes two windows without duplicating due-reminder history', async () => {
    const name = crypto.randomUUID();
    let currentTime = clock.now();
    const sharedClock = { now: () => currentTime };
    const first = new IndexedDbWorkspace(name, sharedClock);
    const second = new IndexedDbWorkspace(name, sharedClock);
    await first.load();
    await first.dispatch({ type: 'create', operationId: 'add', id: 'task', task: { title: 'One alert', status: 'todo', priority: 'normal', due: { kind: 'none' } }, reminderDelay: 10000 });
    currentTime = new Date('2026-10-26T15:00:11Z');
    await Promise.all([first.dispatch({ type: 'reconcile', operationId: 'window1' }), second.dispatch({ type: 'reconcile', operationId: 'window2' })]);
    expect((await first.load()).history).toHaveLength(1);
    await first.close(); await second.close();
  });
});
