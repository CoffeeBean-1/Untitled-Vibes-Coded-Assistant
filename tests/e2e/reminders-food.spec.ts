import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.use({ timezoneId: 'America/Chicago' });
const start = new Date('2026-10-27T15:00:00Z');

test('Aster Hall opens isolated provider checkout and manual pickup checks share reminders', async ({ page, context }) => {
  await page.clock.install({ time: start });
  // Every provider request is intercepted: no production menu, checkout, login or purchase is touched.
  await context.route('https://asterhall.order.online/**', route => route.fulfill({ contentType: 'text/html', body: '<title>Ordering test double</title><h1>Provider checkout test double</h1>' }));
  await page.goto('/');
  const widget = page.getByRole('region', { name: 'Aster Hall', exact: true });
  const order = widget.getByRole('link', { name: /Open ordering/ });
  await expect(order).toHaveAttribute('href', 'https://asterhall.order.online/');
  await expect(order).toHaveAttribute('rel', 'noopener noreferrer');
  const popupPromise = context.waitForEvent('page'); await order.click(); const popup = await popupPromise;
  await expect(popup.getByRole('heading', { name: 'Provider checkout test double' })).toBeVisible();
  expect(await popup.evaluate(() => window.opener === null)).toBe(true); await popup.close();
  await page.getByRole('button', { name: 'Aster Hall', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'No pickup checks' })).toBeVisible();
  await expect(page.locator('iframe')).toHaveCount(0);
  await page.getByLabel('Pickup label').fill('Small Cheval lunch');
  await page.getByText('Add a tracking link', { exact: false }).click();
  await page.getByLabel('Private tracking link').fill('https://asterhall.order.online/track/fixture?token=private-pickup');
  await page.getByRole('combobox', { name: 'Remind me', exact: true }).selectOption('5');
  await page.getByRole('button', { name: 'Set pickup reminder' }).click();
  await expect(page.getByText('Pickup reminder scheduled.', { exact: true })).toBeVisible();
  await expect(page.locator('.pickup-item')).toHaveCount(1);
  await page.reload(); await page.getByRole('button', { name: 'Aster Hall', exact: true }).click();
  await expect(page.locator('.pickup-item')).toHaveCount(1);
  await page.getByRole('button', { name: 'Dashboard', exact: true }).click();
  await page.clock.fastForward(301000);
  await expect(page.locator('.notification')).toHaveCount(1);
  await expect(page.locator('.notification')).toContainText('A reminder is due.');
  await expect(page.locator('.notification')).not.toContainText('Small Cheval');
  await page.getByRole('button', { name: 'Reminders', exact: true }).click();
  await expect(page.locator('.history-entry > div > strong').filter({ hasText: 'Check pickup: Small Cheval lunch' })).toBeVisible();
  await page.getByText('Reminder details', { exact: true }).click();
  await page.getByRole('button', { name: 'Snooze 15 min: Check pickup: Small Cheval lunch' }).click();
  await expect(page.locator('.reminder-entry[data-reminder-id]')).toHaveCount(1);
  await page.getByRole('button', { name: 'Aster Hall', exact: true }).click();
  await page.getByRole('button', { name: 'Mark checked: Small Cheval lunch' }).click();
  await expect(page.getByRole('heading', { name: 'No pickup checks' })).toBeVisible();
  await page.getByRole('button', { name: 'Reminders', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'No scheduled reminders' })).toBeVisible();
});

test('multiple task schedules, relative deadline edits, cancellation and completion', async ({ page }) => {
  await page.clock.install({ time: start }); await page.goto('/');
  await page.getByLabel('Task title').fill('Review budget'); await page.getByRole('button', { name: 'Add details in Tasks', exact: true }).click(); await page.getByLabel('Due date', { exact: true }).fill('2026-10-28');
  await page.getByRole('button', { name: 'Add task', exact: true }).click();
  await page.getByRole('button', { name: 'Edit Review budget', exact: true }).click();
  const dialog = page.getByRole('dialog'); const panel = dialog.getByRole('region', { name: 'Task reminders' });
  await panel.getByRole('combobox', { name: 'Remind me', exact: true }).selectOption('due');
  await panel.getByLabel('Before deadline').selectOption('15');
  await panel.getByRole('button', { name: 'Add reminder', exact: true }).click();
  await expect(panel.locator('[data-reminder-id]')).toHaveCount(1);
  await panel.getByRole('combobox', { name: 'Remind me', exact: true }).selectOption('15');
  await panel.getByRole('button', { name: 'Add reminder', exact: true }).click();
  await expect(panel.locator('[data-reminder-id]')).toHaveCount(2);
  await dialog.getByLabel('Due date', { exact: true }).fill('2026-10-29');
  await dialog.getByRole('button', { name: 'Save changes' }).click(); await expect(dialog).toHaveCount(0);
  await page.getByRole('button', { name: 'Reminders', exact: true }).click();
  const rows = page.locator('.reminder-entry[data-reminder-id]'); await expect(rows).toHaveCount(2);
  await expect(rows.filter({ hasText: '15 minutes before the deadline' })).toContainText('Oct 29, 2026');
  await rows.filter({ has: page.locator('small').filter({ hasText: /^Chosen time/ }) }).getByRole('button', { name: 'Cancel reminder for Review budget' }).click();
  await expect(rows).toHaveCount(1);
  await page.getByRole('button', { name: 'Tasks', exact: true }).click();
  await page.getByRole('checkbox', { name: 'Complete Review budget', exact: true }).click();
  await page.getByRole('button', { name: 'Reminders', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'No scheduled reminders' })).toBeVisible();
  await page.clock.fastForward(305000); await expect(page.getByRole('heading', { name: 'No reminder history' })).toBeVisible();
});

