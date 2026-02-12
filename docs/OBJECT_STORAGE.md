# Object Storage — Liara

همه تصاویر اپ روی **Liara Object Storage** ذخیره می‌شوند.

## تنظیم

۱. در لیارا یک Object Storage بساز و باکت ایجاد کن.  
۲. در اپ: پنل ادمین → تنظیمات → Liara Object Storage را پر کن، یا:

```bash
npx ts-node scripts/setup-liara-storage.ts
```

(Endpoint، Bucket Name، Access Key، Secret Key)

## پوشه‌ها در باکت

| پوشه    | استفاده              |
|---------|----------------------|
| `avatars` | آواتار کاربران       |
| `covers`  | کاور لیست (آپلود کاربر) |
| `lists`   | کاور لیست (ادمین)    |
| `items`   | تصاویر آیتم‌ها       |

## مستندات بیشتر

راهنمای قدم‌به‌قدم: [LIARA_STORAGE_SETUP.md](../LIARA_STORAGE_SETUP.md)
