import { test, expect } from '@playwright/test';

test.describe('صفحهٔ لیست‌ها', () => {
  test('باید بارگذاری شود', async ({ page }) => {
    await page.goto('/lists');
    await expect(page).toHaveTitle(/لیست/i);
  });

  test('باید محتوای اصلی صفحه را نمایش دهد', async ({ page }) => {
    await page.goto('/lists');
    await expect(page.locator('main')).toBeVisible({ timeout: 10000 });
  });
});
