/**
 * گزارش خلأ متادیتای کافه/رستوران برای تیم محتوا.
 *
 * Usage:
 *   npx tsx scripts/report-cafe-meta-gaps.ts
 *   npx tsx scripts/report-cafe-meta-gaps.ts --json > tmp/cafe-meta-gaps.json
 *   npx tsx scripts/report-cafe-meta-gaps.ts --brief
 */

import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { PrismaClient } from '@prisma/client';
import { supportsCategoryDiscovery } from '../lib/category-discovery/supports';
import {
  cafeMetaNeedsAttention,
  suggestCafeMeta,
} from '../lib/category-discovery/suggest-cafe-meta';
import { normalizeCafeMetadataFields } from '../lib/cafe-metadata';

const prisma = new PrismaClient();

const CONTENT_BRIEF = `
# دستور کیفیت دیتای کافه/رستوران (تیم محتوا)

## هدف
هر مکان برای سرچ و چیپ‌ها باید داشته باشد:
1. cuisine — نوع غذا/مدل (الزام عملیاتی)
2. area — محله (ترجیحی)
3. region — پهنه اگر محله دقیق نیست (غرب تهران، شمال تهران، …)

## قوانین cuisine
- ۲ تا ۴ برچسب، جدا با " | "
- واژه قابل‌جستجو (سوخاری، برگر، ایتالیایی، …) نه شعار
- اگر تخصص سوخاری است حتماً «سوخاری» در cuisine باشد حتی اگر در عنوان نباشد

خوب: سوخاری | فست‌فود
بد: بهترین / خوشمزه / فقط فست‌فود وقتی تخصص سوخاری است

## قوانین area / region
- area = محله (سعادت‌آباد، ونک)
- region = پهنه (غرب تهران) وقتی محله مبهم است
- «تهران» به‌تنهایی کافی نیست

## چک قبل از انتشار
- [ ] address پر است
- [ ] cuisine حداقل یک برچسب دقیق دارد
- [ ] area یا region مشخص است
- [ ] تخصص واضح در cuisine آمده

## پرامپت برای نویسنده
برای هر مکان: cuisine (2–4 برچسب با |)، area، region، tip کوتاه.
اگر مکان عملاً سوخاری/برگر/... است همان واژه را در cuisine بنویس حتی اگر در نام نیست.
`.trim();

function asMeta(raw: unknown): Record<string, unknown> {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    return raw as Record<string, unknown>;
  }
  return {};
}

async function main() {
  const args = process.argv.slice(2);
  const asJson = args.includes('--json');
  const printBrief = args.includes('--brief');
  const writeOut = args.includes('--write');

  if (printBrief) {
    console.log(CONTENT_BRIEF);
    return;
  }

  const categories = await prisma.categories.findMany({
    where: { deletedAt: null, isActive: true },
    select: { id: true, slug: true, name: true },
  });
  const cafeCats = categories.filter((c) => supportsCategoryDiscovery(c.slug));
  if (cafeCats.length === 0) {
    console.error('no cafe/restaurant category found');
    process.exit(1);
  }

  const categoryIds = cafeCats.map((c) => c.id);
  const items = await prisma.items.findMany({
    where: {
      deletedAt: null,
      lists: {
        deletedAt: null,
        isActive: true,
        isPublic: true,
        categoryId: { in: categoryIds },
      },
    },
    select: {
      id: true,
      title: true,
      metadata: true,
      catalogItemId: true,
      lists: {
        select: {
          id: true,
          title: true,
          slug: true,
          categories: { select: { slug: true, name: true } },
        },
      },
    },
    take: 5000,
  });

  type Row = {
    itemId: string;
    title: string;
    listTitle: string;
    listSlug: string;
    missingCuisine: boolean;
    missingPlace: boolean;
    currentCuisine: string | null;
    currentArea: string | null;
    currentRegion: string | null;
    suggestedCuisine?: string;
    suggestedArea?: string;
    suggestedRegion?: string;
    confidence: string;
  };

  const rows: Row[] = [];
  let missingCuisine = 0;
  let missingPlace = 0;
  let withSuggestion = 0;

  for (const item of items) {
    const meta = normalizeCafeMetadataFields(asMeta(item.metadata));
    const cuisine = typeof meta.cuisine === 'string' ? meta.cuisine : null;
    const area = typeof meta.area === 'string' ? meta.area : null;
    const region = typeof meta.region === 'string' ? meta.region : null;
    const address = typeof meta.address === 'string' ? meta.address : null;
    const need = cafeMetaNeedsAttention({ cuisine, area, region, address });
    if (!need.missingCuisine && !need.missingPlace) continue;

    if (need.missingCuisine) missingCuisine += 1;
    if (need.missingPlace) missingPlace += 1;

    const suggestion = suggestCafeMeta({
      itemTitle: item.title,
      listTitle: item.lists?.title,
      address,
      existingCuisine: cuisine,
      existingArea: area,
      existingRegion: region,
    });

    if (suggestion.cuisine || suggestion.area || suggestion.region) withSuggestion += 1;

    rows.push({
      itemId: item.id,
      title: item.title,
      listTitle: item.lists?.title ?? '',
      listSlug: item.lists?.slug ?? '',
      missingCuisine: need.missingCuisine,
      missingPlace: need.missingPlace,
      currentCuisine: cuisine,
      currentArea: area,
      currentRegion: region,
      suggestedCuisine: suggestion.cuisine,
      suggestedArea: suggestion.area,
      suggestedRegion: suggestion.region,
      confidence: suggestion.confidence,
    });
  }

  const summary = {
    scannedItems: items.length,
    gapItems: rows.length,
    missingCuisine,
    missingPlace,
    withSuggestion,
    categories: cafeCats.map((c) => c.slug),
  };

  if (asJson) {
    console.log(JSON.stringify({ summary, rows }, null, 2));
  } else {
    console.log('=== cafe meta gaps ===');
    console.log(
      `scanned=${summary.scannedItems} gaps=${summary.gapItems} missingCuisine=${missingCuisine} missingPlace=${missingPlace} suggestable=${withSuggestion}`
    );
    console.log('');
    for (const row of rows.slice(0, 40)) {
      const bits = [
        row.missingCuisine ? 'cuisine?' : null,
        row.missingPlace ? 'place?' : null,
        row.suggestedCuisine ? `→cuisine=${row.suggestedCuisine}` : null,
        row.suggestedArea ? `→area=${row.suggestedArea}` : null,
        row.suggestedRegion ? `→region=${row.suggestedRegion}` : null,
        `conf=${row.confidence}`,
      ]
        .filter(Boolean)
        .join(' ');
      console.log(`- ${row.title} [${row.listTitle}] ${bits}`);
    }
    if (rows.length > 40) console.log(`… and ${rows.length - 40} more`);
    console.log('');
    console.log('Content brief: npx tsx scripts/report-cafe-meta-gaps.ts --brief');
    console.log('Backfill dry-run: npx tsx scripts/suggest-cafe-meta-backfill.ts');
  }

  if (writeOut) {
    const dir = join(process.cwd(), 'tmp');
    mkdirSync(dir, { recursive: true });
    const path = join(dir, 'cafe-meta-gaps.json');
    writeFileSync(path, JSON.stringify({ summary, rows }, null, 2), 'utf8');
    console.error(`wrote ${path}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
