import { test, expect } from '@playwright/test';

test.describe('Tasks Management & Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /Úkoly/i }).click();
    await page.waitForURL('**/tasks*');
  });

  test('Should load Tasks page with correct headers', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Moje úkoly/i })).toBeVisible();

    await expect(page.getByText('+ Přidat úkol')).toBeVisible();
  });

  test('Should open the New Task modal when button is clicked', async ({ page }) => {
    await page.getByText('+ Přidat úkol').click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    await expect(dialog.getByRole('heading', { name: /Nový úkol/i })).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  });
});
