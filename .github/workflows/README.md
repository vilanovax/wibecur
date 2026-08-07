# CI/CD

## Workflow: CI

فایل `ci.yml` روی هر **push** و **pull request** به شاخه `main` اجرا می‌شود.

### Jobs

1. **lint-and-test** — lint، unit test، build
2. **e2e** — Playwright با Postgres
3. **lighthouse** — Lighthouse CI روی `/lists`، `/categories/movies` و `/items/[id]` (بعد از lint-and-test)

### Lighthouse

- Config: `lighthouserc.cjs`
- CI از slug **`movies`** استفاده می‌کند (مطابق `prisma/seed-data.json`); در production معمولاً **`/categories/film`** است.
- گزارش HTML/JSON در artifact **`lighthouse-reports`** (۱۴ روز) + جدول خلاصه در GitHub Actions summary
- Accessibility زیر ۰.۹ → **fail**؛ performance/LCP → **warn** (CI را fail نمی‌کند)

**اجرای local** (سرور باید بالا باشد):

```bash
npm run build && PORT=3002 npm run start
# ترمینال دیگر:
npm run lighthouse:ci
```

**Production / slug `film`:**

```bash
LHCI_BASE_URL=https://your-domain LHCI_CATEGORY_PATH=/categories/film npm run lighthouse:prod
```

### مراحل lint-and-test

1. **Checkout** – دریافت کد
2. **Setup Node 20** – با کش npm
3. **Install** – `npm ci`
4. **Prisma Generate** – تولید کلاینت
5. **Lint** – `npm run lint`
6. **Test** – `npm run test:run`
7. **Build** – `npm run build`

### نکات

- دیتابیس واقعی در lint-and-test استفاده نمی‌شود؛ sitemap در صورت خطای اتصال فقط صفحات ثابت را برمی‌گرداند.
- jobهای e2e و lighthouse هر کدام Postgres جدا + `db:seed` دارند.
- برای دیپلوی (مثلاً Vercel)، معمولاً به‌صورت خودکار بعد از merge انجام می‌شود.
