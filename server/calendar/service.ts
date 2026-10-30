import { emptyCalendar, type CalendarSnapshot } from '../../src/domain/calendar.ts';
import { CalendarError } from './errors.ts';
import { readPublishedFeed, validateFeedUrl, type FeedResult } from './fetch.ts';
import type { ParsedCalendar, ParseOptions } from './parse.ts';

interface Session {
  snapshot: CalendarSnapshot; url: string | null; zone: string; ownerEmail: string;
  etag: string | null; modified: string | null; range: string; generation: number;
  controller: AbortController | null; flight: Promise<CalendarSnapshot> | null; expires: number;
}
export interface ReaderDependencies {
  read?: (url: string, conditional: { etag: string | null; modified: string | null }, signal: AbortSignal) => Promise<FeedResult>;
  parse: (text: string, options: ParseOptions) => Promise<ParsedCalendar>;
  now?: () => Date;
}
export class CalendarService {
  private sessions = new Map<string, Session>();
  private dependencies: ReaderDependencies;
  constructor(dependencies: ReaderDependencies) { this.dependencies = dependencies; }
  private now() { return this.dependencies.now?.() ?? new Date(); }
  session(id: string, previousCookie = false): CalendarSnapshot {
    const now = this.now().getTime();
    for (const [key, session] of this.sessions) if (session.expires < now) { session.controller?.abort(); this.sessions.delete(key); }
    let session = this.sessions.get(id);
    if (!session) {
      if (this.sessions.size >= 20) throw new CalendarError('session_limit', 'Too many local calendar sessions are open. Close unused browser sessions and restart CAi.');
      session = { snapshot: emptyCalendar(previousCookie ? 'ics' : 'sample', previousCookie ? 'disconnected' : 'idle'), url: null, zone: 'UTC', ownerEmail: '', etag: null, modified: null, range: '', generation: 0, controller: null, flight: null, expires: now + 8 * 3600000 };
      this.sessions.set(id, session);
    }
    session.expires = now + 8 * 3600000;
    return structuredClone(session.snapshot);
  }
  async connect(id: string, input: { url: string; timeZone: string; ownerEmail?: string }): Promise<CalendarSnapshot> {
    const url = validateFeedUrl(input.url);
    try { new Intl.DateTimeFormat('en', { timeZone: input.timeZone }); } catch { throw new CalendarError('invalid_zone', 'Choose a valid calendar time zone.'); }
    const session = this.sessions.get(id)!;
    session.controller?.abort(); session.generation++; session.flight = null;
    session.url = url.href; session.zone = input.timeZone; session.ownerEmail = input.ownerEmail?.trim() ?? '';
    session.etag = null; session.modified = null; session.range = '';
    session.snapshot = { ...emptyCalendar('ics', 'loading'), host: url.hostname };
    return this.refresh(id, true);
  }
  async refresh(id: string, connecting = false): Promise<CalendarSnapshot> {
    const session = this.sessions.get(id)!;
    if (!session.url) return structuredClone(session.snapshot);
    if (session.flight) return session.flight;
    const now = this.now();
    if (!connecting && session.snapshot.retryAt && new Date(session.snapshot.retryAt) > now) return structuredClone(session.snapshot);
    if (!connecting && session.snapshot.lastAttempt && now.getTime() - new Date(session.snapshot.lastAttempt).getTime() < 5000) return structuredClone(session.snapshot);
    const generation = session.generation;
    const controller = new AbortController(); session.controller = controller;
    const deadline = setTimeout(() => controller.abort(), 15000); deadline.unref();
    session.snapshot.lastAttempt = now.toISOString();
    const start = new Date(now); start.setUTCHours(0, 0, 0, 0); start.setUTCDate(start.getUTCDate() - 1);
    const end = new Date(start); end.setUTCDate(end.getUTCDate() + 16);
    const range = start.toISOString() + end.toISOString();
    const url = session.url; const zone = session.zone; const ownerEmail = session.ownerEmail;
    const canReuse = session.range === range && !!session.snapshot.lastSuccessfulRefresh;
    const promise = (async () => {
      try {
        const read = this.dependencies.read ?? ((target, conditional, signal) => readPublishedFeed(target, conditional, { signal }));
        const result = await read(url, session.range === range ? { etag: session.etag, modified: session.modified } : { etag: null, modified: null }, controller.signal);
        clearTimeout(deadline);
        if (result.notModified && !canReuse) throw new CalendarError('invalid_cache', 'The calendar provider returned an invalid cached response. Refresh again.');
        let parsed: ParsedCalendar | null = null;
        if (!result.notModified) parsed = await this.dependencies.parse(result.text, { start: start.toISOString(), end: end.toISOString(), timeZone: zone, ownerEmail });
        if (session.generation !== generation) return structuredClone(session.snapshot);
        session.etag = result.etag; session.modified = result.modified; session.range = range;
        session.snapshot = { ...session.snapshot, ...(parsed ?? {}), status: 'ready', error: null, retryAt: null, lastSuccessfulRefresh: this.now().toISOString() };
      } catch (failure) {
        if (session.generation !== generation) return structuredClone(session.snapshot);
        const error = failure instanceof CalendarError ? failure : new CalendarError('read_failed', 'The calendar could not be read. Check the link and try again.');
        session.snapshot = { ...session.snapshot, status: 'error', error: error.message, retryAt: error.retrySeconds ? new Date(this.now().getTime() + error.retrySeconds * 1000).toISOString() : null };
      } finally { clearTimeout(deadline); if (session.generation === generation) { session.controller = null; session.flight = null; } }
      return structuredClone(session.snapshot);
    })();
    session.flight = promise; return promise;
  }
  disconnect(id: string) {
    const session = this.sessions.get(id)!;
    session.generation++; session.controller?.abort(); session.flight = null; session.controller = null;
    session.url = null; session.ownerEmail = ''; session.etag = null; session.modified = null; session.range = '';
    session.snapshot = emptyCalendar('ics', 'disconnected'); return structuredClone(session.snapshot);
  }
  dispose() { for (const session of this.sessions.values()) session.controller?.abort(); this.sessions.clear(); }
}
