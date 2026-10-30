import type { Plugin, Connect } from 'vite';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { randomBytes } from 'node:crypto';
import { Worker } from 'node:worker_threads';
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { z } from 'zod';
import { CalendarError } from './errors.ts';
import { CalendarService } from './service.ts';
import type { ParsedCalendar, ParseOptions } from './parse.ts';

export function parseInWorker(root: string, text: string, options: ParseOptions): Promise<ParsedCalendar> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(pathToFileURL(join(root, 'server/calendar/parse-worker.ts')), { workerData: { text, options }, execArgv: [], resourceLimits: { maxOldGenerationSizeMb: 128 } });
    const timer = setTimeout(() => { void worker.terminate(); reject(new CalendarError('parse_timeout', 'The calendar is too complex to read within the time limit.')); }, 10000);
    worker.once('message', (message: { ok: boolean; result?: ParsedCalendar }) => { clearTimeout(timer); void worker.terminate(); if (message.ok && message.result) resolve(message.result); else reject(new CalendarError('invalid_calendar', 'The provider did not return a supported calendar feed.')); });
    worker.once('error', () => { clearTimeout(timer); reject(new CalendarError('parser_failed', 'The local calendar reader could not parse this feed.')); });
    worker.once('exit', (code) => { if (code !== 0) { clearTimeout(timer); reject(new CalendarError('parser_stopped', 'The local calendar reader stopped before completing the feed.')); } });
  });
}
const inputSchema = z.object({ url: z.string().min(1).max(4096), timeZone: z.string().min(1).max(100), ownerEmail: z.union([z.literal(''), z.email().max(254)]).optional() }).strict();
export function requestAllowed(req: IncomingMessage, port: number): boolean {
  const host = req.headers.host;
  if (![ `127.0.0.1:${port}`, `localhost:${port}` ].includes(host ?? '')) return false;
  if (req.headers['x-cai-request'] !== 'calendar' || req.headers['sec-fetch-site'] === 'cross-site') return false;
  return req.headers.origin ? req.headers.origin === `http://${host}` : req.headers['sec-fetch-site'] === 'same-origin';
}
function send(res: ServerResponse, code: number, data: unknown) {
  res.statusCode = code; res.setHeader('Content-Type', 'application/json'); res.setHeader('Cache-Control', 'no-store'); res.setHeader('Pragma', 'no-cache'); res.setHeader('X-Content-Type-Options', 'nosniff');
  res.end(JSON.stringify(data));
}
function body(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    if (!req.headers['content-type']?.startsWith('application/json')) { reject(new CalendarError('invalid_request', 'The calendar request must be JSON.')); req.resume(); return; }
    const chunks: Buffer[] = []; let bytes = 0; let overflow = false;
    req.on('data', (chunk: Buffer) => { bytes += chunk.length; if (bytes > 8192) { overflow = true; chunks.length = 0; } else if (!overflow) chunks.push(chunk); });
    req.on('end', () => { if (overflow) reject(new CalendarError('invalid_request', 'The calendar request is too large.')); else { try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))); } catch { reject(new CalendarError('invalid_request', 'The calendar request could not be read.')); } } });
    req.on('error', () => reject(new CalendarError('invalid_request', 'The calendar request was interrupted.')));
  });
}
export function calendarReaderPlugin(): Plugin {
  let root = ''; let service: CalendarService;
  const attach = (middlewares: Connect.Server, port: number) => {
    service = new CalendarService({ parse: (text, options) => parseInWorker(root, text, options) });
    const name = `cai_ics_${port}`;
    middlewares.use((req, res, next) => {
      if (!req.url?.startsWith('/api/calendar/')) { next(); return; }
      const handle = async () => {
        if (!requestAllowed(req, port)) { send(res, 403, { error: 'Calendar requests must come from this local CAi workspace.' }); return; }
        const path = req.url!.split('?')[0];
        if (!(path === '/api/calendar/status' && req.method === 'GET' || ['/api/calendar/connect', '/api/calendar/refresh', '/api/calendar/disconnect'].includes(path) && req.method === 'POST')) { send(res, 404, { error: 'Calendar route not found.' }); return; }
        const cookie = req.headers.cookie?.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${name}=`))?.slice(name.length + 1);
        const id = cookie && /^[a-f0-9]{64}$/.test(cookie) ? cookie : randomBytes(32).toString('hex');
        const initial = service.session(id, !!cookie);
        if (!cookie || cookie !== id) res.setHeader('Set-Cookie', `${name}=${id}; HttpOnly; SameSite=Strict; Path=/api/calendar`);
        if (path === '/api/calendar/status') { send(res, 200, initial); return; }
        if (path === '/api/calendar/disconnect') { send(res, 200, service.disconnect(id)); return; }
        if (path === '/api/calendar/refresh') { send(res, 200, await service.refresh(id)); return; }
        const parsed = inputSchema.safeParse(await body(req));
        if (!parsed.success) throw new CalendarError('invalid_request', 'Enter a valid ICS link, time zone, and optional calendar email.');
        send(res, 200, await service.connect(id, parsed.data));
      };
      void handle().catch((error) => { if (!res.writableEnded) send(res, 400, { error: error instanceof CalendarError ? error.message : 'The calendar request could not be completed.' }); });
    });
  };
  return { name: 'cai-local-calendar-reader', configResolved(config) { root = config.root; },
    configureServer(server) { attach(server.middlewares, server.config.server.port ?? 5173); server.httpServer?.once('close', () => service.dispose()); },
    configurePreviewServer(server) { attach(server.middlewares, server.config.preview.port ?? 4173); server.httpServer.once('close', () => service.dispose()); },
  };
}
