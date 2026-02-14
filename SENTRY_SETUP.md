# راهنمای مانیتورینگ خطا با Sentry

Sentry برای ثبت و مانیتورینگ خطاها پیکربندی شده است. بدون DSN، ارسال به Sentry غیرفعال است و اپ بدون مشکل کار می‌کند.

## فعال‌سازی

۱. یک [پروژه Sentry](https://sentry.io/signup/) بسازید.
۲. متغیرهای زیر را به `.env` اضافه کنید:

```env
# Sentry Error Monitoring
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
SENTRY_ORG=your-org-slug
SENTRY_PROJECT=your-project-slug

# اختیاری - برای آپلود source map (stack trace خوانا)
SENTRY_AUTH_TOKEN=your-auth-token
```

۳. برای ساخت و دیپلوی، `SENTRY_AUTH_TOKEN` را در CI/CD (مثلاً Vercel) تنظیم کنید.

## قابلیت‌ها

- **Error Monitoring**: خطاهای client و server به Sentry ارسال می‌شوند
- **Session Replay**: ضبط ۱۰٪ sessionها + ۱۰۰٪ sessionهایی که خطا دارند
- **Performance Tracing**: ۱۰٪ ترافیک در production
- **غیرفعال در صورت نبود DSN**: بدون `NEXT_PUBLIC_SENTRY_DSN` هیچ چیز ارسال نمی‌شود

## ارسال دستی خطا

```ts
import { captureException } from '@/lib/sentry';

try {
  await riskyOperation();
} catch (err) {
  captureException(err, { userId: '123', action: 'checkout' });
  throw err;
}
```
