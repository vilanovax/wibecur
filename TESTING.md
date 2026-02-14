# راهنمای تست

## اجرای تست‌ها

```bash
# اجرای تست‌ها (watch mode)
npm test

# اجرای یک‌بار
npm run test:run
```

## ابزارها

- **Vitest** – Test runner
- **React Testing Library** – تست کامپوننت‌های React
- **jsdom** – محیط شبیه‌سازی شده مرورگر

## ساختار تست‌ها

تست‌ها در کنار فایل‌های مربوطه قرار می‌گیرند:

```
lib/
  seo.ts
  seo.test.ts
  utils/
    slug.ts
    slug.test.ts
components/
  shared/
    ErrorBoundary.tsx
    ErrorBoundary.test.tsx
```

## نوشتن تست جدید

```ts
import { describe, it, expect } from 'vitest';
import { myFunction } from './my-module';

describe('myFunction', () => {
  it('خروجی مورد انتظار', () => {
    expect(myFunction('input')).toBe('output');
  });
});
```

## تست کامپوننت با mock

```tsx
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import MyComponent from './MyComponent';

vi.mock('@/lib/external', () => ({ fetchData: vi.fn() }));

it('نمایش صحیح', () => {
  render(<MyComponent />);
  expect(screen.getByText('متن')).toBeInTheDocument();
});
```

## تست E2E (Playwright)

برای تست سناریوهای کامل در مرورگر:

```bash
# اجرای تست‌های E2E (سرور dev به‌صورت خودکار بالا می‌آید)
npm run test:e2e

# رابط UI برای دیباگ
npm run test:e2e:ui
```

### پیش‌نیاز

- سرور دیتابیس (PostgreSQL) در حال اجرا
- متغیر `DATABASE_URL` تنظیم شده
- پورت ۳۰۰۲ آزاد (اگر dev سرور قبلاً اجرا شده، Playwright از آن استفاده می‌کند)

### عیب‌یابی

- اگر خطای `EADDRINUSE` دیدی، سرور dev را متوقف کن یا پورت دیگری استفاده کن.

### فایل‌های تست

تست‌های E2E در پوشهٔ `e2e/` قرار دارند:

```
e2e/
  home.spec.ts      # صفحهٔ اصلی
  navigation.spec.ts # ناوبری بین صفحات
  lists.spec.ts     # صفحهٔ لیست‌ها
```

---

## محدودیت‌ها

- **Server Components ناهمگام**: Vitest از async Server Components پشتیبانی نمی‌کند؛ برای آن‌ها از E2E (Playwright) استفاده شود.
