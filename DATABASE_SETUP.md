# راه‌اندازی دیتابیس PostgreSQL

## مراحل انجام‌شده

1. نصب پکیج‌های Prisma و NextAuth
2. ایجاد Prisma Schema
3. ایجاد Prisma Client
4. راه‌اندازی NextAuth
5. ایجاد Seed Script
6. به‌روزرسانی صفحات ادمین

## مراحل باقیمانده

### 1. ایجاد فایل `.env`

در ریشه پروژه فایل `.env` را از روی `.env.example` بساز و مقادیر واقعی را پر کن:

```env
# فقط placeholder — هرگز سکرت واقعی را در docs یا git نگذار
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
DIRECT_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"

NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3003"
```

مقادیر نمونهٔ کامل در [`.env.example`](.env.example) است.

### 2. اتصال به دیتابیس و Migration

```bash
npx prisma generate
npx prisma db push
npm run db:seed
```

### 3. تست اتصال

```bash
npm run db:studio
```

### 4. ورود به پنل ادمین (فقط توسعه)

Seed فقط در محیط غیرپروداکشن ادمین آزمایشی می‌سازد. رمز پیش‌فرض seed **هرگز** در production استفاده نشود؛ بعد از seed در لوکال، رمز را عوض کن.

جزئیات seed: [`prisma/SEED_README.md`](prisma/SEED_README.md)

## فایل‌های مرتبط

- `prisma/schema.prisma` — Schema دیتابیس
- `lib/prisma.ts` — Prisma Client
- `lib/auth.ts` — Helperهای authentication
- `app/api/auth/[...nextauth]/route.ts` — NextAuth
- `prisma/seed.ts` — Seed

## Scripts

```bash
npm run db:push
npm run db:migrate
npm run db:seed
npm run db:studio
```

## نکات امنیتی

- `.env` و `.env*.local` در `.gitignore` هستند — commit نکن
- در production حتماً `NEXTAUTH_SECRET` و پسورد دیتابیس را با مقادیر تصادفی قوی ست کن
- اگر سکرتی زمانی در docs یا git لو رفته، فوراً rotate کن
