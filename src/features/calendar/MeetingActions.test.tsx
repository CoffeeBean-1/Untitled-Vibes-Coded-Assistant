import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { CalendarEvent } from '../../domain/calendar';
import { MeetingActions } from './MeetingActions';

const url = 'https://example.zoom.us/j/123?pwd=fixture';
const event: CalendarEvent = { id: 'one', title: 'Planning', start: '2026-10-28T15:00:00.000Z', end: '2026-10-28T16:00:00.000Z', allDay: false, startDate: null, endDate: null, location: '', attendeeCount: 0, tentative: false, joinUrls: [url] };
describe('separate compact meeting buttons', () => {
  it('offers two independent controls, each preserving the approved original link', async () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    render(<MeetingActions event={event} sample={false} compact onNotice={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Open audio options for Planning' }));
    await userEvent.click(screen.getByRole('button', { name: 'Open video options for Planning' }));
    expect(open).toHaveBeenCalledTimes(2);
    expect(open.mock.calls).toEqual([[url, '_blank', 'noopener,noreferrer'], [url, '_blank', 'noopener,noreferrer']]);
  });
  it('intercepts both sample actions without launching a meeting', async () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null); const notice = vi.fn();
    render(<MeetingActions event={event} sample compact onNotice={notice} />);
    await userEvent.click(screen.getByRole('button', { name: 'Preview audio options for Planning' }));
    await userEvent.click(screen.getByRole('button', { name: 'Preview video options for Planning' }));
    expect(notice).toHaveBeenCalledTimes(2); expect(open).not.toHaveBeenCalled();
  });
  it('hides unsafe links and retains the destination chooser from either button', async () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    const { rerender } = render(<MeetingActions event={{ ...event, joinUrls: ['javascript:alert(1)', 'https://zoom.us.attacker.example/j/123'] }} sample={false} compact onNotice={vi.fn()} />);
    expect(screen.queryByRole('group')).not.toBeInTheDocument();
    const protectedLink = 'https://example.safelinks.protection.outlook.com/?url=' + encodeURIComponent(url);
    rerender(<MeetingActions event={{ ...event, joinUrls: [url, protectedLink] }} sample={false} compact onNotice={vi.fn()} />);
    for (const kind of ['audio', 'video']) {
      await userEvent.click(screen.getByRole('button', { name: `Open ${kind} options for Planning` }));
      expect(screen.getByRole('dialog', { name: 'Choose meeting link' })).toBeVisible();
      await userEvent.click(screen.getByRole('button', { name: /Link 2/ }));
      expect(open).toHaveBeenLastCalledWith(protectedLink, '_blank', 'noopener,noreferrer');
    }
  });
});
