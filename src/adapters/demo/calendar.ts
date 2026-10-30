export interface CalendarOccurrence { id: string; title: string; start: string; end: string; attendees: string[] }
export interface CalendarProvider { occurrences(anchor: string): CalendarOccurrence[] }
export interface MeetingLauncher { launch(meeting: CalendarOccurrence): string }

export const demoCalendar: CalendarProvider = {
  occurrences(anchor) {
    const start = new Date(anchor).getTime() + 20 * 60000;
    return [
      { id: 'synthetic-standup', title: 'Team check-in', start: new Date(start).toISOString(), end: new Date(start + 30 * 60000).toISOString(), attendees: ['Alex', 'Jamie', 'You'] },
      { id: 'synthetic-focus', title: 'Project check-in', start: new Date(start + 120 * 60000).toISOString(), end: new Date(start + 145 * 60000).toISOString(), attendees: ['Sam', 'You'] },
    ];
  },
};
export const demoLauncher: MeetingLauncher = {
  launch() { return 'Meeting preview only. Connect Outlook to open your meetings.'; },
};
