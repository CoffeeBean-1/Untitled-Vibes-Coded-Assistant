import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Bell, CalendarDays, Check, ChevronRight, CircleHelp, ClipboardList, LayoutDashboard, LoaderCircle, Moon, Plus, RefreshCw, Settings, ShieldCheck, Sun, Undo2, Utensils, WifiOff } from 'lucide-react';
import { IndexedDbWorkspace, type WorkspaceRepository } from '../adapters/storage/indexedDb';
import { Brand } from '../branding/Brand';
import { BRAND, BRAND_COPY } from '../branding/identity';
import { useCalendar } from '../features/calendar/useCalendar';
import { CalendarView } from '../features/calendar/CalendarView';
import { RemindersView } from '../features/reminders/RemindersView';
import { RemindersWidget } from '../features/reminders/RemindersWidget';
import { TaskReminders } from '../features/reminders/TaskReminders';
import { AsterHallView, AsterHallWidget } from '../features/food/AsterHall';
import { CalendarPanel } from '../features/calendar/CalendarPanel';
import type { Task } from '../domain/model';
import { TaskForm } from '../features/tasks/TaskForm';
import { QuickTaskEntry } from '../features/tasks/QuickTaskEntry';
import { TaskRows } from '../features/tasks/TaskRows';
import { selectTasks, taskViews, type TaskView } from '../features/tasks/views';
import { SettingsView } from '../features/settings/SettingsView';
import { Dialog } from '../shared/Dialog';
import { systemClock, type Clock } from '../shared/clock';
import { useWorkspace } from './useWorkspace';

