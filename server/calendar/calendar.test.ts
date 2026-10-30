// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import { resolve } from 'node:path';
import type { IncomingMessage } from 'node:http';
import { parseIcs, type ParseOptions } from './parse.ts';
import { readPublishedFeed, validateFeedUrl, isPublicAddress, type RawResponse } from './fetch.ts';
import { CalendarService } from './service.ts';
import { CalendarError } from './errors.ts';
import { parseInWorker, requestAllowed } from './plugin.ts';
import { approvedMeetingUrl, meetingCandidates, nextCalendarEvent, calendarSnapshotSchema } from '../../src/domain/calendar.ts';

const options: ParseOptions = { start: '2026-10-25T00:00:00.000Z', end: '2026-11-09T00:00:00.000Z', timeZone: 'America/Chicago' };
const feed = (...events: string[]) => `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//CAi tests//EN\r\nX-WR-CALNAME:Planning\r\n${events.join('\r\n')}\r\nEND:VCALENDAR`;
const event = (properties: string, uid = 'one') => `BEGIN:VEVENT\r\nUID:${uid}\r\nDTSTAMP:20261025T000000Z\r\n${properties.replaceAll('\n', '\r\n')}\r\nEND:VEVENT`;
const basic = feed(event('DTSTART:20261027T140000Z\nDTEND:20261027T150000Z\nSUMMARY:Planning'));
const url = 'https://outlook.office365.com/owa/calendar/fixture/private/calendar.ics';
const result = (text = basic) => ({ notModified: false, text, etag: 'fixture', modified: null });

