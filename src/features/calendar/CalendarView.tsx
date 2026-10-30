import { useRef, useState } from 'react';
import { CalendarDays, Clock, MapPin, Users } from 'lucide-react';
import { nextCalendarEvent, type CalendarEvent } from '../../domain/calendar';
import type { CalendarConnection } from './useCalendar';
import { calendarItems, calendarTime, dayLabel, eventConflicts, eventDay, eventDuration, meetingWhen, selectCalendarEvents, type CalendarScope } from './presentation';
import { CalendarFeedback, CalendarRefresh } from './CalendarFeedback';
import { MeetingActions } from './MeetingActions';
import { deviceZone, localDate } from '../../shared/clock';

const scopes: [CalendarScope,string][]=[['upcoming','Upcoming'],['today','Today'],['week','Next 7 days'],['all','All loaded']];
function fullDate(key: string): string {
  return new Intl.DateTimeFormat(undefined,{timeZone:'UTC',weekday:'long',month:'long',day:'numeric',year:'numeric'}).format(new Date(`${key}T12:00:00Z`));
}
function eventDates(event: CalendarEvent): string {
  const first=eventDay(event);
  const last=event.allDay && event.endDate ? new Date(Date.parse(`${event.endDate}T12:00:00Z`)-86400000).toISOString().slice(0,10) : localDate(new Date(event.end),deviceZone());
  return first===last ? fullDate(first) : `${fullDate(first)} – ${fullDate(last)}`;
}
export function CalendarView({ initialSelectedId, calendar, anchor, now, onSettings, onNotice }: { initialSelectedId?: string; calendar: CalendarConnection; anchor: string; now: Date; onSettings: () => void; onNotice: (message: string) => void }) {
  const [scope,setScope]=useState<CalendarScope>('upcoming');
  const [query,setQuery]=useState('');
  const [selectedId,setSelectedId]=useState(initialSelectedId ?? '');
  const [page,setPage]=useState(() => Math.max(0, Math.floor(selectCalendarEvents(calendarItems(calendar.snapshot,anchor),'upcoming','',now).findIndex(event=>event.id===initialSelectedId)/50)));
  const detail=useRef<HTMLElement>(null);
  const { snapshot }=calendar;
  const sample=snapshot.source==='sample' && snapshot.status==='idle';
  const events=calendarItems(snapshot,anchor);
  const filtered=selectCalendarEvents(events,scope,query,now);
  const currentPage=Math.min(page,Math.max(0,Math.ceil(filtered.length/50)-1));
  const visible=filtered.slice(currentPage*50,currentPage*50+50);
  const nextId=nextCalendarEvent(visible,now)?.id;
  const selected=visible.find(event=>event.id===selectedId) ?? visible.find(event=>event.id===nextId) ?? visible[0];
  const conflicts=selected ? eventConflicts(selected,events) : 0;
  const groups=new Map<string,CalendarEvent[]>();
  for (const event of visible) { const day=eventDay(event); const items=groups.get(day) ?? []; items.push(event); groups.set(day,items); }
  return <div className="calendar-full">
    <section className="card calendar-toolbar" aria-label="Calendar controls"><div className="calendar-source"><strong>{sample ? 'Sample calendar' : snapshot.name}</strong><span>{sample ? 'SAMPLE CALENDAR' : snapshot.host ? 'OUTLOOK · ICS' : 'Not connected'} · Times in {deviceZone()}</span></div><div className="calendar-toolbar-actions">{snapshot.host && <CalendarRefresh calendar={calendar} now={now} />}<button className="button subtle" onClick={onSettings}>Calendar settings</button></div></section>
    <CalendarFeedback calendar={calendar} now={now} />
    <div className="calendar-filterbar"><div className="calendar-scopes" aria-label="Calendar range">{scopes.map(([value,label])=><button key={value} aria-pressed={scope===value} className={scope===value ? 'selected' : ''} onClick={()=>{setScope(value);setPage(0);}}>{label}</button>)}</div><label className="field calendar-search"><span className="sr-only">Search calendar</span><input type="search" value={query} onChange={event=>{setQuery(event.target.value);setPage(0);}} placeholder="Search meetings or locations" /></label></div>
    <p className="calendar-window">{filtered.length} {filtered.length===1 ? 'event' : 'events'}{snapshot.lastSuccessfulRefresh && ` · Updated ${new Date(snapshot.lastSuccessfulRefresh).toLocaleString()}`}{!sample && snapshot.host && ' · Loaded feed window: yesterday through the next two weeks'}</p>
    {visible.length ? <div className="calendar-layout"><section className="card calendar-list" aria-label="Calendar agenda">{[...groups].map(([day,items])=><section key={day} className="agenda-day" aria-label={dayLabel(day,now)}><h2><span>{dayLabel(day,now)}</span><time dateTime={day}>{new Intl.DateTimeFormat(undefined,{timeZone:'UTC',month:'short',day:'numeric'}).format(new Date(`${day}T12:00:00Z`))}</time></h2>{items.map(event=><button key={event.id} className={`agenda-event${selected.id===event.id ? ' selected' : ''}`} aria-pressed={selected.id===event.id} aria-controls="calendar-meeting-details" onClick={()=>{setSelectedId(event.id);if(matchMedia('(max-width: 900px)').matches) detail.current?.scrollIntoView({block:'start'});}}><span className="agenda-event-time">{event.allDay ? 'All day' : calendarTime(event.start)}<small>{event.allDay ? eventDuration(event) : calendarTime(event.end)}</small></span><span className="agenda-event-summary"><strong>{event.title}</strong><span>{event.location || (event.allDay ? 'All-day event' : eventDuration(event))}</span>{event.tentative && <span className="count-badge">Tentative</span>}</span></button>)}</section>)}{filtered.length>50 && <div className="pagination"><span>{currentPage*50+1}–{Math.min((currentPage+1)*50,filtered.length)} of {filtered.length}</span><button className="button subtle" disabled={!currentPage} onClick={()=>{setPage(currentPage-1);setSelectedId('');}}>Previous</button><button className="button subtle" disabled={(currentPage+1)*50>=filtered.length} onClick={()=>{setPage(currentPage+1);setSelectedId('');}}>Next</button></div>}</section>
      <section ref={detail} id="calendar-meeting-details" className="card meeting-details" aria-labelledby="meeting-details-heading"><p className="detail-eyebrow">MEETING DETAILS</p><h2 id="meeting-details-heading">{selected.title}</h2>{!selected.allDay && new Date(selected.end)>now && <p className="detail-status">{meetingWhen(selected,now).label}</p>}<dl><div><dt><CalendarDays size={16} />Date</dt><dd>{eventDates(selected)}</dd></div><div><dt><Clock size={16} />Time</dt><dd>{selected.allDay ? eventDuration(selected) : `${calendarTime(selected.start)} – ${calendarTime(selected.end)}`}<small>{selected.allDay ? 'All-day dates' : `${eventDuration(selected)} · ${deviceZone()}`}</small></dd></div><div><dt><MapPin size={16} />Location</dt><dd>{selected.location || 'No location provided'}</dd></div><div><dt><Users size={16} />Attendees</dt><dd>{selected.attendeeCount || 'Not provided in this feed'}</dd></div></dl>{selected.tentative && <p className="detail-note">Tentative invitation</p>}{conflicts>0 && <p className="detail-note">Overlaps with {conflicts} other {conflicts===1 ? 'event' : 'events'}.</p>}{!sample && !selected.joinUrls.length && <p className="help-text">No supported meeting link in the published event. Check the invitation in Outlook.</p>}<div className="detail-actions"><MeetingActions key={selected.id} event={selected} sample={sample} prominent onNotice={onNotice} /></div></section></div>
      : snapshot.status!=='loading' && <section className="card empty-state"><CalendarDays size={28} /><h2>{snapshot.status==='disconnected' ? 'Calendar disconnected' : snapshot.status==='error' && !events.length ? 'Calendar unavailable' : query ? 'No matching events' : scope==='today' ? 'No events today' : 'No events in this view'}</h2><p>{query ? 'Try another title or location.' : snapshot.host || sample ? 'Choose another range to see more of the loaded calendar.' : 'Connect your Outlook calendar in Settings.'}</p>{!snapshot.host && !sample && <button className="button subtle" onClick={onSettings}>Calendar settings</button>}</section>}
  </div>;
}
