import { z } from 'zod';

export const calendarEventSchema = z.object({
  id: z.string().max(100), title: z.string().max(500), start: z.iso.datetime(), end: z.iso.datetime(),
  allDay: z.boolean(), startDate: z.string().nullable(), endDate: z.string().nullable(),
  location: z.string().max(500), attendeeCount: z.number().int().nonnegative(), tentative: z.boolean(),
  joinUrls: z.array(z.string().max(4096)).max(5),
});
export const calendarSnapshotSchema = z.object({
  source: z.enum(['sample', 'ics']), status: z.enum(['idle', 'loading', 'ready', 'error', 'disconnected']),
  name: z.string().max(120), host: z.string().nullable(), events: z.array(calendarEventSchema).max(1000),
  lastSuccessfulRefresh: z.iso.datetime().nullable(), lastAttempt: z.iso.datetime().nullable(),
  incomplete: z.boolean(), warnings: z.array(z.string().max(300)).max(10),
  error: z.string().nullable(), retryAt: z.iso.datetime().nullable(),
});
export type CalendarEvent = z.infer<typeof calendarEventSchema>;
export type CalendarSnapshot = z.infer<typeof calendarSnapshotSchema>;
export function emptyCalendar(source: CalendarSnapshot['source'] = 'sample', status: CalendarSnapshot['status'] = 'idle'): CalendarSnapshot {
  return { source, status, name: source === 'sample' ? 'Sample calendar' : 'Outlook calendar', host: null, events: [], lastSuccessfulRefresh: null, lastAttempt: null, incomplete: false, warnings: [], error: null, retryAt: null };
}
export function approvedMeetingUrl(value: string, allowWrapper = true): string | null {
  try {
    if (value.length > 4096) return null;
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password || url.port) return null;
    const host = url.hostname.toLowerCase();
    if (['zoom.us', 'zoom.com', 'zoomgov.com'].some((domain) => host === domain || host.endsWith(`.${domain}`))) {
      if (!/^\/(?:j|s|wc)\//i.test(url.pathname)) return null;
      return url.href;
    }
    if (['teams.microsoft.com', 'teams.live.com', 'meet.google.com'].some((domain) => host === domain || host.endsWith(`.${domain}`))) return url.href;
    if (allowWrapper && (host === 'safelinks.protection.outlook.com' || host.endsWith('.safelinks.protection.outlook.com'))) {
      const target = url.searchParams.get('url');
      return target && approvedMeetingUrl(target, false) ? url.href : null;
    }
  } catch { /* Invalid candidates are ignored, never fetched. */ }
  return null;
}
export function meetingCandidates(...values: string[]): string[] {
  const result = new Set<string>();
  for (const text of values) {
    for (const raw of text.slice(0, 100000).match(/https:\/\/[^\s<>"']+/gi) ?? []) {
      const decoded = raw.replace(/&amp;/gi, '&').replace(/&#(?:x([0-9a-f]+)|(\d+));/gi, (_, hex: string, decimal: string) => {
        const code = parseInt(hex ?? decimal, hex ? 16 : 10); return code <= 0x10ffff ? String.fromCodePoint(code) : '';
      }).replace(/[).,;]+$/, '');
      const candidate = approvedMeetingUrl(decoded);
      if (candidate) result.add(candidate);
      if (result.size === 5) return [...result];
    }
  }
  return [...result];
}
export function nextCalendarEvent(events: CalendarEvent[], now: Date): CalendarEvent | undefined {
  return events.filter((event) => !event.allDay && new Date(event.end) > now)
    .sort((a, b) => Number(new Date(b.start) <= now) - Number(new Date(a.start) <= now) || a.start.localeCompare(b.start) || a.id.localeCompare(b.id))[0];
}
