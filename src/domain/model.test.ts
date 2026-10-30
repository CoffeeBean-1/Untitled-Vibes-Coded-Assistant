import { describe, expect, it } from 'vitest';
import { applyCommand, createInitialState, urgency, type TaskInput } from './model';

const now = new Date('2026-10-26T15:00:00Z');
const input: TaskInput = { title: 'Synthetic task', priority: 'high', status: 'todo', due: { kind: 'none' } };
const initial = () => createInitialState(now);
const create = () => applyCommand(initial(), { type: 'create', operationId: 'create-one', id: 'one', task: input, reminderDelay: 10000 }, now);

describe('task and reminder commands', () => {
  it('creates a validated task and schedule without mutating the input snapshot', () => {
    const original = initial();
    const next = applyCommand(original, { type: 'create', operationId: 'create-one', id: 'one', task: input, reminderDelay: 10000 }, now);
    expect(original.tasks).toHaveLength(3);
    expect(next.tasks).toHaveLength(4);
    expect(next.reminders[0].fireAt).toBe('2026-10-26T15:00:10.000Z');
  });
  it('deduplicates a retried operation and fires a persistent reminder once', () => {
    const state = create();
    expect(applyCommand(state, { type: 'create', operationId: 'create-one', id: 'one', task: input, reminderDelay: 10000 }, now)).toBe(state);
    const fired = applyCommand(state, { type: 'reconcile', operationId: 'fire' }, new Date(now.getTime() + 11000));
    expect(fired.history).toHaveLength(1);
    expect(applyCommand(fired, { type: 'reconcile', operationId: 'again' }, new Date(now.getTime() + 12000)).history).toHaveLength(1);
  });
  it('completion atomically cancels pending reminders and reopening does not replay them', () => {
    const completed = applyCommand(create(), { type: 'complete', operationId: 'done', id: 'one', expectedRevision: 1, done: true }, now);
    expect(completed.reminders[0].status).toBe('cancelled');
    const reopened = applyCommand(completed, { type: 'complete', operationId: 'reopen', id: 'one', expectedRevision: 2, done: false }, now);
    expect(applyCommand(reopened, { type: 'reconcile', operationId: 'fire' }, new Date(now.getTime()+20000)).history).toHaveLength(0);
  });
  it('editing to Done cancels the reminder and rejects stale revisions', () => {
    const state = create();
    const next = applyCommand(state, { type: 'edit', operationId: 'edit', id: 'one', expectedRevision: 1, task: { ...input, title: 'Changed', status: 'done' } }, now);
    expect(next.reminders[0].status).toBe('cancelled');
    expect(() => applyCommand(next, { type: 'edit', operationId: 'stale', id: 'one', expectedRevision: 1, task: input }, now)).toThrow('another window');
  });
  it('keeps date-only deadlines independent of display zone and priority', () => {
    const task = { ...create().tasks.at(-1)!, due: { kind: 'date' as const, date: '2026-10-26', timeZone: 'America/Chicago' } };
    expect(urgency(task, new Date('2026-10-27T04:59:59Z'))).toBe('Due today');
    expect(urgency(task, new Date('2026-10-27T05:00:00Z'))).toBe('Overdue');
    expect(task.priority).toBe('high');
    expect(task.due.date).toBe('2026-10-26');
  });
  it('uses instants for timed deadlines and summarizes old reminders after wake', () => {
    const state = create();
    const task = { ...state.tasks.at(-1)!, due: { kind: 'instant' as const, instantUtc: '2026-10-26T15:10:00Z', timeZone: 'Asia/Kolkata' } };
    expect(urgency(task, now)).toBe('Due soon');
    expect(urgency(task, new Date('2026-10-26T15:10:01Z'))).toBe('Overdue');
    const wake = applyCommand(state, { type: 'reconcile', operationId: 'wake' }, new Date(now.getTime()+120000));
    expect(wake.history[0]).toMatchObject({ taskId: null, missed: true });
  });
  it('rejects empty titles, invalid dates and invalid reminder delays', () => {
    const command = { type: 'create' as const, operationId: 'bad', id: 'bad', task: input, reminderDelay: null };
    expect(() => applyCommand(initial(), { ...command, task: { ...input, title: '   ' } }, now)).toThrow();
    expect(() => applyCommand(initial(), { ...command, task: { ...input, due: { kind: 'date', date: '2026-02-30', timeZone: 'UTC' } } }, now)).toThrow();
    expect(() => applyCommand(initial(), { ...command, reminderDelay: -1 }, now)).toThrow();
  });
});
