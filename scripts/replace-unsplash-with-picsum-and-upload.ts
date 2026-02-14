/**
 * یکسان‌سازی تصاویر: فقط آبجکت استوریج (Liara).
 * - هر رکوردی که تصویر ندارد (null/خالی) یا آدرسش از استوریج ما نیست → تصویر پیش‌فرض
 *   ساخته/آپلود می‌شود و در دیتابیس ذخیره می‌شود.
 * - اگر Liara تنظیم باشد: تصویر در آبجکت استوریج آپلود و آدرس آن در DB ذخیره می‌شود.
 * - اگر Liara نباشد: مسیر placeholder محلی (/images/placeholder-cover.svg) در DB ذخیره می‌شود.
 *
 * استفاده:
 *   npm run replace:unsplash          → فقط رکوردهای بدون تصویر یا با آدرس غیر Liara
 *   npm run replace:unsplash -- --all → همه لیست‌ها و آیتم‌ها را با تصویر رندوم به‌روز کن
 *   npm run replace:unsplash:dry-run
 */

import { PrismaClient } from '@prisma/client';
import sharp from 'sharp';
import { uploadImageFromUrl, uploadImageBuffer } from '../lib/object-storage';
import { getObjectStorageConfig, isOurStorageUrl } from '../lib/object-storage-config';

const prisma = new PrismaClient();

const DRY_RUN = process.argv.includes('--dry-run');
/** با --all همه رکوردها (حتی با تصویر Liara) با تصویر رندوم جایگزین می‌شوند */
const FORCE_ALL = process.argv.includes('--all');

/** آیا این URL باید جایگزین شود؟ (هر چیزی غیر از آبجکت استوریج خودمان) */
function shouldReplaceImageUrl(url: string | null): boolean {
  if (!url || typeof url !== 'string' || !url.trim()) return false;
  return !isOurStorageUrl(url.trim());
}

/** آیا این رکورد تصویر ندارد یا تصویرش از استوریج ما نیست؟ (خالی، null، یا جایگزین‌نیاز) */
function needsDefaultOrReplace(url: string | null): boolean {
  if (url == null || typeof url !== 'string') return true;
  const t = url.trim();
  if (!t) return true;
  return !isOurStorageUrl(t);
}

/** تصویر جایگزین از Picsum با seed ثابت برای هر رکورد (تنوع + تکرارپذیری) */
function getPicsumUrl(recordId: string, folder: 'covers' | 'items' | 'avatars'): string {
  const seed = recordId.replace(/-/g, '').slice(0, 8) || '1';
  if (folder === 'avatars') {
    return `https://picsum.photos/seed/${seed}/200/200`;
  }
  if (folder === 'items') {
    return `https://picsum.photos/seed/${seed}/400/400`;
  }
  return `https://picsum.photos/seed/${seed}/400/200`;
}

/** جایگزین: placehold.co برای وقتی Picsum 403 می‌دهد (رنگ بر اساس id) */
function getPlaceholdUrl(recordId: string, folder: 'covers' | 'items' | 'avatars'): string {
  const hash = recordId.split('').reduce((a, c) => ((a << 5) - a + c.charCodeAt(0)) | 0, 0);
  const hue = Math.abs(hash % 360);
  const bg = encodeURIComponent(`hsl(${hue}, 45%, 75%)`);
  if (folder === 'avatars') return `https://placehold.co/200x200/${bg}/png?text=+`;
  if (folder === 'items') return `https://placehold.co/400x400/${bg}/png?text=+`;
  return `https://placehold.co/400x200/${bg}/png?text=+`;
}

/** آپلود تصویر جایگزین: اول Picsum، سپس placehold.co، در نهایت placeholder با sharp */
async function uploadReplacementImage(
  recordId: string,
  folder: 'covers' | 'items' | 'avatars'
): Promise<string | null> {
  const folderName = folder === 'covers' ? 'covers' : folder === 'avatars' ? 'avatars' : 'items';
  let uploaded = await uploadImageFromUrl(getPicsumUrl(recordId, folder), folderName);
  if (uploaded) return uploaded;
  uploaded = await uploadImageFromUrl(getPlaceholdUrl(recordId, folder), folderName);
  if (uploaded) return uploaded;

  const [w, h] = folder === 'avatars' ? [200, 200] : folder === 'items' ? [400, 400] : [400, 200];
  const buffer = await sharp({
    create: { width: w, height: h, channels: 3, background: { r: 229, g: 231, b: 235 } },
  })
    .png()
    .toBuffer();
  return uploadImageBuffer(buffer, 'image/png', folderName);
}

