import { describe, expect, it } from 'vitest';
import { applyCommand, createInitialState, type State } from './model';
import { createBackup, parseBackup, previewRestore, restoreBackup } from './backup';

const now = new Date('2026-10-26T15:00:00Z');
const initial = () => createInitialState(now);
const backup = (state: State) => createBackup(state, now, true);

describe('portable backup boundary', () => {
  it('round-trips supported fields while excluding structured sensitive links and calendar state', () => {
    const state = initial();
    state.tasks[0].description = 'Private task text reviewed by the owner';
    state.tasks[0].references = [{ kind: 'meeting', url: 'https://example.zoom.us/j/123' }, { kind: 'tracking', url: 'https://order.toasttab.com/track/123' }, { kind: 'generic', url: 'https://example.com/reference' }];
    const result = parseBackup(JSON.stringify(backup(state)));
    expect(result.tasks[0].references).toEqual([{ kind: 'generic', url: 'https://example.com/reference' }]);
    expect(result.tasks[0].description).toContain('reviewed');
    expect(JSON.stringify(result)).not.toContain('example.zoom.us');
    expect(result).not.toHaveProperty('anchor');
    expect(createBackup(state, now, false).tasks[0].description).toBe('');
  });
  it('rejects malformed, future-version, oversized, dangling, duplicate and authorization-bearing bundles', () => {
    const value = backup(initial());
    for (const invalid of [{ ...value, schemaVersion: 999 }, { ...value, tasks: [value.tasks[0], value.tasks[0]] }, { ...value, reminderRules: [{ id: 'r', taskId: 'missing', fireAt: now.toISOString() }] }, { ...value, approvalGates: { G2: 'approved' } }]) expect(() => parseBackup(JSON.stringify(invalid))).toThrow();
    expect(() => parseBackup('not JSON')).toThrow();
    expect(() => parseBackup(' '.repeat(5 * 1024 * 1024 + 1))).toThrow('5 MiB');
  });
  it('does not merge unrelated task IDs across namespaces, and maps reminders to their imported targets', () => {
    const source = applyCommand(initial(), { type: 'remind', operationId: 'r', id: 'demo-brief', expectedRevision: 1, delay: 10000 }, now);
    const destination = initial(); const bundle = backup(source);
    const restored = restoreBackup(destination, bundle, { mode: 'merge', conflicts: 'keep' }, 'digest');
    expect(restored.tasks).toHaveLength(6);
    const mapping = restored.sourceMappings.find((item) => item.sourceId === 'demo-brief')!;
    expect(mapping.localId).not.toBe('demo-brief');
    expect(restored.reminders).toContainEqual(expect.objectContaining({ taskId: mapping.localId, status: 'cancelled' }));
    expect(restoreBackup(restored, bundle, { mode: 'merge', conflicts: 'keep' }, 'digest')).toBe(restored);
    expect(() => restoreBackup(restored, bundle, { mode: 'merge', conflicts: 'keep' }, 'different')).toThrow('different content');
  });
  it('makes same-source conflicts explicit and retains unchanged local schedules', () => {
    const state = initial(); const bundle = backup(state);
    bundle.tasks[0].title = 'Imported wording';
    expect(previewRestore(state, bundle, { mode: 'merge', conflicts: 'keep' }).conflicts).toBe(1);
    expect(restoreBackup(state, bundle, { mode: 'merge', conflicts: 'keep' }, 'keep').tasks[0].title).toBe('Review project brief');
    expect(restoreBackup(state, bundle, { mode: 'merge', conflicts: 'replace' }, 'replace').tasks[0].title).toBe('Imported wording');
    const unchanged = applyCommand(state, { type: 'remind', operationId: 'r', id: 'demo-brief', expectedRevision: 1, delay: 10000 }, now);
    expect(restoreBackup(unchanged, bundle, { mode: 'merge', conflicts: 'keep' }, 'same').reminders[0].status).toBe('scheduled');
  });
});
