import { test,expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { emptyCalendar, type CalendarEvent } from '../../src/domain/calendar';

test.use({timezoneId:'America/Chicago'});
const meeting: CalendarEvent={id:'tomorrow',title:'Quarterly planning',start:'2026-10-28T14:00:00.000Z',end:'2026-10-28T14:30:00.000Z',allDay:false,startDate:null,endDate:null,location:'Conference room 4',attendeeCount:4,tentative:true,joinUrls:[]};

test('quiet tomorrow overview opens a shared detailed calendar with search, ranges and safe links',async({page})=>{
  await page.clock.install({time:new Date('2026-10-27T15:02:00Z')});
  const events=[{...meeting,id:'yesterday',title:'Previous review',start:'2026-10-26T14:00:00.000Z',end:'2026-10-26T14:30:00.000Z'}, {...meeting,id:'day',title:'Team offsite',allDay:true,startDate:'2026-10-27',endDate:'2026-10-29',start:'2026-10-27T05:00:00.000Z',end:'2026-10-29T05:00:00.000Z',tentative:false}, meeting, {...meeting,id:'overlap',title:'Design discussion',start:'2026-10-28T14:15:00.000Z',end:'2026-10-28T15:00:00.000Z',tentative:false,joinUrls:['https://zoom.us/j/fixture-one?pwd=test','https://teams.microsoft.com/l/meetup-join/fixture-two']}, {...meeting,id:'later',title:'Roadmap workshop',start:'2026-11-07T16:00:00.000Z',end:'2026-11-07T17:00:00.000Z'}];
  let statusReads=0;
  await page.route('**/api/calendar/**',async route=>{
    if(route.request().url().endsWith('/status')) statusReads++;
    await route.fulfill({json:{...emptyCalendar('ics','ready'),name:'Work calendar',host:'outlook.office365.com',lastSuccessfulRefresh:'2026-10-27T15:00:00.000Z',events}});
  });
  await page.goto('/');
  const card=page.getByRole('region',{name:'Meetings'});
  await expect(card.getByRole('region',{name:'Tomorrow',exact:true}).getByText('9:00 AM',{exact:true})).toBeVisible();
  await expect(card.locator('.imminent')).toHaveCount(0); await expect(card.getByText(/1378|minutes/)).toHaveCount(0);
  await expect(card.getByText('Quarterly planning',{exact:true})).toBeVisible();
  await page.screenshot({path:'artifacts/overview-tomorrow.png',fullPage:true});
  const readsBefore=statusReads;
  await card.getByRole('button',{name:'Open calendar',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Calendar',exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'Calendar',exact:true})).toHaveAttribute('aria-current','page');
  await expect(page.getByRole('heading',{name:'Quarterly planning',exact:true})).toBeVisible();
  const details=page.getByRole('region',{name:'Quarterly planning',exact:true});
  await expect(details.getByText('Conference room 4',{exact:true})).toBeVisible(); await expect(details.getByText('4',{exact:true})).toBeVisible();
  await expect(details.getByText('Overlaps with 1 other event.')).toBeVisible();
  await expect(details.getByRole('link',{name:'Open Outlook'})).toHaveAttribute('href','https://outlook.office.com/calendar/');
  await page.getByRole('button',{name:'Today',exact:true}).click(); await expect(page.getByRole('button',{name:/Team offsite/})).toBeVisible(); await expect(page.getByRole('button',{name:/Quarterly planning/})).toHaveCount(0);
  await page.getByRole('button',{name:'All loaded',exact:true}).click(); await expect(page.getByRole('button',{name:/Previous review/})).toBeVisible();
  await page.getByRole('button',{name:'Next 7 days',exact:true}).click(); await expect(page.getByRole('button',{name:/Roadmap workshop/})).toHaveCount(0);
  await page.getByRole('button',{name:'Upcoming',exact:true}).click(); await page.getByLabel('Search calendar').fill('design'); await page.getByRole('button',{name:/Design discussion/}).click();
  await expect(page.getByRole('heading',{name:'Design discussion',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Join meeting'}).click(); await expect(page.getByRole('dialog',{name:'Choose meeting link'})).toBeVisible(); await page.keyboard.press('Escape');
  await expect(page.getByRole('button',{name:'Join meeting'})).toBeFocused();
  await page.getByLabel('Search calendar').fill('not found'); await expect(page.getByRole('heading',{name:'No matching events'})).toBeVisible();
  await page.getByLabel('Search calendar').clear();
  expect(statusReads).toBe(readsBefore);
  expect((await new AxeBuilder({page}).analyze()).violations).toEqual([]);
  await page.screenshot({path:'artifacts/calendar-full-light.png',fullPage:true});
  await page.getByRole('button',{name:'Switch to dark theme'}).click(); expect((await new AxeBuilder({page}).analyze()).violations).toEqual([]);
  await page.screenshot({path:'artifacts/calendar-full-dark.png',fullPage:true});
  await page.setViewportSize({width:390,height:844}); expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.getByRole('button',{name:'Calendar',exact:true}).scrollIntoViewIfNeeded(); await expect(page.getByRole('button',{name:'Calendar',exact:true})).toBeVisible();
  await page.screenshot({path:'artifacts/calendar-full-mobile.png',fullPage:true});
});

test('every current dashboard widget has a full-view destination including shared reminder state',async({page})=>{
  await page.clock.install({time:new Date('2026-10-27T15:00:00Z')});
  await page.goto('/');
  await page.getByRole('button',{name:'Open reminders',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Reminders',exact:true})).toBeVisible(); await expect(page.getByRole('heading',{name:'No scheduled reminders'})).toBeVisible();
  await page.getByRole('button',{name:'Dashboard',exact:true}).click();
  await page.getByLabel('Task title').fill('Prepare meeting brief'); await page.getByRole('button',{name:'Add details in Tasks',exact:true}).click(); await page.getByRole('combobox',{name:'Reminder',exact:true}).selectOption('300000'); await page.getByRole('button',{name:'Add task',exact:true}).click();
  await page.getByRole('button',{name:'Reminders',exact:true}).click(); await expect(page.locator('.reminder-entry[data-reminder-id] strong').filter({hasText:'Prepare meeting brief'})).toBeVisible();
  await page.getByRole('button',{name:'Open task',exact:true}).click(); await expect(page.getByRole('dialog',{name:'Edit task'})).toBeVisible(); await page.keyboard.press('Escape');
  await page.clock.fastForward(301000); await expect(page.getByRole('heading',{name:'No scheduled reminders'})).toBeVisible(); await expect(page.locator('.history-entry > div > strong').filter({hasText:'Prepare meeting brief'})).toBeVisible();
  expect((await new AxeBuilder({page}).analyze()).violations).toEqual([]);
  await page.getByRole('button',{name:'Dashboard',exact:true}).click(); await page.getByRole('button',{name:'Open all tasks'}).click(); await expect(page.getByRole('heading',{name:'Tasks',exact:true})).toBeVisible();
});
