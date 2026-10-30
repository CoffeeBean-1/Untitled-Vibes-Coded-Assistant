import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('quick add is minimal, supports Enter, and transfers a retained draft into Tasks', async ({ page }) => {
  await page.goto('/');
  const widget = page.getByRole('region', { name: 'Tasks', exact: true });
  const quick = page.getByRole('form', { name: 'Quick add task' });
  await expect(quick.getByRole('textbox', { name: 'Task title' })).toBeVisible();
  await expect(widget.getByRole('combobox')).toHaveCount(0);
  await expect(widget.locator('textarea, input[type="date"], details')).toHaveCount(0);
  await page.getByRole('button', { name: 'Create a task', exact: true }).click();
  await expect(quick.getByLabel('Task title')).toBeFocused();
  await quick.getByLabel('Task title').fill('  Send agenda  '); await quick.getByLabel('Task title').press('Enter');
  await expect(widget.getByRole('button', { name: 'Send agenda', exact: true })).toBeVisible();
  await expect(quick.getByLabel('Task title')).toHaveValue(''); await expect(quick.getByLabel('Task title')).toBeFocused();
  const row = widget.locator('.task-row').filter({ has: page.getByRole('button', { name: 'Send agenda', exact: true }) });
  await expect(row).toContainText('No deadline'); await expect(row).toContainText('Normal');

  await quick.getByLabel('Task title').fill('Prepare detailed brief');
  await widget.getByRole('button', { name: 'Add details in Tasks', exact: true }).click();
  await expect(page.locator('main h1')).toHaveText('Tasks');
  const dialog = page.getByRole('dialog', { name: 'New task' });
  await expect(dialog.getByLabel('Task title')).toHaveValue('Prepare detailed brief');
  await expect(dialog.getByLabel('Task title')).toBeFocused();
  await expect(dialog.getByLabel('Description')).toBeVisible();
  await page.keyboard.press('Escape'); await expect(dialog).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Prepare detailed brief', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Dashboard', exact: true }).click();
  await expect(quick.getByLabel('Task title')).toHaveValue('Prepare detailed brief');
  await widget.getByRole('button', { name: 'Add details in Tasks', exact: true }).click();
  await dialog.getByLabel('Due date', { exact: true }).fill('2026-10-28');
  await dialog.getByLabel('Priority', { exact: true }).selectOption('high');
  await dialog.getByLabel('Description').fill('Add the key points and next steps.');
  await dialog.getByLabel('Project or list').fill('Planning');
  await dialog.getByRole('button', { name: 'Add task', exact: true }).click(); await expect(dialog).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Prepare detailed brief', exact: true })).toHaveCount(1);
  await page.getByRole('button', { name: 'Dashboard', exact: true }).click();
  await expect(quick.getByLabel('Task title')).toHaveValue('');
  await expect(widget.getByRole('button', { name: 'Prepare detailed brief', exact: true })).toHaveCount(1);
  await page.reload(); await expect(widget.getByRole('button', { name: 'Prepare detailed brief', exact: true })).toHaveCount(1);
});

test('quick entry stays compact and accessible in both themes and at narrow widths', async ({ page }) => {
  await page.goto('/'); const entry = page.locator('.quick-task-entry');
  expect((await entry.boundingBox())!.height).toBeLessThan(120);
  await page.screenshot({ path: 'artifacts/quick-task-desktop-light.png', fullPage: true });
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.getByRole('button', { name: 'Switch to dark theme' }).click();
  for (const width of [768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect((await entry.boundingBox())!.height).toBeLessThan(120);
  }
  await entry.scrollIntoViewIfNeeded(); await page.screenshot({ path: 'artifacts/quick-task-mobile-dark.png', fullPage: true });
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.setViewportSize({ width: 1280, height: 900 }); await page.evaluate(() => { document.documentElement.style.zoom = '2'; });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
