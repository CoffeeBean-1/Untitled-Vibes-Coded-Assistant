import type { State, Task } from '../../domain/model';
import { ReminderComposer } from './ReminderComposer';
import { ReminderRow, type Execute } from './ReminderRow';

export function TaskReminders({ task, state, now, busy, execute }: { task: Task; state: State; now: Date; busy: boolean; execute: Execute }) {
  const reminders = state.reminders.filter(item => item.taskId === task.id && item.status === 'scheduled');
  return <section className="task-reminders" aria-label="Task reminders"><h3>Reminders <span className="count-badge">{reminders.length}</span></h3>{reminders.map(item => <ReminderRow key={item.id} reminder={item} state={state} now={now} busy={busy} execute={execute} />)}{task.lifecycle === 'active' && task.status !== 'done' ? <><p className="help-text">Add more than one reminder. Save task edits before scheduling from a changed deadline.</p><ReminderComposer task={task} now={now} busy={busy} onSchedule={schedule => execute({ type: 'schedule-reminder', taskId: task.id, expectedRevision: task.revision, schedule })} /></> : <p className="help-text">Reopen and restore this task before adding reminders.</p>}</section>;
}
