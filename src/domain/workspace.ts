import { z } from 'zod';
import { taskSchema as legacyTaskSchema, stateSchema as legacyStateSchema } from './legacyModel';
import { localDate, deviceZone } from '../shared/clock';
import { DomainError } from './errors';
import { cancelReminder, defaultReminderSettings, dueReminderInstant, newReminder, pickupSchema, reconcileReminders, reminderSchema, reminderSettingsSchema, rescheduleTaskReminders, targetActive, type ReminderSettings, type ScheduleInput } from './reminders';
export { DomainError } from './errors';
export { reminderSchema } from './reminders';

const utc = z.iso.datetime();
export const prioritySchema = z.enum(['critical', 'high', 'normal', 'low']);
export const statusSchema = z.enum(['todo', 'in_progress', 'waiting', 'done']);
export const deadlineSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('none') }).strict(),
  z.object({ kind: z.literal('date'), date: z.iso.date(), timeZone: z.string().refine(validZone) }).strict(),
  z.object({ kind: z.literal('instant'), instantUtc: utc, timeZone: z.string().refine(validZone) }).strict(),
]);
function validZone(value: string) { try { new Intl.DateTimeFormat('en', { timeZone: value }); return true; } catch { return false; } }
export function classifyReference(value: string): 'generic' | 'meeting' | 'tracking' {
  try {
    const host = new URL(value).hostname.toLowerCase();
    if (['zoom.us', 'teams.microsoft.com', 'teams.live.com', 'meet.google.com', 'safelinks.protection.outlook.com'].some((domain) => host === domain || host.endsWith(`.${domain}`))) return 'meeting';
    if (['toasttab.com', 'order.online', 'doordash.com'].some(domain => host === domain || host.endsWith(`.${domain}`))) return 'tracking';
  } catch { /* Schema validation reports invalid URLs. */ }
  return 'generic';
}
const referenceSchema = z.object({ kind: z.enum(['generic', 'meeting', 'tracking']), url: z.string().max(2048).refine((value) => { try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password; } catch { return false; } }, 'Reference links must be HTTPS URLs without embedded credentials.') }).strict();
export const taskSchema = legacyTaskSchema.extend({
  id: z.string().min(1).max(100),
  due: deadlineSchema,
  description: z.string().max(10000).default(''), project: z.string().trim().max(100).default(''),
  tags: z.array(z.string().trim().min(1).max(50)).max(20).refine((tags) => new Set(tags).size === tags.length, 'Tags must be unique.').default([]), start: deadlineSchema.default({ kind: 'none' }),
  references: z.array(referenceSchema).max(20).default([]), lifecycle: z.enum(['active', 'archived', 'trashed']).default('active'),
  archivedAt: utc.nullable().default(null), deletedAt: utc.nullable().default(null), completedAt: utc.nullable().default(null),
}).strict().superRefine((task, context) => {
  if (task.start.kind === 'none' || task.due.kind === 'none') return;
  const start = task.start.kind === 'instant' && task.due.kind === 'instant' ? task.start.instantUtc : task.start.kind === 'date' ? task.start.date : localDate(new Date(task.start.instantUtc), task.due.timeZone);
  const due = task.due.kind === 'date' ? task.due.date : task.start.kind === 'instant' ? task.due.instantUtc : localDate(new Date(task.due.instantUtc), task.due.timeZone);
  if (start > due) context.addIssue({ code: 'custom', path: ['start'], message: 'The start must not be after the deadline.' });
});
export const preferencesSchema = z.object({ theme: z.enum(['light', 'dark', 'system']), satire: z.boolean(), density: z.enum(['compact', 'default', 'comfortable']).optional() }).strict();
export const stateSchema = z.object({
  schemaVersion: z.literal(3), namespaceId: z.string().uuid(), revision: z.number().int().nonnegative(), anchor: utc,
  tasks: z.array(taskSchema).max(10000), reminders: z.array(reminderSchema).max(10000),
  pickups: z.array(pickupSchema).max(1000).default([]), reminderSettings: reminderSettingsSchema.default(defaultReminderSettings),
  history: z.array(z.object({ id: z.string(), taskId: z.string().nullable(), message: z.string(), shownAt: utc, missed: z.boolean(), reminderIds: z.array(z.string()).default([]), intendedAt: utc.nullable().default(null), acknowledgedAt: utc.nullable().default(null), deliveries: z.array(z.object({ reminderId: z.string(), revision: z.number().int(), title: z.string(), intendedAt: utc })).default([]) })).max(100),
  preferences: preferencesSchema, operationIds: z.array(z.string()).max(100),
  receipts: z.array(z.object({ id: z.string(), fingerprint: z.string() })).max(100),
  importedBundles: z.array(z.object({ id: z.string(), fingerprint: z.string() })).max(1000),
  sourceMappings: z.array(z.object({ source: z.string(), sourceId: z.string(), localId: z.string() })).max(20000),
  undo: z.object({ label: z.string(), taskBefore: taskSchema, remindersBefore: z.array(reminderSchema), expectedRevision: z.number().int(), reminderVersions: z.array(z.object({ id: z.string(), revision: z.number().int() })).default([]) }).nullable(),
}).strict().superRefine((state, context) => {
  const ids = new Set(state.tasks.map((task) => task.id));
  if (ids.size !== state.tasks.length || new Set(state.reminders.map((item) => item.id)).size !== state.reminders.length) context.addIssue({ code: 'custom', message: 'Duplicate record identifiers.' });
  const pickupIds = new Set(state.pickups.map(item => item.id));
  if (pickupIds.size !== state.pickups.length || state.pickups.some(item => ids.has(item.id))) context.addIssue({ code: 'custom', message: 'Duplicate pickup identifiers.' });
  if (state.reminders.some((item) => item.taskId !== null ? !ids.has(item.taskId) : !pickupIds.has(item.pickupId!))) context.addIssue({ code: 'custom', message: 'A reminder references a missing task.' });
});
export type Task = z.infer<typeof taskSchema>;
export type State = z.infer<typeof stateSchema>;
export type Deadline = Task['due'];
export type Preferences = State['preferences'];
export type TaskInput = Pick<Task, 'title' | 'status' | 'priority' | 'due'> & Partial<Pick<Task, 'description' | 'project' | 'tags' | 'start' | 'references'>>;
export type Command = { operationId: string } & (
  | { type: 'create'; id: string; task: TaskInput; reminderDelay: number | null }
  | { type: 'edit'; id: string; expectedRevision: number; task: TaskInput }
  | { type: 'complete'; id: string; expectedRevision: number; done: boolean }
  | { type: 'lifecycle'; id: string; expectedRevision: number; lifecycle: Task['lifecycle'] }
  | { type: 'remind'; id: string; expectedRevision: number; delay: number }
  | { type: 'schedule-reminder'; taskId: string; expectedRevision: number; schedule: ScheduleInput }
  | { type: 'change-reminder'; id: string; expectedRevision: number; action: 'cancel' | 'snooze' | 'activate'; fireAt?: string }
  | { type: 'reminder-settings'; settings: ReminderSettings }
  | { type: 'acknowledge-reminder'; id: string }
  | { type: 'create-pickup'; id: string; title: string; trackingUrl: string | null; schedule: ScheduleInput }
  | { type: 'finish-pickup'; id: string; expectedRevision: number }
  | { type: 'preferences'; preferences: Preferences } | { type: 'undo' } | { type: 'reconcile'; ownerId?: string }
);
export type NewCommand = Command extends infer C ? C extends Command ? Omit<C, 'operationId'> : never : never;

