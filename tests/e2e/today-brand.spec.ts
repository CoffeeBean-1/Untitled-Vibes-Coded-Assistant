import { test,expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { emptyCalendar,type CalendarEvent } from '../../src/domain/calendar';

test.use({timezoneId:'America/Chicago'});
test('today/tomorrow groups, restrained empty-state satire and local day rollover',async({page})=>{
  await page.clock.install({time:new Date('2026-10-27T22:00:00Z')});
  const base: CalendarEvent={id:'ended',title:'Morning review',start:'2026-10-27T14:00:00.000Z',end:'2026-10-27T15:00:00.000Z',allDay:false,startDate:null,endDate:null,location:'Room',attendeeCount:2,tentative:false,joinUrls:[]};
  const events=[base,{...base,id:'tomorrow',title:'Tomorrow planning',start:'2026-10-28T14:00:00.000Z',end:'2026-10-28T15:00:00.000Z'},{...base,id:'tomorrow-2',title:'Budget review',start:'2026-10-28T16:00:00.000Z',end:'2026-10-28T17:00:00.000Z'},{...base,id:'tomorrow-3',title:'Delivery check-in',start:'2026-10-28T17:00:00.000Z',end:'2026-10-28T18:00:00.000Z'},{...base,id:'tomorrow-4',title:'Late planning',start:'2026-10-28T18:00:00.000Z',end:'2026-10-28T19:00:00.000Z'},{...base,id:'later',title:'Later review',start:'2026-10-29T14:00:00.000Z',end:'2026-10-29T15:00:00.000Z'}];
  let partial=false;
  await page.route('**/api/calendar/**',route=>route.fulfill({json:{...emptyCalendar('ics','ready'),host:'outlook.office365.com',events,incomplete:partial}}));
  await page.goto('/'); const card=page.getByRole('region',{name:'Meetings'});
  const today=card.getByRole('region',{name:'Today',exact:true}); const tomorrow=card.getByRole('region',{name:'Tomorrow',exact:true});
  await expect(today.getByText('No more meetings today!',{exact:true})).toBeVisible(); await expect(today.getByText('Go touch some grass before it\'s too late.',{exact:true})).toBeVisible();
  await expect(tomorrow.getByText('Tomorrow planning',{exact:true})).toBeVisible(); await expect(card.getByText('Later review',{exact:true})).toHaveCount(0); await expect(card.getByText('Morning review',{exact:true})).toHaveCount(0);
  await page.screenshot({path:'artifacts/today-tomorrow-light.png',fullPage:true});
  await expect(tomorrow.locator('.meeting-list > li')).toHaveCount(3); await tomorrow.getByRole('button',{name:/1 more tomorrow/}).click();
  await expect(page.getByRole('heading',{name:'Late planning',exact:true})).toBeVisible(); await page.getByRole('button',{name:'Dashboard',exact:true}).click();
  await page.getByRole('button',{name:'Settings',exact:true}).click(); await page.getByRole('checkbox',{name:/Optional satirical copy/}).click();
  await expect(page.getByRole('checkbox',{name:/Optional satirical copy/})).not.toBeChecked(); await page.getByRole('button',{name:'Dashboard',exact:true}).click();
  await expect(today.getByText('No more meetings today!',{exact:true})).toBeVisible(); await expect(card.getByText('Go touch some grass before it\'s too late.',{exact:true})).toHaveCount(0);
  await page.clock.setFixedTime(new Date('2026-10-28T22:00:00Z')); await page.clock.runFor(1100);
  await expect(today.getByText('No more meetings today!',{exact:true})).toBeVisible(); await expect(tomorrow.getByText('Later review',{exact:true})).toBeVisible();
  partial=true; await page.getByRole('button',{name:'Refresh calendar',exact:true}).click(); await expect(today.getByText('No meetings shown today.',{exact:true})).toBeVisible();
});

test('locked local identity, equal tagline lines, satire off and responsive accessible variants',async({page,request})=>{
  const external:string[]=[]; page.on('request',req=>{if(!req.url().startsWith('http://127.0.0.1:4173')) external.push(req.url());});
  await page.goto('/'); await expect(page).toHaveTitle('CAi | Cursed Assistant-inator');
  await expect(page.getByRole('link',{name:'CAi home',exact:true})).toBeVisible();
  await expect(page.locator('.identity .cai-brand-symbol')).toHaveAttribute('src','/branding/cai/cai-mark-128.png');
  for(const asset of ['favicon.ico','cai-app-icon-16.png','cai-app-icon-32.png','apple-touch-icon.png','cai-mark-128.png','cai-wordmark-dark.svg','cai-wordmark-light.svg']) expect((await request.get('/branding/cai/'+asset)).ok()).toBe(true);
  await page.getByRole('button',{name:'About CAi'}).click();
  await expect(page.getByText('THE COMPANY',{exact:true})).toBeVisible(); await expect(page.getByText('THE COMPANY · SATIRE',{exact:true})).toHaveCount(0);
  await expect(page.getByRole('heading',{name:'Our dedication to AI',exact:true})).toBeVisible();
  await expect(page.getByText('AI is the future. CAi is building the narrative to match.',{exact:true})).toBeVisible();
  await expect(page.getByText('Productivity is our job.',{exact:true})).toBeVisible(); await expect(page.getByText('Your data is our passion.',{exact:true})).toBeVisible();
  const styles=await page.locator('.cai-brand-tagline > span').evaluateAll(elements=>elements.map(el=>{const style=getComputedStyle(el);return [style.fontSize,style.fontWeight,style.color];})); expect(styles[0]).toEqual(styles[1]);
  await expect(page.getByRole('heading',{name:'Data and privacy',exact:true})).toBeVisible(); expect((await new AxeBuilder({page}).analyze()).violations).toEqual([]);
  await expect(page.locator('.about-brand-stage .cai-brand-symbol')).toHaveAttribute('src','/branding/cai/cai-mark-128.png');
  await page.screenshot({path:'artifacts/brand-about-light.png',fullPage:true});
  await page.getByRole('button',{name:'Switch to dark theme'}).click(); await expect(page.locator('html')).toHaveAttribute('data-theme','dark'); await expect(page.locator('.identity .cai-brand-symbol')).toHaveAttribute('src','/branding/cai/cai-mark-128.png');
  for(const width of [1280,768,375,320]) { await page.setViewportSize({width,height:900}); expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true); }
  await page.screenshot({path:'artifacts/brand-about-mobile-dark.png',fullPage:true}); expect((await new AxeBuilder({page}).analyze()).violations).toEqual([]);
  await page.emulateMedia({forcedColors:'active'}); await expect(page.locator('.identity .cai-forced-label')).toBeVisible(); await page.emulateMedia({forcedColors:'none'});
  await page.setViewportSize({width:1280,height:900}); await page.evaluate(()=>{document.documentElement.style.zoom='2';}); expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true); await page.evaluate(()=>{document.documentElement.style.zoom='';});
  await page.getByRole('button',{name:'Settings',exact:true}).click(); await page.getByRole('checkbox',{name:/Optional satirical copy/}).click(); await expect(page.getByRole('checkbox',{name:/Optional satirical copy/})).not.toBeChecked(); await page.getByRole('button',{name:'About CAi'}).click();
  await expect(page.locator('.cai-brand-tagline')).toHaveCount(0); await expect(page.getByText('THE COMPANY',{exact:true})).toBeVisible(); await expect(page.getByRole('heading',{name:'Our dedication to AI',exact:true})).toHaveCount(0); await expect(page.getByRole('heading',{name:'Data and privacy',exact:true})).toBeVisible();
  expect(external).toEqual([]);
});
