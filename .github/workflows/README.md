# CI/CD

## Workflow: CI

فایل `ci.yml` روی هر **push** و **pull request** به شاخه `main` اجرا می‌شود.

### مراحل

1. **Checkout** – دریافت کد
2. **Setup Node 20** – با کش npm
3. **Install** – `npm ci`
4. **Prisma Generate** – تولید کلاینت
5. **Lint** – `npm run lint`
6. **Test** – `npm run test:run`
7. **Build** – `npm run build`

### نکات

- دیتابیس واقعی در CI استفاده نمی‌شود؛ sitemap در صورت خطای اتصال فقط صفحات ثابت را برمی‌گرداند.
- برای دیپلوی (مثلاً Vercel)، معمولاً به‌صورت خودکار بعد از merge انجام می‌شود.
