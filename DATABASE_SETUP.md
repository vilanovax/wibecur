# راه‌اندازی دیتابیس Liara PostgreSQL

## ✅ مراحل انجام شده

1. ✅ نصب پکیج‌های Prisma و NextAuth
2. ✅ ایجاد Prisma Schema
3. ✅ ایجاد Prisma Client
4. ✅ راه‌اندازی NextAuth
5. ✅ ایجاد Seed Script
6. ✅ به‌روزرسانی صفحات ادمین

## 📝 مراحل باقیمانده

### 1. ایجاد فایل `.env.local`

در ریشه پروژه فایل `.env.local` را ایجاد کنید و محتوای زیر را اضافه کنید:

```env
# Liara PostgreSQL Database
DATABASE_URL="postgresql://root:AjsM48P30hBDC0GwFayWVjrj@vinson.liara.cloud:34870/postgres"

# For Prisma migrations
DIRECT_URL="postgresql://root:AjsM48P30hBDC0GwFayWVjrj@vinson.liara.cloud:34870/postgres?schema=public"

# NextAuth Secret
NEXTAUTH_SECRET="wibecur-secret-key-change-in-production-2025"
NEXTAUTH_URL="http://localhost:3000"
```

### 2. اتصال به دیتابیس و Migration

```bash
# Generate Prisma Client
npx prisma generate

# Push schema to database
npx prisma db push

# Run seed to create admin user and categories
npm run db:seed
```

### 3. تست اتصال

```bash
# Open Prisma Studio (GUI for database)
npm run db:studio
```

### 4. ورود به پنل ادمین

- ایمیل: `admin@listhub.ir`
- رمز عبور: `admin123`

## 📁 فایل‌های ایجاد شده

- `prisma/schema.prisma` - Schema دیتابیس
- `lib/prisma.ts` - Prisma Client instance
- `lib/auth.ts` - Helper functions برای authentication
- `app/api/auth/[...nextauth]/route.ts` - NextAuth route handler
- `prisma/seed.ts` - Seed script برای ایجاد داده‌های اولیه
- `app/admin/dashboard/page.tsx` - Dashboard با داده‌های واقعی
- `app/admin/categories/page.tsx` - مدیریت دسته‌بندی‌ها
- `app/admin/lists/page.tsx` - مدیریت لیست‌ها

## 🔧 Scripts موجود

```bash
npm run db:push      # Push schema to database
npm run db:migrate   # Create migration
npm run db:seed      # Run seed script
npm run db:studio    # Open Prisma Studio
```

## 🎯 مراحل بعدی

1. ایجاد صفحه Login
2. ایجاد فرم‌های Create/Edit برای Categories
3. ایجاد فرم‌های Create/Edit برای Lists
4. اضافه کردن Image Upload
5. اضافه کردن Search و Filter

## ⚠️ نکات مهم

- فایل `.env.local` را به `.gitignore` اضافه کنید (قبلاً اضافه شده)
- در production، `NEXTAUTH_SECRET` را تغییر دهید
- برای امنیت بیشتر، از environment variables در production استفاده کنید

