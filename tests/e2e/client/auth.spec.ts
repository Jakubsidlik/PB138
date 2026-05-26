import { test, expect } from '@playwright/test';

test.describe('Authentication checks', () => {
  test('User should be automatically authenticated and redirected to dashboard', async ({ page }) => {
    // Navigating to the root URL
    await page.goto('/');

    // If global setup worked, we should NOT be on the Clerk sign-in page.
    // We should be on the dashboard. Let's check for a dashboard element.
    // Assuming the sidebar has a navigation element.
    await expect(page.getByText('Hlavní stránka', { exact: false }).first()).toBeVisible({ timeout: 15000 });
    
    // Check for the "Hlavní stránka" (Home) link in the sidebar to ensure we are fully loaded
    await expect(page.getByRole('link', { name: /Hlavní stránka/i })).toBeVisible();
  });
});
