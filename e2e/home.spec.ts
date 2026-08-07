import { test, expect } from '@playwright/test';

test.describe('صفحهٔ اصلی', () => {
  test('باید بارگذاری شود و المان‌های اصلی را نشان دهد', async ({ page }) => {
    await page.goto('/');
    // عنوان صفحهٔ خانه metadata محلی است («خانه»)، نه فقط برند
    await expect(page).toHaveTitle(/خانه|وایب|WibeCur/i);
    await expect(page.getByRole('navigation', { name: 'منوی اصلی' })).toBeVisible();
  });

  test('باید کنترل جستجو را نمایش دهد', async ({ page }) => {
    await page.goto('/');
    // دسکتاپ: HeaderDesktopSearch — موبایل: HomeSearchBar (هر دو aria-label یکسان)
    await expect(page.getByRole('button', { name: 'باز کردن جستجو' }).first()).toBeVisible();
  });

  test('باید ناوبری اصلی را نمایش دهد', async ({ page }) => {
    await page.goto('/');
    // Desktop Chrome: DesktopTopNav — bottom nav روی lg مخفی است
    await expect(page.getByRole('navigation', { name: 'منوی اصلی' })).toBeVisible();
  });
});
