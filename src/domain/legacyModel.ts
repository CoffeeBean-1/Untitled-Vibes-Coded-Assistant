import { z } from 'zod';

const utc = z.iso.datetime();
const date = z.iso.date();
const zone = z.string().max(100).refine((value) => {
  try { new Intl.DateTimeFormat('en', { timeZone: value }); return true; } catch { return false; }
}, 'Choose a valid time zone.');
export const prioritySchema = z.enum(['critical', 'high', 'normal', 'low']);
export const statusSchema = z.enum(['todo', 'in_progress', 'waiting', 'done']);
export const deadlineSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('none') }),
  z.object({ kind: z.literal('date'), date, timeZone: zone }),
  z.object({ kind: z.literal('instant'), instantUtc: utc, timeZone: zone }),
]);
export const taskSchema = z.object({
  id: z.string().min(1), title: z.string().trim().min(1).max(200),
  status: statusSchema, priority: prioritySchema, due: deadlineSchema,
  createdAt: utc, updatedAt: utc, revision: z.number().int().positive(),
});
export const preferencesSchema = z.object({ theme: z.enum(['light', 'dark', 'system']), satire: z.boolean() });
const reminderSchema = z.object({
  id: z.string(), taskId: z.string(), fireAt: utc,
  status: z.enum(['scheduled', 'shown', 'cancelled']),
});
export const stateSchema = z.object({
  schemaVersion: z.literal(1), revision: z.number().int().nonnegative(), anchor: utc,
  tasks: z.array(taskSchema).max(10000), reminders: z.array(reminderSchema).max(10000),
  history: z.array(z.object({ id: z.string(), taskId: z.string().nullable(), message: z.string(), shownAt: utc, missed: z.boolean() })).max(100),
  preferences: preferencesSchema,
  operationIds: z.array(z.string()).max(100),
});
