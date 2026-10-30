import { z } from 'zod';
import { Temporal } from '@js-temporal/polyfill';
import { DomainError } from './errors';
import type { Deadline, State, Task } from './workspace';

export const zoneSchema = z.string().max(100).refine(value => { try { new Intl.DateTimeFormat('en', { timeZone: value }); return true; } catch { return false; } }, 'Choose a valid IANA time zone.');
export const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Choose a time in HH:mm format.');
export const reminderRuleSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('absolute') }).strict(),
  z.object({ kind: z.literal('due'), minutesBefore: z.number().int().min(0).max(43200), localTime: timeSchema }).strict(),
]);
export const reminderSchema = z.object({
  id: z.string().min(1).max(100), taskId: z.string().min(1).max(100).nullable(), pickupId: z.string().min(1).max(100).nullable().default(null),
  fireAt: z.iso.datetime(), timeZone: zoneSchema.default('UTC'), rule: reminderRuleSchema.default({ kind: 'absolute' }),
  status: z.enum(['scheduled', 'shown', 'cancelled']), revision: z.number().int().positive().default(1),
  deferredUntil: z.iso.datetime().nullable().default(null), shownAt: z.iso.datetime().nullable().default(null),
  cancelReason: z.string().max(100).nullable().default(null),
}).strict().refine(item => (item.taskId === null) !== (item.pickupId === null), 'A reminder must have exactly one target.');
export const pickupSchema = z.object({
  id: z.string().min(1).max(100), title: z.string().trim().min(1).max(200), trackingUrl: z.string().max(2048).nullable(),
  active: z.boolean(), revision: z.number().int().positive(), createdAt: z.iso.datetime(),
}).strict().refine(item => item.trackingUrl === null || safeTrackingUrl(item.trackingUrl), 'Tracking links must use HTTPS without embedded credentials or local addresses.');
export const reminderSettingsSchema = z.object({
  privatePreview: z.boolean(),
  quietHours: z.object({ enabled: z.boolean(), start: timeSchema, end: timeSchema, timeZone: zoneSchema }).strict().refine(item => !item.enabled || item.start !== item.end, 'Quiet hours must have different start and end times.'),
}).strict();
export const defaultReminderSettings = () => ({ privatePreview: true, quietHours: { enabled: false, start: '22:00', end: '08:00', timeZone: 'America/Chicago' } });
export type Reminder = z.infer<typeof reminderSchema>;
export type ReminderRule = z.infer<typeof reminderRuleSchema>;
export type ReminderSettings = z.infer<typeof reminderSettingsSchema>;
export type ScheduleInput = { fireAt: string; timeZone: string; rule: ReminderRule };

