import { describe, expect, it } from 'vitest';
import { applyCommand, createInitialState, migrateState, type Command, type State } from './model';
import { backupFingerprintData, createBackup, parseBackup, restoreBackup } from './backup';
import { dueReminderInstant, localInstant, quietHoursEnd, safeTrackingUrl } from './reminders';

const now = new Date('2026-10-27T15:00:00.000Z');
const initial = () => createInitialState(now);
const run = (state: State, command: Omit<Extract<Command, { type: 'reconcile' }>, 'operationId'>, time: string) => applyCommand(state, { ...command, operationId: crypto.randomUUID() }, new Date(time));
function schedule(state = initial(), id = 'alarm', fireAt = '2026-10-27T15:15:00.000Z') {
  return applyCommand(state, { type: 'schedule-reminder', operationId: id, taskId: 'demo-brief', expectedRevision: state.tasks[0].revision, schedule: { fireAt, timeZone: 'America/Chicago', rule: { kind: 'absolute' } } }, now);
}
function relative(state = initial()) {
  state.tasks[0].due = { kind: 'date', date: '2026-10-28', timeZone: 'America/Chicago' };
  return applyCommand(state, { type: 'schedule-reminder', operationId: 'relative', taskId: 'demo-brief', expectedRevision: 1, schedule: { fireAt: now.toISOString(), timeZone: 'UTC', rule: { kind: 'due', localTime: '09:00', minutesBefore: 15 } } }, now);
}
describe('persistent reminder scheduling', () => {
  it('adds multiple reminders, retries idempotently and keeps chosen times independent of deadline edits', () => {
    let state = schedule(); state = schedule(state, 'second', '2026-10-27T15:30:00.000Z');
    expect(schedule(state, 'second', '2026-10-27T15:30:00.000Z')).toBe(state);
    const original = state.reminders.map(item => item.fireAt);
    state = applyCommand(state, { type: 'edit', id: 'demo-brief', expectedRevision: 1, operationId: 'edit', task: { ...state.tasks[0], due: { kind: 'date', date: '2026-10-29', timeZone: 'Asia/Tokyo' } } }, now);
    expect(state.reminders.map(item => item.fireAt)).toEqual(original);
  });
  it('computes date-only reminders in the task zone and moves only relative schedules', () => {
    let state = schedule(relative());
    expect(state.reminders[0]).toMatchObject({ fireAt: '2026-10-28T13:45:00.000Z', timeZone: 'America/Chicago', revision: 1 });
    state = applyCommand(state, { type: 'edit', operationId: 'edit', id: 'demo-brief', expectedRevision: 1, task: { ...state.tasks[0], due: { kind: 'date', date: '2026-10-29', timeZone: 'America/Chicago' } } }, now);
    expect(state.reminders[0]).toMatchObject({ fireAt: '2026-10-29T13:45:00.000Z', revision: 2 });
    expect(state.reminders[1].fireAt).toBe('2026-10-27T15:15:00.000Z');
    expect(() => applyCommand(state, { type: 'change-reminder', operationId: 'stale', id: 'relative', expectedRevision: 1, action: 'snooze', fireAt: '2026-10-28T15:00:00.000Z' }, now)).toThrow('changed');
    const removed = applyCommand(state, { type: 'edit', operationId: 'remove-due', id: 'demo-brief', expectedRevision: 2, task: { ...state.tasks[0], due: { kind: 'none' } } }, now);
    expect(removed.reminders[0]).toMatchObject({ status: 'cancelled', cancelReason: 'Deadline removed' });
    expect(removed.reminders[1].status).toBe('scheduled');
  });
  it('uses elapsed minutes for timed deadlines and deterministic DST local times', () => {
    const rule = { kind: 'due' as const, localTime: '09:00', minutesBefore: 15 };
    expect(dueReminderInstant({ kind: 'instant', instantUtc: '2026-10-28T16:00:00.000Z', timeZone: 'Asia/Tokyo' }, rule)).toBe('2026-10-28T15:45:00.000Z');
    expect(localInstant('2026-03-08T02:30', 'America/Chicago')).toBe('2026-03-08T08:30:00.000Z');
    expect(localInstant('2026-11-01T01:30', 'America/Chicago')).toBe('2026-11-01T06:30:00.000Z');
    expect(() => localInstant('2026-02-30T09:00', 'America/Chicago')).toThrow();
  });
  it('snoozes the same schedule with a new revision and never delivers at the old time', () => {
    let state = schedule();
    const command = { type: 'change-reminder' as const, operationId: 'snooze', id: 'alarm', expectedRevision: 1, action: 'snooze' as const, fireAt: '2026-10-27T16:00:00.000Z' };
    state = applyCommand(state, command, now);
    expect(applyCommand(state, command, now)).toBe(state);
    state = run(state, { type: 'reconcile' }, '2026-10-27T15:15:01Z'); expect(state.history).toHaveLength(0);
    state = run(state, { type: 'reconcile' }, '2026-10-27T16:00:01Z');
    expect(state.history).toHaveLength(1); expect(state.history[0].deliveries[0]).toMatchObject({ reminderId: 'alarm', revision: 2, intendedAt: '2026-10-27T16:00:00.000Z' });
    expect(run(state, { type: 'reconcile' }, '2026-10-27T16:00:02Z').history).toHaveLength(1);
  });
  it('cancels all schedules on completion/trash and refuses snooze of an inactive target', () => {
    const state = schedule(schedule(), 'second');
    for (const command of [{ type: 'complete' as const, done: true }, { type: 'lifecycle' as const, lifecycle: 'trashed' as const }]) {
      const next = applyCommand(state, { ...command, operationId: 'inactive', id: 'demo-brief', expectedRevision: 1 }, now);
      expect(next.reminders.every(item => item.status === 'cancelled')).toBe(true);
      expect(() => applyCommand(next, { type: 'change-reminder', operationId: 'bad', id: 'alarm', expectedRevision: 2, action: 'snooze', fireAt: '2026-10-27T16:00:00.000Z' }, now)).toThrow('no longer active');
    }
  });
  it('summarizes missed schedules once and retains immutable intended times after snooze', () => {
    let state = schedule(schedule(), 'second', '2026-10-27T15:30:00.000Z');
    state = run(state, { type: 'reconcile' }, '2026-10-27T17:00:00Z');
    expect(state.history).toHaveLength(1); expect(state.history[0]).toMatchObject({ missed: true, reminderIds: ['alarm', 'second'] });
    expect(state.history[0].deliveries).toHaveLength(2);
    const historical = structuredClone(state.history[0]);
    state = applyCommand(state, { type: 'change-reminder', operationId: 'again', id: 'alarm', expectedRevision: 1, action: 'snooze', fireAt: '2026-10-27T18:00:00.000Z' }, new Date('2026-10-27T17:00:00Z'));
    expect(state.history[0]).toEqual(historical);
    state = applyCommand(state, { type: 'acknowledge-reminder', operationId: 'ack', id: historical.id }, new Date('2026-10-27T17:01:00Z'));
    expect(state.history[0].acknowledgedAt).toBe('2026-10-27T17:01:00.000Z');
  });
  it('rejects past schedules and stale task revisions without changing the original snapshot', () => {
    const state = initial(); const copy = structuredClone(state);
    expect(() => schedule(state, 'past', now.toISOString())).toThrow('future');
    expect(() => applyCommand(state, { type: 'schedule-reminder', operationId: 'bad', taskId: 'demo-brief', expectedRevision: 99, schedule: { fireAt: '2026-10-27T18:00:00.000Z', timeZone: 'UTC', rule: { kind: 'absolute' } } }, now)).toThrow('changed');
    expect(state).toEqual(copy);
  });
});
describe('quiet hours and safe recovery', () => {
  it('keeps version-one backup receipt bytes stable after defaults are added', () => {
    const current = createBackup(schedule(), now, true);
    const legacy = { format: current.format, schemaVersion: 1, bundleId: current.bundleId, sourceNamespaceId: current.sourceNamespaceId, exportedAt: current.exportedAt, tasks: current.tasks, preferences: current.preferences, reminderRules: current.reminderRules.map(({ id, taskId, fireAt }) => ({ id, taskId, fireAt })), omissions: current.omissions };
    const parsed = parseBackup(JSON.stringify(legacy));
    expect(backupFingerprintData(parsed)).toBe(JSON.stringify(legacy));
    expect(parsed.reminderRules[0].rule).toEqual({ kind: 'absolute' });
    expect(() => parseBackup(JSON.stringify({ ...legacy, pickups: [{ id: 'new-feature' }] }))).toThrow();
  });
  it('defers overnight alerts without changing intended time or treating critical priority as an override', () => {
    let state = schedule(initial(), 'alarm', '2026-10-28T03:15:00.000Z'); state.tasks[0].priority = 'critical';
    state.reminderSettings.quietHours = { enabled: true, start: '22:00', end: '08:00', timeZone: 'America/Chicago' };
    state = run(state, { type: 'reconcile' }, '2026-10-28T03:15:01Z');
    expect(state.history).toHaveLength(0); expect(state.reminders[0]).toMatchObject({ fireAt: '2026-10-28T03:15:00.000Z', deferredUntil: '2026-10-28T13:00:00.000Z' });
    expect(run(state, { type: 'reconcile' }, '2026-10-28T12:59:59Z').history).toHaveLength(0);
    state = run(state, { type: 'reconcile' }, '2026-10-28T13:00:00Z');
    expect(state.history).toHaveLength(1); expect(state.history[0].missed).toBe(true);
    expect(quietHoursEnd(new Date('2026-10-28T14:00:00Z'), state.reminderSettings)).toBeNull();
  });
  it('handles same-day quiet hours, a DST overlap and turning quiet hours off', () => {
    let state = schedule(); state.reminderSettings.quietHours = { enabled: true, start: '09:00', end: '11:00', timeZone: 'America/Chicago' };
    expect(quietHoursEnd(now, state.reminderSettings)).toBe('2026-10-27T16:00:00.000Z');
    state = run(state, { type: 'reconcile' }, '2026-10-27T15:15:01Z'); state.reminderSettings.quietHours.enabled = false;
    expect(run(state, { type: 'reconcile' }, '2026-10-27T15:15:02Z').history[0].missed).toBe(true);
    state.reminderSettings.quietHours = { enabled: true, start: '22:00', end: '01:30', timeZone: 'America/Chicago' };
    expect(quietHoursEnd(new Date('2026-11-01T05:00:00Z'), state.reminderSettings)).toBe('2026-11-01T07:30:00.000Z');
    expect(quietHoursEnd(new Date('2026-11-01T06:45:00Z'), state.reminderSettings)).toBe('2026-11-01T07:30:00.000Z');
    expect(quietHoursEnd(new Date('2026-11-01T07:15:00Z'), state.reminderSettings)).toBe('2026-11-01T07:30:00.000Z');
    expect(quietHoursEnd(new Date('2026-11-01T07:30:00Z'), state.reminderSettings)).toBeNull();
  });
  it('migrates version-two reminders without losing identifiers, times, history or preferences', () => {
    const current = schedule();
    const { pickups: _pickups, reminderSettings: _settings, ...raw } = current;
    void _pickups; void _settings;
    const legacy = { ...raw, schemaVersion: 2, reminders: current.reminders.map(({ id, taskId, fireAt, status }) => ({ id, taskId, fireAt, status })) };
    const migrated = migrateState(legacy);
    expect(migrated.schemaVersion).toBe(3); expect(migrated.reminders[0]).toMatchObject({ id: 'alarm', revision: 1, rule: { kind: 'absolute' }, fireAt: current.reminders[0].fireAt });
    expect(migrated.preferences).toEqual(current.preferences); expect(migrated.reminderSettings.privatePreview).toBe(true);
  });
  it('undo restores prior relative times but preserves later independent reminder edits', () => {
    let state = relative();
    state = applyCommand(state, { type: 'edit', operationId: 'edit', id: 'demo-brief', expectedRevision: 1, task: { ...state.tasks[0], due: { kind: 'date', date: '2026-10-29', timeZone: 'America/Chicago' } } }, now);
    expect(applyCommand(state, { type: 'undo', operationId: 'undo' }, now).reminders[0].fireAt).toBe('2026-10-28T13:45:00.000Z');
    state = applyCommand(state, { type: 'change-reminder', operationId: 'manual', id: 'relative', expectedRevision: 2, action: 'snooze', fireAt: '2026-10-30T13:00:00.000Z' }, now);
    const undone = applyCommand(state, { type: 'undo', operationId: 'undo' }, now);
    expect(undone.reminders[0]).toMatchObject({ fireAt: '2026-10-30T13:00:00.000Z', status: 'scheduled' });
  });
});
describe('manual pickup boundary', () => {
  const pickupCommand = { type: 'create-pickup' as const, operationId: 'pickup-reminder', id: 'lunch', title: 'Lunch', trackingUrl: 'https://asterhall.order.online/track/example?token=private-fixture', schedule: { fireAt: '2026-10-27T15:15:00.000Z', timeZone: 'America/Chicago', rule: { kind: 'absolute' as const } } };
  it('creates a manual pickup check, records literal history and cancels it when checked', () => {
    const state = applyCommand(initial(), pickupCommand, now);
    expect(state.tasks).toHaveLength(3); expect(state.pickups).toHaveLength(1);
    expect(applyCommand(state, pickupCommand, now)).toBe(state);
    expect(run(state, { type: 'reconcile' }, '2026-10-27T15:15:01Z').history[0].message).toBe('Check pickup: Lunch');
    const checked = applyCommand(state, { type: 'finish-pickup', operationId: 'checked', id: 'lunch', expectedRevision: 1 }, now);
    expect(checked.reminders[0].status).toBe('cancelled'); expect(checked.pickups[0].active).toBe(false);
  });
  it('excludes tracking links from portable backups, preserves reminder rules and imports them disabled', () => {
    const state = applyCommand(relative(), pickupCommand, now); const bundle = createBackup(state, now, true);
    const encoded = JSON.stringify(bundle); expect(encoded).not.toContain('private-fixture'); expect(encoded).not.toContain('/track/example');
    const restored = restoreBackup(initial(), parseBackup(encoded), { mode: 'merge', conflicts: 'keep' }, 'fingerprint');
    expect(restored.pickups[0].trackingUrl).toBeNull(); expect(restored.reminders).toHaveLength(2);
    expect(restored.reminders.every(item => item.status === 'cancelled')).toBe(true);
    expect(restored.reminders.some(item => item.rule.kind === 'due')).toBe(true);
    expect(run(restored, { type: 'reconcile' }, '2026-10-30T15:00:00Z').history).toHaveLength(0);
  });
  it('rejects executable/credential/local tracking links and invalid backup target references', () => {
    for (const value of ['javascript:alert(1)', 'http://example.com', 'https://u:p@example.com/', 'https://127.0.0.1/', 'https://example.local/', 'https://localhost/', 'https://example.com/#secret']) expect(safeTrackingUrl(value)).toBe(false);
    expect(safeTrackingUrl(pickupCommand.trackingUrl)).toBe(true);
    const bundle = createBackup(applyCommand(initial(), pickupCommand, now), now, true);
    expect(() => parseBackup(JSON.stringify({ ...bundle, pickups: [] }))).toThrow('missing');
    expect(() => parseBackup(JSON.stringify({ ...bundle, pickups: [{ ...bundle.pickups[0], trackingUrl: pickupCommand.trackingUrl }] }))).toThrow('tracking');
  });
});
