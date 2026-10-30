import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { calendarReaderPlugin } from './server/calendar/plugin.ts';

const headers = {
  'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self' ws://127.0.0.1:*; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'",
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
};

export default defineConfig({
  plugins: [react(), calendarReaderPlugin()],
  server: { host: '127.0.0.1', port: 5173, strictPort: true, headers: { ...headers, 'Content-Security-Policy': headers['Content-Security-Policy'].replace("script-src 'self'", "script-src 'self' 'unsafe-inline'") } },
  preview: { host: '127.0.0.1', port: 4173, strictPort: true, headers },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'server/**/*.test.ts'],
    restoreMocks: true,
  },
});
