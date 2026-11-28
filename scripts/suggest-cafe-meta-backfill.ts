/**
 * پیشنهاد / بک‌فیل امن cuisine و area/region برای آیتم‌های کافه.
 * فقط فیلدهای خالی را پر می‌کند؛ موجود را بازنویسی نمی‌کند.
 *
 * Usage:
 *   npx tsx scripts/suggest-cafe-meta-backfill.ts
 *   npx tsx scripts/suggest-cafe-meta-backfill.ts --high-only
 *   npx tsx scripts/suggest-cafe-meta-backfill.ts --apply
 *   npx tsx scripts/suggest-cafe-meta-backfill.ts --apply --high-only
 */

import { Prisma, PrismaClient } from '@prisma/client';
import { supportsCategoryDiscovery } from '../lib/category-discovery/supports';
import {
  cafeMetaNeedsAttention,
  suggestCafeMeta,
} from '../lib/category-discovery/suggest-cafe-meta';
import { normalizeCafeMetadataFields } from '../lib/cafe-metadata';

const prisma = new PrismaClient();

function asMeta(raw: unknown): Record<string, unknown> {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    return raw as Record<string, unknown>;
  }
  return {};
}

async function main() {
  const args = process.argv.slice(2);
  const apply = args.includes('--apply');
  const highOnly = args.includes('--high-only');

  const categories = await prisma.categories.findMany({
    where: { deletedAt: null, isActive: true },
    select: { id: true, slug: true },
  });
  const cafeCats = categories.filter((c) => supportsCategoryDiscovery(c.slug));
  if (cafeCats.length === 0) {
    console.error('no cafe/restaurant category found');
    process.exit(1);
  }

  const items = await prisma.items.findMany({
    where: {
      deletedAt: null,
      lists: {
        deletedAt: null,
        isActive: true,
        isPublic: true,
        categoryId: { in: cafeCats.map((c) => c.id) },
      },
    },
    select: {
      id: true,
      title: true,
      metadata: true,
      lists: { select: { title: true, slug: true } },
    },
    take: 5000,
  });

  let candidates = 0;
  let applied = 0;
  let skippedLow = 0;

  for (const item of items) {
    const rawMeta = asMeta(item.metadata);
    const meta = normalizeCafeMetadataFields(rawMeta);
    const cuisine = typeof meta.cuisine === 'string' ? meta.cuisine : null;
    const area = typeof meta.area === 'string' ? meta.area : null;
    const region = typeof meta.region === 'string' ? meta.region : null;
    const address = typeof meta.address === 'string' ? meta.address : null;

    const need = cafeMetaNeedsAttention({ cuisine, area, region, address });
    if (!need.missingCuisine && !need.missingPlace) continue;

    const suggestion = suggestCafeMeta({
      itemTitle: item.title,
      listTitle: item.lists?.title,
      address,
      existingCuisine: cuisine,
      existingArea: area,
      existingRegion: region,
    });

    if (!suggestion.cuisine && !suggestion.area && !suggestion.region) continue;
    if (highOnly && suggestion.confidence !== 'high') {
      skippedLow += 1;
      continue;
    }

    candidates += 1;
    const patch: Record<string, unknown> = {};
    if (suggestion.cuisine) patch.cuisine = suggestion.cuisine;
    if (suggestion.area) patch.area = suggestion.area;
    if (suggestion.region) patch.region = suggestion.region;

    console.log(
      `${apply ? 'APPLY' : 'DRY'} ${item.title} ← ${JSON.stringify(patch)} (${suggestion.confidence}) [${item.lists?.title ?? ''}]`
    );

    if (!apply) continue;

    const nextMeta = normalizeCafeMetadataFields({
      ...rawMeta,
      ...meta,
      ...patch,
    });
    // preserve non-cafe keys from original
    const merged = { ...rawMeta, ...nextMeta };

    await prisma.items.update({
      where: { id: item.id },
      data: { metadata: merged as Prisma.InputJsonValue },
    });
    applied += 1;
  }

  console.log('');
  console.log(
    `done. candidates=${candidates} applied=${applied} skippedLowConfidence=${skippedLow} mode=${apply ? 'apply' : 'dry-run'}`
  );
  if (!apply && candidates > 0) {
    console.log('To write: npx tsx scripts/suggest-cafe-meta-backfill.ts --apply --high-only');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
