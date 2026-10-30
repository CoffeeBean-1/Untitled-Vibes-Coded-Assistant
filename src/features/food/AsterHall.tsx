import { useState } from 'react';
import { ArrowRight, ExternalLink, Utensils } from 'lucide-react';
import type { State } from '../../domain/model';
import { ReminderComposer } from '../reminders/ReminderComposer';
import { ReminderRow, type Execute } from '../reminders/ReminderRow';
import { safeTrackingUrl } from '../../domain/reminders';

export const ASTER_HALL_URL = 'https://asterhall.order.online/';
export const ASTER_HALL_WEBSITE = 'https://asterhallchicago.com/food-hall';
function OrderLink({ compact = false }: { compact?: boolean }) {
  return <a className={`button ${compact ? 'subtle' : 'primary'}`} href={ASTER_HALL_URL} target="_blank" rel="noopener noreferrer">Open ordering <ExternalLink size={15} /><span className="sr-only"> (opens a new tab)</span></a>;
}
export function AsterHallWidget({ state, onOpen }: { state: State; onOpen: () => void }) {
  const next = state.reminders.filter(item => item.pickupId !== null && item.status === 'scheduled').sort((a, b) => Date.parse(a.fireAt) - Date.parse(b.fireAt))[0];
  return <section className="card food-widget" aria-labelledby="food-widget-heading"><div className="card-heading"><div className="heading-with-icon"><Utensils size={18} /><h2 id="food-widget-heading">Aster Hall</h2></div><button className="icon-button" aria-label="Open Aster Hall" onClick={onOpen}><ArrowRight size={17} /></button></div><div className="food-widget-body"><p>One menu. Your lunch break.</p><OrderLink compact />{next ? <button className="food-pickup-preview" onClick={onOpen}><span>Check pickup</span><strong>{new Date(next.fireAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}</strong><ArrowRight size={14} /></button> : <button className="text-button" onClick={onOpen}>Set a pickup reminder <ArrowRight size={14} /></button>}</div></section>;
}
export function AsterHallView({ state, now, busy, execute, onReminders }: { state: State; now: Date; busy: boolean; execute: Execute; onReminders: () => void }) {
  const [title, setTitle] = useState('Aster Hall');
  const [tracking, setTracking] = useState('');
  const [validation, setValidation] = useState('');
  const [message, setMessage] = useState('');
  const pickups = state.pickups.filter(item => item.active);
  return <div className="food-full"><section className="card food-ordering"><div className="food-heading-icon"><Utensils size={24} /></div><div><p className="eyebrow">LUNCH BREAK</p><h2>Order from Aster Hall</h2><p>Browse the consolidated menu and check out on Aster Hall’s ordering site.</p><div className="food-links"><OrderLink /><a href={ASTER_HALL_WEBSITE} target="_blank" rel="noopener noreferrer">Restaurant website <ExternalLink size={13} /><span className="sr-only"> (opens a new tab)</span></a></div><p className="help-text">See the ordering site for current menus, availability, hours and pickup estimates.</p></div></section>
    <div className="food-columns"><section className="card settings-card"><h2>Set a pickup check</h2><p>Choose when to check on your pickup. See the ordering site for its latest status.</p><label className="field"><span>Pickup label</span><input required maxLength={200} value={title} onChange={event => setTitle(event.target.value)} placeholder="Lunch at Aster Hall" /></label><details className="food-tracking"><summary>Add a tracking link <span>optional</span></summary><label className="field"><span>Private tracking link</span><input type="url" maxLength={2048} value={tracking} onChange={event => setTracking(event.target.value)} placeholder="https://…" /></label><p className="help-text">Saved on this device. Excluded from portable backups. CAi does not read or refresh the tracking page.</p></details>{validation && <p role="alert" className="field-error">{validation}</p>}{message && <p role="status" className="help-text">{message}</p>}<ReminderComposer now={now} busy={busy} label="Set pickup reminder" onSchedule={async schedule => {
      setValidation(''); setMessage('');
      if (!title.trim()) { setValidation('Add a pickup label.'); return false; }
      if (tracking.trim() && !safeTrackingUrl(tracking.trim())) { setValidation('Use an HTTPS tracking link without embedded credentials, a fragment or a local address.'); return false; }
      const success = await execute({ type: 'create-pickup', id: crypto.randomUUID(), title: title.trim(), trackingUrl: tracking.trim() || null, schedule });
      if (success) { setTracking(''); setMessage('Pickup reminder scheduled.'); }
      return success;
    }} /></section><section className="card"><div className="card-heading"><h2>Your pickup checks</h2><span className="count-badge">{pickups.length}</span></div>{pickups.length ? <div className="reminder-list">{pickups.map(pickup => <div className="pickup-item" key={pickup.id}><div className="pickup-heading"><h3>{pickup.title}</h3><button className="text-button" disabled={busy} aria-label={`Mark checked: ${pickup.title}`} onClick={() => { void execute({ type: 'finish-pickup', id: pickup.id, expectedRevision: pickup.revision }); }}>Mark checked</button></div>{state.reminders.filter(item => item.pickupId === pickup.id && item.status !== 'cancelled').map(item => <ReminderRow key={item.id} state={state} reminder={item} now={now} busy={busy} execute={execute} />)}{pickup.trackingUrl && <details className="food-tracking"><summary>Tracking</summary><a className="text-button" href={pickup.trackingUrl} target="_blank" rel="noopener noreferrer">Open tracking <ExternalLink size={13} /><span className="sr-only"> (opens a new tab)</span></a></details>}</div>)}</div> : <div className="empty-state small"><h3>No pickup checks</h3><p>Set a time after placing your order.</p></div>}<div className="card-footnote"><button className="text-button" onClick={onReminders}>Open all reminders <ArrowRight size={14} /></button></div></section></div>
  </div>;
}
