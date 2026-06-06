/**
 * ذخیره تنظیمات ParsPack Object Storage در دیتابیس
 *
 * استفاده:
 *   PARSPACK_ENDPOINT=https://c466145.parspack.net \
 *   PARSPACK_BUCKET_NAME=c466145 \
 *   PARSPACK_ACCESS_KEY=... \
 *   PARSPACK_SECRET_KEY=... \
 *   npx tsx scripts/setup-parspack-storage.ts
 */
import 'dotenv/config';
import { updateSettings } from '../lib/settings';
import { testObjectStorageConnection } from '../lib/object-storage';

async function main() {
  const endpoint = process.env.PARSPACK_ENDPOINT?.trim() || 'https://c466145.parspack.net';
  const bucketName = process.env.PARSPACK_BUCKET_NAME?.trim() || 'c466145';
  const accessKey = process.env.PARSPACK_ACCESS_KEY?.trim();
  const secretKey = process.env.PARSPACK_SECRET_KEY?.trim();

  if (!accessKey || !secretKey) {
    console.error('PARSPACK_ACCESS_KEY و PARSPACK_SECRET_KEY الزامی هستند.');
    process.exit(1);
  }

  await updateSettings({
    liaraEndpoint: endpoint,
    liaraBucketName: bucketName,
    liaraAccessKey: accessKey,
    liaraSecretKey: secretKey,
  });

  console.log('✓ تنظیمات ParsPack در دیتابیس ذخیره شد');
  console.log(`  Endpoint: ${endpoint}`);
  console.log(`  Bucket: ${bucketName}`);

  const ok = await testObjectStorageConnection();
  console.log(ok ? '✓ اتصال S3 برقرار است' : '⚠ اتصال S3 تأیید نشد — کلیدها را بررسی کنید');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
