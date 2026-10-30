import { lookup } from 'node:dns/promises';
import https from 'node:https';
import ipaddr from 'ipaddr.js';
import { CalendarError, unavailable } from './errors.ts';

const hosts = new Set(['outlook.office365.com', 'outlook.office.com', 'outlook.live.com', 'outlook.office365.us', 'outlook.office.de']);
export const MAX_FEED_BYTES = 5 * 1024 * 1024;
export function validateFeedUrl(input: string): URL {
  try {
    if (input.length > 4096) throw new Error();
    const url = new URL(input.trim().replace(/^webcal:/i, 'https:'));
    if (url.protocol !== 'https:' || url.port || url.username || url.password || url.hash || !hosts.has(url.hostname.toLowerCase()) || !/\.ics$/i.test(url.pathname)) throw new Error();
    return url;
  } catch { throw new CalendarError('invalid_url', 'Use the published Outlook ICS link, ending in .ics, from Outlook calendar settings. Regular calendar pages and other hosts are not supported.'); }
}
export function isPublicAddress(address: string): boolean {
  try { return ipaddr.process(address).range() === 'unicast'; } catch { return false; }
}
export interface RawResponse { status: number; headers: Record<string, string | undefined>; text: string }
export interface Address { address: string; family: number }
export type ReaderTransport = (url: URL, address: Address, headers: Record<string, string>, signal: AbortSignal) => Promise<RawResponse>;
export const httpsTransport: ReaderTransport = (url, address, headers, signal) => new Promise((resolve, reject) => {
  // Connect to the validated IP, while retaining the provider host for SNI and certificate validation.
  const request = https.request({ hostname: address.address, family: address.family, servername: url.hostname, port: 443, path: url.pathname + url.search,
    method: 'GET', headers: { ...headers, Host: url.host }, signal, timeout: 15000 }, (response) => {
    response.on('error', () => reject(unavailable()));
    const status = response.statusCode ?? 502;
    const safeHeaders = { location: response.headers.location, etag: response.headers.etag, 'last-modified': response.headers['last-modified'], 'retry-after': response.headers['retry-after'] };
    if (status === 304 || status >= 300 && status < 400) { response.resume(); resolve({ status, headers: safeHeaders, text: '' }); return; }
    if (Number(response.headers['content-length'] ?? 0) > MAX_FEED_BYTES) { response.destroy(); reject(new CalendarError('too_large', 'The calendar feed exceeds the 5 MiB reader limit.')); return; }
    const chunks: Buffer[] = []; let length = 0;
    response.on('data', (chunk: Buffer) => {
      length += chunk.length;
      if (length > MAX_FEED_BYTES) { response.destroy(); reject(new CalendarError('too_large', 'The calendar feed exceeds the 5 MiB reader limit.')); }
      else chunks.push(chunk);
    });
    response.on('end', () => resolve({ status, headers: safeHeaders, text: Buffer.concat(chunks).toString('utf8').replace(/^\uFEFF/, '') }));
  });
  request.on('timeout', () => request.destroy());
  request.on('error', () => reject(unavailable())); request.end();
});
export interface FeedResult { notModified: boolean; text: string; etag: string | null; modified: string | null }
export async function readPublishedFeed(input: string, conditional: { etag?: string | null; modified?: string | null } = {}, dependencies: { resolve?: (host: string) => Promise<Address[]>; transport?: ReaderTransport; signal?: AbortSignal } = {}): Promise<FeedResult> {
  let url = validateFeedUrl(input);
  const signal = dependencies.signal ?? AbortSignal.timeout(15000);
  const resolve = dependencies.resolve ?? ((host: string) => lookup(host, { all: true, verbatim: true }));
  for (let redirects = 0; redirects <= 3; redirects++) {
    if (signal.aborted) throw unavailable();
    const addresses = await new Promise<Address[]>((accept, reject) => {
      const aborted = () => reject(unavailable());
      signal.addEventListener('abort', aborted, { once: true });
      resolve(url.hostname).then(accept, () => reject(unavailable())).finally(() => signal.removeEventListener('abort', aborted));
      if (signal.aborted) aborted();
    });
    if (!addresses.length || addresses.some((address) => !isPublicAddress(address.address))) throw new CalendarError('invalid_destination', 'The calendar URL does not resolve to an allowed public provider address.');
    if (signal.aborted) throw unavailable();
    const headers: Record<string, string> = { Accept: 'text/calendar', 'User-Agent': 'CAiCalendar/0.3' };
    if (conditional.etag) headers['If-None-Match'] = conditional.etag;
    if (conditional.modified) headers['If-Modified-Since'] = conditional.modified;
    const response = await (dependencies.transport ?? httpsTransport)(url, addresses[0], headers, signal);
    if (response.status === 304) return { notModified: true, text: '', etag: conditional.etag ?? null, modified: conditional.modified ?? null };
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      if (!response.headers.location) throw unavailable();
      url = validateFeedUrl(new URL(response.headers.location, url).href); continue;
    }
    if (response.status === 429) {
      const value = response.headers['retry-after'] ?? '60';
      const seconds = /^\d+$/.test(value) ? Number(value) : Math.ceil((Date.parse(value) - Date.now()) / 1000);
      throw new CalendarError('rate_limited', 'Outlook asked CAi to wait before refreshing again.', Number.isFinite(seconds) ? Math.max(5, Math.min(seconds, 86400)) : 60);
    }
    if ([401, 403].includes(response.status)) throw new CalendarError('access_denied', 'This feed is not accessible. Check that the published ICS link is still active.');
    if (response.status < 200 || response.status >= 300) throw unavailable();
    if (Buffer.byteLength(response.text) > MAX_FEED_BYTES) throw new CalendarError('too_large', 'The calendar feed exceeds the 5 MiB reader limit.');
    if (!response.text.trimStart().startsWith('BEGIN:VCALENDAR')) throw new CalendarError('not_calendar', 'The link returned a web page instead of a calendar. Copy the ICS subscription link from Outlook settings.');
    return { notModified: false, text: response.text, etag: response.headers.etag ?? null, modified: response.headers['last-modified'] ?? null };
  }
  throw new CalendarError('redirect_limit', 'The calendar link redirected too many times. Copy a fresh published ICS link.');
}
