import { LoaderCircle, RefreshCw } from 'lucide-react';
import type { CalendarConnection } from './useCalendar';
import { calendarTime } from './presentation';

export function CalendarFeedback({ calendar, now }: { calendar: CalendarConnection; now: Date }) {
  const { snapshot }=calendar;
  return <>
    {snapshot.status==='loading' && <p className="calendar-state" role="status"><LoaderCircle className="spin" size={16} />Loading calendar…</p>}
    {snapshot.error && <div className="calendar-warning" role="status">{snapshot.error}{snapshot.events.length>0 && <strong>Showing the last successful refresh.</strong>}</div>}
    {snapshot.incomplete && <p className="calendar-warning">Some events could not be read. This agenda is incomplete.</p>}
    {snapshot.retryAt && new Date(snapshot.retryAt)>now && <p className="calendar-warning">Refresh available after {calendarTime(snapshot.retryAt)}.</p>}
  </>;
}
export function CalendarRefresh({ calendar, now }: { calendar: CalendarConnection; now: Date }) {
  const { snapshot,busy }=calendar;
  return <button className="icon-button" aria-label="Refresh calendar" disabled={busy || !snapshot.host || !!snapshot.retryAt && new Date(snapshot.retryAt)>now} onClick={()=>{ void calendar.refresh(); }}><RefreshCw size={16} className={busy ? 'spin' : ''} /></button>;
}