/** وقتی Liara تنظیم نشده، از placeholder محلی استفاده می‌کنیم (بدون آپلود) */
const LOCAL_PLACEHOLDER_COVER = '/images/placeholder-cover.svg';
const LOCAL_PLACEHOLDER_ITEM = '/images/placeholder-cover.svg';
const LOCAL_PLACEHOLDER_AVATAR = '/images/placeholder-cover.svg';

async function run() {
  console.log(FORCE_ALL ? '🔄 به‌روزرسانی همه تصاویر با تصویر رندوم (لیست‌ها، آیتم‌ها، …)' : '🔄 یکسان‌سازی تصاویر: فقط آبجکت استوریج (جایگزینی هر آدرس غیر از Liara)');
  if (DRY_RUN) console.log('   [DRY-RUN] دیتابیس به‌روزرسانی نمی‌شود.\n');
  if (FORCE_ALL) console.log('   [--all] همه رکوردها به‌روزرسانی می‌شوند.\n');

  const config = await getObjectStorageConfig();
  const useLocalPlaceholder = !config;
  if (useLocalPlaceholder && !DRY_RUN) {
    console.log('   ⚠️  Liara تنظیم نشده → استفاده از placeholder محلی (/images/placeholder-cover.svg)\n');
  }

  let totalDone = 0;
  let totalFail = 0;

  async function getReplacementUrl(recordId: string, folder: 'covers' | 'items' | 'avatars'): Promise<string | null> {
    if (useLocalPlaceholder) {
      return folder === 'items' ? LOCAL_PLACEHOLDER_ITEM : folder === 'avatars' ? LOCAL_PLACEHOLDER_AVATAR : LOCAL_PLACEHOLDER_COVER;
    }
    return uploadReplacementImage(recordId, folder);
  }

  // --- lists (coverImage) ---
  const lists = await prisma.lists.findMany({
    select: { id: true, title: true, coverImage: true },
  });
  const listsToReplace = FORCE_ALL ? lists : lists.filter((l) => needsDefaultOrReplace(l.coverImage));
  console.log(`\n📋 lists: ${listsToReplace.length} از ${lists.length}${FORCE_ALL ? ' (همه)' : ' بدون تصویر یا با آدرس غیر از استوریج'}`);

  for (const list of listsToReplace) {
    try {
      if (!DRY_RUN) {
        const newUrl = await getReplacementUrl(list.id, 'covers');
        if (newUrl) {
          await prisma.lists.update({
            where: { id: list.id },
            data: { coverImage: newUrl, updatedAt: new Date() },
          });
          console.log(`   ✅ list ${list.id.slice(0, 8)}... → Liara`);
          totalDone++;
        } else {
          console.log(`   ⚠️  list ${list.id.slice(0, 8)}... آپلود ناموفق`);
          totalFail++;
        }
      } else {
        console.log(`   [dry] list ${list.id.slice(0, 8)}... → Picsum/placeholder`);
        totalDone++;
      }
    } catch (e: any) {
      console.error(`   ❌ list ${list.id}:`, e?.message || e);
      totalFail++;
    }
    await new Promise((r) => setTimeout(r, 400));
  }

  // --- items (imageUrl) ---
  const items = await prisma.items.findMany({
    select: { id: true, title: true, imageUrl: true },
  });
  const itemsToReplace = FORCE_ALL ? items : items.filter((i) => needsDefaultOrReplace(i.imageUrl));
  console.log(`\n📦 items: ${itemsToReplace.length} از ${items.length}${FORCE_ALL ? ' (همه)' : ' بدون تصویر یا با آدرس غیر از استوریج'}`);

  for (const item of itemsToReplace) {
    try {
      if (!DRY_RUN) {
        const newUrl = await getReplacementUrl(item.id, 'items');
        if (newUrl) {
          await prisma.items.update({
            where: { id: item.id },
            data: { imageUrl: newUrl, updatedAt: new Date() },
          });
          console.log(`   ✅ item ${item.id.slice(0, 8)}... → Liara`);
          totalDone++;
        } else {
          console.log(`   ⚠️  item ${item.id.slice(0, 8)}... آپلود ناموفق`);
          totalFail++;
        }
      } else {
        console.log(`   [dry] item ${item.id.slice(0, 8)}... → Picsum/placeholder`);
        totalDone++;
      }
    } catch (e: any) {
      console.error(`   ❌ item ${item.id}:`, e?.message || e);
      totalFail++;
    }
    await new Promise((r) => setTimeout(r, 400));
  }

  // --- users (image) ---
  const users = await prisma.users.findMany({
    select: { id: true, name: true, image: true },
  });
  const usersToReplace = FORCE_ALL ? users : users.filter((u) => needsDefaultOrReplace(u.image));
  console.log(`\n👤 users: ${usersToReplace.length} از ${users.length}${FORCE_ALL ? ' (همه)' : ' بدون تصویر یا با آدرس غیر از استوریج'}`);

  for (const user of usersToReplace) {
    try {
      if (!DRY_RUN) {
        const newUrl = await getReplacementUrl(user.id, 'avatars');
        if (newUrl) {
          await prisma.users.update({
            where: { id: user.id },
            data: { image: newUrl, updatedAt: new Date() },
          });
          console.log(`   ✅ user ${user.id.slice(0, 8)}... → Liara`);
          totalDone++;
        } else {
          console.log(`   ⚠️  user ${user.id.slice(0, 8)}... آپلود ناموفق`);
          totalFail++;
        }
      } else {
        console.log(`   [dry] user ${user.id.slice(0, 8)}... → Picsum/placeholder`);
        totalDone++;
      }
    } catch (e: any) {
      console.error(`   ❌ user ${user.id}:`, e?.message || e);
      totalFail++;
    }
    await new Promise((r) => setTimeout(r, 400));
  }

  // --- suggested_items (imageUrl) ---
  const suggestedItems = await prisma.suggested_items.findMany({
    select: { id: true, title: true, imageUrl: true },
  });
  const suggestedItemsToReplace = FORCE_ALL ? suggestedItems : suggestedItems.filter((i) => needsDefaultOrReplace(i.imageUrl));
  console.log(`\n💡 suggested_items: ${suggestedItemsToReplace.length} از ${suggestedItems.length}${FORCE_ALL ? ' (همه)' : ' بدون تصویر یا با آدرس غیر از استوریج'}`);

  for (const si of suggestedItemsToReplace) {
    try {
      if (!DRY_RUN) {
        const newUrl = await getReplacementUrl(si.id, 'items');
        if (newUrl) {
          await prisma.suggested_items.update({
            where: { id: si.id },
            data: { imageUrl: newUrl, updatedAt: new Date() },
          });
          console.log(`   ✅ suggested_item ${si.id.slice(0, 8)}... → Liara`);
          totalDone++;
        } else {
          console.log(`   ⚠️  suggested_item ${si.id.slice(0, 8)}... آپلود ناموفق`);
          totalFail++;
        }
      } else {
        console.log(`   [dry] suggested_item ${si.id.slice(0, 8)}... → Picsum/placeholder`);
        totalDone++;
      }
    } catch (e: any) {
      console.error(`   ❌ suggested_item ${si.id}:`, e?.message || e);
      totalFail++;
    }
    await new Promise((r) => setTimeout(r, 400));
  }

  // --- suggested_lists (coverImage) ---
  const suggestedLists = await prisma.suggested_lists.findMany({
    select: { id: true, title: true, coverImage: true },
  });
  const suggestedListsToReplace = FORCE_ALL ? suggestedLists : suggestedLists.filter((l) => needsDefaultOrReplace(l.coverImage));
  console.log(`\n💡 suggested_lists: ${suggestedListsToReplace.length} از ${suggestedLists.length}${FORCE_ALL ? ' (همه)' : ' بدون تصویر یا با آدرس غیر از استوریج'}`);

  for (const sl of suggestedListsToReplace) {
    try {
      if (!DRY_RUN) {
        const newUrl = await getReplacementUrl(sl.id, 'covers');
        if (newUrl) {
          await prisma.suggested_lists.update({
            where: { id: sl.id },
            data: { coverImage: newUrl, updatedAt: new Date() },
          });
          console.log(`   ✅ suggested_list ${sl.id.slice(0, 8)}... → Liara`);
          totalDone++;
        } else {
          console.log(`   ⚠️  suggested_list ${sl.id.slice(0, 8)}... آپلود ناموفق`);
          totalFail++;
        }
      } else {
        console.log(`   [dry] suggested_list ${sl.id.slice(0, 8)}... → Picsum/placeholder`);
        totalDone++;
      }
    } catch (e: any) {
      console.error(`   ❌ suggested_list ${sl.id}:`, e?.message || e);
      totalFail++;
    }
    await new Promise((r) => setTimeout(r, 400));
  }

  console.log('\n' + '='.repeat(50));
  console.log('📈 خلاصه:');
  console.log(`   ✅ انجام‌شده: ${totalDone}`);
  console.log(`   ❌ ناموفق: ${totalFail}`);
  if (DRY_RUN) {
    console.log('   [DRY-RUN] برای اعمال واقعی، بدون --dry-run اجرا کنید.');
  }
  console.log('✨ تمام.\n');
}

run()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
