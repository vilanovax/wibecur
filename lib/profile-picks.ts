import { prisma } from '@/lib/prisma';
import { fetchBrowsePublicItems } from '@/lib/browse-public-items';

export const MAX_PICKS_PER_CATEGORY = 10;
export const MAX_PICK_NOTE_LENGTH = 120;

export type ProfilePickItemDto = {
  id: string;
  catalogItemId: string;
  categorySlug: string;
  sortOrder: number;
  note: string | null;
  title: string;
  imageUrl: string | null;
  itemId: string | null;
};

export type ProfilePickShelfDto = {
  categorySlug: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  picks: ProfilePickItemDto[];
};

export type ProfilePicksResponse = {
  shelves: ProfilePickShelfDto[];
  categories: Array<{
    id: string;
    name: string;
    slug: string;
    icon: string;
    color: string;
  }>;
  maxPerCategory: number;
};

async function resolveItemIdsByCatalog(
  catalogItemIds: string[]
): Promise<Map<string, string>> {
  if (catalogItemIds.length === 0) return new Map();

  const rows = await prisma.items.findMany({
    where: {
      catalogItemId: { in: catalogItemIds },
      lists: { isActive: true, isPublic: true },
    },
    select: { id: true, catalogItemId: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });

  const map = new Map<string, string>();
  for (const row of rows) {
    if (row.catalogItemId && !map.has(row.catalogItemId)) {
      map.set(row.catalogItemId, row.id);
    }
  }
  return map;
}

async function fetchActivePickCategories() {
  return prisma.categories.findMany({
    where: { isActive: true, deletedAt: null },
    orderBy: { order: 'asc' },
    select: { id: true, name: true, slug: true, icon: true, color: true },
  });
}

function buildShelves(
  picks: Array<{
    id: string;
    catalogItemId: string;
    categorySlug: string;
    sortOrder: number;
    note: string | null;
    catalog_items: {
      id: string;
      title: string;
      imageUrl: string | null;
    };
  }>,
  categories: Awaited<ReturnType<typeof fetchActivePickCategories>>,
  itemIdByCatalog: Map<string, string>
): ProfilePickShelfDto[] {
  const categoryBySlug = new Map(categories.map((c) => [c.slug, c]));
  const byCategory = new Map<string, ProfilePickItemDto[]>();

  for (const pick of picks) {
    const list = byCategory.get(pick.categorySlug) ?? [];
    list.push({
      id: pick.id,
      catalogItemId: pick.catalogItemId,
      categorySlug: pick.categorySlug,
      sortOrder: pick.sortOrder,
      note: pick.note,
      title: pick.catalog_items.title,
      imageUrl: pick.catalog_items.imageUrl,
      itemId: itemIdByCatalog.get(pick.catalogItemId) ?? null,
    });
    byCategory.set(pick.categorySlug, list);
  }

  const shelves: ProfilePickShelfDto[] = [];
  for (const [categorySlug, categoryPicks] of byCategory) {
    const cat = categoryBySlug.get(categorySlug);
    shelves.push({
      categorySlug,
      categoryName: cat?.name ?? categorySlug,
      categoryIcon: cat?.icon ?? '📌',
      categoryColor: cat?.color ?? '#6366F1',
      picks: categoryPicks.sort((a, b) => a.sortOrder - b.sortOrder),
    });
  }

  shelves.sort((a, b) => {
    const orderA = categories.findIndex((c) => c.slug === a.categorySlug);
    const orderB = categories.findIndex((c) => c.slug === b.categorySlug);
    return (orderA === -1 ? 999 : orderA) - (orderB === -1 ? 999 : orderB);
  });

  return shelves;
}

export async function getProfilePicksForUser(userId: string): Promise<ProfilePicksResponse> {
  const [picks, categories] = await Promise.all([
    prisma.profile_picks.findMany({
      where: { userId },
      orderBy: [{ categorySlug: 'asc' }, { sortOrder: 'asc' }],
      include: {
        catalog_items: {
          select: { id: true, title: true, imageUrl: true },
        },
      },
    }),
    fetchActivePickCategories(),
  ]);

  const itemIdByCatalog = await resolveItemIdsByCatalog(
    picks.map((p) => p.catalogItemId)
  );

  return {
    shelves: buildShelves(picks, categories, itemIdByCatalog),
    categories,
    maxPerCategory: MAX_PICKS_PER_CATEGORY,
  };
}

export async function getPublicProfilePicksForUser(
  userId: string
): Promise<ProfilePickShelfDto[]> {
  const data = await getProfilePicksForUser(userId);
  return data.shelves.filter((s) => s.picks.length > 0);
}

async function resolveCategorySlugForCatalogItem(
  catalogItemId: string
): Promise<string | null> {
  const catalog = await prisma.catalog_items.findUnique({
    where: { id: catalogItemId },
    select: { categorySlug: true },
  });
  if (catalog?.categorySlug) return catalog.categorySlug;

  const item = await prisma.items.findFirst({
    where: {
      catalogItemId,
      lists: { isActive: true, isPublic: true, categoryId: { not: null } },
    },
    select: { lists: { select: { categories: { select: { slug: true } } } } },
    orderBy: { createdAt: 'desc' },
  });

  return item?.lists.categories?.slug ?? null;
}

export class ProfilePickError extends Error {
  constructor(
    message: string,
    public code: 'NOT_FOUND' | 'DUPLICATE' | 'LIMIT' | 'INVALID' = 'INVALID'
  ) {
    super(message);
    this.name = 'ProfilePickError';
  }
}

export async function addProfilePick(userId: string, catalogItemId: string) {
  const catalog = await prisma.catalog_items.findUnique({
    where: { id: catalogItemId },
    select: { id: true, title: true },
  });
  if (!catalog) {
    throw new ProfilePickError('آیتم کاتالوگ یافت نشد', 'NOT_FOUND');
  }

  const existing = await prisma.profile_picks.findUnique({
    where: { userId_catalogItemId: { userId, catalogItemId } },
  });
  if (existing) {
    throw new ProfilePickError('این آیتم قبلاً در منتخب‌هاست', 'DUPLICATE');
  }

  const categorySlug = await resolveCategorySlugForCatalogItem(catalogItemId);
  if (!categorySlug) {
    throw new ProfilePickError('دسته‌بندی این آیتم مشخص نیست', 'INVALID');
  }

  const category = await prisma.categories.findFirst({
    where: { slug: categorySlug, isActive: true, deletedAt: null },
    select: { slug: true },
  });
  if (!category) {
    throw new ProfilePickError('دسته‌بندی فعال نیست', 'INVALID');
  }

  const countInCategory = await prisma.profile_picks.count({
    where: { userId, categorySlug },
  });
  if (countInCategory >= MAX_PICKS_PER_CATEGORY) {
    throw new ProfilePickError(
      `حداکثر ${MAX_PICKS_PER_CATEGORY} آیتم در هر دسته مجاز است`,
      'LIMIT'
    );
  }

  const maxOrder = await prisma.profile_picks.aggregate({
    where: { userId, categorySlug },
    _max: { sortOrder: true },
  });

  const pick = await prisma.profile_picks.create({
    data: {
      userId,
      catalogItemId,
      categorySlug,
      sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
    },
    include: {
      catalog_items: { select: { id: true, title: true, imageUrl: true } },
    },
  });

  const itemIdMap = await resolveItemIdsByCatalog([catalogItemId]);
  return {
    id: pick.id,
    catalogItemId: pick.catalogItemId,
    categorySlug: pick.categorySlug,
    sortOrder: pick.sortOrder,
    note: pick.note,
    title: pick.catalog_items.title,
    imageUrl: pick.catalog_items.imageUrl,
    itemId: itemIdMap.get(catalogItemId) ?? null,
  } satisfies ProfilePickItemDto;
}

export async function removeProfilePick(userId: string, pickId: string) {
  const pick = await prisma.profile_picks.findFirst({
    where: { id: pickId, userId },
    select: { id: true, categorySlug: true, sortOrder: true },
  });
  if (!pick) {
    throw new ProfilePickError('منتخب یافت نشد', 'NOT_FOUND');
  }

  await prisma.$transaction([
    prisma.profile_picks.delete({ where: { id: pickId } }),
    prisma.profile_picks.updateMany({
      where: {
        userId,
        categorySlug: pick.categorySlug,
        sortOrder: { gt: pick.sortOrder },
      },
      data: { sortOrder: { decrement: 1 } },
    }),
  ]);
}

export async function reorderProfilePicks(
  userId: string,
  categorySlug: string,
  orderedIds: string[]
) {
  if (orderedIds.length === 0) return;

  const picks = await prisma.profile_picks.findMany({
    where: { userId, categorySlug },
    select: { id: true },
    orderBy: { sortOrder: 'asc' },
  });

  const validIds = new Set(picks.map((p) => p.id));
  if (orderedIds.length !== picks.length) {
    throw new ProfilePickError('ترتیب نامعتبر است', 'INVALID');
  }
  for (const id of orderedIds) {
    if (!validIds.has(id)) {
      throw new ProfilePickError('ترتیب نامعتبر است', 'INVALID');
    }
  }

  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.profile_picks.update({
        where: { id },
        data: { sortOrder: index },
      })
    )
  );
}

