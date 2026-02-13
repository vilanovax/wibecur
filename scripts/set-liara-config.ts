/**
 * ذخیره تنظیمات Liara Object Storage در دیتابیس از روی متغیرهای محیطی.
 * کلیدها را در .env قرار بدهید (هیچ‌وقت در کد ننویسید).
 *
 * استفاده:
 *   LIARA_BUCKET_NAME=wibe \
 *   LIARA_ENDPOINT=https://storage.c2.liara.space \
 *   LIARA_ACCESS_KEY=... \
 *   LIARA_SECRET_KEY=... \
 *   npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/set-liara-config.ts
 *
 * یا مقادیر را در .env بگذارید و فقط اجرا کنید:
 *   npm run set-liara-config
 */

require('dotenv').config();

const { updateSettings } = require('../lib/settings');

async function setLiaraConfig() {
  const bucketName = process.env.LIARA_BUCKET_NAME?.trim();
  const endpoint = process.env.LIARA_ENDPOINT?.trim();
  const accessKey = process.env.LIARA_ACCESS_KEY?.trim();
  const secretKey = process.env.LIARA_SECRET_KEY?.trim();

  if (!bucketName || !endpoint || !accessKey || !secretKey) {
    console.error('❌ برای اجرا این متغیرهای محیطی را در .env تنظیم کنید:');
    console.error('   LIARA_BUCKET_NAME');
    console.error('   LIARA_ENDPOINT   (مثال: https://storage.c2.liara.space)');
    console.error('   LIARA_ACCESS_KEY');
    console.error('   LIARA_SECRET_KEY');
    process.exit(1);
  }

  try {
    console.log('در حال ذخیره تنظیمات Liara در دیتابیس...\n');

    await updateSettings({
      liaraBucketName: bucketName,
      liaraEndpoint: endpoint,
      liaraAccessKey: accessKey,
      liaraSecretKey: secretKey,
    });

    console.log('✅ Liara Object Storage با موفقیت در دیتابیس ذخیره شد.');
    console.log('   Bucket:', bucketName);
    console.log('   Endpoint:', endpoint);
    console.log('\nاز این به بعد آپلود تصاویر به Liara انجام می‌شود.');
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ خطا:', error?.message || error);
    process.exit(1);
  }
}

setLiaraConfig();
