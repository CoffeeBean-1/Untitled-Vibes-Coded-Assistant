import { describe, expect, it } from 'vitest';
import { applyCommand, createInitialState, taskSchema, urgency } from './model';
import { selectTasks } from '../features/tasks/views';

const now = new Date('2026-10-26T15:00:00Z');
describe('lifecycle and retrieval', () => {
  it('archives/trashes without losing content and keeps inactive tasks out of active views', () => {
    let state = createInitialState(now);
    state = applyCommand(state, { type: 'remind', operationId: 'r', id: 'demo-brief', expectedRevision: 1, delay: 10000 }, now);
    state = applyCommand(state, { type: 'lifecycle', operationId: 'trash', id: 'demo-brief', expectedRevision: 1, lifecycle: 'trashed' }, now);
    expect(state.reminders[0].status).toBe('cancelled');
    expect(selectTasks(state.tasks, 'All tasks', '', '', '', now)).toHaveLength(2);
    expect(selectTasks(state.tasks, 'Trash', '', '', '', now)).toHaveLength(1);
    expect(urgency(state.tasks[0], now)).toBe('In trash');
    state = applyCommand(state, { type: 'lifecycle', operationId: 'restore', id: 'demo-brief', expectedRevision: 2, lifecycle: 'active' }, now);
    expect(state.tasks[0].title).toBe('Review project brief');
    expect(state.reminders[0].status).toBe('cancelled');
  });
  it('undo restores content and only future, unshown schedules', () => {
    let state = createInitialState(now);
    state = applyCommand(state, { type: 'remind', operationId: 'r', id: 'demo-brief', expectedRevision: 1, delay: 10000 }, now);
    state = applyCommand(state, { type: 'complete', operationId: 'done', id: 'demo-brief', expectedRevision: 1, done: true }, now);
    expect(applyCommand(state, { type: 'undo', operationId: 'undo' }, now).reminders[0].status).toBe('scheduled');
    expect(applyCommand(state, { type: 'undo', operationId: 'late-undo' }, new Date(now.getTime()+11000)).reminders[0].status).toBe('cancelled');
  });
  it('rejects a reused command ID with different content and stale undo', () => {
    const command = { type: 'complete' as const, operationId: 'id', id: 'demo-brief', expectedRevision: 1, done: true };
    const state = applyCommand(createInitialState(now), command, now);
    expect(() => applyCommand(state, { ...command, done: false }, now)).toThrow('different change');
    state.tasks[0].revision += 1;
    expect(() => applyCommand(state, { type: 'undo', operationId: 'undo' }, now)).toThrow('changed');
  });
  it('validates rich fields and contradictory starts and supports distinct simple views', () => {
    const state = createInitialState(now);
    state.tasks[0] = taskSchema.parse({ ...state.tasks[0], description: 'Quarterly review notes', project: 'Research', tags: ['planning'], status: 'waiting' });
    expect(selectTasks(state.tasks, 'Inbox', '', '', '', now)).toHaveLength(2);
    expect(selectTasks(state.tasks, 'Waiting', 'QUARTERLY', 'high', '', now)).toHaveLength(1);
    expect(selectTasks(state.tasks, 'Today', '', '', '', now)).toHaveLength(2);
    expect(() => taskSchema.parse({ ...state.tasks[0], start: { kind: 'date', date: '2026-10-27', timeZone: 'America/Chicago' } })).toThrow('start');
    expect(() => taskSchema.parse({ ...state.tasks[0], references: [{ kind: 'generic', url: 'javascript:alert(1)' }] })).toThrow();
  });
});
