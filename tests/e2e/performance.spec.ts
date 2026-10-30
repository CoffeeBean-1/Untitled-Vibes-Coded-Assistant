import { writeFile, mkdir } from 'node:fs/promises';
import { expect, test } from '@playwright/test';

test('1,000-task baseline uses bounded lists and measures search and committed feedback', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Review project brief', exact: true })).toBeVisible();
  await page.evaluate(async () => {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open('cai-synthetic-v1', 3);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result; const tx = db.transaction('workspace', 'readwrite'); const store = tx.objectStore('workspace');
        const get = store.get('synthetic');
        get.onsuccess = () => {
          const state = get.result;
          state.tasks = Array.from({ length: 1000 }, (_, index) => ({ ...state.tasks[0], id: `load-${index}`, title: `Load task ${index}`, description: 'Performance fixture', status: 'todo', due: { kind: 'none' } }));
          state.revision++; store.put(state, 'synthetic');
        };
        tx.oncomplete = () => { db.close(); resolve(); }; tx.onerror = () => reject(tx.error);
      };
    });
  });
  await page.reload(); await page.getByRole('button', { name: 'Tasks', exact: true }).click();
  await expect(page.locator('.task-row')).toHaveCount(50);
  const searchTimes: number[] = []; const editTimes: number[] = [];
  for (let repetition = 0; repetition < 55; repetition++) {
    const start = await page.evaluate(() => performance.now());
    await page.getByLabel('Search tasks').fill(repetition % 2 ? 'Load task 777' : 'Load task 888');
    await expect(page.locator('.task-row')).toHaveCount(1);
    const row = page.locator('.task-row');
    await expect(row).toContainText(repetition % 2 ? 'Load task 777' : 'Load task 888');
    if (repetition >= 5) searchTimes.push(await page.evaluate(() => performance.now()) - start);
    const checkbox = row.getByRole('checkbox');
    const checked = await checkbox.isChecked(); const editStart = await page.evaluate(() => performance.now());
    await checkbox.click();
    await page.waitForFunction((desired) => (document.querySelector('.task-row input[type="checkbox"]') as HTMLInputElement | null)?.checked === desired, !checked, { polling: 'raf' });
    if (repetition >= 5) editTimes.push(await page.evaluate(() => performance.now()) - editStart);
  }
  const p95 = (values: number[]) => [...values].sort((a, b) => a-b)[Math.ceil(values.length * .95)-1];
  const report = { taskCount: 1000, pageSize: 50, warmups: 5, samples: 50, searchP95Ms: p95(searchTimes), committedCompletionP95Ms: p95(editTimes), proposedSearchBudgetMs: 200, proposedFeedbackBudgetMs: 100, note: 'Chrome automation timings include protocol/assertion overhead and completion waits for persistence; one active task view, not the later four-widget benchmark.' };
  await mkdir('artifacts', { recursive: true }); await writeFile('artifacts/m2-performance.json', JSON.stringify(report, null, 2));
  console.log('Task baseline:', JSON.stringify(report));
});
