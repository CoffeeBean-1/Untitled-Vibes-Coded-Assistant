import { z } from 'zod';
import { pickupSchema, reminderRuleSchema, reminderSettingsSchema, defaultReminderSettings, zoneSchema } from './reminders';
import { classifyReference, DomainError, preferencesSchema, stateSchema, taskSchema, type State } from './model';

export const backupSchema = z.object({
  format: z.literal('cai-backup'), schemaVersion: z.union([z.literal(1), z.literal(2)]), bundleId: z.string().uuid(), sourceNamespaceId: z.string().uuid(), exportedAt: z.iso.datetime(),
  tasks: z.array(taskSchema).max(10000), preferences: preferencesSchema,
  pickups: z.array(pickupSchema).max(1000).default([]), reminderSettings: reminderSettingsSchema.default(defaultReminderSettings),
  reminderRules: z.array(z.object({ id: z.string().min(1).max(100), taskId: z.string().min(1).max(100).nullable(), pickupId: z.string().min(1).max(100).nullable().default(null), fireAt: z.iso.datetime(), timeZone: zoneSchema.default('UTC'), rule: reminderRuleSchema.default({ kind: 'absolute' }) }).strict()).max(10000),
  omissions: z.array(z.string().max(100)).max(20),
}).strict().superRefine((bundle, context) => {
  const ids = new Set(bundle.tasks.map((task) => task.id));
  if (ids.size !== bundle.tasks.length || new Set(bundle.reminderRules.map((item) => item.id)).size !== bundle.reminderRules.length) context.addIssue({ code: 'custom', message: 'The backup contains duplicate identifiers.' });
  const pickupIds = new Set(bundle.pickups.map(item => item.id));
  if (bundle.schemaVersion === 1 && (bundle.pickups.length || bundle.reminderRules.some(item => item.pickupId !== null || item.rule.kind !== 'absolute' || item.timeZone !== 'UTC') || JSON.stringify(bundle.reminderSettings) !== JSON.stringify(defaultReminderSettings()))) context.addIssue({ code: 'custom', message: 'These reminder features require backup version 2.' });
  if (pickupIds.size !== bundle.pickups.length || bundle.pickups.some(item => ids.has(item.id) || item.trackingUrl !== null)) context.addIssue({ code: 'custom', message: 'Duplicate pickup IDs or excluded tracking links.' });
  if (bundle.reminderRules.some((item) => (item.taskId === null) === (item.pickupId === null) || (item.taskId !== null ? !ids.has(item.taskId) : !pickupIds.has(item.pickupId!)))) context.addIssue({ code: 'custom', message: 'A reminder references a missing task.' });
  if (bundle.tasks.some((task) => task.references.some((ref) => ref.kind !== 'generic' || classifyReference(ref.url) !== 'generic'))) context.addIssue({ code: 'custom', message: 'Remove structured meeting and tracking links before importing this backup.' });
});
export type Backup = z.infer<typeof backupSchema>;
export type RestoreOptions = { mode: 'merge' | 'replace'; conflicts: 'keep' | 'replace' };
export const MAX_BACKUP_BYTES = 5 * 1024 * 1024;
// Version-one import receipts were hashed before reminder defaults existed. Preserve
// that exact canonical field order so a repeated old import remains a no-op.
export function backupFingerprintData(bundle: Backup): string {
  if (bundle.schemaVersion !== 1) return JSON.stringify(bundle);
  return JSON.stringify({ format: bundle.format, schemaVersion: 1, bundleId: bundle.bundleId, sourceNamespaceId: bundle.sourceNamespaceId, exportedAt: bundle.exportedAt, tasks: bundle.tasks, preferences: bundle.preferences, reminderRules: bundle.reminderRules.map(({ id, taskId, fireAt }) => ({ id, taskId, fireAt })), omissions: bundle.omissions });
}
export function parseBackup(text: string): Backup {
  if (new TextEncoder().encode(text).length > MAX_BACKUP_BYTES) throw new DomainError('Choose a backup smaller than 5 MiB.');
  try { return backupSchema.parse(JSON.parse(text)); } catch (error) { throw new DomainError(error instanceof z.ZodError ? `This backup is not supported: ${error.issues[0]?.message ?? 'invalid content'}` : 'This file is not valid JSON.'); }
}
export function createBackup(state: State, now: Date, includeDescriptions: boolean): Backup {
  const bundle = backupSchema.parse({
    format: 'cai-backup', schemaVersion: 2, bundleId: crypto.randomUUID(), sourceNamespaceId: state.namespaceId, exportedAt: now.toISOString(), preferences: state.preferences, reminderSettings: state.reminderSettings,
    pickups: state.pickups.map(item => ({ ...item, trackingUrl: null })),
    tasks: state.tasks.map((task) => ({ ...task, description: includeDescriptions ? task.description : '', references: task.references.filter((ref) => ref.kind === 'generic' && classifyReference(ref.url) === 'generic') })),
    reminderRules: state.reminders.filter((item) => item.status === 'scheduled').map(({ id, taskId, pickupId, fireAt, timeZone, rule }) => ({ id, taskId, pickupId, fireAt, timeZone, rule })),
    omissions: ['calendar-data', 'credentials-and-approval-state', 'meeting-and-tracking-links', 'notification-history', ...(!includeDescriptions ? ['descriptions'] : [])],
  });
  if (new TextEncoder().encode(JSON.stringify(bundle)).length > MAX_BACKUP_BYTES) throw new DomainError('This backup exceeds 5 MiB. Omit descriptions or reduce the task data before exporting.');
  return bundle;
}
export function previewRestore(state: State, bundle: Backup, options: RestoreOptions) {
  let added = 0; let identical = 0; let conflicts = 0;
  for (const task of bundle.tasks) {
    const id = bundle.sourceNamespaceId === state.namespaceId ? task.id : state.sourceMappings.find((item) => item.source === bundle.sourceNamespaceId && item.sourceId === task.id)?.localId;
    const existing = state.tasks.find((item) => item.id === id);
    if (!existing || options.mode === 'replace') added++;
    else if (JSON.stringify({ ...existing, id: task.id }) === JSON.stringify(task)) identical++;
    else conflicts++;
  }
  return { pickups: bundle.pickups.length, reminderRules: bundle.reminderRules.length, added, identical, conflicts, total: bundle.tasks.length, removed: options.mode === 'replace' ? state.tasks.length : 0 };
}
export function restoreBackup(state: State, raw: Backup, options: RestoreOptions, fingerprint: string): State {
  const bundle = backupSchema.parse(raw); const receipt = state.importedBundles.find((item) => item.id === bundle.bundleId);
  if (receipt) { if (receipt.fingerprint !== fingerprint) throw new DomainError('That backup identifier was already used for different content.'); return state; }
  if (state.importedBundles.length >= 1000) throw new DomainError('The import history limit has been reached. Export your workspace before starting a new one.');
  const next = structuredClone(state); next.undo = null;
  if (options.mode === 'replace') { next.tasks = []; next.pickups = []; next.reminders = []; next.history = []; next.sourceMappings = []; next.preferences = bundle.preferences; next.reminderSettings = bundle.reminderSettings; }
  const changed = new Set<string>();
  for (const incoming of bundle.tasks) {
    let id = incoming.id;
    if (bundle.sourceNamespaceId !== next.namespaceId) {
      let mapping = next.sourceMappings.find((item) => item.source === bundle.sourceNamespaceId && item.sourceId === incoming.id);
      if (!mapping) { mapping = { source: bundle.sourceNamespaceId, sourceId: incoming.id, localId: crypto.randomUUID() }; next.sourceMappings.push(mapping); }
      id = mapping.localId;
    }
    const index = next.tasks.findIndex((task) => task.id === id);
    if (index >= 0 && (options.conflicts === 'keep' || JSON.stringify({ ...next.tasks[index], id: incoming.id }) === JSON.stringify(incoming))) continue;
    const task = { ...incoming, id, revision: index >= 0 ? next.tasks[index].revision + 1 : incoming.revision };
    if (index >= 0) next.tasks[index] = task; else next.tasks.push(task);
    changed.add(id);
  }
  const mapId = (kind: 'pickup' | 'reminder', sourceId: string) => {
    if (bundle.sourceNamespaceId === next.namespaceId) return sourceId;
    const source = `${bundle.sourceNamespaceId}:${kind}`;
    let mapping = next.sourceMappings.find(item => item.source === source && item.sourceId === sourceId);
    if (!mapping) { mapping = { source, sourceId, localId: crypto.randomUUID() }; next.sourceMappings.push(mapping); }
    return mapping.localId;
  };
  for (const incoming of bundle.pickups) {
    const id = mapId('pickup', incoming.id); const index = next.pickups.findIndex(item => item.id === id);
    if (index >= 0 && (options.conflicts === 'keep' || JSON.stringify({ ...next.pickups[index], id: incoming.id, trackingUrl: null }) === JSON.stringify(incoming))) continue;
    const pickup = { ...incoming, id, trackingUrl: null, revision: index >= 0 ? next.pickups[index].revision + 1 : incoming.revision };
    if (index >= 0) next.pickups[index] = pickup; else next.pickups.push(pickup);
    changed.add(id);
  }
  next.reminders = next.reminders.map(item => changed.has(item.taskId ?? item.pickupId!) && item.status === 'scheduled' ? { ...item, revision: item.revision + 1, status: 'cancelled' as const, cancelReason: 'Target restored from backup' } : item);
  for (const rule of bundle.reminderRules) {
    const taskId = rule.taskId === null ? null : bundle.sourceNamespaceId === next.namespaceId ? rule.taskId : next.sourceMappings.find(item => item.source === bundle.sourceNamespaceId && item.sourceId === rule.taskId)!.localId;
    const pickupId = rule.pickupId === null ? null : mapId('pickup', rule.pickupId);
    const id = mapId('reminder', rule.id); const existing = next.reminders.find(item => item.id === id);
    const same = existing && existing.fireAt === rule.fireAt && JSON.stringify(existing.rule) === JSON.stringify(rule.rule) && existing.timeZone === rule.timeZone;
    if (existing && !changed.has(taskId ?? pickupId!) && (same || options.conflicts === 'keep')) continue;
    const restored = { ...rule, id, taskId, pickupId, status: 'cancelled' as const, revision: (existing?.revision ?? 0) + 1, deferredUntil: null, shownAt: null, cancelReason: 'Imported; review before activating' };
    if (existing) Object.assign(existing, restored); else next.reminders.push(restored);
  }
  next.importedBundles.push({ id: bundle.bundleId, fingerprint }); next.revision += 1; next.operationIds = []; next.receipts = [];
  return stateSchema.parse(next);
}