export async function updateProfilePickNote(
  userId: string,
  pickId: string,
  note: string | null
) {
  const pick = await prisma.profile_picks.findFirst({
    where: { id: pickId, userId },
    select: { id: true },
  });
  if (!pick) {
    throw new ProfilePickError('منتخب یافت نشد', 'NOT_FOUND');
  }

  const trimmed = note?.trim() ?? '';
  const value = trimmed.length > 0 ? trimmed.slice(0, MAX_PICK_NOTE_LENGTH) : null;

  return prisma.profile_picks.update({
    where: { id: pickId },
    data: { note: value },
    select: { id: true, note: true },
  });
}

export async function getProfilePickStatus(
  userId: string,
  catalogItemId: string | null | undefined
) {
  if (!catalogItemId) {
    return { isPicked: false, pickId: null as string | null, categorySlug: null as string | null };
  }

  const pick = await prisma.profile_picks.findUnique({
    where: { userId_catalogItemId: { userId, catalogItemId } },
    select: { id: true, categorySlug: true },
  });

  return {
    isPicked: !!pick,
    pickId: pick?.id ?? null,
    categorySlug: pick?.categorySlug ?? null,
  };
}

export async function browseItemsForProfilePicks(options: {
  userId: string;
  categorySlug: string;
  page?: number;
  limit?: number;
  search?: string;
}) {
  const category = await prisma.categories.findFirst({
    where: { slug: options.categorySlug, isActive: true, deletedAt: null },
    select: { id: true, slug: true, name: true, icon: true, color: true },
  });
  if (!category) {
    throw new ProfilePickError('دسته یافت نشد', 'NOT_FOUND');
  }

  const existingPicks = await prisma.profile_picks.findMany({
    where: { userId: options.userId },
    select: { catalogItemId: true },
  });
  const excludeCatalogItemIds = existingPicks.map((p) => p.catalogItemId);

  const result = await fetchBrowsePublicItems({
    page: options.page,
    limit: options.limit,
    search: options.search,
    categoryId: category.id,
    requireCatalogItemId: true,
    excludeCatalogItemIds,
    sort: 'newest',
  });

  return { category, ...result };
}
