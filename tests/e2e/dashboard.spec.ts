import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('task lifecycle, persisted reminder, simulated launch, and preference persistence', async ({ page, context }) => {
  await page.clock.install({ time: new Date('2026-10-26T15:00:00Z') });
  const external: string[] = [];
  page.on('request', (request) => { if (!request.url().startsWith('http://127.0.0.1:4173')) external.push(request.url()); });
  await page.goto('/');
  await expect(page.locator('.workspace-badge')).toHaveText('Local workspace');
  await expect(page.getByText("Your work, management's success story.", { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Preview audio options for Team check-in' }).click();
  await expect(page.getByText('Meeting preview only. Connect Outlook to open your meetings.')).toBeVisible();
  expect(context.pages()).toHaveLength(1);
  await page.getByLabel('Task title').fill('Synthetic lifecycle test');
  await page.getByRole('button', { name: 'Add details in Tasks', exact: true }).click();
  await page.getByLabel('Due date', { exact: true }).fill('2026-10-27');
  await page.getByRole('combobox', { name: 'Priority', exact: true }).selectOption('high');
  await page.getByRole('combobox', { name: 'Reminder', exact: true }).selectOption('300000');
  await page.getByRole('button', { name: 'Add task', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Synthetic lifecycle test', exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Synthetic lifecycle test', exact: true })).toBeVisible();
  await page.clock.fastForward(301000);
  await expect(page.locator('.notification').filter({ hasText: 'A reminder is due.' })).toHaveCount(1);
  await page.reload();
  await expect(page.locator('.notification').filter({ hasText: 'A reminder is due.' })).toHaveCount(1);
  await page.getByRole('checkbox', { name: 'Complete Synthetic lifecycle test', exact: true }).click();
  await expect(page.getByRole('checkbox', { name: 'Complete Synthetic lifecycle test', exact: true })).toHaveCount(0);
  await page.reload();
  await page.getByRole('button', { name: /Completed/ }).click();
  await expect(page.getByRole('checkbox', { name: 'Reopen Synthetic lifecycle test', exact: true })).toBeChecked();
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await page.getByRole('radio', { name: 'Dark', exact: true }).click();
  await expect(page.getByRole('radio', { name: 'Dark', exact: true })).toBeChecked();
  await page.getByRole('checkbox', { name: /Optional satirical copy/ }).click();
  await expect(page.getByRole('checkbox', { name: /Optional satirical copy/ })).not.toBeChecked();
  await page.reload();
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await expect(page.getByRole('radio', { name: 'Dark', exact: true })).toBeChecked();
  await expect(page.getByRole('checkbox', { name: /Optional satirical copy/ })).not.toBeChecked();
  await page.getByRole('button', { name: 'Dashboard', exact: true }).click();
  await expect(page.getByText("Your work, management's success story.", { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'About CAi' }).click();
  await expect(page.getByRole('heading', { name: 'Cursed Assistant-inator', exact: true })).toBeVisible();
  await expect(page.getByText('THE COMPANY', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Our dedication to AI', exact: true })).toHaveCount(0);
  expect(external).toEqual([]);
});

test('editing and completing a pending reminder survives reload without stale alerts', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-26T15:00:00Z') });
  await page.goto('/');
  await page.getByLabel('Task title').fill('Cancel this nudge');
  await page.getByRole('button', { name: 'Add details in Tasks', exact: true }).click();
  await page.getByRole('combobox', { name: 'Reminder', exact: true }).selectOption('300000');
  await page.getByRole('button', { name: 'Add task', exact: true }).click();
  await page.getByRole('button', { name: 'Edit Cancel this nudge', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Task title').fill('Renamed synthetic task');
  await dialog.getByRole('combobox', { name: 'Priority', exact: true }).selectOption('critical');
  await dialog.getByRole('button', { name: 'Save changes' }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Edit Renamed synthetic task' })).toBeFocused();
  await page.getByRole('checkbox', { name: 'Complete Renamed synthetic task', exact: true }).click();
  await expect(page.getByRole('checkbox', { name: 'Complete Renamed synthetic task', exact: true })).toHaveCount(0);
  await page.reload();
  await page.clock.fastForward(305000);
  await expect(page.getByText('No reminders yet.', { exact: false })).toBeVisible();
});

test('empty tasks, offline indicator, and escaped task content stay usable', async ({ page, context }) => {
  await page.goto('/');
  await expect(page.getByRole('checkbox', { name: /^Complete / })).toHaveCount(3);
  const names = await page.getByRole('checkbox', { name: /^Complete / }).evaluateAll((elements) => elements.map((element) => element.getAttribute('aria-label')!));
  for (const name of names) {
    await page.getByRole('checkbox', { name, exact: true }).click();
    await expect(page.getByRole('checkbox', { name, exact: true })).toHaveCount(0);
  }
  await expect(page.getByText('No tasks here')).toBeVisible();
  await context.setOffline(true);
  await expect(page.getByText('Offline. Your saved tasks are still available.')).toBeVisible();
  await page.getByLabel('Task title').fill('<img src=x onerror=alert(1)>');
  await page.getByRole('button', { name: 'Add task', exact: true }).click();
  await expect(page.getByRole('button', { name: '<img src=x onerror=alert(1)>', exact: true })).toBeVisible();
  await expect(page.locator('main img')).toHaveCount(0);
});

test('storage opening failure is explicit and does not offer an unsaved workspace', async ({ page }) => {
  await page.addInitScript(() => { indexedDB.open = () => { throw new Error('Synthetic storage failure'); }; });
  await page.goto('/');
  await expect(page.getByRole('alert')).toContainText('has not been reset');
  await expect(page.getByRole('button', { name: 'Retry storage', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Add task', exact: true })).toHaveCount(0);
  await expect(page.locator('.workspace-badge')).toHaveText('Local workspace');
  await expect(page.getByText("Your work, management's success story.", { exact: true })).toHaveCount(0);
});

test('keyboard editing, Escape, reduced motion and accessible light/dark views', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.getByRole('button', { name: 'Edit Review project brief' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Edit Review project brief' })).toBeFocused();
  const light = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  expect(light.violations).toEqual([]);
  await page.getByRole('button', { name: 'Switch to dark theme' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  const dark = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  expect(dark.violations).toEqual([]);
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([]);
});

test('responsive captures, long content, dark mode and 200 percent zoom', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-26T15:00:00Z') });
  await page.goto('/');
  await page.getByLabel('Task title').fill('A deliberately long synthetic task title that wraps gracefully while keeping all the essential controls available on narrow screens');
  await page.getByRole('button', { name: 'Add task', exact: true }).click();
  for (const viewport of [{ width: 1440, height: 900 }, { width: 1024, height: 768 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    await expect(page.getByRole('button', { name: 'Add task', exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: `artifacts/dashboard-${viewport.width}-light.png`, fullPage: true });
  }
  await page.getByRole('button', { name: 'Switch to dark theme' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.screenshot({ path: 'artifacts/dashboard-390-dark.png', fullPage: true });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.screenshot({ path: 'artifacts/dashboard-1440-dark.png', fullPage: true });
  await page.evaluate(() => { document.documentElement.style.zoom = '2'; });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await expect(page.getByRole('button', { name: 'Add task', exact: true })).toBeVisible();
  await page.screenshot({ path: 'artifacts/dashboard-200-percent.png', fullPage: true });
});
