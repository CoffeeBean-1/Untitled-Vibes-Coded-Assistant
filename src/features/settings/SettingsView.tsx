import { CalendarSettings } from '../calendar/CalendarSettings';
import type { CalendarConnection } from '../calendar/useCalendar';
import type { WorkspaceRepository } from '../../adapters/storage/indexedDb';
import type { NewCommand, State } from '../../domain/model';
import { ReminderSettings } from '../reminders/ReminderSettings';
import { BackupSettings } from '../storage/BackupSettings';

export function SettingsView({ state, busy, execute, repository, publish, calendar }: { calendar: CalendarConnection; state: State; busy: boolean; execute: (command: NewCommand) => Promise<boolean>; repository: WorkspaceRepository; publish: (state: State) => void }) {
  return <div className="settings-stack">
    <section className="card settings-card"><h2>Appearance</h2><fieldset disabled={busy}><legend>Theme</legend><div className="segmented">{(['light', 'dark', 'system'] as const).map((theme) => <label key={theme}><input type="radio" name="theme" value={theme} checked={state.preferences.theme === theme} onChange={() => { void execute({ type: 'preferences', preferences: { ...state.preferences, theme } }); }} /><span>{theme[0].toUpperCase() + theme.slice(1)}</span></label>)}</div></fieldset>
    <fieldset className="density-setting" disabled={busy}><legend>Display density</legend><div className="density-options">{(['compact', 'default', 'comfortable'] as const).map((density) => <label key={density}><input type="radio" name="density" value={density} checked={(state.preferences.density ?? 'default') === density} onChange={() => { void execute({ type: 'preferences', preferences: { ...state.preferences, density } }); }} /><span><strong>{density === 'compact' ? 'Compact' : density === 'default' ? 'Default' : 'Comfortable'}</strong><small>{density === 'compact' ? 'Tighter rows and spacing' : density === 'default' ? 'Balanced spacing' : 'More room between items'}</small></span></label>)}</div><p className="help-text">Applies to the dashboard, calendar, tasks and reminders. Text stays the same size.</p></fieldset>
    <label className="toggle-row"><div><strong>Optional satirical copy</strong><p>Show the brand tagline and occasional fictional corporate commentary. Functional messages stay unchanged.</p></div><input type="checkbox" checked={state.preferences.satire} disabled={busy} onChange={(event) => { void execute({ type: 'preferences', preferences: { ...state.preferences, satire: event.target.checked } }); }} /></label></section>
    <ReminderSettings state={state} busy={busy} execute={execute} />
    <BackupSettings state={state} repository={repository} onRestored={publish} />
    <CalendarSettings calendar={calendar} />
    <section className="card settings-card"><h2>Storage and reminders</h2><dl className="capability-list"><div><dt>Tasks and preferences</dt><dd>Saved in this browser</dd></div><div><dt>Reminders</dt><dd>App must remain open</dd></div><div><dt>Global shortcut</dt><dd>Unavailable in browser mode</dd></div></dl><p className="help-text">Browser data can be cleared by device policy or site-data deletion. Keep backups of anything you want to retain. Reminders may be delayed in background tabs; chosen-time reminders stay independent of deadlines; deadline-relative reminders move with the saved deadline.</p></section>
  </div>;
}
