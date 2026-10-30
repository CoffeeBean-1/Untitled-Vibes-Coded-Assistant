import '@testing-library/jest-dom/vitest';
import 'fake-indexeddb/auto';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(cleanup);
if (typeof window !== 'undefined') {
Object.defineProperty(window, 'matchMedia', { writable: true, value: vi.fn().mockImplementation((query: string) => ({ matches: false, media: query, onchange: null, addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn() })) });
HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); };

vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ source: 'sample', status: 'idle', name: 'Sample calendar', host: null, events: [], lastSuccessfulRefresh: null, lastAttempt: null, incomplete: false, warnings: [], error: null, retryAt: null }), { status: 200 })));
}
