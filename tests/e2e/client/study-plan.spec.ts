import { test, expect } from '@playwright/test';

test.describe('Study Plan Navigation & Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /Studijní plán/i }).click();
    await page.waitForURL('**/study');
  });

  test('Should load Study Plan page with correct headers', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Moje Studijní Plány/i })).toBeVisible();

    await expect(page.getByText('+ Nový studijní plán')).toBeVisible();
  });

  test('Should open the New Study Plan modal when button is clicked', async ({ page }) => {
    await page.getByText('+ Nový studijní plán').click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    await expect(dialog.getByRole('heading', { name: /Nový studijní plán/i })).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  });
});
