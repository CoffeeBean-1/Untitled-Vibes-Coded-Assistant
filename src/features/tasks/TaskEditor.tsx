import { useState, type FormEvent } from 'react';
import { Plus, Save } from 'lucide-react';
import { z } from 'zod';
import { classifyReference, DomainError, taskSchema, type Deadline, type Task, type TaskInput } from '../../domain/model';
import { deviceZone } from '../../shared/clock';

function inputDate(deadline: Deadline | undefined) {
  if (!deadline || deadline.kind === 'none') return '';
  if (deadline.kind === 'date') return deadline.date;
  const date = new Date(deadline.instantUtc);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}
function deadline(value: string, timed: boolean, original?: Deadline): Deadline {
  if (!value) return { kind: 'none' };
  if (original && inputDate(original) === value && (original.kind === 'instant') === timed) return original;
  if (!timed) return { kind: 'date', date: value, timeZone: deviceZone() };
  const instant = new Date(value);
  if (!Number.isFinite(instant.getTime()) || inputDate({ kind: 'instant', instantUtc: instant.toISOString(), timeZone: deviceZone() }) !== value) throw new DomainError('That local time does not exist because the clocks change. Choose a different time.');
  return { kind: 'instant', instantUtc: instant.toISOString(), timeZone: deviceZone() };
}

export function TaskForm({ task, busy, onSubmit, full = false, initialTitle = '' }: { task?: Task; busy: boolean; full?: boolean; initialTitle?: string; onSubmit: (input: TaskInput, reminderDelay: number | null) => Promise<boolean> }) {
  const [title, setTitle] = useState(task?.title ?? initialTitle);
  const [priority, setPriority] = useState<Task['priority']>(task?.priority ?? 'normal');
  const [status, setStatus] = useState<Task['status']>(task?.status ?? 'todo');
  const [due, setDue] = useState(inputDate(task?.due));
  const [timed, setTimed] = useState(task?.due.kind === 'instant');
  const [start, setStart] = useState(inputDate(task?.start));
  const [startTimed, setStartTimed] = useState(task?.start.kind === 'instant');
  const [description, setDescription] = useState(task?.description ?? '');
  const [project, setProject] = useState(task?.project ?? '');
  const [tags, setTags] = useState(task?.tags.join(', ') ?? '');
  const [references, setReferences] = useState(task?.references.map((ref) => ref.url).join('\n') ?? '');
  const [reminder, setReminder] = useState('');
  const [validation, setValidation] = useState('');
  async function submit(event: FormEvent) {
    event.preventDefault(); setValidation('');
    try {
      const input: TaskInput = { title: title.trim(), priority, status, due: deadline(due, timed, task?.due), start: deadline(start, startTimed, task?.start), description, project: project.trim(), tags: [...new Set(tags.split(',').map((tag) => tag.trim()).filter(Boolean))], references: references.split('\n').map((url) => url.trim()).filter(Boolean).map((url) => ({ url, kind: classifyReference(url) })) };
      taskSchema.parse({ ...task, ...input, id: task?.id ?? 'validation', createdAt: task?.createdAt ?? new Date().toISOString(), updatedAt: new Date().toISOString(), revision: task?.revision ?? 1 });
      if (status === 'done' && reminder) throw new DomainError('Completed tasks cannot have a pending reminder.');
      if (await onSubmit(input, reminder ? Number(reminder) : null)) {
        if (!task) { setTitle(''); setDue(''); setStart(''); setReminder(''); setPriority('normal'); setDescription(''); setTags(''); setProject(''); setReferences(''); setValidation(''); }
      }
    } catch (error) { setValidation(error instanceof z.ZodError ? error.issues[0]?.message ?? 'Check the task fields.' : error instanceof Error ? error.message : 'Check the task fields.'); }
  }
  const expanded = !!task || full;
  return <form className="task-form" onSubmit={(event) => { void submit(event); }}>
    <label className="field"><span>Task title</span><input data-dialog-initial-focus={!!task || full || undefined} required maxLength={200} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="What needs to get done?" aria-describedby={validation ? 'task-validation' : undefined} /></label>
    <div className="form-options">
      <label className="field"><span>{timed ? 'Due date and time' : 'Due date'} <small>optional</small></span><input aria-label={timed ? 'Due date and time' : 'Due date'} type={timed ? 'datetime-local' : 'date'} value={due} onChange={(event) => setDue(event.target.value)} /></label>
      <label className="field"><span>Priority</span><select aria-label="Priority" value={priority} onChange={(event) => setPriority(event.target.value as Task['priority'])}><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option><option value="critical">Critical</option></select></label>
      <label className="field"><span>{task ? 'Status' : 'Reminder'}</span>{task ? <select aria-label="Status" value={status} onChange={(event) => setStatus(event.target.value as Task['status'])}><option value="todo">To do</option><option value="in_progress">In progress</option><option value="waiting">Waiting</option><option value="done">Done</option></select> : <select aria-label="Reminder" value={reminder} onChange={(event) => setReminder(event.target.value)}><option value="">None</option><option value="300000">In 5 minutes</option><option value="900000">In 15 minutes</option><option value="1800000">In 30 minutes</option><option value="3600000">In 1 hour</option></select>}</label>
    </div>
    <details className="task-details" open={expanded || undefined}><summary>More details</summary><div className="details-fields">
      <label className="field"><span>Description</span><textarea maxLength={10000} rows={3} value={description} onChange={(event) => setDescription(event.target.value)} /></label>
      <div className="form-options two"><label className="field"><span>Project or list</span><input maxLength={100} value={project} onChange={(event) => setProject(event.target.value)} placeholder="Inbox if left blank" /></label><label className="field"><span>Tags</span><input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="Separate with commas" /></label></div>
      <div className="form-options two"><label className="field"><span>Deadline precision</span><select value={timed ? 'instant' : 'date'} onChange={(event) => { setTimed(event.target.value === 'instant'); setDue(''); }}><option value="date">Date only</option><option value="instant">Date and time</option></select></label><label className="field"><span>Start precision</span><select value={startTimed ? 'instant' : 'date'} onChange={(event) => { setStartTimed(event.target.value === 'instant'); setStart(''); }}><option value="date">Date only</option><option value="instant">Date and time</option></select></label></div>
      <label className="field"><span>{startTimed ? 'Start date and time' : 'Start date'} <small>optional</small></span><input aria-label={startTimed ? 'Start date and time' : 'Start date'} type={startTimed ? 'datetime-local' : 'date'} value={start} onChange={(event) => setStart(event.target.value)} /></label>
      <label className="field"><span>Reference links</span><textarea rows={2} value={references} onChange={(event) => setReferences(event.target.value)} placeholder="One HTTPS link per line" /></label>
      {full && !task && <label className="field"><span>Status</span><select aria-label="Status" value={status} onChange={(event) => setStatus(event.target.value as Task['status'])}><option value="todo">To do</option><option value="in_progress">In progress</option><option value="waiting">Waiting</option><option value="done">Done</option></select></label>}
    </div></details>
    {validation && <p id="task-validation" className="field-error" role="alert">{validation}</p>}
    <div className="form-footer"><span>Scheduling time zone: {deviceZone()}</span><button type="submit" className="button primary" disabled={busy}>{task ? <Save size={16} /> : <Plus size={16} />}{busy ? 'Saving…' : task ? 'Save changes' : 'Add task'}</button></div>
  </form>;
}
