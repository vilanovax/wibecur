import { test, expect } from '@playwright/test';

test.describe('ناوبری', () => {
  test('باید به صفحهٔ لیست‌ها برود', async ({ page }) => {
    await page.goto('/');
    await page
      .getByRole('navigation', { name: 'منوی اصلی' })
      .getByRole('link', { name: 'لیست‌ها' })
      .click();
    await expect(page).toHaveURL(/\/lists/);
    await expect(page).toHaveTitle(/لیست/i);
  });

  test('باید به صفحهٔ اکسپلور برود', async ({ page }) => {
    await page.goto('/');
    await page
      .getByRole('navigation', { name: 'منوی اصلی' })
      .getByRole('link', { name: 'اکسپلور' })
      .click();
    await expect(page).toHaveURL(/\/explore/);
    await expect(page.getByRole('heading', { name: /امروز دنبال چه وایبی|اکسپلور/i }).first()).toBeVisible({
      timeout: 15_000,
    });
  });

  test('باید به صفحهٔ ورود برود', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveURL(/\/login/);
    // AuthBrandHeader پیش‌فرض: «وایب»؛ فیلد تلفن مرحلهٔ اول (placeholder چون label هنوز htmlFor ندارد)
    await expect(page.getByRole('heading', { name: /وایب|ورود/i })).toBeVisible();
    await expect(page.getByPlaceholder(/۰۹۱۲/)).toBeVisible();
    await expect(page.getByRole('button', { name: 'ادامه' })).toBeVisible();
  });

  test('مسیر نامعتبر نباید به صفحهٔ اصلی ریدایرکت شود', async ({ page }) => {
    await page.goto('/not-found-page-xyz-12345', { waitUntil: 'domcontentloaded' });
    expect(page.url()).toContain('not-found-page-xyz-12345');
  });

  test('لندینگ قدیمی user-lists به اکسپلور ریدایرکت شود', async ({ request }) => {
    // فقط Location ریدایرکت را چک کن — load کامل /explore در CI گاهی سنگین است
    const res = await request.get('/user-lists', { maxRedirects: 0 });
    expect([301, 302, 303, 307, 308]).toContain(res.status());
    const location = res.headers().location ?? '';
    expect(location).toMatch(/\/explore/);
  });
});
