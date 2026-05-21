import { test, expect } from '@playwright/test';

test.describe('Tasks Management & Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Navigate to Tasks section using the sidebar
    await page.getByRole('link', { name: /Úkoly/i }).click();
    await page.waitForURL('**/tasks*');
  });

  test('Should load Tasks page with correct headers', async ({ page }) => {
    // Check for main heading
    await expect(page.getByRole('heading', { name: /Moje úkoly/i })).toBeVisible();
    
    // Check for the add task button
    await expect(page.getByText('+ Přidat úkol')).toBeVisible();
  });

  test('Should open the New Task modal when button is clicked', async ({ page }) => {
    // Click the button to add a new task
    await page.getByText('+ Přidat úkol').click();
    
    // Expect the modal/dialog to appear
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    
    // Check for correct dialog heading
    await expect(dialog.getByRole('heading', { name: /Nový úkol/i })).toBeVisible();
    
    // Close the dialog using the Escape key
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  });
});