export function migrateState(raw: unknown): State {
  if (typeof raw === 'object' && raw !== null && 'schemaVersion' in raw && raw.schemaVersion === 1) {
    const legacy = legacyStateSchema.parse(raw);
    return stateSchema.parse({ ...legacy, schemaVersion: 3, namespaceId: crypto.randomUUID(), tasks: legacy.tasks.map((task) => ({ ...task, title: task.id === 'demo-brief' && task.title === 'Review the demo briefing' && task.revision === 1 ? 'Review project brief' : task.title })), receipts: [], importedBundles: [], sourceMappings: [], undo: null });
  }
  if (typeof raw === 'object' && raw !== null && 'schemaVersion' in raw && raw.schemaVersion === 2) return stateSchema.parse({ ...raw, schemaVersion: 3 });
  return stateSchema.parse(raw);
}
export function urgency(task: Task, now: Date): string {
  if (task.lifecycle !== 'active') return task.lifecycle === 'archived' ? 'Archived' : 'In trash';
  if (task.status === 'done') return 'Completed';
  if (task.due.kind === 'none') return 'No deadline';
  const today = localDate(now, task.due.timeZone);
  if (task.due.kind === 'date') return task.due.date < today ? 'Overdue' : task.due.date === today ? 'Due today' : 'Upcoming';
  const difference = new Date(task.due.instantUtc).getTime() - now.getTime();
  if (difference < 0) return 'Overdue';
  if (difference <= 3600000) return 'Due soon';
  return localDate(new Date(task.due.instantUtc), task.due.timeZone) === today ? 'Due today' : 'Upcoming';
}
export function createInitialState(now: Date): State {
  const timestamp = now.toISOString(); const timeZone = deviceZone(); const today = localDate(now, timeZone);
  return stateSchema.parse({
    schemaVersion: 3, namespaceId: crypto.randomUUID(), revision: 0, anchor: timestamp, preferences: { theme: 'system', satire: true },
    tasks: [
      { id: 'demo-brief', title: 'Review project brief', status: 'in_progress', priority: 'high', due: { kind: 'date', date: today, timeZone } },
      { id: 'demo-priorities', title: 'Plan next week’s priorities', status: 'todo', priority: 'normal', due: { kind: 'none' } },
      { id: 'demo-break', title: 'Book time for focused work', status: 'todo', priority: 'low', due: { kind: 'date', date: today, timeZone } },
    ].map((task) => ({ ...task, createdAt: timestamp, updatedAt: timestamp, revision: 1 })),
    reminders: [], history: [], operationIds: [], receipts: [], importedBundles: [], sourceMappings: [], undo: null,
  });
}
export function applyCommand(current: State, command: Command, now: Date): State {
  const { operationId, ...payload } = command; const fingerprint = JSON.stringify(payload);
  const prior = current.receipts.find((receipt) => receipt.id === operationId);
  if (prior) { if (prior.fingerprint !== fingerprint) throw new DomainError('This operation ID was already used for a different change.'); return current; }
  if (current.operationIds.includes(operationId)) throw new DomainError('This older operation cannot be retried. Refresh and try the action again.');
  const next = structuredClone(current); const timestamp = now.toISOString();
  const cancel = (id: string) => next.reminders.forEach((item) => { if (item.taskId === id) cancelReminder(item, 'Task completed or removed'); });
  const schedule = (task: Task, delay: number) => {
    if (!Number.isFinite(delay) || delay < 1000 || delay > 86400000) throw new DomainError('Choose a reminder between one second and one day from now.');
    if (task.status === 'done' || task.lifecycle !== 'active') throw new DomainError('Restore and reopen the task before scheduling a reminder.');
    next.reminders.push(newReminder(operationId, task.id, null, { fireAt: new Date(now.getTime() + delay).toISOString(), timeZone: deviceZone(), rule: { kind: 'absolute' } }, now));
  };
  if (command.type === 'create') {
    if (next.tasks.some((task) => task.id === command.id)) throw new DomainError('This task already exists.');
    const task = taskSchema.parse({ ...command.task, id: command.id, createdAt: timestamp, updatedAt: timestamp, revision: 1 });
    next.tasks.push(task); next.undo = null;
    if (command.reminderDelay !== null) schedule(task, command.reminderDelay);
  } else if (command.type === 'schedule-reminder') {
    const task = next.tasks.find(item => item.id === command.taskId);
    if (!task || task.revision !== command.expectedRevision) throw new DomainError('The task changed. Close and reopen reminders to review the current version.');
    if (task.status === 'done' || task.lifecycle !== 'active') throw new DomainError('Restore and reopen the task before scheduling a reminder.');
    const schedule = { ...command.schedule };
    if (schedule.rule.kind === 'due') { schedule.fireAt = dueReminderInstant(task.due, schedule.rule); if (task.due.kind !== 'none') schedule.timeZone = task.due.timeZone; }
    next.reminders.push(newReminder(operationId, task.id, null, schedule, now));
  } else if (command.type === 'change-reminder') {
    const reminder = next.reminders.find(item => item.id === command.id);
    if (!reminder || reminder.revision !== command.expectedRevision) throw new DomainError('This reminder changed in another window. Review its current schedule.');
    if (command.action === 'cancel') cancelReminder(reminder, 'Cancelled by you');
    else {
      if (!targetActive(next, reminder)) throw new DomainError('This target is no longer active. Its reminder cannot be restarted.');
      let fireAt = command.fireAt;
      if (command.action === 'activate' && !fireAt && reminder.rule.kind === 'due') fireAt = dueReminderInstant(next.tasks.find(task => task.id === reminder.taskId)!.due, reminder.rule);
      if (!fireAt || !Number.isFinite(Date.parse(fireAt)) || Date.parse(fireAt) <= now.getTime()) throw new DomainError('Choose a reminder time in the future.');
      reminder.fireAt = new Date(fireAt).toISOString(); reminder.status = 'scheduled'; reminder.revision++; reminder.deferredUntil = null; reminder.shownAt = null; reminder.cancelReason = null;
      if (command.action === 'snooze' || command.fireAt) reminder.rule = { kind: 'absolute' };
    }
  } else if (command.type === 'create-pickup') {
    if (next.pickups.some(item => item.id === command.id) || next.tasks.some(item => item.id === command.id)) throw new DomainError('This pickup reminder already exists.');
    if (command.schedule.rule.kind !== 'absolute') throw new DomainError('Pickup reminders need a chosen time.');
    const pickup = pickupSchema.parse({ id: command.id, title: command.title, trackingUrl: command.trackingUrl, active: true, revision: 1, createdAt: timestamp });
    next.pickups.push(pickup); next.reminders.push(newReminder(operationId, null, pickup.id, command.schedule, now));
  } else if (command.type === 'finish-pickup') {
    const pickup = next.pickups.find(item => item.id === command.id);
    if (!pickup || pickup.revision !== command.expectedRevision) throw new DomainError('This pickup changed. Review it before continuing.');
    pickup.active = false; pickup.revision++;
    next.reminders.forEach(item => { if (item.pickupId === pickup.id) cancelReminder(item, 'Pickup checked'); });
  } else if (command.type === 'reminder-settings') next.reminderSettings = reminderSettingsSchema.parse(command.settings);
  else if (command.type === 'acknowledge-reminder') {
    const entry = next.history.find(item => item.id === command.id); if (entry) entry.acknowledgedAt ??= timestamp;
  } else if (command.type === 'preferences') next.preferences = preferencesSchema.parse(command.preferences);
  else if (command.type === 'undo') {
    if (!next.undo) throw new DomainError('There is no change to undo.');
    const undo = next.undo; const index = next.tasks.findIndex((task) => task.id === undo.taskBefore.id);
    if (index < 0 || next.tasks[index].revision !== undo.expectedRevision) throw new DomainError('The task has changed since that action. Reopen it to review the current version.');
    const currentReminderVersions = new Map(next.reminders.map(item => [item.id, item.revision]));
    next.tasks[index] = { ...undo.taskBefore, revision: undo.expectedRevision + 1, updatedAt: timestamp };
    if (undo.taskBefore.status === 'done' || undo.taskBefore.lifecycle !== 'active') cancel(undo.taskBefore.id);
    else for (const reminder of next.reminders) { if (reminder.taskId === undo.taskBefore.id && undo.reminderVersions.some(item => item.id === reminder.id && item.revision === reminder.revision)) cancelReminder(reminder, 'Task change undone'); }
    for (const reminder of undo.remindersBefore) {
      if (reminder.status !== 'scheduled' || Date.parse(reminder.fireAt) <= now.getTime()) continue;
      const existing = next.reminders.find((item) => item.id === reminder.id);
      if (existing && existing.status !== 'shown' && undo.reminderVersions.some(item => item.id === reminder.id && item.revision === currentReminderVersions.get(item.id))) Object.assign(existing, { ...reminder, revision: existing.revision + 1 });
    }
    next.undo = null;
  } else if (command.type === 'reconcile') {
    if (!reconcileReminders(next, now, operationId)) return current;
  } else {
    const task = next.tasks.find((item) => item.id === command.id);
    if (!task) throw new DomainError('This task is no longer available. Reload the workspace.');
    if (task.revision !== command.expectedRevision) throw new DomainError('This task changed in another window. Close the editor and reopen it before trying again.');
    const before = structuredClone(task); const remindersBefore = next.reminders.filter((item) => item.taskId === task.id).map((item) => ({ ...item }));
    if (command.type === 'remind') schedule(task, command.delay);
    else {
      if (command.type === 'edit') { const previousDue = JSON.stringify(task.due); Object.assign(task, taskSchema.parse({ ...task, ...command.task })); task.tags = [...new Set(task.tags)]; task.completedAt = task.status === 'done' ? task.completedAt ?? timestamp : null; if (task.status !== 'done' && task.lifecycle === 'active' && JSON.stringify(task.due) !== previousDue) rescheduleTaskReminders(next, task); }
      if (command.type === 'complete') { task.status = command.done ? 'done' : 'todo'; task.completedAt = command.done ? timestamp : null; }
      if (command.type === 'lifecycle') { task.lifecycle = command.lifecycle; task.archivedAt = command.lifecycle === 'archived' ? timestamp : null; task.deletedAt = command.lifecycle === 'trashed' ? timestamp : null; }
      task.revision += 1; task.updatedAt = timestamp;
      if (task.status === 'done' || task.lifecycle !== 'active') cancel(task.id);
      next.undo = { label: command.type === 'complete' ? command.done ? 'Task completed' : 'Task reopened' : command.type === 'lifecycle' ? task.lifecycle === 'trashed' ? 'Task moved to trash' : task.lifecycle === 'archived' ? 'Task archived' : 'Task restored' : 'Task updated', taskBefore: before, remindersBefore, expectedRevision: task.revision, reminderVersions: next.reminders.filter(item => item.taskId === task.id).map(({ id, revision }) => ({ id, revision })) };
    }
  }
  next.revision += 1; next.operationIds = [...next.operationIds, operationId].slice(-100);
  next.receipts = [...next.receipts, { id: operationId, fingerprint }].slice(-100);
  return stateSchema.parse(next);
}
