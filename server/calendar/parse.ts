import ICAL from 'ical.js';
import { Temporal } from '@js-temporal/polyfill';
import { createHash } from 'node:crypto';
import { meetingCandidates, type CalendarEvent } from '../../src/domain/calendar.ts';

export interface ParseOptions { start: string; end: string; timeZone: string; ownerEmail?: string }
export interface ParsedCalendar { name: string; events: CalendarEvent[]; incomplete: boolean; warnings: string[] }
function value(component: ICAL.Component, name: string): string { const result = component.getFirstPropertyValue(name); return result === null || result === undefined ? '' : String(result); }
function dateText(time: ICAL.Time): string { return `${String(time.year).padStart(4, '0')}-${String(time.month).padStart(2, '0')}-${String(time.day).padStart(2, '0')}`; }
function timestamp(time: ICAL.Time, component: ICAL.Component, field: string, fallback: string): string {
  if (!time.isDate && time.zone && time.zone !== ICAL.Timezone.localTimezone) return new Date(time.toUnixTime() * 1000).toISOString();
  const tzid = component.getFirstProperty(field)?.getParameter('tzid');
  const timeZone = typeof tzid === 'string' && tzid ? tzid : fallback;
  return Temporal.ZonedDateTime.from({ timeZone, year: time.year, month: time.month, day: time.day, hour: time.isDate ? 0 : time.hour, minute: time.isDate ? 0 : time.minute, second: time.isDate ? 0 : time.second }, { disambiguation: 'compatible' }).toInstant().toString({ fractionalSecondDigits: 3 });
}
function declined(event: ICAL.Event, email?: string): boolean {
  if (!email) return false;
  return event.attendees.some((attendee) => String(attendee.getFirstValue()).replace(/^mailto:/i, '').toLowerCase() === email.toLowerCase() && String(attendee.getParameter('partstat')).toUpperCase() === 'DECLINED');
}
export function parseIcs(input: string, options: ParseOptions): ParsedCalendar {
  if (!input.trimStart().startsWith('BEGIN:VCALENDAR')) throw new Error('not_calendar');
  ICAL.TimezoneService.reset();
  const calendar = new ICAL.Component(ICAL.parse(input));
  for (const zone of calendar.getAllSubcomponents('vtimezone')) {
    const id = value(zone, 'tzid');
    if (!id || ['UTC', 'GMT', 'Z'].includes(id.toUpperCase())) continue;
    ICAL.TimezoneService.register(zone);
  }
  const components = calendar.getAllSubcomponents('vevent');
  if (components.length > 5000) throw new Error('too_many_events');
  let missingUid = false;
  const unique = new Map<string, ICAL.Component>();
  for (const component of components) {
    if (!value(component, 'uid')) { missingUid = true; continue; }
    const key = `${value(component, 'uid')}|${value(component, 'recurrence-id')}`;
    const old = unique.get(key);
    const sequence = Number(value(component, 'sequence') || 0);
    const oldSequence = old ? Number(value(old, 'sequence') || 0) : -1;
    const modified = value(component, 'last-modified') || value(component, 'dtstamp');
    if (!old || sequence > oldSequence || sequence === oldSequence && modified >= (value(old, 'last-modified') || value(old, 'dtstamp'))) unique.set(key, component);
  }
  const groups = new Map<string, ICAL.Component[]>();
  for (const component of unique.values()) { const uid = value(component, 'uid'); const list = groups.get(uid) ?? []; list.push(component); groups.set(uid, list); }
  const events: CalendarEvent[] = []; const warnings = new Set<string>(); const emitted = new Set<string>();
  let iterations = 0; let incomplete = missingUid;
  if (missingUid) warnings.add('Some events lack an identifier and were omitted.');
  const add = (event: ICAL.Event, start: ICAL.Time, end: ICAL.Time, key: string) => {
    if (value(event.component, 'status').toUpperCase() === 'CANCELLED' || declined(event, options.ownerEmail)) return;
    try {
      const startInstant = timestamp(start, event.component, 'dtstart', options.timeZone);
      let endDate = start.isDate ? dateText(end) : null;
      let endInstant = timestamp(end, event.component, 'dtend', options.timeZone);
      if (start.isDate && end.compare(start) <= 0) {
        const next = Temporal.PlainDate.from(dateText(start)).add({ days: 1 });
        endDate = next.toString();
        endInstant = next.toZonedDateTime(options.timeZone).toInstant().toString({ fractionalSecondDigits: 3 });
      }
      if (endInstant < startInstant) { incomplete = true; warnings.add('Some events have invalid time ranges and were omitted.'); return; }
      if (startInstant >= options.end || endInstant <= options.start) return;
      const id = createHash('sha256').update(`${event.uid}|${key}`).digest('hex');
      if (emitted.has(id)) return; emitted.add(id);
      if (events.length >= 1000) { incomplete = true; warnings.add('The calendar has more events than this view can show.'); return; }
      events.push({ id, title: (event.summary || 'Untitled event').slice(0, 500), start: startInstant, end: endInstant,
        allDay: start.isDate, startDate: start.isDate ? dateText(start) : null, endDate,
        location: (event.location || '').slice(0, 500), attendeeCount: event.attendees.length,
        tentative: value(event.component, 'status').toUpperCase() === 'TENTATIVE',
        joinUrls: meetingCandidates(value(event.component, 'url'), event.location || '', event.description || '', value(event.component, 'x-alt-desc')) });
    } catch { incomplete = true; warnings.add('Some events use an unsupported time zone or invalid date and were omitted.'); }
  };
  for (const group of groups.values()) {
    const master = group.find((component) => !component.hasProperty('recurrence-id'));
    const exceptions = group.filter((component) => component.hasProperty('recurrence-id'));
    if (!master) { for (const component of exceptions) { try { const event = new ICAL.Event(component, { exceptions: [] }); add(event, event.startDate, event.endDate, value(component, 'recurrence-id')); } catch { incomplete = true; } } continue; }
    if (value(master, 'status').toUpperCase() === 'CANCELLED' || declined(new ICAL.Event(master), options.ownerEmail)) continue;
    try {
      const event = new ICAL.Event(master, { exceptions, strictExceptions: true });
      if (!event.isRecurring()) add(event, event.startDate, event.endDate, 'single');
      else {
        const iterator = event.iterator();
        let occurrence: ICAL.Time | null;
        while ((occurrence = iterator.next())) {
          if (++iterations > 20000) { incomplete = true; warnings.add('A long recurrence series exceeded the expansion limit. Some events may be missing.'); break; }
          const details = event.getOccurrenceDetails(occurrence);
          add(details.item, details.startDate, details.endDate, occurrence.toString());
          // Use the unmodified slot to stop expansion, then add moved exceptions separately.
          if (timestamp(occurrence, master, 'dtstart', options.timeZone) >= options.end) break;
        }
        for (const component of exceptions) { const exception = new ICAL.Event(component, { exceptions: [] }); add(exception, exception.startDate, exception.endDate, value(component, 'recurrence-id')); }
      }
    } catch { incomplete = true; warnings.add('A recurrence series could not be fully read.'); }
  }
  events.sort((a, b) => a.start.localeCompare(b.start) || a.id.localeCompare(b.id));
  return { name: (value(calendar, 'x-wr-calname') || 'Outlook calendar').slice(0, 120), events, incomplete, warnings: [...warnings].slice(0, 10) };
}
