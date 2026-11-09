/**
 * جایگاه‌های یتیم / ناسازگار را گزارش می‌کند.
 *
 * اجرا:
 *   npx tsx scripts/audit-orphan-placements.ts
 *   npx tsx scripts/audit-orphan-placements.ts --fix=coherence
 */

import { prisma } from '../lib/prisma';

async function main() {
  const titleFilter = process.argv
    .find((a) => a.startsWith('--title='))
    ?.slice('--title='.length)
    ?.trim();

  const softDeletedOnLiveLists = await prisma.items.findMany({
    where: {
      deletedAt: { not: null },
      lists: { deletedAt: null, isActive: true, isPublic: true },
      ...(titleFilter
        ? { title: { contains: titleFilter, mode: 'insensitive' as const } }
        : {}),
    },
    select: {
      id: true,
      title: true,
      deletedAt: true,
      catalogItemId: true,
      listId: true,
      lists: { select: { id: true, title: true, slug: true, isPublic: true, isActive: true } },
    },
    take: 100,
  });

  const liveOnHiddenLists = await prisma.items.findMany({
    where: {
      deletedAt: null,
      OR: [
        { lists: { deletedAt: { not: null } } },
        { lists: { isActive: false } },
        { lists: { isPublic: false } },
      ],
      ...(titleFilter
        ? { title: { contains: titleFilter, mode: 'insensitive' as const } }
        : {}),
    },
    select: {
      id: true,
      title: true,
      catalogItemId: true,
      listId: true,
      lists: {
        select: {
          id: true,
          title: true,
          slug: true,
          isPublic: true,
          isActive: true,
          deletedAt: true,
        },
      },
    },
    take: 100,
  });

  const titled = titleFilter
    ? await prisma.items.findMany({
        where: {
          title: { contains: titleFilter, mode: 'insensitive' },
        },
        select: {
          id: true,
          title: true,
          deletedAt: true,
          catalogItemId: true,
          order: true,
          listId: true,
          lists: {
            select: {
              id: true,
              title: true,
              slug: true,
              isPublic: true,
              isActive: true,
              deletedAt: true,
            },
          },
        },
        take: 50,
      })
    : [];

  console.log(
    JSON.stringify(
      {
        softDeletedOnLiveListsCount: softDeletedOnLiveLists.length,
        liveOnHiddenListsCount: liveOnHiddenLists.length,
        softDeletedOnLiveLists,
        liveOnHiddenLists,
        titledMatches: titled,
      },
      null,
      2
    )
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
