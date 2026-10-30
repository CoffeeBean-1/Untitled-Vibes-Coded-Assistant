export class CalendarError extends Error {
  code: string;
  retrySeconds: number | null;
  constructor(code: string, message: string, retrySeconds: number | null = null) { super(message); this.code = code; this.retrySeconds = retrySeconds; }
}
export const unavailable = () => new CalendarError('unavailable', 'The calendar provider could not be reached. Try again shortly.');
