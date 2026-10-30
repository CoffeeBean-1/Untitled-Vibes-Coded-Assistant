import { useRef, type FormEvent } from 'react';
import { ArrowUpRight, Plus } from 'lucide-react';

export function QuickTaskEntry({ title, onTitleChange, busy, onAdd, onDetails }: { title: string; onTitleChange: (title: string) => void; busy: boolean; onAdd: (title: string) => Promise<boolean>; onDetails: () => void }) {
  const input = useRef<HTMLInputElement>(null);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy || !title.trim()) return;
    if (await onAdd(title.trim())) input.current?.focus();
  }
  return <div className="quick-task-entry"><form aria-label="Quick add task" onSubmit={event => { void submit(event); }}>
    <label className="quick-task-input"><span className="sr-only">Task title</span><Plus size={17} aria-hidden="true" /><input ref={input} required maxLength={200} readOnly={busy} value={title} onChange={event => onTitleChange(event.target.value)} placeholder="Add a task…" /></label>
    <button type="submit" className="button primary" disabled={busy || !title.trim()} aria-label="Add task">{busy ? 'Adding…' : 'Add'}</button>
  </form><button className="text-button quick-task-details" disabled={busy} onClick={onDetails}>Add details in Tasks <ArrowUpRight size={13} aria-hidden="true" /></button></div>;
}
