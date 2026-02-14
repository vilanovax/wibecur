import { test, expect } from '@playwright/test';

test.describe('ناوبری', () => {
  test('باید به صفحهٔ لیست‌ها برود', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'لیست' }).click();
    await expect(page).toHaveURL(/\/lists/);
    await expect(page).toHaveTitle(/لیست/i);
  });

  test('باید به صفحهٔ ورود برود', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('heading', { name: /ورود/i })).toBeVisible();
  });

  test('مسیر نامعتبر نباید به صفحهٔ اصلی ریدایرکت شود', async ({ page }) => {
    await page.goto('/not-found-page-xyz-12345');
    expect(page.url()).toContain('not-found-page-xyz-12345');
  });
});
