import { useState, type FormEvent } from 'react';
import { CalendarDays, RefreshCw, Unplug } from 'lucide-react';
import { deviceZone } from '../../shared/clock';
import type { CalendarConnection } from './useCalendar';

export function CalendarSettings({ calendar }: { calendar: CalendarConnection }) {
  const [url, setUrl] = useState('');
  const [timeZone, setTimeZone] = useState(deviceZone);
  const [ownerEmail, setOwnerEmail] = useState('');
  const { snapshot, busy, actionError } = calendar;
  async function connect(event: FormEvent) {
    event.preventDefault();
    if (await calendar.connect({ url, timeZone, ownerEmail })) setUrl('');
  }
  const configured = snapshot.source === 'ics' && !!snapshot.host;
  return <section className="card settings-card" aria-labelledby="outlook-heading"><h2 id="outlook-heading">Outlook calendar</h2>
    <p>Connect a published ICS subscription. Read-only calendar access; no email access or Microsoft sign-in.</p>
    {configured && <div className="calendar-connection"><CalendarDays size={19} /><div><strong>{snapshot.name}</strong><small>{snapshot.host}</small><small>{snapshot.lastSuccessfulRefresh ? `Last refreshed ${new Date(snapshot.lastSuccessfulRefresh).toLocaleString()}` : 'Not refreshed yet'}</small></div></div>}
    {snapshot.status === 'disconnected' && <p role="status">Calendar disconnected. Paste the link again to reconnect.</p>}
    {(actionError || snapshot.error) && <p className="field-error" role="alert">{actionError || snapshot.error}</p>}
    <form className="task-form" onSubmit={(event) => { void connect(event); }}>
      <label className="field"><span>ICS subscription link</span><input type="password" autoComplete="off" spellCheck={false} maxLength={4096} required value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://outlook.office365.com/…/calendar.ics" /></label>
      <details className="task-details"><summary>Calendar options</summary><div className="details-fields"><label className="field"><span>Calendar time zone</span><input required value={timeZone} onChange={(event) => setTimeZone(event.target.value)} /></label><label className="field"><span>Your calendar email <small>optional</small></span><input type="email" autoComplete="off" value={ownerEmail} onChange={(event) => setOwnerEmail(event.target.value)} maxLength={254} /></label><p className="help-text">The optional email is matched only against calendar attendees to exclude invitations you declined. It does not access your inbox. The time zone is used for all-day and floating-time events.</p></div></details>
      <div className="backup-actions"><button type="submit" className="button primary" disabled={busy}>{busy ? 'Working…' : configured ? 'Replace calendar' : 'Connect calendar'}</button>{configured && <button type="button" className="button subtle" disabled={busy} onClick={() => { void calendar.refresh(); }}><RefreshCw size={15} />Refresh calendar</button>}{snapshot.source === 'ics' && <button type="button" className="button subtle" onClick={() => { void calendar.disconnect(); }}><Unplug size={15} />Disconnect calendar</button>}</div>
    </form>
    <p className="help-text">Anyone holding the subscription link can read the details Outlook publishes. Unpublish the calendar in Outlook to revoke the feed.</p>
    <p className="help-text">The private link and calendar stay in memory on this computer, outside task backups and logs. Browser reloads retain the connection while CAi is running; restarting CAi or an eight-hour idle timeout requires pasting the link again.</p>
    <p className="help-text">Refreshes run while this app is visible. Published feed updates may lag behind changes in Outlook. Unsupported time zones or complex recurrence are labeled as incomplete.</p>
  </section>;
}
