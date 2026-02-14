# Rate Limiting

محدودیت تعداد درخواست‌ها برای APIها با **Upstash Redis** پیاده‌سازی شده است.

## پیکربندی

۱. در [Upstash Console](https://console.upstash.com) یک Redis بساز  
۲. متغیرهای زیر را به `.env` اضافه کن:

```
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxx
```

## محدودیت فعلی

- **۶۰ درخواست در دقیقه** به ازای هر IP برای همهٔ مسیرهای `/api/*`
- در صورت عدم تنظیم متغیرها، rate limiting **غیرفعال** است (اپ بدون محدودیت کار می‌کند)

## پاسخ ۴۲۹

در صورت عبور از حد مجاز:

```json
{
  "error": "تعداد درخواست‌ها زیاد است. لطفاً کمی صبر کنید."
}
```

## تغییر محدودیت

مقدارها در `lib/rate-limit.ts` قابل تنظیم هستند:

```ts
Ratelimit.slidingWindow(60, '1 m')  // 60 درخواست در 1 دقیقه
```
