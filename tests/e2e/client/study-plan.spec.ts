import { test, expect } from '@playwright/test';

test.describe('Study Plan Navigation & Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Navigate to Study Plan section using the sidebar
    await page.getByRole('link', { name: /Studijní plán/i }).click();
    await page.waitForURL('**/study');
  });

  test('Should load Study Plan page with correct headers', async ({ page }) => {
    // Check for main heading
    await expect(page.getByRole('heading', { name: /Moje Studijní Plány/i })).toBeVisible();
    
    // Check for the add plan button
    await expect(page.getByText('+ Nový studijní plán')).toBeVisible();
  });

  test('Should open the New Study Plan modal when button is clicked', async ({ page }) => {
    // Click the button to add a new study plan
    await page.getByText('+ Nový studijní plán').click();
    
    // Expect the modal/dialog to appear
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    
    // Check for correct dialog heading
    await expect(dialog.getByRole('heading', { name: /Nový studijní plán/i })).toBeVisible();
    
    // Close the dialog using the Escape key or a cancel button
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  });
});
