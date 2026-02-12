# Object Storage — MinIO (لوکال) / Liara (پروداکشن)

تمام تصاویر اپ در object storage ذخیره می‌شوند، نه به صورت URL خارجی.

## لوکال (توسعه)

استفاده از **MinIO** در Docker.

### ۱. اجرای سرویس‌ها

```bash
docker-compose up -d
```

MinIO روی `http://localhost:9000` (API) و `http://localhost:9001` (Console) در دسترس است.

### ۲. متغیرهای محیطی (.env)

```env
OBJECT_STORAGE_PROVIDER=minio
MINIO_ENDPOINT=http://localhost:9000
MINIO_PUBLIC_URL=http://localhost:9000
MINIO_BUCKET=wibecur
MINIO_ACCESS_KEY=wibecur
MINIO_SECRET_KEY=wibecur_minio_secret
```

مقادیر بالا با `docker-compose.yml` هماهنگ هستند.

### ۳. Bucket و دسترسی

- Bucket با اولین آپلود خودکار ایجاد می‌شود
- دسترسی public read روی bucket خودکار تنظیم می‌شود

### ۴. MinIO Console

برای مدیریت فایل‌ها: [http://localhost:9001](http://localhost:9001)

- User: `wibecur`
- Password: `wibecur_minio_secret`

---

## پروداکشن (استقرار آنلاین)

استفاده از **Liara Object Storage** یا **Amazon S3**.

### ۱. تنظیم Liara از پنل ادمین

```bash
npx ts-node scripts/setup-liara-storage.ts
```

اطلاعات Object Storage را از [console.liara.ir](https://console.liara.ir) وارد کنید.

### ۲. یا تنظیم با متغیر محیطی

```env
OBJECT_STORAGE_PROVIDER=liara
```

و تنظیم Liara در پنل ادمین → تنظیمات.

---

## ساختار پوشه‌ها در Storage

| پوشه    | استفاده                        |
|---------|---------------------------------|
| `avatars` | آواتار کاربران                 |
| `covers`  | کاور لیست‌ها (user upload)     |
| `lists`   | تصاویر کاور لیست (ادمین)      |
| `items`   | تصاویر آیتم‌ها                 |
| `images`  | پیش‌فرض                        |

---

## مهاجرت به Liara هنگام دیپلوی

۱. `OBJECT_STORAGE_PROVIDER=liara` قرار بده
۲. Liara را از پنل ادمین تنظیم کن
۳. تصاویر موجود در MinIO: با اسکریپت migrate یا دستی به Liara منتقل کن