export function safeTrackingUrl(value: string): boolean {
  try {
    const url = new URL(value); const host = url.hostname.toLowerCase();
    return url.protocol === 'https:' && !url.username && !url.password && !url.hash && host.includes('.') && !host.endsWith('.localhost') && !host.endsWith('.local') && !host.endsWith('.internal') && !/^[\d.]+$/.test(host) && !host.includes(':');
  } catch { return false; }
}
export function localInstant(value: string, timeZone: string): string {
  try {
    zoneSchema.parse(timeZone);
    return Temporal.PlainDateTime.from(value).toZonedDateTime(timeZone, { disambiguation: 'compatible' }).toInstant().toString({ smallestUnit: 'millisecond' });
  } catch { throw new DomainError('Choose a valid date, time and time zone.'); }
}
export function localInput(instant: Date, timeZone: string): string {
  return Temporal.Instant.from(instant.toISOString()).toZonedDateTimeISO(timeZone).toPlainDateTime().toString({ smallestUnit: 'minute' });
}
export function dueReminderInstant(due: Deadline, rule: Extract<ReminderRule, { kind: 'due' }>): string {
  if (due.kind === 'none') throw new DomainError('Set a task deadline before adding a deadline-relative reminder.');
  const instant = due.kind === 'instant' ? Temporal.Instant.from(due.instantUtc) : Temporal.Instant.from(localInstant(`${due.date}T${rule.localTime}`, due.timeZone));
  return instant.subtract({ minutes: rule.minutesBefore }).toString({ smallestUnit: 'millisecond' });
}
export function quietHoursEnd(now: Date, settings: ReminderSettings): string | null {
  const quiet = settings.quietHours; if (!quiet.enabled) return null;
  const instant = Temporal.Instant.from(now.toISOString());
  const today = instant.toZonedDateTimeISO(quiet.timeZone).toPlainDate();
  const overnight = quiet.start > quiet.end;
  // Compare real interval bounds: wall-time comparison alone can end quiet hours
  // between the two copies of an overlapping end time during a fall-back.
  for (const date of [today, today.subtract({ days: 1 })]) {
    const start = date.toPlainDateTime(quiet.start).toZonedDateTime(quiet.timeZone, { disambiguation: 'compatible' }).toInstant();
    const end = (overnight ? date.add({ days: 1 }) : date).toPlainDateTime(quiet.end).toZonedDateTime(quiet.timeZone, { disambiguation: 'later' }).toInstant();
    if (Temporal.Instant.compare(instant, start) >= 0 && Temporal.Instant.compare(instant, end) < 0) return end.toString({ smallestUnit: 'millisecond' });
  }
  return null;
}
export function targetActive(state: State, reminder: Reminder): boolean {
  if (reminder.taskId !== null) return state.tasks.some(task => task.id === reminder.taskId && task.lifecycle === 'active' && task.status !== 'done');
  return state.pickups.some(pickup => pickup.id === reminder.pickupId && pickup.active);
}
export function reminderTitle(state: State, reminder: Reminder): string {
  return reminder.taskId !== null ? state.tasks.find(task => task.id === reminder.taskId)?.title ?? 'Task reminder' : `Check pickup: ${state.pickups.find(pickup => pickup.id === reminder.pickupId)?.title ?? 'Aster Hall'}`;
}
export function cancelReminder(reminder: Reminder, reason: string) {
  if (reminder.status !== 'scheduled') return;
  reminder.status = 'cancelled'; reminder.cancelReason = reason; reminder.revision++; reminder.deferredUntil = null;
}
export function newReminder(id: string, taskId: string | null, pickupId: string | null, input: ScheduleInput, now: Date): Reminder {
  const reminder = reminderSchema.parse({ id, taskId, pickupId, ...input, status: 'scheduled' });
  if (new Date(reminder.fireAt).getTime() <= now.getTime()) throw new DomainError('Choose a reminder time in the future.');
  return reminder;
}
export function rescheduleTaskReminders(state: State, task: Task) {
  for (const reminder of state.reminders) {
    if (reminder.taskId !== task.id || reminder.status !== 'scheduled' || reminder.rule.kind !== 'due') continue;
    if (task.due.kind === 'none') cancelReminder(reminder, 'Deadline removed');
    else { reminder.fireAt = dueReminderInstant(task.due, reminder.rule); reminder.timeZone = task.due.timeZone; reminder.revision++; reminder.deferredUntil = null; }
  }
}
export function reconcileReminders(state: State, now: Date, operationId: string): boolean {
  const timestamp = now.toISOString(); let changed = false;
  const due: Reminder[] = [];
  for (const reminder of state.reminders) {
    if (reminder.status !== 'scheduled') continue;
    if (!targetActive(state, reminder)) { cancelReminder(reminder, 'Target inactive'); changed = true; continue; }
    if (Date.parse(reminder.fireAt) > now.getTime()) continue;
    const quietEnd = quietHoursEnd(now, state.reminderSettings);
    if (quietEnd) {
      if (reminder.deferredUntil !== quietEnd) { reminder.deferredUntil = quietEnd; changed = true; }
      continue;
    }
    // Re-evaluate current quiet hours rather than relying on a saved timer when settings change.
    due.push(reminder);
  }
  const missed = due.filter(item => item.deferredUntil !== null || now.getTime() - new Date(item.fireAt).getTime() > 60000);
  for (const reminder of due) {
    reminder.status = 'shown'; reminder.shownAt = timestamp; changed = true;
    if (!missed.includes(reminder)) state.history.unshift({ id: `${reminder.id}:${reminder.revision}`, taskId: reminder.taskId, message: reminderTitle(state, reminder), shownAt: timestamp, missed: false, reminderIds: [reminder.id], intendedAt: reminder.fireAt, acknowledgedAt: null, deliveries: [{ reminderId: reminder.id, revision: reminder.revision, title: reminderTitle(state, reminder), intendedAt: reminder.fireAt }] });
  }
  if (missed.length) state.history.unshift({ id: operationId, taskId: null, message: `${missed.length} reminder${missed.length === 1 ? '' : 's'} became due while you were away or during quiet hours.`, shownAt: timestamp, missed: true, reminderIds: missed.map(item => item.id), intendedAt: missed.map(item => item.fireAt).sort()[0], acknowledgedAt: null, deliveries: missed.map(item => ({ reminderId: item.id, revision: item.revision, title: reminderTitle(state, item), intendedAt: item.fireAt })) });
  state.history = state.history.slice(0, 100);
  return changed;
}
