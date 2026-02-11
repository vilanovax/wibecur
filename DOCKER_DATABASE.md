# راه‌اندازی دیتابیس با Docker (لوکال)

PostgreSQL داخل Docker با همان دیتای فعلی پروژه.

## پیش‌نیاز

- Docker و Docker Compose نصب و در حال اجرا روی سیستم
- اتصال به دیتابیس فعلی (برای مرحلهٔ خروجی گرفتن)

---

## مرحله ۱: خروجی گرفتن از دیتابیس فعلی (بدون حذف هیچ داده‌ای)

دیتابیس فعلی دست‌نخورده می‌ماند؛ فقط یک کپی از دیتا در فایل ذخیره می‌شود.

1. در `.env` مقدار `DATABASE_URL` را به همان دیتابیس فعلی (مثلاً Liara یا هر سرور دیگر) نگه دار.
2. از ریشهٔ پروژه اجرا کن:

```bash
npm run db:export
```

خروجی: فایل `prisma/seed-data.json` ساخته می‌شود (همهٔ دیتا به‌صورت JSON).

---

## مرحله ۲: بالا آوردن PostgreSQL در Docker

```bash
docker-compose up -d
```

صبر کن تا سرویس سالم شود (چند ثانیه). وضعیت را می‌توانی با `docker-compose ps` چک کنی.

---

## مرحله ۳: تنظیم اتصال به دیتابیس Docker

در `.env` مقدار `DATABASE_URL` را برای دیتابیس Docker بگذار:

```env
DATABASE_URL="postgresql://wibecur:wibecur_local_secret@localhost:5433/wibecur"
```

در صورت استفاده از migrationها، در همان `.env` یا در migrationها:

```env
DIRECT_URL="postgresql://wibecur:wibecur_local_secret@localhost:5433/wibecur"
```

(اگر در پروژه از `DIRECT_URL` استفاده می‌کنی، همین را هم برای اتصال مستقیم Prisma به Docker بگذار.)

---

## مرحله ۴: ساخت جداول و وارد کردن دیتا

```bash
npx prisma generate
npx prisma db push
npm run db:seed
```

- `db push`: ساخت/به‌روزرسانی schema روی دیتابیس Docker.
- `db:seed`: خواندن `prisma/seed-data.json` و پر کردن دیتابیس با همان دیتای مرحلهٔ ۱.

بعد از این، اپ با دیتابیس داخل Docker کار می‌کند و دیتای فعلی منتقل شده است.

---

## دستورات مفید

| دستور | توضیح |
|--------|--------|
| `docker-compose up -d` | بالا آوردن دیتابیس در پس‌زمینه |
| `docker-compose down` | متوقف کردن کانتینر (دیتا روی volume می‌ماند) |
| `docker-compose down -v` | متوقف کردن و **حذف volume** (دیتا پاک می‌شود) |
| `npm run db:studio` | باز کردن Prisma Studio روی دیتابیس فعلی (Docker اگر `.env` را عوض کرده باشی) |

---

## بازگشت به دیتابیس قبلی (مثلاً Liara)

برای اتصال دوباره به دیتابیس قبلی، در `.env` فقط `DATABASE_URL` و در صورت وجود `DIRECT_URL` را به آدرس همان سرور برگردان.

---

## امنیت

- پسورد داخل `docker-compose.yml` فقط برای محیط لوکال است.
- فایل `.env` را در git کامیت نکن و در production از مقادیر امن و جداگانه استفاده کن.