const defaultRepository = new IndexedDbWorkspace();
type View = 'dashboard' | 'tasks' | 'calendar' | 'reminders' | 'food' | 'settings' | 'about';
const viewNames: Record<View, string> = { dashboard: 'Dashboard', tasks: 'Tasks', calendar: 'Calendar', reminders: 'Reminders', food: 'Aster Hall', settings: 'Settings', about: 'About' };
export function App({ repository = defaultRepository, clock = systemClock }: { repository?: WorkspaceRepository; clock?: Clock }) {
  const { state, loading, busy, error, setError, now, load, execute, publish } = useWorkspace(repository, clock);
  const calendar = useCalendar(clock);
  const [calendarSelection, setCalendarSelection] = useState<string | undefined>();
  const [view, setView] = useState<View>('dashboard');
  const [online, setOnline] = useState(() => navigator.onLine);
  const [systemDark, setSystemDark] = useState(() => matchMedia('(prefers-color-scheme: dark)').matches);
  const [editing, setEditing] = useState<Task | null>(null);
  const [creating, setCreating] = useState(false);
  const [quickTitle, setQuickTitle] = useState('');
  const [creationTitle, setCreationTitle] = useState('');
  const [creatingFromQuick, setCreatingFromQuick] = useState(false);
  const [notice, setNotice] = useState('');
  const [dashboardFilter, setDashboardFilter] = useState<'active' | 'done'>('active');
  const [taskView, setTaskView] = useState<TaskView>('All tasks');
  const [search, setSearch] = useState('');
  const [pageIndex, setPageIndex] = useState(0);
  const [priority, setPriority] = useState('');
  const [status, setStatus] = useState('');
  const quickEntry = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const media = matchMedia('(prefers-color-scheme: dark)');
    const updateTheme = () => setSystemDark(media.matches); const updateOnline = () => setOnline(navigator.onLine);
    media.addEventListener('change', updateTheme); window.addEventListener('online', updateOnline); window.addEventListener('offline', updateOnline);
    return () => { media.removeEventListener('change', updateTheme); window.removeEventListener('online', updateOnline); window.removeEventListener('offline', updateOnline); };
  }, []);
  const theme = state?.preferences.theme ?? 'system';
  const dark = theme === 'dark' || theme === 'system' && systemDark;
  useEffect(() => { document.documentElement.dataset.theme = dark ? 'dark' : 'light'; document.documentElement.style.colorScheme = dark ? 'dark' : 'light'; }, [dark]);
  const active = state?.tasks.filter((task) => task.lifecycle === 'active' && task.status !== 'done') ?? [];
  const done = state?.tasks.filter((task) => task.lifecycle === 'active' && task.status === 'done') ?? [];
  const selectedTasks = useMemo(() => state ? selectTasks(state.tasks, taskView, search, priority, status, now) : [], [state, taskView, search, priority, status, now]);
  const currentPage = Math.min(pageIndex, Math.max(0, Math.ceil(selectedTasks.length / 50) - 1));
  const editingOpen = editing !== null || creating;
  const openNewTask = (fromQuick = false) => {
    setError(''); setEditing(null); setCreationTitle(fromQuick ? quickTitle : ''); setCreatingFromQuick(fromQuick);
    setView('tasks'); setTaskView('All tasks'); setSearch(''); setPriority(''); setStatus(''); setPageIndex(0); setCreating(true);
  };
  const closeEditor = () => { if (!busy) { setEditing(null); setCreating(false); } };

  return <div className="app-shell" data-density={state?.preferences.density ?? 'default'}>
    <a className="skip-link" href="#main-content">Skip to content</a>
    <aside className="sidebar" aria-label="Workspace navigation"><a className="identity" href="#dashboard" aria-label="CAi home" onClick={() => setView('dashboard')}><Brand dark={dark} decorative /></a><div className="sidebar-label">WORKSPACE</div><nav>{([{ view: 'dashboard', icon: LayoutDashboard, name: 'Dashboard' }, { view: 'tasks', icon: ClipboardList, name: 'Tasks' }, { view: 'calendar', icon: CalendarDays, name: 'Calendar' }, { view: 'reminders', icon: Bell, name: 'Reminders' }, { view: 'food', icon: Utensils, name: 'Aster Hall' }, { view: 'settings', icon: Settings, name: 'Settings' }, { view: 'about', icon: CircleHelp, name: 'About CAi' }] as const).map(({ view: target, icon: Icon, name }) => <button key={target} className={`nav-item ${view === target ? 'selected' : ''}`} aria-current={view === target ? 'page' : undefined} onClick={() => setView(target)}><Icon size={18} />{name}</button>)}</nav><div className="sidebar-bottom"><div className="local-icon"><ShieldCheck size={19} /></div><strong>On this device</strong><p>Tasks saved locally.<br />Backups in Settings.</p><span className="version">CAi / 0.3</span></div></aside>
    <div className="workspace"><header className="topbar"><span className="breadcrumb">Workspace <ChevronRight size={14} /><strong>{viewNames[view]}</strong></span><div className="topbar-actions"><span className="workspace-badge"><span className="footer-dot" />Local workspace</span><button disabled={!state || busy} className="icon-button" aria-label={`Switch to ${dark ? 'light' : 'dark'} theme`} onClick={() => { if (state) void execute({ type: 'preferences', preferences: { ...state.preferences, theme: dark ? 'light' : 'dark' } }); }}>{dark ? <Sun size={19} /> : <Moon size={19} />}</button><span className="avatar" aria-label="Your workspace">Y</span></div></header>
    <main id="main-content" tabIndex={-1}>
      {!online && <div className="banner offline" role="status"><WifiOff size={17} /><span>Offline. Your saved tasks are still available.</span></div>}
      {error && !editingOpen && <div className="banner error" role="alert"><span>{error}</span><button className="button subtle" disabled={loading || busy} onClick={() => { void load(); }}><RefreshCw size={15} />Retry storage</button></div>}
      {notice && <div className="banner success" role="status"><Check size={17} />{notice}<button className="text-button" onClick={() => setNotice('')}>Dismiss</button></div>}
      {state?.undo && <div className="undo-bar" role="status"><span>{state.undo.label}</span><button className="text-button" disabled={busy} onClick={() => { void execute({ type: 'undo' }); }}><Undo2 size={15} />Undo</button></div>}
      <div className="page-heading"><div><p className="eyebrow">{view === 'about' ? 'ABOUT CAi' : 'YOUR WORKSPACE'}</p><h1>{view === 'about' ? BRAND.fullName : viewNames[view]}</h1><p className="subtitle">{view === 'dashboard' ? 'Your schedule and priorities, in one place.' : view === 'tasks' ? 'Plan, prioritize, and keep work moving.' : view === 'calendar' ? 'Your meetings, with room for the details.' : view === 'reminders' ? 'Scheduled reminders and delivery history.' : view === 'food' ? 'Order lunch and keep track of your pickup check.' : view === 'settings' ? 'Your preferences, connections, and backups.' : 'Meetings, tasks, and reminders in one workspace.'}</p></div>{view === 'dashboard' && <div className="today-date"><CalendarDays size={17} />{new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric' }).format(now)}</div>}{view === 'tasks' && state && <button className="button primary" onClick={() => openNewTask()}><Plus size={16} />New task</button>}</div>
      {loading && !state && <div className="loading-state" role="status"><LoaderCircle className="spin" size={22} />Loading workspace…</div>}
      {!loading && !state && <section className="card empty-state"><ShieldCheck size={28} /><h2>Storage unavailable</h2><p>The workspace needs working local storage before it can save tasks.</p></section>}
      {view === 'dashboard' && state && <div className="dashboard-grid"><section className="card tasks-card" aria-labelledby="tasks-heading"><div className="card-heading"><div className="heading-with-icon"><span className="card-icon"><Check size={19} /></span><h2 id="tasks-heading">Tasks</h2><span className="count-badge">{active.length}</span></div><button className="icon-button" aria-label="Create a task" onClick={() => quickEntry.current?.querySelector('input')?.focus()}><Plus size={20} /></button></div><div className="task-tabs" aria-label="Task list"><button aria-pressed={dashboardFilter === 'active'} className={dashboardFilter === 'active' ? 'active' : ''} onClick={() => setDashboardFilter('active')}>Active <span>{active.length}</span></button><button aria-pressed={dashboardFilter === 'done'} className={dashboardFilter === 'done' ? 'active' : ''} onClick={() => setDashboardFilter('done')}>Completed <span>{done.length}</span></button><span className="save-state" role="status">{busy ? 'Saving…' : error ? 'Storage needs attention' : 'Saved'}</span></div><TaskRows tasks={(dashboardFilter === 'active' ? active : done).slice(-6).reverse()} busy={busy} now={now} onEdit={setEditing} execute={execute} /><div ref={quickEntry}><QuickTaskEntry title={quickTitle} onTitleChange={setQuickTitle} busy={busy} onDetails={() => openNewTask(true)} onAdd={async title => { const success = await execute({ type: 'create', id: crypto.randomUUID(), task: { title, status: 'todo', priority: 'normal', due: { kind: 'none' } }, reminderDelay: null }); if (success) { setQuickTitle(''); setDashboardFilter('active'); } return success; }} /></div><div className="card-footnote"><button className="text-button" onClick={() => setView('tasks')}>Open all tasks <ArrowRight size={14} /></button></div></section>
      <div className="right-column"><CalendarPanel calendar={calendar} anchor={state.anchor} now={now} satire={state.preferences.satire} onSettings={() => setView('settings')} onOpen={(id) => { setCalendarSelection(id); setView('calendar'); }} onNotice={setNotice} />
      <RemindersWidget state={state} onOpen={() => setView('reminders')} /><AsterHallWidget state={state} onOpen={() => setView('food')} />
      {state.preferences.satire && <p className="quiet-note">{BRAND_COPY.dashboard}</p>}</div></div>}
      {view === 'tasks' && state && <section className="card full-tasks"><div className="task-view-tabs" aria-label="Task views">{taskViews.map((name) => <button className={taskView === name ? 'selected' : ''} aria-pressed={taskView === name} key={name} onClick={() => { setTaskView(name); setPageIndex(0); }}>{name}</button>)}</div><div className="task-toolbar"><label className="field search-field"><span className="sr-only">Search tasks</span><input value={search} onChange={(event) => { setSearch(event.target.value); setPageIndex(0); }} placeholder="Search tasks, descriptions, projects, tags…" /></label><label className="field"><span className="sr-only">Filter by priority</span><select value={priority} onChange={(event) => { setPriority(event.target.value); setPageIndex(0); }}><option value="">All priorities</option><option value="critical">Critical</option><option value="high">High</option><option value="normal">Normal</option><option value="low">Low</option></select></label><label className="field"><span className="sr-only">Filter by status</span><select value={status} onChange={(event) => { setStatus(event.target.value); setPageIndex(0); }}><option value="">All statuses</option><option value="todo">To do</option><option value="in_progress">In progress</option><option value="waiting">Waiting</option><option value="done">Done</option></select></label></div><div className="task-result-count">{selectedTasks.length} {selectedTasks.length === 1 ? 'task' : 'tasks'}{taskView === 'Trash' && ' · Items stay here until restored.'}</div><TaskRows tasks={selectedTasks.slice(currentPage * 50, currentPage * 50 + 50)} busy={busy} now={now} onEdit={setEditing} execute={execute} full />{selectedTasks.length > 50 && <div className="pagination"><span>Showing {currentPage * 50 + 1}–{Math.min((currentPage + 1) * 50, selectedTasks.length)} of {selectedTasks.length}</span><button className="button subtle" disabled={currentPage === 0} onClick={() => setPageIndex(currentPage - 1)}>Previous</button><button className="button subtle" disabled={(currentPage + 1) * 50 >= selectedTasks.length} onClick={() => setPageIndex(currentPage + 1)}>Next</button></div>}</section>}
      {view === 'calendar' && state && <CalendarView initialSelectedId={calendarSelection} calendar={calendar} anchor={state.anchor} now={now} onSettings={() => setView('settings')} onNotice={setNotice} />}
      {view === 'reminders' && state && <RemindersView state={state} now={now} busy={busy} error={error} execute={execute} onTask={setEditing} onTasks={() => setView('tasks')} onFood={() => setView('food')} />}
      {view === 'food' && state && <AsterHallView state={state} now={now} busy={busy} execute={execute} onReminders={() => setView('reminders')} />}
      {view === 'settings' && state && <SettingsView state={state} busy={busy} execute={execute} repository={repository} publish={publish} calendar={calendar} />}
      {view === 'about' && <div className="settings-stack"><section className="card settings-card about-brand-stage"><p className="eyebrow">THE COMPANY</p><Brand dark={dark} signature satire={state?.preferences.satire ?? false} /><p>{state?.preferences.satire ? BRAND_COPY.about : 'Your tasks, schedule, and reminders in one workspace.'}</p><a className="brand-privacy-link" href="#actual-privacy">Actual privacy and data handling</a></section>{state?.preferences.satire && <section className="card settings-card company-ai" aria-labelledby="company-ai-heading"><h2 id="company-ai-heading">{BRAND_COPY.companyAI.title}</h2><p className="company-ai-lead">{BRAND_COPY.companyAI.lead}</p><div className="company-ai-statements">{BRAND_COPY.companyAI.sections.map(({heading,body}) => <div key={heading}><h3>{heading}</h3><p>{body}</p></div>)}</div></section>}<section className="card settings-card" id="actual-privacy" aria-labelledby="privacy-heading"><h2 id="privacy-heading">Data and privacy</h2><p>Tasks and preferences stay in this browser. Backups download to your device. No AI processing, advertising, or remote analytics are built into this app.</p><p>{calendar.snapshot.source === 'sample' ? 'Outlook is not connected yet. Connect a read-only ICS subscription in Settings. The calendar currently shows sample meetings.' : 'The ICS calendar connection is read-only, without email access. Its link and calendar data stay in the local reader’s memory for this session and are excluded from task backups. Disconnect clears them; published updates may be delayed.'}</p><p>Reminders are recorded inside CAi while a window is visible. Missed reminders are summarized when you return. Pickup tracking links stay on this device and are excluded from portable backups.</p></section></div>}
      <footer className="page-footer"><span><span className="footer-dot" />{state ? error ? 'Storage needs attention' : busy ? 'Saving…' : 'Saved on this device' : 'Local workspace'}</span><span>Cursed Assistant-inator / CAi</span></footer>
    </main></div>
    {editingOpen && <Dialog title={editing ? 'Edit task' : 'New task'} onClose={closeEditor}>{error && <div className="banner error" role="alert">{error}</div>}<TaskForm task={editing ?? undefined} initialTitle={creationTitle} full busy={busy} onSubmit={async (task, reminderDelay) => { const success = editing ? await execute({ type: 'edit', id: editing.id, expectedRevision: editing.revision, task }) : await execute({ type: 'create', id: crypto.randomUUID(), task, reminderDelay }); if (success) { if (!editing && creatingFromQuick) { setQuickTitle(''); setDashboardFilter('active'); } setEditing(null); setCreating(false); setCreatingFromQuick(false); } return success; }} />{editing && state && <TaskReminders task={editing} state={state} now={now} busy={busy} execute={execute} />}</Dialog>}
  </div>;
}
