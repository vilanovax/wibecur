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

## محدودیت‌ها

- **Server Components ناهمگام**: Vitest از async Server Components پشتیبانی نمی‌کند؛ برای آن‌ها از E2E (Playwright/Cypress) استفاده شود.
