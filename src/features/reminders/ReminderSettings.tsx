import { useState } from 'react';
import type { State } from '../../domain/model';
import type { Execute } from './ReminderRow';
import { reminderSettingsSchema } from '../../domain/reminders';

export function ReminderSettings({ state, busy, execute }: { state: State; busy: boolean; execute: Execute }) {
  const [settings, setSettings] = useState(state.reminderSettings);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const quiet = settings.quietHours;
  return <section className="card settings-card" aria-labelledby="reminder-settings-heading"><h2 id="reminder-settings-heading">Reminders</h2><p>Reminders appear inside CAi while a window is visible. Alerts that become due while you are away are summarized when you return. Browser and desktop notifications are not enabled; no notification permission is requested.</p><form onSubmit={event => { event.preventDefault(); setError(''); const parsed = reminderSettingsSchema.safeParse(settings); if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? 'Check reminder settings.'); return; } void execute({ type: 'reminder-settings', settings: parsed.data }).then(success => setSaved(success)); }} onChange={() => setSaved(false)}>
    <label className="toggle-row"><div><strong>Private reminder previews</strong><p>Hide task and pickup names in dashboard alerts. Full details stay in Reminders.</p></div><input type="checkbox" checked={settings.privatePreview} onChange={event => setSettings({ ...settings, privatePreview: event.target.checked })} /></label>
    <label className="toggle-row"><div><strong>Quiet hours</strong><p>Defer alerts until quiet hours end. Task priority does not override this.</p></div><input type="checkbox" checked={quiet.enabled} onChange={event => setSettings({ ...settings, quietHours: { ...quiet, enabled: event.target.checked } })} /></label>
    {quiet.enabled && <div className="reminder-form-grid"><label className="field"><span>Quiet hours start</span><input type="time" required value={quiet.start} onChange={event => setSettings({ ...settings, quietHours: { ...quiet, start: event.target.value } })} /></label><label className="field"><span>Quiet hours end</span><input type="time" required value={quiet.end} onChange={event => setSettings({ ...settings, quietHours: { ...quiet, end: event.target.value } })} /></label><label className="field"><span>Quiet hours time zone</span><input required maxLength={100} value={quiet.timeZone} onChange={event => setSettings({ ...settings, quietHours: { ...quiet, timeZone: event.target.value } })} /></label></div>}
    {error && <p className="field-error" role="alert">{error}</p>}<button className="button subtle" disabled={busy} type="submit">Save reminder settings</button>{saved && <p className="help-text" role="status">Reminder settings saved.</p>}
  </form></section>;
}
