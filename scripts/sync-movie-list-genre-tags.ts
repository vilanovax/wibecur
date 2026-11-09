/**
 * تگ‌های لیست‌های فیلم را از metadata.genre / country آیتم‌ها همگام می‌کند.
 * Usage: npx tsx scripts/sync-movie-list-genre-tags.ts
 */

import { PrismaClient } from '@prisma/client';
import { genresFromItemMeta } from '../lib/film-list-genres';

const prisma = new PrismaClient();

async function main() {
  const movies = await prisma.categories.findFirst({
    where: { slug: 'movies', deletedAt: null },
    select: { id: true, name: true },
  });
  if (!movies) {
    console.error('movies category not found');
    process.exit(1);
  }

  const lists = await prisma.lists.findMany({
    where: {
      categoryId: movies.id,
      deletedAt: null,
    },
    select: {
      id: true,
      title: true,
      tags: true,
      items: {
        where: { deletedAt: null },
        select: { metadata: true },
        take: 300,
      },
    },
  });

  let updated = 0;
  for (const list of lists) {
    const tags = new Set<string>();
    for (const item of list.items) {
      const meta =
        item.metadata && typeof item.metadata === 'object' && !Array.isArray(item.metadata)
          ? (item.metadata as Record<string, unknown>)
          : null;
      for (const g of genresFromItemMeta(meta)) tags.add(g);
    }
    const nextTags = [...tags].slice(0, 16);
    const prev = [...(list.tags ?? [])].sort().join('|');
    const next = [...nextTags].sort().join('|');
    if (prev === next) continue;

    await prisma.lists.update({
      where: { id: list.id },
      data: { tags: nextTags },
    });
    updated += 1;
    console.log(`updated ${list.title} → ${nextTags.join('، ')}`);
  }

  console.log(`done. lists=${lists.length} updated=${updated}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
