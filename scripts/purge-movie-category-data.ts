/**
 * حذف کامل لیست‌ها و آیتم‌های دسته فیلم/سریال برای شروع مجدد import.
 * دستهٔ فیلم خودش حذف نمی‌شود.
 *
 * Usage:
 *   npx tsx scripts/purge-movie-category-data.ts          # dry-run
 *   npx tsx scripts/purge-movie-category-data.ts --confirm # اجرای واقعی
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const MOVIE_SLUGS = ['movies', 'movie', 'film', 'series'];

async function main() {
  const confirm = process.argv.includes('--confirm');

  const movieCategories = await prisma.categories.findMany({
    where: {
      OR: [
        { slug: { in: MOVIE_SLUGS } },
        { slug: { contains: 'movie' } },
        { slug: { contains: 'film' } },
        { slug: 'series' },
      ],
    },
    select: { id: true, name: true, slug: true, icon: true },
  });

  if (movieCategories.length === 0) {
    console.log('❌ دستهٔ فیلم/سریال یافت نشد.');
    return;
  }

  const categoryIds = movieCategories.map((c) => c.id);
  const movieSlugs = [...new Set(movieCategories.map((c) => c.slug))];

  console.log('🎬 دسته‌های هدف:');
  for (const c of movieCategories) {
    console.log(`   • ${c.icon ?? ''} ${c.name} (${c.slug})`);
  }
  console.log('');

  const lists = await prisma.lists.findMany({
    where: { categoryId: { in: categoryIds } },
    select: { id: true, title: true, slug: true, itemCount: true, deletedAt: true },
  });

  const listIds = lists.map((l) => l.id);

  const itemCount = await prisma.items.count({
    where: { listId: { in: listIds } },
  });

  const catalogFromItems = await prisma.items.findMany({
    where: { listId: { in: listIds }, catalogItemId: { not: null } },
    select: { catalogItemId: true },
    distinct: ['catalogItemId'],
  });
  const catalogIdsFromLists = catalogFromItems
    .map((i) => i.catalogItemId)
    .filter((id): id is string => Boolean(id));

  const catalogBySlugCount = await prisma.catalog_items.count({
    where: { categorySlug: { in: movieSlugs } },
  });

  const suggestedListsCount = await prisma.suggested_lists.count({
    where: { categoryId: { in: categoryIds } },
  });

  const featuredSlotsCount = await prisma.home_featured_slot.count({
    where: { listId: { in: listIds } },
  });

  console.log('📊 خلاصه (قبل از حذف):');
  console.log(`   لیست‌ها: ${lists.length.toLocaleString('fa-IR')}`);
  console.log(`   آیتم‌های لیست (جایگاه): ${itemCount.toLocaleString('fa-IR')}`);
  console.log(`   catalog از این لیست‌ها: ${catalogIdsFromLists.length.toLocaleString('fa-IR')}`);
  console.log(`   catalog با categorySlug فیلم: ${catalogBySlugCount.toLocaleString('fa-IR')}`);
  console.log(`   پیشنهاد لیست (suggested_lists): ${suggestedListsCount.toLocaleString('fa-IR')}`);
  console.log(`   اسلات featured: ${featuredSlotsCount.toLocaleString('fa-IR')}`);
  console.log('');

  if (lists.length > 0) {
    console.log('📋 نمونه لیست‌ها:');
    for (const l of lists.slice(0, 8)) {
      const trashed = l.deletedAt ? ' [سطل]' : '';
      console.log(`   • ${l.title} (${l.itemCount} آیتم)${trashed}`);
    }
    if (lists.length > 8) console.log(`   … و ${lists.length - 8} لیست دیگر`);
    console.log('');
  }

  if (!confirm) {
    console.log('⚠️  dry-run — برای حذف واقعی:');
    console.log('   npx tsx scripts/purge-movie-category-data.ts --confirm');
    return;
  }

  console.log('🗑️  در حال حذف…\n');

  const result = await prisma.$transaction(async (tx) => {
    // پیشنهادهای لیست دسته فیلم
    const suggestedLists = await tx.suggested_lists.deleteMany({
      where: { categoryId: { in: categoryIds } },
    });

    // حذف لیست‌ها → cascade: items, bookmarks, likes, comments, featured slots, …
    const deletedLists = await tx.lists.deleteMany({
      where: { categoryId: { in: categoryIds } },
    });

    // catalog مرتبط با فیلم
    const deletedCatalogBySlug = await tx.catalog_items.deleteMany({
      where: { categorySlug: { in: movieSlugs } },
    });

    const deletedCatalogById =
      catalogIdsFromLists.length > 0
        ? await tx.catalog_items.deleteMany({
            where: {
              id: { in: catalogIdsFromLists },
              items: { none: {} },
            },
          })
        : { count: 0 };

    return {
      suggestedLists: suggestedLists.count,
      lists: deletedLists.count,
      catalogBySlug: deletedCatalogBySlug.count,
      catalogById: deletedCatalogById.count,
    };
  });

  console.log('✅ حذف انجام شد:');
  console.log(`   لیست‌ها: ${result.lists.toLocaleString('fa-IR')}`);
  console.log(`   suggested_lists: ${result.suggestedLists.toLocaleString('fa-IR')}`);
  console.log(
    `   catalog_items: ${(result.catalogBySlug + result.catalogById).toLocaleString('fa-IR')}`
  );
  console.log('');
  console.log('ℹ️  دستهٔ فیلم/سریال حفظ شد — می‌توانید از import گروهی دوباره داده بزنید.');
}

main()
  .catch((e) => {
    console.error('❌ خطا:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