describe('ICS normalization', () => {
  it('expands recurring exceptions, EXDATE, RDATE and latest revisions without duplicates', () => {
    const input = feed(
      event('DTSTART:20261026T140000Z\nDTEND:20261026T150000Z\nRRULE:FREQ=DAILY;COUNT=5\nEXDATE:20261027T140000Z\nRDATE:20261103T140000Z\nSUMMARY:Daily', 'series'),
      event('RECURRENCE-ID:20261028T140000Z\nDTSTART:20261028T160000Z\nDTEND:20261028T170000Z\nSEQUENCE:1\nSUMMARY:Moved', 'series'),
      event('RECURRENCE-ID:20261029T140000Z\nDTSTART:20261029T140000Z\nDTEND:20261029T150000Z\nSTATUS:CANCELLED', 'series'),
      event('DTSTART:20261027T170000Z\nDTEND:20261027T180000Z\nSEQUENCE:1\nSUMMARY:Old', 'revision'),
      event('DTSTART:20261027T180000Z\nDTEND:20261027T190000Z\nSEQUENCE:2\nSUMMARY:Updated', 'revision'));
    const parsed = parseIcs(input, options);
    expect(parsed.incomplete).toBe(false);
    expect(parsed.events.map(item => item.title)).toEqual(['Daily', 'Updated', 'Moved', 'Daily', 'Daily']);
    expect(parsed.events.find(item => item.title === 'Moved')?.start).toBe('2026-10-28T16:00:00.000Z');
    expect(new Set(parsed.events.map(item => item.id)).size).toBe(5);
  });
  it('resolves IANA DST and floating times and preserves exclusive all-day dates', () => {
    const parsed = parseIcs(feed(
      event('DTSTART;TZID=America/Chicago:20261031T090000\nDTEND;TZID=America/Chicago:20261031T100000\nRRULE:FREQ=DAILY;COUNT=3', 'dst'),
      event('DTSTART;VALUE=DATE:20261101\nDTEND;VALUE=DATE:20261103\nSUMMARY:Away', 'day'),
      event('DTSTART:20261027T090000\nDTEND:20261027T100000', 'floating')), options);
    expect(parsed.incomplete).toBe(false);
    expect(parsed.events.filter(item => !item.allDay).map(item => item.start)).toEqual(['2026-10-27T14:00:00.000Z', '2026-10-31T14:00:00.000Z', '2026-11-01T15:00:00.000Z', '2026-11-02T15:00:00.000Z']);
    expect(parsed.events.find(item => item.allDay)).toMatchObject({ startDate: '2026-11-01', endDate: '2026-11-03', start: '2026-11-01T05:00:00.000Z', end: '2026-11-03T06:00:00.000Z' });
  });
  it('reads embedded Outlook-style VTIMEZONE and reports unsupported zones', () => {
    const zone = 'BEGIN:VTIMEZONE\r\nTZID:Custom Central\r\nBEGIN:STANDARD\r\nDTSTART:19701101T020000\r\nRRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU\r\nTZOFFSETFROM:-0500\r\nTZOFFSETTO:-0600\r\nEND:STANDARD\r\nBEGIN:DAYLIGHT\r\nDTSTART:19700308T020000\r\nRRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU\r\nTZOFFSETFROM:-0600\r\nTZOFFSETTO:-0500\r\nEND:DAYLIGHT\r\nEND:VTIMEZONE';
    const parsed = parseIcs(feed(zone, event('DTSTART;TZID=Custom Central:20261102T090000\nDTEND;TZID=Custom Central:20261102T100000')), options);
    expect(parsed.events[0]?.start).toBe('2026-11-02T15:00:00.000Z');
    const invalid = parseIcs(feed(event('DTSTART;TZID=Unknown/Invalid:20261027T090000\nDTEND;TZID=Unknown/Invalid:20261027T100000')), options);
    expect(invalid.incomplete).toBe(true); expect(invalid.events).toEqual([]);
  });
  it('filters cancelled and matched declined invitations, labels tentative, never returns descriptions/emails', () => {
    const parsed = parseIcs(feed(
      event('DTSTART:20261027T140000Z\nDTEND:20261027T150000Z\nSTATUS:CANCELLED', 'cancel'),
      event('DTSTART:20261027T150000Z\nDTEND:20261027T160000Z\nATTENDEE;PARTSTAT=DECLINED:mailto:owner@example.test', 'decline'),
      event('DTSTART:20261027T160000Z\nDTEND:20261027T170000Z\nSTATUS:TENTATIVE\nDESCRIPTION:<script>bad()</script> https://zoom.us/j/123?pwd=fixture\nATTENDEE:mailto:someone@example.test', 'tentative')), { ...options, ownerEmail: 'OWNER@example.test' });
    expect(parsed.events).toHaveLength(1); expect(parsed.events[0].tentative).toBe(true);
    expect(parsed.events[0].joinUrls).toEqual(['https://zoom.us/j/123?pwd=fixture']);
    expect(JSON.stringify(parsed)).not.toMatch(/<script>|someone@example/);
  });
  it('uses ongoing timed events before upcoming and keeps all-day out of next meeting', () => {
    const parsed = parseIcs(feed(event('DTSTART;VALUE=DATE:20261027\nDTEND;VALUE=DATE:20261028', 'day'), event('DTSTART:20261027T140000Z\nDTEND:20261027T150000Z', 'timed')), options);
    expect(nextCalendarEvent(parsed.events, new Date('2026-10-27T14:30:00Z'))?.allDay).toBe(false);
    expect(nextCalendarEvent(parsed.events, new Date('2026-10-28T00:00:00Z'))).toBeUndefined();
  });
  it('bounds recurrence work and rejects invalid files', () => {
    expect(() => parseIcs('<html>not calendar</html>', options)).toThrow();
    expect(parseIcs(feed(event('DTSTART:20000101T000000Z\nDTEND:20000101T000001Z\nRRULE:FREQ=SECONDLY')), options).incomplete).toBe(true);
  });
  it('runs the real isolated Node worker against a synthetic feed', async () => {
    expect((await parseInWorker(resolve('.'), basic, options)).events[0].title).toBe('Planning');
  });
});

