import { ArrowRight, CalendarDays } from 'lucide-react';
import type { CalendarConnection } from './useCalendar';
import { calendarItems, calendarTime, dashboardMeetingDays, dayLabel, eventDay, meetingProvider, meetingRelative } from './presentation';
import { MeetingActions } from './MeetingActions';
import { CalendarFeedback, CalendarRefresh } from './CalendarFeedback';
import { emptyCalendarMessage } from '../../branding/identity';

export function CalendarPanel({ calendar, anchor, now, satire, onSettings, onOpen, onNotice }: { calendar: CalendarConnection; anchor: string; now: Date; satire: boolean; onSettings: () => void; onOpen: (id?: string) => void; onNotice: (message: string) => void }) {
  const { snapshot }=calendar;
  const sample=snapshot.source==='sample' && snapshot.status==='idle';
  const days=dashboardMeetingDays(calendarItems(snapshot,anchor),now);
  const available=sample || snapshot.status==='ready' || !!snapshot.lastSuccessfulRefresh;
  const complete=!snapshot.incomplete && !snapshot.error;
  return <section className="card meeting-card meeting-list-card" aria-labelledby="meeting-heading">
    <div className="card-heading"><div className="heading-with-icon"><CalendarDays size={18} /><h2 id="meeting-heading">Meetings</h2></div><button className="icon-button" aria-label="Open calendar" onClick={()=>onOpen()}><ArrowRight size={17} /></button></div>
    <CalendarFeedback calendar={calendar} now={now} />
    {available ? days.map(day=><section key={day.date} className="meeting-day" aria-label={day.label}><h3>{day.label}<time dateTime={day.date}>{new Intl.DateTimeFormat(undefined,{timeZone:'UTC',month:'short',day:'numeric'}).format(new Date(`${day.date}T12:00:00Z`))}</time></h3>
      {day.events.length ? <><ul className="meeting-list">{day.events.slice(0,3).map(event=><li key={event.id}>
        <button className="meeting-list-details" onClick={()=>onOpen(event.id)}><strong className="meeting-list-title">{event.title}</strong><span className="meeting-list-meta"><time dateTime={event.start}>{eventDay(event)<day.date ? `Started ${dayLabel(eventDay(event),now).toLowerCase()} · ` : ''}{calendarTime(event.start)}</time><span> · {meetingRelative(event,now)}</span>{meetingProvider(event) && <small> · {meetingProvider(event)}</small>}</span></button>
        <MeetingActions event={event} sample={sample} compact onNotice={onNotice} />
      </li>)}</ul>{day.events.length>3 && <button className="text-button meeting-day-more" onClick={()=>onOpen(day.events[3].id)}>+{day.events.length-3} more {day.label.toLowerCase()} <ArrowRight size={13} /></button>}</> : <div className="meeting-day-empty"><p>{!complete ? `No meetings shown ${day.label.toLowerCase()}.` : day.label==='Today' ? 'No more meetings today!' : 'No meetings tomorrow.'}</p>{day.label==='Today' && complete && satire && <small>{emptyCalendarMessage(day.date)}</small>}</div>}
    </section>) : snapshot.status!=='loading' && <div className="empty-state small"><h3>{snapshot.status==='disconnected' ? 'Calendar disconnected' : 'Calendar unavailable'}</h3><button className="text-button" onClick={onSettings}>Connect Outlook</button></div>}
    <div className="meeting-list-footer"><span className="small-label">{sample ? 'SAMPLE CALENDAR' : snapshot.source==='ics' ? 'OUTLOOK · ICS' : 'CALENDAR'}</span><button className="text-button" onClick={()=>onOpen()}>View calendar</button>{snapshot.host && <CalendarRefresh calendar={calendar} now={now} />}</div>
  </section>;
}
