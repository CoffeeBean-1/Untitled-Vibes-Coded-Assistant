import { useCallback, useEffect, useRef, useState } from 'react';
import { calendarSnapshotSchema, emptyCalendar, type CalendarSnapshot } from '../../domain/calendar';
import type { Clock } from '../../shared/clock';

export function useCalendar(clock: Clock) {
  const [snapshot, setSnapshot] = useState<CalendarSnapshot>(() => ({ ...emptyCalendar(), status: 'loading' }));
  const [busy, setBusy] = useState(false);
  const snapshotRef = useRef(snapshot);
  const sequence = useRef(0);
  const controller = useRef<AbortController | null>(null);
  const actionBusy = useRef(false);
  const [actionError, setActionError] = useState('');
  const publish = useCallback((next: CalendarSnapshot) => { snapshotRef.current = next; setSnapshot(next); }, []);
  const request = useCallback(async (action: 'status' | 'connect' | 'refresh' | 'disconnect', input?: { url: string; timeZone: string; ownerEmail?: string }): Promise<boolean> => {
    const number = ++sequence.current; controller.current?.abort();
    const abort = new AbortController(); controller.current = abort;
    const timer = window.setTimeout(() => abort.abort(), 30000);
    actionBusy.current = true; setBusy(true); setActionError('');
    try {
      const response = await fetch(`/api/calendar/${action}`, { method: action === 'status' ? 'GET' : 'POST', credentials: 'same-origin', cache: 'no-store', signal: abort.signal,
        headers: { 'X-CAi-Request': 'calendar', ...(input ? { 'Content-Type': 'application/json' } : {}) }, ...(input ? { body: JSON.stringify(input) } : {}) });
      if (!response.ok) {
        let message = 'The local calendar reader is unavailable. Start CAi with Start-CAi.cmd and try again.';
        try { const data: unknown = await response.json(); if (typeof data === 'object' && data && 'error' in data && typeof data.error === 'string' && data.error.length < 500) message = data.error; } catch { /* A static-only host is not a calendar reader. */ }
        throw new Error(message);
      }
      const next = calendarSnapshotSchema.parse(await response.json());
      if (number !== sequence.current) return false;
      publish(next); return next.status !== 'error';
    } catch (failure) {
      if (number !== sequence.current) return false;
      const message = failure instanceof Error && failure.name !== 'AbortError' && failure.message.length < 500 ? failure.message : 'The calendar request timed out. Try again.';
      if (action === 'connect' && snapshotRef.current.status !== 'loading') setActionError(message);
      else publish({ ...snapshotRef.current, status: 'error', error: message });
      return false;
    } finally { clearTimeout(timer); if (number === sequence.current) { actionBusy.current = false; setBusy(false); } }
  }, [publish]);
  const cancelRequest = useCallback(() => { sequence.current++; controller.current?.abort(); actionBusy.current = false; }, []);
  useEffect(() => { void request('status'); return cancelRequest; }, [request, cancelRequest]);
  useEffect(() => {
    const refresh = () => {
      const current = snapshotRef.current;
      if (actionBusy.current || document.visibilityState === 'hidden' || current.source !== 'ics' || !current.host || current.status === 'disconnected') return;
      if (current.retryAt && new Date(current.retryAt) > clock.now()) return;
      if (!current.lastAttempt || clock.now().getTime() - new Date(current.lastAttempt).getTime() >= 30000) void request('refresh');
    };
    const timer = window.setInterval(refresh, 120000);
    document.addEventListener('visibilitychange', refresh); window.addEventListener('focus', refresh);
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', refresh); window.removeEventListener('focus', refresh); };
  }, [clock, request]);
  return { snapshot, busy, actionError, connect: (input: { url: string; timeZone: string; ownerEmail?: string }) => request('connect', input), refresh: () => request('refresh'), disconnect: () => request('disconnect') };
}
export type CalendarConnection = ReturnType<typeof useCalendar>;