test('quiet hours persist, defer alerts and summarize them once at the boundary', async ({ page }) => {
  await page.clock.install({ time: start }); await page.goto('/');
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await expect(page.getByRole('checkbox', { name: /Private reminder previews/ })).toBeChecked();
  await page.getByRole('checkbox', { name: /^Quiet hours/ }).check();
  await page.getByLabel('Quiet hours start').fill('09:00'); await page.getByLabel('Quiet hours end', { exact: true }).fill('11:00');
  await page.getByLabel('Quiet hours time zone').fill('America/Chicago');
  await page.getByRole('button', { name: 'Save reminder settings' }).click(); await expect(page.getByText('Reminder settings saved.')).toBeVisible();
  await page.getByRole('button', { name: 'Dashboard', exact: true }).click();
  await page.getByLabel('Task title').fill('Quiet review'); await page.getByRole('button', { name: 'Add details in Tasks', exact: true }).click(); await page.getByRole('combobox', { name: 'Reminder', exact: true }).selectOption('300000');
  await page.getByRole('button', { name: 'Add task', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Quiet review', exact: true })).toBeVisible();
  await page.clock.fastForward(301000);
  await expect(page.locator('.notification')).toHaveCount(0);
  await page.getByRole('button', { name: 'Reminders', exact: true }).click();
  await expect(page.getByText(/Quiet hours · deferred until/)).toBeVisible();
  await page.clock.setFixedTime(new Date('2026-10-27T16:00:00Z')); await page.clock.runFor(1100);
  await expect(page.getByText('1 reminder became due while you were away or during quiet hours.', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'No scheduled reminders' })).toBeVisible();
  await page.reload(); await page.getByRole('button', { name: 'Reminders', exact: true }).click();
  await expect(page.getByText('1 reminder became due while you were away or during quiet hours.', { exact: true })).toHaveCount(1);
  await page.getByRole('button', { name: 'Acknowledge', exact: true }).click();
  await expect(page.getByText(/^Acknowledged /)).toBeVisible();
});

test('returning after all CAi tabs close summarizes missed work without replay or data loss', async ({ page, context }) => {
  await page.clock.install({ time: start }); await page.goto('/');
  await page.getByLabel('Task title').fill('After return'); await page.getByRole('button', { name: 'Add details in Tasks', exact: true }).click(); await page.getByRole('combobox', { name: 'Reminder', exact: true }).selectOption('300000');
  await page.getByRole('button', { name: 'Add task', exact: true }).click();
  await expect(page.getByRole('button', { name: 'After return', exact: true })).toBeVisible();
  await page.close();
  const reopened = await context.newPage(); await reopened.clock.install({ time: new Date('2026-10-27T16:00:00Z') }); await reopened.goto('/');
  await expect(reopened.locator('.notification')).toHaveCount(1); await expect(reopened.locator('.notification')).toContainText('1 reminder became due');
  await reopened.reload(); await expect(reopened.locator('.notification')).toHaveCount(1);
  await expect(reopened.getByRole('button', { name: 'After return', exact: true })).toBeVisible();
});

test('two windows share new schedules and the remaining window takes over without duplicates', async ({ page, context }) => {
  await page.clock.install({ time: start }); await page.goto('/');
  const other = await context.newPage(); await other.clock.install({ time: start }); await other.goto('/');
  await other.getByRole('button', { name: 'Reminders', exact: true }).click();
  await expect(other.getByRole('heading', { name: 'No scheduled reminders' })).toBeVisible();
  await page.getByLabel('Task title').fill('Shared window check'); await page.getByRole('button', { name: 'Add details in Tasks', exact: true }).click();
  await page.getByRole('combobox', { name: 'Reminder', exact: true }).selectOption('300000');
  await page.getByRole('button', { name: 'Add task', exact: true }).click();
  await expect(other.locator('.reminder-entry[data-reminder-id] strong')).toHaveText('Shared window check');
  await page.close(); await other.clock.fastForward(301000);
  await expect(other.locator('.history-entry')).toHaveCount(1);
  await expect(other.getByRole('heading', { name: 'No scheduled reminders' })).toBeVisible();
  const returned = await context.newPage(); await returned.clock.install({ time: new Date('2026-10-27T15:05:01Z') }); await returned.goto('/');
  await expect(returned.locator('.notification')).toHaveCount(1); await other.reload();
  await other.getByRole('button', { name: 'Reminders', exact: true }).click(); await expect(other.locator('.history-entry')).toHaveCount(1);
});

test('food and reminder views remain accessible in both themes and mobile sizes', async ({ page }) => {
  await page.clock.install({ time: start }); await page.goto('/');
  await page.getByRole('button', { name: 'Aster Hall', exact: true }).click();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.screenshot({ path: 'artifacts/aster-hall-light.png', fullPage: true });
  await page.getByLabel('Pickup label').fill('Lunch check');
  await page.getByRole('button', { name: 'Set pickup reminder' }).click(); await expect(page.locator('.pickup-item')).toHaveCount(1);
  await page.getByRole('button', { name: 'Switch to dark theme' }).click();
  for (const width of [1280, 768, 390, 320]) { await page.setViewportSize({ width, height: 900 }); expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true); }
  await page.screenshot({ path: 'artifacts/aster-hall-mobile-dark.png', fullPage: true });
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.getByRole('button', { name: 'Reminders', exact: true }).click();
  await page.screenshot({ path: 'artifacts/reminders-mobile-dark.png', fullPage: true });
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.setViewportSize({ width: 1280, height: 900 }); await page.evaluate(() => { document.documentElement.style.zoom = '2'; });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
