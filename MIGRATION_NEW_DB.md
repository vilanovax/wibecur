# انتقال به دیتابیس جدید (بدون حذف دادهٔ قبلی)

این راهنما برای تغییر مسیر اپ به دیتابیس جدید **pgsql.feedban.ir** است. دادهٔ دیتابیس قبلی **حذف نمی‌شود**؛ فقط یک کپی به دیتابیس جدید منتقل می‌شود.

---

## اطلاعات اتصال دیتابیس جدید

| پارامتر | مقدار |
|--------|--------|
| **Host** | `pgsql.feedban.ir` |
| **Port** | `5174` |
| **Username** | `postgres` |
| **Database** | `wibe` |
| **Password** | در Navicat یا پنل سرور تنظیم شده — در `.env` بگذار. |

**رشته اتصال (Connection string):**
```
postgresql://postgres:YOUR_PASSWORD@pgsql.feedban.ir:5174/wibe
```

---

## مرحله ۱: خروجی گرفتن از دیتابیس فعلی (دیتا دست‌نخورده می‌ماند)

۱. در `.env` فعلاً همان `DATABASE_URL` دیتابیس **قدیم** را نگه دار.  
۲. از ریشهٔ پروژه اجرا کن:

```bash
npm run db:export
```

خروجی: فایل `prisma/seed-data.json` ساخته می‌شود (کپی از دیتا؛ دیتابیس قدیم تغییری نمی‌کند).

---

## مرحله ۲: ساخت دیتابیس و جداول روی سرور جدید

۱. روی سرور جدید (pgsql.feedban.ir) یک دیتابیس به نام `wibe` بساز (اگر از قبل وجود ندارد).  
۲. در `.env` آدرس را موقتاً به دیتابیس **جدید** تغییر بده:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@pgsql.feedban.ir:5174/wibe"
DIRECT_URL="postgresql://postgres:YOUR_PASSWORD@pgsql.feedban.ir:5174/wibe"
```

۳. ساخت/به‌روزرسانی schema و کلاینت Prisma:

```bash
npx prisma generate
npx prisma db push
```

(در صورت استفاده از migrations به‌جای `db push` از `npx prisma migrate deploy` استفاده کن.)

---

## مرحله ۳: وارد کردن دیتا به دیتابیس جدید

همین `.env` را روی دیتابیس جدید نگه دار و اجرا کن:

```bash
npm run db:seed
```

این دستور از `prisma/seed-data.json` (مرحله ۱) می‌خواند و دیتا را داخل دیتابیس جدید وارد می‌کند.

---

## مرحله ۴: تست اتصال

- اپ را اجرا کن (`npm run dev`) و مطمئن شو همه‌چیز با دیتابیس جدید کار می‌کند.  
- در Navicat به `pgsql.feedban.ir:5174` و دیتابیس `wibe` وصل شو و جداول و داده را چک کن.

---

## نکات امنیتی

- پسورد را **فقط** در `.env` بگذار و `.env` را در git کامیت نکن.  
- در `.env.example` از placeholder مثل `YOUR_PASSWORD` استفاده شده؛ در محیط واقعی پسورد واقعی را فقط در `.env` قرار بده.

---

## اتصال در Navicat

- **Host:** `pgsql.feedban.ir`  
- **Port:** `5174`  
- **User:** `postgres`  
- **Password:** همان پسوردی که در `.env` استفاده می‌کنی  
- **Database:** `wibe`

بعد از این مراحل، مسیر دیتابیس به دیتابیس جدید تغییر کرده و داده‌ها در دیتابیس جدید هستند؛ دیتابیس قبلی دست‌نخورده است.
