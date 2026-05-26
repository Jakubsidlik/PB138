import { test, expect } from '@playwright/test';

test.describe('Dashboard Layout & Rendering', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Hlavní stránka', { exact: false }).first()).toBeVisible({ timeout: 15000 });
  });

  test('Sidebar should contain main navigation links', async ({ page }) => {
    const sidebar = page.locator('.dashboard-root')
    
    await expect(sidebar.getByRole('link', { name: 'Hlavní stránka', exact: true })).toBeVisible();
    await expect(sidebar.getByRole('link', { name: 'Kalendář', exact: true })).toBeVisible();
    await expect(sidebar.getByRole('link', { name: 'Úkoly', exact: true })).toBeVisible();
    await expect(sidebar.getByRole('link', { name: 'Soubory', exact: true })).toBeVisible();
    await expect(sidebar.getByRole('link', { name: 'Studijní plán', exact: true })).toBeVisible();
  });

  test('Dashboard should display a greeting', async ({ page }) => {
    const mainContent = page.locator('main')
    await expect(page.locator('h1.dashboard-home-greeting').or(page.getByRole('heading', { name: /(Ahoj|Dobr[éý] (ráno|dopoledne|odpoledne|večer|noc)).*/i }).first())).toBeVisible();
  });
});
