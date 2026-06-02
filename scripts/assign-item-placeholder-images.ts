/**
 * تصاویر placeholder متنوع برای آیتم‌های بدون poster
 *
 * استفاده:
 *   npm run seed:item-images
 *   npm run seed:item-images -- --dry-run
 *   npm run seed:item-images -- --all
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import {
  inferCategorySlugFromTitle,
  normalizeCategorySlug,
  pickCategoryCoverVariant,
} from '../lib/category-cover-images';
import { isTmdbImageUrl } from '../lib/image-url-policy';

const prisma = new PrismaClient();

const dryRun = process.argv.includes('--dry-run');
const forceAll = process.argv.includes('--all');

const BROKEN_IMAGE_FRAGMENTS = [
  'picsum.photos',
  'placehold.co',
  'via.placeholder.com',
  'placeholder-cover',
  'placeholder-item',
];

function itemNeedsPlaceholderImage(imageUrl: string | null | undefined): boolean {
  if (!imageUrl || typeof imageUrl !== 'string' || !imageUrl.trim()) return true;
  const url = imageUrl.trim();
  if (
    url === '/images/placeholder-cover.svg' ||
    url === '/images/placeholder-item.svg' ||
    url.includes('placeholder-cover')
  ) {
    return true;
  }
  const lower = url.toLowerCase();
  if (BROKEN_IMAGE_FRAGMENTS.some((f) => lower.includes(f))) return true;
  if (url.startsWith('/images/banners/')) return false;
  if (url.startsWith('/')) return false;
  if (isTmdbImageUrl(url)) return true;
  if (url.includes('upload.wikimedia.org')) return false;
  return true;
}

function getPlaceholderUrl(input: {
  id: string;
  title: string;
  categorySlug: string | null;
}): string {
  const slug =
    normalizeCategorySlug(input.categorySlug) ??
    inferCategorySlugFromTitle(input.title) ??
    'default';
  return pickCategoryCoverVariant(slug, input.id);
}

async function run() {
  console.log('🖼️  Assign category placeholder images to items\n');
  if (dryRun) console.log('   [DRY-RUN] No DB writes.\n');
  if (forceAll) console.log('   [--all] Re-assign all items.\n');

  const items = await prisma.items.findMany({
    select: {
      id: true,
      title: true,
      imageUrl: true,
      lists: {
        select: {
          categories: { select: { slug: true } },
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  const candidates = forceAll
    ? items
    : items.filter((item) => itemNeedsPlaceholderImage(item.imageUrl));

  console.log(`📦 ${candidates.length} of ${items.length} items to update\n`);

  let updated = 0;
  let skipped = 0;

  for (const item of candidates) {
    const categorySlug = item.lists?.categories?.slug ?? null;
    const placeholderUrl = getPlaceholderUrl({
      id: item.id,
      title: item.title,
      categorySlug,
    });

    if (item.imageUrl === placeholderUrl) {
      skipped++;
      continue;
    }

    if (dryRun) {
      console.log(`   [dry] ${item.title} → ${placeholderUrl}`);
      updated++;
      continue;
    }

    await prisma.items.update({
      where: { id: item.id },
      data: { imageUrl: placeholderUrl, updatedAt: new Date() },
    });
    console.log(`   ✅ ${item.title} → ${placeholderUrl.split('/').pop()}`);
    updated++;
  }

  console.log('\n— Summary —');
  console.log(`   Updated: ${updated}`);
  console.log(`   Already OK: ${skipped}`);
  console.log('\n✅ Done.');
}

run()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