describe('URL and reader boundary', () => {
  it('restricts published feed origins and private DNS, including mapped IPv4', () => {
    expect(validateFeedUrl(url).hostname).toBe('outlook.office365.com');
    expect(validateFeedUrl(url.replace('https:', 'webcal:')).protocol).toBe('https:');
    for (const value of [url.replace('https:', 'http:'), url.replace('office365.com','office365.com.evil.test'), 'https://127.0.0.1/calendar.ics', 'https://outlook.office365.com:8443/a.ics', 'https://user:secret@outlook.office365.com/a.ics', 'https://outlook.office.com/calendar/']) expect(() => validateFeedUrl(value)).toThrow();
    for (const address of ['127.0.0.1','10.0.0.1','169.254.169.254','::1','::ffff:192.168.0.1','fc00::1','fe80::1']) expect(isPublicAddress(address)).toBe(false);
    expect(isPublicAddress('8.8.8.8')).toBe(true);
  });
  it('pins a validated public address and conditionals and blocks redirect escape before another request', async () => {
    const transport = vi.fn(async (_url, address, headers) => { expect(address.address).toBe('8.8.8.8'); expect(headers['If-None-Match']).toBe('fixture'); return {status: 200, headers: {}, text: basic}; });
    const dependencies = { resolve: async () => [{ address:'8.8.8.8', family:4 }], transport };
    expect((await readPublishedFeed(url, {etag:'fixture'}, dependencies)).text).toBe(basic);
    await expect(readPublishedFeed(url, {}, { ...dependencies, resolve: async () => [{address:'10.0.0.1',family:4}] })).rejects.toThrow('public provider');
    const redirected = vi.fn(async (): Promise<RawResponse> => ({status:302,headers:{location:'https://evil.test/x.ics'},text:''}));
    await expect(readPublishedFeed(url, {}, {...dependencies,transport:redirected})).rejects.toThrow('published Outlook'); expect(redirected).toHaveBeenCalledTimes(1);
  });
  it('handles throttles, non-calendar bodies and DNS cancellation without exposing the link', async () => {
    const resolve = async () => [{address:'8.8.8.8',family:4}];
    await expect(readPublishedFeed(url, {}, {resolve,transport:async () => ({status:429,headers:{'retry-after':'120'},text:''})})).rejects.toMatchObject({retrySeconds:120});
    await expect(readPublishedFeed(url, {}, {resolve,transport:async () => ({status:200,headers:{},text:'<html>login</html>'})})).rejects.toThrow('web page');
    const controller = new AbortController(); const pending = readPublishedFeed(url, {}, {signal:controller.signal,resolve:() => new Promise(() => {})}); controller.abort();
    await expect(pending).rejects.not.toThrow('private/calendar.ics');
  });
  it('retains protected links, rejects lookalikes and preserves passcodes', () => {
    const join = 'https://example.zoom.us/j/123?pwd=fixture&context=one';
    const protectedUrl = 'https://nam01.safelinks.protection.outlook.com/?url='+encodeURIComponent(join)+'&data=fixture';
    expect(approvedMeetingUrl(protectedUrl)).toBe(protectedUrl);
    for (const value of ['javascript:alert(1)', 'https://zoom.us.evil.test/j/1','https://bad@zoom.us/j/1','https://zoom.us:8443/j/1','https://zoom.us/account']) expect(approvedMeetingUrl(value)).toBeNull();
    expect(meetingCandidates(`<a href="${join.replace('&','&amp;')}">Join</a>`,join)).toEqual([join]);
  });
  it('rejects cross-site and foreign-host requests', () => {
    const request = (headers: Record<string,string | undefined>) => ({headers}) as IncomingMessage;
    expect(requestAllowed(request({host:'127.0.0.1:5173','x-cai-request':'calendar','sec-fetch-site':'same-origin'}),5173)).toBe(true);
    for (const headers of [{host:'evil.test:5173','x-cai-request':'calendar','sec-fetch-site':'same-origin'}, {host:'127.0.0.1:5173','x-cai-request':'calendar',origin:'https://evil.test'}, {host:'127.0.0.1:5173','sec-fetch-site':'same-origin'}]) expect(requestAllowed(request(headers),5173)).toBe(false);
  });
});

