import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { emptyCalendar, type CalendarSnapshot } from '../../src/domain/calendar';

test('ICS connect, reload, stale refresh, safe join and disconnect stay separate from tasks', async ({page,context}) => {
  const now = new Date('2026-10-27T13:00:00Z'); await page.clock.install({time:now});
  let snapshot: CalendarSnapshot = emptyCalendar(); let fail = false;
  const join='https://example.zoom.us/j/123?pwd=fixture';
  await context.route('https://example.zoom.us/**', route => route.fulfill({contentType:'text/html',body:'<p>Intercepted test destination</p>'}));
  await page.route('**/api/calendar/**', async route => {
    const action = new URL(route.request().url()).pathname.split('/').pop();
    if(action==='connect') {
      expect(route.request().postDataJSON().url).toBe('https://outlook.office365.com/fixture/calendar.ics');
      snapshot={...emptyCalendar('ics','ready'),name:'Planning',host:'outlook.office365.com',lastSuccessfulRefresh:now.toISOString(),lastAttempt:now.toISOString(),events:[{id:'fixture',title:'Planning review',start:'2026-10-27T14:00:00.000Z',end:'2026-10-27T15:00:00.000Z',allDay:false,startDate:null,endDate:null,location:'Conference room',attendeeCount:3,tentative:true,joinUrls:[join]}]};
    }
    if(action==='refresh' && fail) snapshot={...snapshot,status:'error',error:'Calendar is temporarily unavailable.'};
    if(action==='disconnect') snapshot=emptyCalendar('ics','disconnected');
    await route.fulfill({json:snapshot});
  });
  await page.goto('/'); await expect(page.getByText('SAMPLE CALENDAR',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Settings',exact:true}).click();
  await page.getByLabel('ICS subscription link').fill('https://outlook.office365.com/fixture/calendar.ics');
  await page.getByRole('button',{name:'Connect calendar',exact:true}).click();
  await expect(page.getByLabel('ICS subscription link')).toHaveValue('');
  await expect(page.getByText('Last refreshed',{exact:false})).toBeVisible();
  await page.getByRole('button',{name:'Dashboard',exact:true}).click();
  await expect(page.getByRole('button',{name:/^Planning review/})).toBeVisible(); await expect(page.getByText('Tentative',{exact:true})).toHaveCount(0);
  await page.reload(); await expect(page.getByRole('button',{name:/^Planning review/})).toBeVisible();
  expect((await new AxeBuilder({page}).analyze()).violations).toEqual([]);
  const popup = page.waitForEvent('popup'); await page.getByRole('button',{name:'Open video options for Planning review'}).click(); const destination=await popup; await destination.waitForLoadState(); expect(destination.url()).toBe(join); await destination.close();
  fail=true; await page.getByRole('button',{name:'Refresh calendar',exact:true}).click();
  await expect(page.getByText('Showing the last successful refresh.',{exact:false})).toBeVisible(); await expect(page.getByText('SAMPLE CALENDAR',{exact:true})).toHaveCount(0);
  await page.screenshot({path:'artifacts/calendar-light.png',fullPage:true});
  await page.getByRole('button',{name:'Switch to dark theme'}).click(); await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
  await page.screenshot({path:'artifacts/calendar-dark.png',fullPage:true});
  await page.setViewportSize({width:390,height:844}); expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:'artifacts/calendar-mobile.png',fullPage:true});
  await page.getByRole('button',{name:'Settings',exact:true}).click(); await page.getByRole('button',{name:'Disconnect calendar',exact:true}).click();
  await expect(page.getByText('Calendar disconnected. Paste the link again to reconnect.')).toBeVisible();
  await page.getByRole('button',{name:'Dashboard',exact:true}).click(); await expect(page.getByRole('heading',{name:'Calendar disconnected'})).toBeVisible();
  await expect(page.getByRole('button',{name:/^Planning review/})).toHaveCount(0); await page.reload(); await expect(page.getByRole('heading',{name:'Calendar disconnected'})).toBeVisible();
});

test('real local middleware uses isolated cookies and rejects cross-site requests', async ({request}) => {
  const headers={'X-CAi-Request':'calendar','Sec-Fetch-Site':'same-origin'};
  const status=await request.get('/api/calendar/status',{headers}); expect(status.status()).toBe(200); expect((await status.json()).source).toBe('sample');
  expect(status.headers()['cache-control']).toBe('no-store'); expect(status.headers()['set-cookie']).toContain('HttpOnly; SameSite=Strict');
  const invalid=await request.post('/api/calendar/connect',{headers,data:{url:'https://evil.test/private.ics',timeZone:'UTC'}}); expect(invalid.status()).toBe(400); expect(await invalid.text()).not.toContain('evil.test');
  const denied=await request.post('/api/calendar/disconnect',{headers:{...headers,Origin:'https://evil.test'}}); expect(denied.status()).toBe(403);
  const disconnect=await request.post('/api/calendar/disconnect',{headers}); expect((await disconnect.json()).status).toBe('disconnected');
  const after=await request.get('/api/calendar/status',{headers}); expect((await after.json()).status).toBe('disconnected');
});
