/**
 * حذف URLهای TMDB از imageUrl و metadata آیتم‌ها
 *
 * استفاده:
 *   npm run fix:tmdb-images
 *   npm run fix:tmdb-images -- --dry-run
 */

import 'dotenv/config';
import { PrismaClient, Prisma } from '@prisma/client';
import { isTmdbImageUrl, stripBlockedItemImageUrl } from '../lib/image-url-policy';
import {
  inferCategorySlugFromTitle,
  normalizeCategorySlug,
  pickCategoryCoverVariant,
} from '../lib/category-cover-images';

const prisma = new PrismaClient();
const dryRun = process.argv.includes('--dry-run');

const METADATA_IMAGE_KEYS = ['posterUrl', 'poster', 'imageUrl', 'coverUrl', 'backdropUrl'] as const;

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

function sanitizeMetadata(metadata: unknown): {
  next: Prisma.InputJsonValue | typeof Prisma.DbNull | undefined;
  changed: boolean;
} {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return { next: undefined, changed: false };
  }

  const record = { ...(metadata as Record<string, unknown>) };
  let changed = false;

  for (const key of METADATA_IMAGE_KEYS) {
    const val = record[key];
    if (typeof val === 'string' && isTmdbImageUrl(val)) {
      delete record[key];
      changed = true;
    }
  }

  if (!changed) return { next: undefined, changed: false };
  return { next: Object.keys(record).length ? (record as Prisma.InputJsonValue) : Prisma.DbNull, changed: true };
}

async function run() {
  console.log('🚫 Replace TMDB item image URLs\n');
  if (dryRun) console.log('   [DRY-RUN] No DB writes.\n');

  const items = await prisma.items.findMany({
    select: {
      id: true,
      title: true,
      imageUrl: true,
      metadata: true,
      lists: { select: { categories: { select: { slug: true } } } },
    },
    orderBy: { createdAt: 'asc' },
  });

  let updated = 0;

  for (const item of items) {
    const categorySlug = item.lists?.categories?.slug ?? null;
    const imageIsTmdb = isTmdbImageUrl(item.imageUrl);
    const { next: nextMetadata, changed: metadataChanged } = sanitizeMetadata(item.metadata);

    if (!imageIsTmdb && !metadataChanged) continue;

    const nextImageUrl = imageIsTmdb
      ? getPlaceholderUrl({ id: item.id, title: item.title, categorySlug })
      : stripBlockedItemImageUrl(item.imageUrl) ?? getPlaceholderUrl({ id: item.id, title: item.title, categorySlug });

    if (dryRun) {
      console.log(`   [dry] ${item.title}`);
      if (imageIsTmdb) console.log(`         image: ${item.imageUrl} → ${nextImageUrl}`);
      if (metadataChanged) console.log('         metadata: removed TMDB image keys');
      updated++;
      continue;
    }

    await prisma.items.update({
      where: { id: item.id },
      data: {
        imageUrl: nextImageUrl,
        ...(metadataChanged ? { metadata: nextMetadata } : {}),
        updatedAt: new Date(),
      },
    });
    console.log(`   ✅ ${item.title}`);
    updated++;
  }

  const suggested = await prisma.suggested_items.findMany({
    select: { id: true, title: true, imageUrl: true },
  });

  for (const row of suggested) {
    if (!isTmdbImageUrl(row.imageUrl)) continue;
    const nextImageUrl = getPlaceholderUrl({
      id: row.id,
      title: row.title,
      categorySlug: inferCategorySlugFromTitle(row.title),
    });

    if (dryRun) {
      console.log(`   [dry] suggested ${row.title} → ${nextImageUrl}`);
      updated++;
      continue;
    }

    await prisma.suggested_items.update({
      where: { id: row.id },
      data: { imageUrl: nextImageUrl, updatedAt: new Date() },
    });
    console.log(`   ✅ suggested ${row.title}`);
    updated++;
  }

  console.log(`\n✅ Done. Updated ${updated} record(s).`);
}

run()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
