import { useCallback, useEffect, useRef, useState } from 'react';
import type { WorkspaceRepository } from '../adapters/storage/indexedDb';
import { DomainError, type NewCommand, type State } from '../domain/model';
import type { Clock } from '../shared/clock';

export function useWorkspace(repository: WorkspaceRepository, clock: Clock) {
  const [state, setState] = useState<State | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [now, setNow] = useState(() => clock.now());
  const revision = useRef(-1);
  const ownerId = useRef(crypto.randomUUID());
  const channel = useRef<BroadcastChannel | null>(null);
  const commandLock = useRef(false);
  const publish = useCallback((next: State) => {
    if (next.revision > revision.current) { revision.current = next.revision; setState(next); }
  }, []);
  const load = useCallback(async () => {
    setLoading(true);
    try { publish(await repository.load()); setError(''); }
    catch { setError('Local storage could not be opened. Your existing data has not been reset. Allow site storage, then retry.'); }
    finally { setLoading(false); }
  }, [repository, publish]);
  useEffect(() => { void load(); }, [load]);
  const ready = state !== null;
  useEffect(() => {
    if (!ready) return;
    const coordinatorId = ownerId.current;
    let running = false; let disposed = false;
    const tick = async () => {
      if (disposed || document.visibilityState === 'hidden' || running) return;
      running = true; setNow(clock.now());
      try { const next = await repository.dispatch({ type: 'reconcile', ownerId: coordinatorId, operationId: crypto.randomUUID() }); if (!disposed) publish(next); }
      catch { if (!disposed) setError('Local storage is unavailable. Retry to check your saved workspace and reminders.'); }
      finally { running = false; }
    };
    const timer = window.setInterval(() => { void tick(); }, 1000);
    const wake = () => { if (document.visibilityState === 'hidden') void repository.releaseCoordinator?.(coordinatorId).catch(() => undefined); else void tick(); };
    document.addEventListener('visibilitychange', wake); window.addEventListener('focus', wake); void tick();
    return () => { disposed = true; void repository.releaseCoordinator?.(coordinatorId).catch(() => undefined); clearInterval(timer); document.removeEventListener('visibilitychange', wake); window.removeEventListener('focus', wake); };
  }, [ready, repository, clock, publish]);
  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;
    const events = new BroadcastChannel('cai-workspace-changed'); channel.current = events;
    let disposed = false;
    events.onmessage = () => { void repository.load().then(next => { if (!disposed) publish(next); }).catch(() => undefined); };
    return () => { disposed = true; channel.current = null; events.close(); };
  }, [repository, publish]);
  const execute = useCallback(async (command: NewCommand): Promise<boolean> => {
    if (commandLock.current) return false;
    commandLock.current = true; setBusy(true);
    try { publish(await repository.dispatch({ ...command, operationId: crypto.randomUUID() })); channel.current?.postMessage('changed'); setError(''); return true; }
    catch (failure) { setError(failure instanceof DomainError ? failure.message : 'That change was not saved. Your last saved data is still available. Retry the action when storage is available.'); return false; }
    finally { commandLock.current = false; setBusy(false); }
  }, [repository, publish]);
  return { state, loading, busy, error, setError, now, load, execute, publish };
}
