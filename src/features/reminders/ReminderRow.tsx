import { useState } from 'react';
import type { NewCommand, State } from '../../domain/model';
import { localInput, localInstant, reminderTitle, targetActive, type Reminder } from '../../domain/reminders';

export type Execute = (command: NewCommand) => Promise<boolean>;
export function ReminderRow({ reminder, state, now, busy, execute, onOpen, openLabel = 'Open task' }: { reminder: Reminder; state: State; now: Date; busy: boolean; execute: Execute; onOpen?: () => void; openLabel?: string }) {
  const [chosen, setChosen] = useState(() => localInput(new Date(Math.max(now.getTime(), Date.parse(reminder.fireAt)) + 15 * 60000), reminder.timeZone));
  const [error, setError] = useState('');
  const inactive = !targetActive(state, reminder);
  const title = reminderTitle(state, reminder);
  async function changeTime() {
    setError('');
    try { await execute({ type: 'change-reminder', id: reminder.id, expectedRevision: reminder.revision, action: reminder.status === 'cancelled' ? 'activate' : 'snooze', fireAt: localInstant(chosen, reminder.timeZone) }); }
    catch (failure) { setError(failure instanceof Error ? failure.message : 'Check the time.'); }
  }
  return <div className="reminder-entry" data-reminder-id={reminder.id}><div className="reminder-row-main"><strong>{title}</strong><p>{new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short', timeZone: reminder.timeZone }).format(new Date(reminder.fireAt))} <span className="reminder-zone">{reminder.timeZone}</span></p><small>{reminder.status === 'cancelled' ? reminder.cancelReason ?? 'Off' : reminder.deferredUntil ? `Quiet hours · deferred until ${new Date(reminder.deferredUntil).toLocaleString()}` : reminder.rule.kind === 'due' ? `${reminder.rule.minutesBefore ? `${reminder.rule.minutesBefore} minutes before` : 'At'} the deadline${state.tasks.find(task => task.id === reminder.taskId)?.due.kind === 'date' ? ` · ${reminder.rule.localTime}` : ''}` : 'Chosen time · independent of deadline'}</small>
    <details className="reminder-change"><summary>{reminder.status === 'cancelled' ? 'Review and activate' : 'Change time'}</summary><label className="field"><span>New reminder time</span><input type="datetime-local" required value={chosen} onChange={event => setChosen(event.target.value)} /></label><p className="help-text">{reminder.timeZone}. Saving a chosen time makes this independent of the deadline.</p>{error && <p className="field-error" role="alert">{error}</p>}<button className="button subtle" disabled={busy || inactive} onClick={() => { void changeTime(); }}>{reminder.status === 'cancelled' ? 'Activate reminder' : 'Save reminder time'}</button></details></div>
    <div className="reminder-row-actions">{onOpen && <button className="text-button" onClick={onOpen}>{openLabel}</button>}{reminder.status !== 'cancelled' && <button className="button subtle" disabled={busy || inactive} aria-label={`Snooze 15 min: ${title}`} onClick={() => { void execute({ type: 'change-reminder', id: reminder.id, expectedRevision: reminder.revision, action: 'snooze', fireAt: new Date(now.getTime() + 15 * 60000).toISOString() }); }}>Snooze 15 min</button>}{reminder.status === 'scheduled' && <button className="text-button" disabled={busy} aria-label={`Cancel reminder for ${title}`} onClick={() => { void execute({ type: 'change-reminder', id: reminder.id, expectedRevision: reminder.revision, action: 'cancel' }); }}>Cancel</button>}</div>
  </div>;
}
