import { useEffect, useState } from 'react';
import { Download, History, Upload } from 'lucide-react';
import type { RecoveryEntry, WorkspaceRepository } from '../../adapters/storage/indexedDb';
import { createBackup, MAX_BACKUP_BYTES, parseBackup, previewRestore, type Backup, type RestoreOptions } from '../../domain/backup';
import { classifyReference, DomainError, type State } from '../../domain/model';
import { Dialog } from '../../shared/Dialog';

export function BackupSettings({ state, repository, onRestored }: { state: State; repository: WorkspaceRepository; onRestored: (state: State) => void }) {
  const [includeDescriptions, setIncludeDescriptions] = useState(true);
  const [acknowledged, setAcknowledged] = useState(false);
  const [bundle, setBundle] = useState<Backup | null>(null);
  const [previewRevision, setPreviewRevision] = useState(0);
  const [options, setOptions] = useState<RestoreOptions>({ mode: 'merge', conflicts: 'keep' });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [recoveries, setRecoveries] = useState<RecoveryEntry[]>([]);
  const [recovery, setRecovery] = useState<RecoveryEntry | null>(null);
  useEffect(() => { let disposed = false; repository.listRecoveries?.().then((entries) => { if (!disposed) setRecoveries(entries); }).catch(() => { if (!disposed) setError('Recovery history could not be read.'); }); return () => { disposed = true; }; }, [repository, state.revision]);
  function download() {
    try {
      const content = JSON.stringify(createBackup(state, new Date(), includeDescriptions), null, 2);
      if (new TextEncoder().encode(content).length > MAX_BACKUP_BYTES) throw new DomainError('This backup exceeds 5 MiB. Omit descriptions or reduce the task data before exporting.');
      const url = URL.createObjectURL(new Blob([content], { type: 'application/json' }));
      const link = document.createElement('a'); link.href = url; link.download = `cai-backup-${new Date().toISOString().slice(0, 10)}.json`; link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setMessage('Backup downloaded. Keep it somewhere you trust.'); setError('');
    } catch (failure) { setError(failure instanceof DomainError ? failure.message : 'The backup could not be created. Your workspace has not changed.'); }
  }
  async function choose(file: File) {
    setError(''); setMessage('');
    try {
      if (file.size > MAX_BACKUP_BYTES) throw new Error('Choose a backup smaller than 5 MiB.');
      setBundle(parseBackup(await file.text())); setPreviewRevision(state.revision); setConfirmed(false);
    } catch (failure) { setBundle(null); setError(failure instanceof Error ? failure.message : 'The file could not be read.'); }
  }
  async function restore() {
    if (!bundle || !repository.restore) return;
    setBusy(true); setError('');
    try { onRestored(await repository.restore(bundle, options, previewRevision)); setBundle(null); setMessage('Backup restored. Imported reminders remain off. A recovery snapshot is available below.'); }
    catch (failure) { setError(failure instanceof Error ? failure.message : 'Restore failed. The current workspace is unchanged.'); }
    finally { setBusy(false); }
  }
  async function recover() {
    if (!recovery || !repository.recover) return;
    setBusy(true); setError('');
    try { onRestored(await repository.recover(recovery.id, previewRevision)); setRecovery(null); setMessage('Workspace recovered. Pending reminders are off until you choose new ones.'); }
    catch (failure) { setError(failure instanceof Error ? failure.message : 'The snapshot could not be recovered.'); }
    finally { setBusy(false); }
  }
  const preview = bundle ? previewRestore(state, bundle, options) : null;
  const flaggedTitles = state.tasks.filter((task) => (task.title + '\n' + (includeDescriptions ? task.description : '')).match(/https?:\/\/\S+/g)?.some((url) => classifyReference(url) !== 'generic')).map((task) => task.title);
  return <section className="card settings-card" aria-labelledby="backup-heading"><h2 id="backup-heading">Backup and recovery</h2>
    {error && <p className="field-error" role="alert">{error}</p>}{message && <p role="status">{message}</p>}
    <p>Download your tasks, pickup checks, reminder rules and preferences, or restore a previous backup. These files can contain private information.</p>
    <label className="check-option"><input type="checkbox" checked={includeDescriptions} onChange={(event) => setIncludeDescriptions(event.target.checked)} />Include task descriptions</label>
    <p className="help-text">Task titles, pickup labels and generic links are included. Pickup tracking links are excluded. Meeting/tracking links in structured fields are excluded. Check any links or private content in task text; text is not automatically scrubbed.</p>
    {flaggedTitles.length > 0 && <p className="field-error">Review meeting/tracking links in the text of: {flaggedTitles.join('; ')}</p>}
    <label className="check-option"><input type="checkbox" checked={acknowledged} onChange={(event) => setAcknowledged(event.target.checked)} />I have reviewed the task content for export</label>
    <div className="backup-actions"><button className="button primary" disabled={!acknowledged || busy} onClick={download}><Download size={16} />Download backup</button><label className="button subtle file-button"><Upload size={16} />Choose backup<input aria-label="Choose backup file" type="file" accept=".json,application/json" disabled={busy} onChange={(event) => { const file = event.target.files?.[0]; if (file) void choose(file); event.target.value = ''; }} /></label></div>
    <div className="recovery-list"><h3><History size={16} />Recovery snapshots</h3><p className="help-text">Saved on this device before upgrades and restores. Restoring one also saves the current workspace.</p>{recoveries.length ? recoveries.slice(0, 8).map((entry) => <div key={entry.id}><span>{entry.reason}<small>{new Date(entry.createdAt).toLocaleString()}</small></span><button className="text-button" disabled={busy} onClick={() => { setRecovery(entry); setPreviewRevision(state.revision); setError(''); }}>Review recovery<span className="sr-only"> {entry.id}</span></button></div>) : <p className="help-text">No snapshots yet. One is saved automatically before the first upgrade or restore.</p>}</div>
    {bundle && preview && <Dialog title="Review backup" onClose={() => { if (!busy) setBundle(null); }}><p className="help-text">{preview.total} tasks · exported {new Date(bundle.exportedAt).toLocaleDateString()}</p><label className="field"><span>Restore mode</span><select value={options.mode} onChange={(event) => { setOptions({ ...options, mode: event.target.value as RestoreOptions['mode'] }); setConfirmed(false); }}><option value="merge">Merge with current workspace</option><option value="replace">Replace current workspace</option></select></label><label className="field"><span>When a task conflicts</span><select value={options.conflicts} onChange={(event) => setOptions({ ...options, conflicts: event.target.value as RestoreOptions['conflicts'] })}><option value="keep">Keep current version</option><option value="replace">Use version from backup</option></select></label><dl className="capability-list"><div><dt>New tasks</dt><dd>{preview.added}</dd></div><div><dt>Conflicting tasks</dt><dd>{preview.conflicts}</dd></div><div><dt>Identical tasks</dt><dd>{preview.identical}</dd></div><div><dt>Pickup checks in backup</dt><dd>{preview.pickups}</dd></div><div><dt>Reminder rules (imported off)</dt><dd>{preview.reminderRules}</dd></div><div><dt>Current tasks replaced</dt><dd>{preview.removed}</dd></div></dl><p className="help-text">{options.mode === 'merge' ? 'Current preferences and unchanged tasks are kept.' : 'This replaces all tasks, pickup checks, reminders and preferences in this workspace.'} A recovery snapshot is saved first. Imported reminders stay off.</p><label className="check-option"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />I have reviewed these changes</label>{error && <p className="field-error" role="alert">{error}</p>}<button className="button primary" disabled={!confirmed || busy} onClick={() => { void restore(); }}>{busy ? 'Restoring…' : 'Restore backup'}</button></Dialog>}
    {recovery && <Dialog title="Recover workspace" onClose={() => { if (!busy) setRecovery(null); }}><p>Restore the snapshot from {new Date(recovery.createdAt).toLocaleString()}? Your current workspace will be saved as another recovery snapshot. Pending reminders will be disabled.</p>{error && <p className="field-error" role="alert">{error}</p>}<button className="button primary" disabled={busy} onClick={() => { void recover(); }}>{busy ? 'Recovering…' : 'Recover workspace'}</button></Dialog>}
  </section>;
}