describe('memory-only calendar sessions', () => {
  it('isolates sessions, reuses same-day cache and retains last good data after failure', async () => {
    let now = new Date('2026-10-27T12:00:00Z'); let fail = false;
    const read = vi.fn(async () => { if(fail) throw new CalendarError('offline','Calendar is unavailable.'); return result(); });
    const parse = vi.fn(async (text, opts) => parseIcs(text, opts));
    const service = new CalendarService({read,parse,now:() => now}); service.session('a'); service.session('b');
    const connected = await service.connect('a',{url,timeZone:'UTC'}); expect(calendarSnapshotSchema.safeParse(connected).success).toBe(true);
    expect(service.session('b').source).toBe('sample'); expect(JSON.stringify(connected)).not.toContain('private/calendar.ics');
    now = new Date('2026-10-27T12:01:00Z'); fail = true;
    const stale = await service.refresh('a'); expect(stale.status).toBe('error'); expect(stale.events).toEqual(connected.events); expect(stale.lastSuccessfulRefresh).toBe(connected.lastSuccessfulRefresh);
    expect(service.disconnect('a').events).toEqual([]); expect(service.session('a').status).toBe('disconnected'); service.dispose();
  });
  it('discards a late old-feed response after disconnect or replacement, even if abort is ignored', async () => {
    let finish!: (value: ReturnType<typeof result>) => void;
    const read = vi.fn(() => new Promise<ReturnType<typeof result>>(resolve => {finish=resolve;}));
    const service = new CalendarService({read,parse:async(text,opts) => parseIcs(text,opts),now:() => new Date('2026-10-27T12:00:00Z')}); service.session('a');
    const pending = service.connect('a',{url,timeZone:'UTC'}); service.disconnect('a'); finish(result()); await pending;
    expect(service.session('a')).toMatchObject({status:'disconnected',events:[],host:null}); service.dispose();
  });
  it('honors retry-after, expires sessions and rejects an unsolicited 304', async () => {
    let now = new Date('2026-10-27T12:00:00Z');
    const read = vi.fn(async () => {throw new CalendarError('rate','Wait before refreshing.',120);});
    const service = new CalendarService({read,parse:async(text,opts) => parseIcs(text,opts),now:()=>now}); service.session('a');
    expect((await service.connect('a',{url,timeZone:'UTC'})).retryAt).toBe('2026-10-27T12:02:00.000Z'); await service.refresh('a'); expect(read).toHaveBeenCalledTimes(1);
    now = new Date('2026-10-28T12:00:00Z'); expect(service.session('a',true)).toMatchObject({status:'disconnected',host:null,events:[]}); service.dispose();
    const invalid = new CalendarService({read:async()=>({notModified:true,text:'',etag:null,modified:null}),parse:async(text,opts)=>parseIcs(text,opts)}); invalid.session('x');
    expect((await invalid.connect('x',{url,timeZone:'UTC'})).status).toBe('error'); invalid.dispose();
  });
  it('reuses a valid 304 only within the same range and requests a fresh body after midnight', async () => {
    let now=new Date('2026-10-27T12:00:00Z');
    const read=vi.fn(async (_url: string, conditional: {etag: string|null}) => conditional.etag ? {...result(),notModified:true,text:''} : result());
    const parse=vi.fn(async(text,opts)=>parseIcs(text,opts));
    const service=new CalendarService({read,parse,now:()=>now}); service.session('a');
    await service.connect('a',{url,timeZone:'UTC'}); now=new Date('2026-10-27T12:01:00Z');
    expect((await service.refresh('a')).events).toHaveLength(1); expect(parse).toHaveBeenCalledTimes(1);
    now=new Date('2026-10-28T00:01:00Z'); await service.refresh('a'); expect(read.mock.calls[2][1].etag).toBeNull(); expect(parse).toHaveBeenCalledTimes(2); service.dispose();
  });
});
