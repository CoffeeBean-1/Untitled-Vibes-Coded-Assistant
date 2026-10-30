import { demoCalendar } from '../../adapters/demo/calendar';
import { approvedMeetingUrl, type CalendarEvent, type CalendarSnapshot } from '../../domain/calendar';
import { deviceZone, localDate } from '../../shared/clock';

export type CalendarScope = 'upcoming' | 'today' | 'week' | 'all';
export function calendarItems(snapshot: CalendarSnapshot, anchor: string): CalendarEvent[] {
  if (snapshot.source !== 'sample' || snapshot.status !== 'idle') return snapshot.events;
  return demoCalendar.occurrences(anchor).map(event => ({ ...event, allDay: false, startDate: null, endDate: null, location: '', attendeeCount: event.attendees.length, tentative: false, joinUrls: [] }));
}
export function calendarTime(instant: string, timeZone = deviceZone()): string {
  return new Intl.DateTimeFormat(undefined, { timeZone, hour: 'numeric', minute: '2-digit' }).format(new Date(instant));
}
export function meetingRelative(event: CalendarEvent, now: Date): string {
  const difference=Date.parse(event.start)-now.getTime();
  if(difference<=0) return new Date(event.end)>now ? 'In progress' : 'Ended';
  if(difference<60000) return 'In less than a minute';
  const unit=difference<3600000 ? 'minute' : difference<86400000 ? 'hour' : 'day';
  const divisor=unit==='minute' ? 60000 : unit==='hour' ? 3600000 : 86400000;
  return new Intl.RelativeTimeFormat('en',{numeric:'always'}).format(Math.floor(difference/divisor),unit);
}
export function meetingProvider(event: CalendarEvent): string | null {
  const providers=new Set<string>();
  for(const candidate of event.joinUrls) {
    const approved=approvedMeetingUrl(candidate); if(!approved) continue;
    let url=new URL(approved);
    if(url.hostname.endsWith('safelinks.protection.outlook.com')) { const inner=url.searchParams.get('url'); if(inner && approvedMeetingUrl(inner,false)) url=new URL(inner); }
    const host=url.hostname;
    providers.add(['zoom.us','zoom.com','zoomgov.com'].some(domain=>host===domain || host.endsWith(`.${domain}`)) ? 'Zoom' : host.endsWith('meet.google.com') ? 'Google Meet' : host.includes('teams.') ? 'Teams' : 'Online meeting');
  }
  return providers.size===1 ? [...providers][0] : providers.size>1 ? 'Online meeting' : null;
}
function dayNumber(key: string): number { return Date.parse(`${key}T00:00:00Z`) / 86400000; }
export function dayLabel(key: string, now: Date, timeZone = deviceZone()): string {
  const today = localDate(now,timeZone); const difference = dayNumber(key) - dayNumber(today);
  if (difference === 0) return 'Today';
  if (difference === 1) return 'Tomorrow';
  if (difference === -1) return 'Yesterday';
  return new Intl.DateTimeFormat(undefined, { timeZone: 'UTC', weekday: 'short', month: 'short', day: 'numeric', ...(key.slice(0,4)!==today.slice(0,4) ? {year:'numeric' as const} : {}) }).format(new Date(`${key}T12:00:00Z`));
}
export function meetingWhen(event: CalendarEvent, now: Date, timeZone = deviceZone()): { label: string; urgent: boolean } {
  const start = new Date(event.start); const end = new Date(event.end);
  if (start <= now && end > now) return { label: 'In progress', urgent: true };
  const minutes = Math.ceil((start.getTime() - now.getTime()) / 60000);
  if (minutes > 0 && minutes <= 15) return { label: `In ${minutes} min`, urgent: true };
  return { label: `${dayLabel(localDate(start,timeZone),now,timeZone)} at ${calendarTime(event.start,timeZone)}`, urgent: false };
}
export function eventDay(event: CalendarEvent, timeZone = deviceZone()): string {
  return event.allDay && event.startDate ? event.startDate : localDate(new Date(event.start),timeZone);
}
export function dashboardMeetingDays(events: CalendarEvent[], now: Date, timeZone = deviceZone()) {
  const today=localDate(now,timeZone);
  const tomorrow=new Date(Date.parse(`${today}T12:00:00Z`)+86400000).toISOString().slice(0,10);
  const upcoming=events.filter(event=>!event.allDay && new Date(event.end)>now).sort((a,b)=>a.start.localeCompare(b.start) || a.id.localeCompare(b.id));
  return [
    { label:'Today', date:today, events:upcoming.filter(event=>eventDay(event,timeZone)<=today) },
    { label:'Tomorrow', date:tomorrow, events:upcoming.filter(event=>eventDay(event,timeZone)===tomorrow) },
  ];
}
export function eventDuration(event: CalendarEvent): string {
  if (event.allDay && event.startDate && event.endDate) {
    const days = Math.max(1,dayNumber(event.endDate)-dayNumber(event.startDate));
    return days === 1 ? 'All day' : `${days} days · all day`;
  }
  const minutes = Math.max(0,Math.round((Date.parse(event.end)-Date.parse(event.start))/60000));
  return minutes < 60 ? `${minutes} min` : `${Math.floor(minutes/60)} hr${minutes%60 ? ` ${minutes%60} min` : ''}`;
}
export function eventConflicts(event: CalendarEvent, events: CalendarEvent[]): number {
  return event.allDay ? 0 : events.filter(other=>!other.allDay && other.id!==event.id && other.start<event.end && other.end>event.start).length;
}
export function selectCalendarEvents(events: CalendarEvent[], scope: CalendarScope, query: string, now: Date, timeZone = deviceZone()): CalendarEvent[] {
  const today = localDate(now,timeZone); const search = query.trim().toLocaleLowerCase();
  return events.filter(event=>{
    const firstDay = eventDay(event,timeZone);
    const lastDay = event.allDay && event.endDate ? dayNumber(event.endDate)-1 : dayNumber(localDate(new Date(Math.max(Date.parse(event.start),Date.parse(event.end)-1)),timeZone));
    const future = event.allDay ? lastDay>=dayNumber(today) : new Date(event.end)>now;
    const inRange = scope==='all' || scope==='today' && dayNumber(firstDay)<=dayNumber(today) && lastDay>=dayNumber(today) || future && (scope==='upcoming' || scope==='week' && dayNumber(firstDay)<dayNumber(today)+7);
    return inRange && (!search || `${event.title} ${event.location}`.toLocaleLowerCase().includes(search));
  }).sort((a,b)=>eventDay(a,timeZone).localeCompare(eventDay(b,timeZone)) || Number(b.allDay)-Number(a.allDay) || a.start.localeCompare(b.start) || a.id.localeCompare(b.id));
}
