/**
 * قرار دادن تصویر Hero برای دسته «کافه و رستوران»
 * تصویر از یک منبع رایگان دانلود و در Liara Object Storage آپلود می‌شود.
 *
 * استفاده:
 *   npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/set-cafe-category-hero.ts
 *
 * پیش‌نیاز: Liara Object Storage باید تنظیم شده باشد.
 */

import { PrismaClient } from '@prisma/client';
import { uploadImageFromUrl } from '../lib/object-storage';

const prisma = new PrismaClient();

// تصویر کافه/رستوران از Unsplash (رایگان، قابل استفاده)
const CAFE_HERO_IMAGE_URL =
  'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=900&q=80';

async function main() {
  console.log('☕ در حال تنظیم تصویر Hero دسته کافه و رستوران...\n');

  const category = await prisma.categories.findUnique({
    where: { slug: 'cafe' },
    select: { id: true, name: true, slug: true, heroImage: true },
  });

  if (!category) {
    console.error('❌ دسته کافه یافت نشد.');
    process.exit(1);
  }

  console.log(`📂 دسته: ${category.name} (${category.slug})`);

  console.log('📤 در حال آپلود تصویر به Liara...');
  const uploadedUrl = await uploadImageFromUrl(CAFE_HERO_IMAGE_URL, 'covers');

  if (!uploadedUrl) {
    console.error('❌ آپلود به Liara ناموفق بود. مطمئن شوید Liara Object Storage تنظیم شده است.');
    process.exit(1);
  }

  console.log('✅ تصویر آپلود شد:', uploadedUrl);

  await prisma.categories.update({
    where: { id: category.id },
    data: { heroImage: uploadedUrl, updatedAt: new Date() },
  });

  console.log('\n✅ heroImage دسته کافه و رستوران به‌روز شد.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
