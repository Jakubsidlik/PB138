import { test, expect } from '@playwright/test';

test.describe('Authentication checks', () => {
  test('User should be automatically authenticated and redirected to dashboard', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByText('Hlavní stránka', { exact: false }).first()).toBeVisible({ timeout: 15000 });

    await expect(page.getByRole('link', { name: /Hlavní stránka/i })).toBeVisible();
  });
});
