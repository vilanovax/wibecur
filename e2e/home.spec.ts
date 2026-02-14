import { test, expect } from '@playwright/test';

test.describe('صفحهٔ اصلی', () => {
  test('باید بارگذاری شود و المان‌های اصلی را نشان دهد', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/وایب|WibeCur/i);
  });

  test('باید نوار جستجو را نمایش دهد', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByPlaceholder(/فیلم|جستجو/i)).toBeVisible();
  });

  test('باید ناوبری پایین را نمایش دهد', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('navigation')).toBeVisible();
  });
});
