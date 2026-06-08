/**
 * پر کردن metadata.entryKind برای آیتم‌های قدیمی
 * npx tsx scripts/backfill-entry-kind.ts
 * npx tsx scripts/backfill-entry-kind.ts --dry-run
 */

import { prisma } from '../lib/prisma';
import type { Prisma } from '@prisma/client';
import {
  isMixedListCategory,
  parseEntryKind,
  type EntryKind,
} from '../lib/list-entry';

const dryRun = process.argv.includes('--dry-run');

function inferEntryKind(item: {
  catalogItemId: string | null;
  externalUrl: string | null;
  imageUrl: string | null;
  metadata: unknown;
  listCategorySlug: string | null;
}): EntryKind | null {
  const meta =
    item.metadata != null && typeof item.metadata === 'object' && !Array.isArray(item.metadata)
      ? (item.metadata as Record<string, unknown>)
      : {};

  const existing = parseEntryKind(meta.entryKind);
  if (existing) return null;

  if (item.catalogItemId) return 'catalog_ref';

  if (!isMixedListCategory(item.listCategorySlug)) return null;

  if (typeof meta.factType === 'string' && meta.factType.trim()) return 'fact';
  if (item.externalUrl?.trim() && !item.imageUrl?.trim()) return 'link';

  return 'tip';
}

async function main() {
  const items = await prisma.items.findMany({
    select: {
      id: true,
      catalogItemId: true,
      externalUrl: true,
      imageUrl: true,
      metadata: true,
      lists: { select: { categories: { select: { slug: true } } } },
    },
    orderBy: { createdAt: 'asc' },
  });

  let updated = 0;
  let skipped = 0;

  for (const item of items) {
    const listCategorySlug = item.lists?.categories?.slug ?? null;
    const kind = inferEntryKind({
      catalogItemId: item.catalogItemId,
      externalUrl: item.externalUrl,
      imageUrl: item.imageUrl,
      metadata: item.metadata,
      listCategorySlug,
    });

    if (!kind) {
      skipped++;
      continue;
    }

    const meta =
      item.metadata != null && typeof item.metadata === 'object' && !Array.isArray(item.metadata)
        ? { ...(item.metadata as Record<string, unknown>) }
        : {};

    meta.entryKind = kind;
    if (kind === 'catalog_ref' && listCategorySlug && !meta.sourceCategorySlug) {
      meta.sourceCategorySlug = listCategorySlug;
    }

    if (dryRun) {
      console.log(`[dry-run] ${item.id} → entryKind=${kind}`);
    } else {
      await prisma.items.update({
        where: { id: item.id },
        data: { metadata: meta as Prisma.InputJsonValue, updatedAt: new Date() },
      });
    }
    updated++;
  }

  console.log(
    dryRun
      ? `dry-run: ${updated} آیتم نیاز به backfill · ${skipped} رد شد`
      : `انجام شد: ${updated} آیتم به‌روز · ${skipped} بدون تغییر`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
