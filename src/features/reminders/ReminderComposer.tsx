import { useState, type FormEvent } from 'react';
import { BellPlus } from 'lucide-react';
import type { Task } from '../../domain/model';
import { dueReminderInstant, localInput, localInstant, type ScheduleInput } from '../../domain/reminders';
import { deviceZone } from '../../shared/clock';

export function ReminderComposer({ task, now, busy, onSchedule, label = 'Add reminder' }: { task?: Task; now: Date; busy: boolean; label?: string; onSchedule: (schedule: ScheduleInput) => Promise<boolean> }) {
  const [mode, setMode] = useState('15');
  const [zone, setZone] = useState(deviceZone());
  const [chosen, setChosen] = useState(() => localInput(new Date(now.getTime() + 15 * 60000), deviceZone()));
  const [before, setBefore] = useState('0');
  const [dateTime, setDateTime] = useState('09:00');
  const [error, setError] = useState('');
  async function submit(event: FormEvent) {
    event.preventDefault(); setError('');
    try {
      const rule = mode === 'due' ? { kind: 'due' as const, minutesBefore: Number(before), localTime: dateTime } : { kind: 'absolute' as const };
      const schedule = { rule, timeZone: rule.kind === 'due' && task?.due.kind !== 'none' ? task?.due.timeZone ?? zone : zone, fireAt: rule.kind === 'due' && task ? dueReminderInstant(task.due, rule) : mode === 'custom' ? localInstant(chosen, zone) : new Date(now.getTime() + Number(mode) * 60000).toISOString() };
      if (await onSchedule(schedule)) setError('');
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Check the reminder time.'); }
  }
  return <form className="reminder-composer" onSubmit={event => { void submit(event); }}>
    <div className="reminder-form-grid"><label className="field"><span>Remind me</span><select value={mode} onChange={event => setMode(event.target.value)}><option value="5">In 5 minutes</option><option value="15">In 15 minutes</option><option value="30">In 30 minutes</option><option value="60">In 1 hour</option><option value="custom">At a chosen time</option>{task && <option value="due" disabled={task.due.kind === 'none'}>Relative to deadline</option>}</select></label>
    {mode === 'custom' && <><label className="field"><span>Reminder date and time</span><input type="datetime-local" required value={chosen} onChange={event => setChosen(event.target.value)} /></label><label className="field"><span>Reminder time zone</span><input required maxLength={100} value={zone} onChange={event => setZone(event.target.value)} /></label></>}
    {mode === 'due' && <><label className="field"><span>Before deadline</span><select value={before} onChange={event => setBefore(event.target.value)}><option value="0">At deadline</option><option value="5">5 minutes</option><option value="15">15 minutes</option><option value="60">1 hour</option><option value="1440">1 day</option></select></label>{task?.due.kind === 'date' && <label className="field"><span>Time on the due date</span><input type="time" required value={dateTime} onChange={event => setDateTime(event.target.value)} /></label>}</>}
    </div>
    <p className="help-text">{mode === 'due' && task?.due.kind !== 'none' ? `Uses the saved deadline in ${task?.due.timeZone}. Moves with deadline changes.` : mode === 'custom' ? 'Chosen local time. During clock changes, skipped times move forward and repeated times use the earlier occurrence.' : `From now, in ${zone}.${task ? ' Independent of the task deadline.' : ''}`}</p>
    {error && <p role="alert" className="field-error">{error}</p>}
    <button type="submit" className="button primary" disabled={busy}><BellPlus size={16} />{label}</button>
  </form>;
}
