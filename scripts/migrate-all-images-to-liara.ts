/**
 * Migration یک‌باره: همهٔ تصاویر خارجی (items, lists, users, suggested_items, suggested_lists)
 * را به Liara Object Storage منتقل می‌کند. فقط آپدیت URL بعد از آپلود موفق — بدون حذف دیتا.
 *
 * استفاده:
 *   npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/migrate-all-images-to-liara.ts
 *   npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/migrate-all-images-to-liara.ts --dry-run
 *   npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/migrate-all-images-to-liara.ts --batch=10
 */

import { PrismaClient } from '@prisma/client';
import { ensureImageInLiara } from '../lib/object-storage';
import { getObjectStorageConfig, isOurStorageUrl } from '../lib/object-storage-config';

const prisma = new PrismaClient();
const RETRY_DELAY_MS = 2000;

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const batchArg = args.find((a) => a.startsWith('--batch='));
const batchSize = batchArg ? Math.max(1, parseInt(batchArg.split('=')[1], 10) || 10) : 5;
const delayMs = 300;

function shouldMigrate(url: string | null): url is string {
  return !!url && typeof url === 'string' && url.trim().startsWith('http') && !isOurStorageUrl(url.trim());
}

async function processBatch<T>(
  name: string,
  items: T[],
  getUrl: (item: T) => string | null,
  folder: 'items' | 'avatars' | 'covers' | 'lists',
  updateFn: (item: T, newUrl: string) => Promise<void>
) {
  let success = 0;
  let fail = 0;
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const url = getUrl(item);
    if (!shouldMigrate(url)) continue;
    const label = `${name} ${i + 1}/${items.length}`;
    try {
      let newUrl = await ensureImageInLiara(url!, folder);
      if ((!newUrl || newUrl === url) && !dryRun) {
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
        newUrl = await ensureImageInLiara(url!, folder);
      }
      if (newUrl && newUrl !== url) {
        if (!dryRun) await updateFn(item, newUrl);
        console.log(`   ✅ ${label}: migrated`);
        success++;
      } else {
        console.log(`   ⚠️  ${label}: kept original (upload returned same or null)`);
        if (!newUrl && url) fail++;
      }
    } catch (e: any) {
      console.error(`   ❌ ${label}: ${e?.message || e}`);
      fail++;
    }
    if (i < items.length - 1) await new Promise((r) => setTimeout(r, delayMs));
    if ((i + 1) % batchSize === 0 && i < items.length - 1) {
      console.log(`   … پیشرفت: ${i + 1}/${items.length}`);
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  return { success, fail };
}

async function run() {
  console.log('🚀 Migrate all images to Liara');
  if (dryRun) console.log('   [DRY-RUN] هیچ تغییری در دیتابیس اعمال نمی‌شود.\n');
  console.log(`   Batch size: ${batchSize}, delay: ${delayMs}ms\n`);

  const config = await getObjectStorageConfig();
  if (!config) {
    if (dryRun) {
      console.log('   ⚠️  Liara Object Storage تنظیم نشده است؛ در حالت dry-run آپلود انجام نمی‌شود.\n');
    } else {
      console.error('❌ Liara Object Storage تنظیم نشده است.');
      console.error('   از پنل ادمین → تنظیمات، مقادیر Liara (bucket, endpoint, access key, secret key) را وارد کنید و دوباره اسکریپت را اجرا کنید.\n');
      process.exit(1);
    }
  }

  let totalSuccess = 0;
  let totalFail = 0;

  // --- items (imageUrl) ---
  const items = await prisma.items.findMany({
    where: { imageUrl: { not: null, startsWith: 'http' } },
    select: { id: true, title: true, imageUrl: true },
  });
  const itemsToMigrate = items.filter((i) => shouldMigrate(i.imageUrl));
  console.log(`📦 items: ${itemsToMigrate.length} of ${items.length} with external imageUrl`);
  if (itemsToMigrate.length > 0) {
    const { success, fail } = await processBatch(
      'item',
      itemsToMigrate,
      (i) => i.imageUrl,
      'items',
      async (item, newUrl) => {
        await prisma.items.update({
          where: { id: item.id },
          data: { imageUrl: newUrl, updatedAt: new Date() },
        });
      }
    );
    totalSuccess += success;
    totalFail += fail;
  }

  // --- lists (coverImage) ---
  const lists = await prisma.lists.findMany({
    where: { coverImage: { not: null, startsWith: 'http' } },
    select: { id: true, title: true, coverImage: true },
  });
  const listsToMigrate = lists.filter((l) => shouldMigrate(l.coverImage));
  console.log(`\n📋 lists: ${listsToMigrate.length} of ${lists.length} with external coverImage`);
  if (listsToMigrate.length > 0) {
    const { success, fail } = await processBatch(
      'list',
      listsToMigrate,
      (l) => l.coverImage,
      'covers',
      async (item, newUrl) => {
        await prisma.lists.update({
          where: { id: item.id },
          data: { coverImage: newUrl, updatedAt: new Date() },
        });
      }
    );
    totalSuccess += success;
    totalFail += fail;
  }

  // --- users (image) ---
  const users = await prisma.users.findMany({
    where: { image: { not: null, startsWith: 'http' } },
    select: { id: true, name: true, image: true },
  });
  const usersToMigrate = users.filter((u) => shouldMigrate(u.image));
  console.log(`\n👤 users: ${usersToMigrate.length} of ${users.length} with external image`);
  if (usersToMigrate.length > 0) {
    const { success, fail } = await processBatch(
      'user',
      usersToMigrate,
      (u) => u.image,
      'avatars',
      async (item, newUrl) => {
        await prisma.users.update({
          where: { id: item.id },
          data: { image: newUrl, updatedAt: new Date() },
        });
      }
    );
    totalSuccess += success;
    totalFail += fail;
  }

  // --- suggested_items (imageUrl) ---
  const suggestedItems = await prisma.suggested_items.findMany({
    where: { imageUrl: { not: null, startsWith: 'http' } },
    select: { id: true, title: true, imageUrl: true },
  });
  const suggestedItemsToMigrate = suggestedItems.filter((i) => shouldMigrate(i.imageUrl));
  console.log(`\n💡 suggested_items: ${suggestedItemsToMigrate.length} of ${suggestedItems.length} with external imageUrl`);
  if (suggestedItemsToMigrate.length > 0) {
    const { success, fail } = await processBatch(
      'suggested_item',
      suggestedItemsToMigrate,
      (i) => i.imageUrl,
      'items',
      async (item, newUrl) => {
        await prisma.suggested_items.update({
          where: { id: item.id },
          data: { imageUrl: newUrl },
        });
      }
    );
    totalSuccess += success;
    totalFail += fail;
  }

  // --- suggested_lists (coverImage) ---
  const suggestedLists = await prisma.suggested_lists.findMany({
    where: { coverImage: { not: null, startsWith: 'http' } },
    select: { id: true, title: true, coverImage: true },
  });
  const suggestedListsToMigrate = suggestedLists.filter((l) => shouldMigrate(l.coverImage));
  console.log(`\n💡 suggested_lists: ${suggestedListsToMigrate.length} of ${suggestedLists.length} with external coverImage`);
  if (suggestedListsToMigrate.length > 0) {
    const { success, fail } = await processBatch(
      'suggested_list',
      suggestedListsToMigrate,
      (l) => l.coverImage,
      'covers',
      async (item, newUrl) => {
        await prisma.suggested_lists.update({
          where: { id: item.id },
          data: { coverImage: newUrl },
        });
      }
    );
    totalSuccess += success;
    totalFail += fail;
  }

  console.log('\n' + '='.repeat(50));
  console.log('📈 خلاصه:');
  console.log(`   ✅ موفق: ${totalSuccess}`);
  console.log(`   ❌ ناموفق: ${totalFail}`);
  if (dryRun) {
    console.log('   [DRY-RUN] دیتابیس تغییر نکرد.');
  } else {
    const remaining = await countRemainingExternalUrls();
    if (remaining > 0) {
      console.log(`   ⚠️  هنوز ${remaining} رکورد با URL تصویر خارج از Liara باقی مانده است.`);
      console.log('   لطفاً خطاهای بالا را برطرف کنید (شبکه، دسترسی به URL منبع، تنظیمات Liara) و اسکریپت را دوباره اجرا کنید.\n');
      process.exit(1);
    }
    console.log('   همهٔ تصاویر به Liara منتقل شدند.');
  }
  console.log('✨ تمام.\n');
}

async function countRemainingExternalUrls(): Promise<number> {
  let n = 0;
  const items = await prisma.items.findMany({ where: { imageUrl: { not: null, startsWith: 'http' } }, select: { imageUrl: true } });
  n += items.filter((i) => i.imageUrl && !isOurStorageUrl(i.imageUrl)).length;
  const lists = await prisma.lists.findMany({ where: { coverImage: { not: null, startsWith: 'http' } }, select: { coverImage: true } });
  n += lists.filter((l) => l.coverImage && !isOurStorageUrl(l.coverImage)).length;
  const users = await prisma.users.findMany({ where: { image: { not: null, startsWith: 'http' } }, select: { image: true } });
  n += users.filter((u) => u.image && !isOurStorageUrl(u.image)).length;
  const suggestedItems = await prisma.suggested_items.findMany({ where: { imageUrl: { not: null, startsWith: 'http' } }, select: { imageUrl: true } });
  n += suggestedItems.filter((i) => i.imageUrl && !isOurStorageUrl(i.imageUrl)).length;
  const suggestedLists = await prisma.suggested_lists.findMany({ where: { coverImage: { not: null, startsWith: 'http' } }, select: { coverImage: true } });
  n += suggestedLists.filter((l) => l.coverImage && !isOurStorageUrl(l.coverImage)).length;
  return n;
}

run()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
