# چک‌لیست Production – وایب‌کر

قبل از دیپلوی، موارد زیر را بررسی و تنظیم کن.

---

## ۱. متغیرهای محیطی (Environment Variables)

### الزامی

| متغیر | توضیح | مثال |
|-------|-------|------|
| `DATABASE_URL` | اتصال PostgreSQL | `postgresql://user:pass@host:5432/wibecur` |
| `DIRECT_URL` | اتصال مستقیم (مایگریشن) | همان مقدار یا جدا |
| `NEXTAUTH_SECRET` | کلید امضا JWT — حداقل ۳۲ کاراکتر رندوم | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | آدرس پایه اپ | `https://wibecur.ir` |
| `ENCRYPTION_KEY` | کلید رمزنگاری API keys در دیتابیس — ۳۲ کاراکتر | ثابت و رندوم |

### توصیه‌شده

| متغیر | توضیح |
|-------|-------|
| `NEXT_PUBLIC_APP_URL` | آدرس سایت (برای SEO، OG images) |
| `NEXT_PUBLIC_SENTRY_DSN` | DSN پروژه Sentry |
| `SENTRY_ORG` | سازمان Sentry |
| `SENTRY_PROJECT` | پروژه Sentry |
| `SENTRY_AUTH_TOKEN` | توکن برای آپلود source map (در CI/CD) |

### اختیاری

| متغیر | توضیح |
|-------|-------|
| `NEXT_PUBLIC_SKIP_EXTERNAL_IMAGES` | `true` = غیرفعال کردن تصاویر خارجی |
| `CRON_SECRET` / `REVALIDATE_SECRET` | برای cron های `/api/cron/*` |
| `OMDB_API_KEY` | API OMDB (ادمین – جستجوی فیلم) |
| `PORT` | پورت سرور (پیش‌فرض: 3000) |

### نکات امنیتی

- [ ] هیچ رمز/کلید واقعی در git commit نباشد
- [ ] `NEXTAUTH_SECRET` در production متفاوت از development باشد
- [ ] `ENCRYPTION_KEY` ثابت بماند (تغییر آن کلیدهای ذخیره‌شده را غیرقابل استفاده می‌کند)

---

## ۲. دیتابیس

- [ ] PostgreSQL در دسترس و سالم است
- [ ] مایگریشن‌ها اجرا شده: `npx prisma migrate deploy`
- [ ] اگر لازم است: `prisma db push` (فقط برای dev/staging)
- [ ] Connection pool مناسب (مثلاً PgBouncer برای ترافیک بالا)
- [ ] پشتیبان‌گیری خودکار تنظیم شده

---

## ۳. Object Storage (Liara)

تصاویر از Liara Object Storage سرو می‌شوند. تنظیمات از **دیتابیس** (جدول settings) خوانده می‌شود.

- [ ] باکیت در Liara ساخته شده
- [ ] از پنل ادمین → تنظیمات، Liara پیکربندی شده
- [ ] یا اسکریپت `npm run set-liara-config` با env اجرا شده

متغیرهای `.env` برای اسکریپت:

```
LIARA_BUCKET_NAME=
LIARA_ENDPOINT=
LIARA_ACCESS_KEY=
LIARA_SECRET_KEY=
```

---

## ۴. Sentry

- [ ] پروژه Sentry ساخته شده
- [ ] `NEXT_PUBLIC_SENTRY_DSN` تنظیم شده
- [ ] در CI/CD، `SENTRY_AUTH_TOKEN` برای آپلود source map تنظیم شده

بدون DSN، ارسال رویداد به Sentry انجام نمی‌شود و اپ عادی کار می‌کند.

---

## ۵. Rate limiting

برای محدود کردن سوءاستفاده از API، Upstash Redis توصیه می‌شود:

- [ ] در [Upstash Console](https://console.upstash.com) یک Redis ساخته شده
- [ ] `UPSTASH_REDIS_REST_URL` و `UPSTASH_REDIS_REST_TOKEN` در env تنظیم شده
- [ ] بدون این متغیرها rate limiting غیرفعال است (۶۰ درخواست/دقیقه به ازای هر IP)

---

## ۶. آنالیتیکس (Vercel Analytics)

- [ ] روی Vercel دیپلوی شده (آنالیتیکس فقط روی Vercel کار می‌کند)
- [ ] در Dashboard → Analytics، آمار صفحات و eventهای سفارشی قابل مشاهده است

---

## ۷. سرویس‌های جانبی (پنل ادمین)

از **تنظیمات ادمین** در دیتابیس خوانده می‌شوند:

| سرویس | کاربرد |
|-------|--------|
| OMDB API | جستجو و اطلاعات فیلم |
| TMDB API | داده سینمایی |
| OpenAI | توضیح خودکار آیتم |
| Google API | جستجوی تصویر |

- [ ] در صورت نیاز، API keyها در پنل ادمین ذخیره شده‌اند

---

## ۸. تست قبل از دیپلوی

```bash
# لینت
npm run lint

# تست‌های واحد
npm run test:run

# تست‌های E2E (نیاز به DB و پورت ۳۰۰۲ آزاد)
npm run test:e2e

# بیلد
npm run build
```

- [ ] همه بدون خطا اجرا می‌شوند

---

## ۹. بررسی عملکرد

- [ ] لاگین/ثبت‌نام
- [ ] بارگذاری لیست‌ها و آیتم‌ها
- [ ] آپلود تصویر
- [ ] ذخیره/بوکمارک
- [ ] کامنت‌ها

---

## ۱۰. محیط Staging (اختیاری)

برای تست قبل از production:

- [ ] دیتابیس جدا برای staging
- [ ] `NEXTAUTH_URL` و `NEXT_PUBLIC_APP_URL` مربوط به staging
- [ ] Sentry environment به `staging` تنظیم شود

---

## ۱۱. دسترس‌پذیری

- [ ] Skip link و focus قابل مشاهده کار می‌کنند
- [ ] ARIA و labelها برای دکمه‌ها و فرم‌ها تنظیم شده‌اند
- [ ] فایل `ACCESSIBILITY.md` برای راهنمای کامل

---

## ۱۲. CI/CD

GitHub Actions در `.github/workflows/ci.yml` پیکربندی شده:

- [ ] روی هر push و PR به `main` اجرا می‌شود
- [ ] Lint → Test → Build
- [ ] در صورت شکست، merge یا deploy متوقف می‌شود

---

## فایل مرجع

فایل `.env.example` را کپی کن و مقادیر واقعی را پر کن:

```bash
cp .env.example .env
# سپس .env را ویرایش کن
```
