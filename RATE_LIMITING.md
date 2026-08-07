# Rate Limiting

محدودیت IP/API مبتنی بر Redis/Upstash **در حال حاضر غیرفعال** است (`lib/rate-limit.ts` همیشه allow می‌کند).

## محدودیت‌های فعال

- **کامنت:** فاصله زمانی بین کامنت‌ها از تنظیمات ادمین (`rateLimitMinutes`) و دیتابیس
- **ضداسپم کامنت:** `lib/comment-antispan.ts` (بدون Redis)

## فعال‌سازی مجدد (اختیاری)

برای rate limit سراسری API در آینده می‌توان Upstash یا Redis لیارا را دوباره وصل کرد.
