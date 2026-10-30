import { describe,expect,it } from 'vitest';
import type { CalendarEvent } from '../../domain/calendar';
import { dashboardMeetingDays, dayLabel, eventDuration, meetingRelative, meetingWhen, selectCalendarEvents } from './presentation';

const event: CalendarEvent={id:'one',title:'Planning',start:'2026-10-28T14:00:00.000Z',end:'2026-10-28T14:30:00.000Z',allDay:false,startDate:null,endDate:null,location:'Room 1',attendeeCount:2,tentative:false,joinUrls:[]};
describe('calendar overview and agenda presentation',()=>{
  it('groups only remaining timed meetings today/tomorrow, including overnight ongoing meetings',()=>{
    const now=new Date('2026-10-27T15:00:00Z');
    const events=[event,{...event,id:'ended',start:'2026-10-27T13:00:00.000Z',end:'2026-10-27T14:00:00.000Z'},{...event,id:'ongoing',start:'2026-10-26T23:00:00.000Z',end:'2026-10-27T16:00:00.000Z'},{...event,id:'all-day',allDay:true},{...event,id:'later',start:'2026-10-29T14:00:00.000Z',end:'2026-10-29T15:00:00.000Z'}];
    const groups=dashboardMeetingDays(events,now,'America/Chicago');
    expect(groups.map(group=>group.label)).toEqual(['Today','Tomorrow']);
    expect(groups[0].events.map(item=>item.id)).toEqual(['ongoing']);
    expect(groups[1].events.map(item=>item.id)).toEqual(['one']);
  });
  it('uses the next local calendar day across DST and returns explicit empty groups',()=>{
    const groups=dashboardMeetingDays([],new Date('2026-11-01T05:30:00Z'),'America/Chicago');
    expect(groups.map(group=>group.date)).toEqual(['2026-11-01','2026-11-02']);
    expect(groups.every(group=>!group.events.length)).toBe(true);
    expect(dashboardMeetingDays([],new Date('2027-01-01T04:00:00Z'),'America/Chicago')[1].date).toBe('2027-01-01');
  });
  it('steps relative countdowns through minutes, hours and days at the actual boundaries',()=>{
    const start=Date.parse(event.start);
    const before=(difference:number)=>new Date(start-difference);
    expect(meetingRelative(event,before(59*60000))).toBe('in 59 minutes');
    expect(meetingRelative(event,before(3600000))).toBe('in 1 hour');
    expect(meetingRelative(event,before(23*3600000))).toBe('in 23 hours');
    expect(meetingRelative(event,before(86400000))).toBe('in 1 day');
    expect(meetingRelative(event,before(59*1000))).toBe('In less than a minute');
    expect(meetingRelative(event,new Date(event.start))).toBe('In progress');
  });
  it('shows a calm tomorrow label instead of 1378 minutes',()=>{
    const label=meetingWhen(event,new Date('2026-10-27T15:02:00Z'),'America/Chicago');
    expect(label).toEqual({label:'Tomorrow at 9:00 AM',urgent:false});
  });
  it('reserves countdowns for 15 minutes or less and recognizes ongoing meetings',()=>{
    expect(meetingWhen(event,new Date('2026-10-28T13:44:00Z'),'America/Chicago')).toMatchObject({urgent:false});
    expect(meetingWhen(event,new Date('2026-10-28T13:45:00Z'),'America/Chicago')).toEqual({label:'In 15 min',urgent:true});
    expect(meetingWhen(event,new Date(event.start),'America/Chicago')).toEqual({label:'In progress',urgent:true});
  });
  it('uses local calendar dates across midnight, DST and year boundaries',()=>{
    expect(dayLabel('2026-11-01',new Date('2026-11-01T04:50:00Z'),'America/Chicago')).toBe('Tomorrow');
    expect(dayLabel('2027-01-01',new Date('2026-12-31T18:00:00Z'),'America/Chicago')).toBe('Tomorrow');
    expect(dayLabel('2026-10-28',new Date('2026-10-28T00:10:00Z'),'America/Chicago')).toBe('Tomorrow');
  });
  it('filters full-day overlaps using exclusive end dates and searches titles/locations',()=>{
    const allDay={...event,id:'day',allDay:true,startDate:'2026-10-27',endDate:'2026-10-29',start:'2026-10-27T05:00:00.000Z',end:'2026-10-29T05:00:00.000Z'};
    expect(selectCalendarEvents([allDay,event],'today','',new Date('2026-10-28T20:00:00Z'),'America/Chicago')).toHaveLength(2);
    expect(selectCalendarEvents([allDay],'today','',new Date('2026-10-29T12:00:00Z'),'America/Chicago')).toEqual([]);
    expect(selectCalendarEvents([event],'upcoming','ROOM 1',new Date('2026-10-27T12:00:00Z'),'America/Chicago')).toEqual([event]);
    expect(selectCalendarEvents([event],'today','',new Date('2026-10-27T12:00:00Z'),'America/Chicago')).toEqual([]);
    expect(eventDuration(allDay)).toBe('2 days · all day');
  });
});
