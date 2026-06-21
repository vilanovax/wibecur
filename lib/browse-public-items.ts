import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import { publicActiveItemWhere } from '@/lib/public-content-filters';

export type BrowseItemsSort =
  | 'newest'
  | 'oldest'
  | 'title-asc'
  | 'title-desc';

export type BrowseItemsAvailability = 'all' | 'available' | 'in-list';

export type ExistingInListKeys = {
  catalogItemIds: string[];
  titleKeys: string[];
};

const ITEM_SELECT = {
  id: true,
  title: true,
  description: true,
  imageUrl: true,
  externalUrl: true,
  listId: true,
  catalogItemId: true,
  createdAt: true,
  lists: {
    select: {
      id: true,
      title: true,
      slug: true,
      categoryId: true,
      categories: {
        select: {
          id: true,
          name: true,
          slug: true,
          icon: true,
          color: true,
        },
      },
    },
  },
} as const;

function buildAvailabilityWhere(
  availability: BrowseItemsAvailability,
  existing: ExistingInListKeys
): Prisma.itemsWhereInput | undefined {
  if (availability === 'all') return undefined;

  const inListOr: Prisma.itemsWhereInput[] = [];
  if (existing.catalogItemIds.length > 0) {
    inListOr.push({ catalogItemId: { in: existing.catalogItemIds } });
  }
  for (const titleKey of existing.titleKeys) {
    if (titleKey) {
      inListOr.push({ title: { equals: titleKey, mode: 'insensitive' } });
    }
  }

  if (inListOr.length === 0) {
    return availability === 'in-list' ? { id: { in: [] } } : undefined;
  }

  if (availability === 'in-list') {
    return { OR: inListOr };
  }

  return { NOT: { OR: inListOr } };
}

function buildOrderBy(sort: BrowseItemsSort): Prisma.itemsOrderByWithRelationInput[] {
  switch (sort) {
    case 'oldest':
      return [{ createdAt: 'asc' }];
    case 'title-asc':
      return [{ title: 'asc' }];
    case 'title-desc':
      return [{ title: 'desc' }];
    case 'newest':
    default:
      return [{ createdAt: 'desc' }];
  }
}

export async function fetchBrowsePublicItems(options: {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  sourceListId?: string;
  availability?: BrowseItemsAvailability;
  sort?: BrowseItemsSort;
  existing?: ExistingInListKeys;
  requireCatalogItemId?: boolean;
  excludeCatalogItemIds?: string[];
}) {
  const page = options.page ?? 1;
  const limit = Math.min(options.limit ?? 24, 48);
  const skip = (page - 1) * limit;
  const search = options.search?.trim() ?? '';
  const availability = options.availability ?? 'all';
  const sort = options.sort === 'title-asc' || options.sort === 'title-desc' || options.sort === 'oldest'
    ? options.sort
    : 'newest';
  const existing = options.existing ?? { catalogItemIds: [], titleKeys: [] };

  const and: Prisma.itemsWhereInput[] = [
    publicActiveItemWhere,
    {
      lists: {
        isActive: true,
        isPublic: true,
        ...(options.categoryId ? { categoryId: options.categoryId } : {}),
        ...(options.sourceListId ? { id: options.sourceListId } : {}),
      },
    },
  ];

  if (options.requireCatalogItemId) {
    and.push({ catalogItemId: { not: null } });
  }

  if (options.excludeCatalogItemIds && options.excludeCatalogItemIds.length > 0) {
    and.push({
      OR: [
        { catalogItemId: null },
        { catalogItemId: { notIn: options.excludeCatalogItemIds } },
      ],
    });
  }

  if (search) {
    and.push({
      OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { lists: { title: { contains: search, mode: 'insensitive' } } },
      ],
    });
  }

  const availabilityWhere = buildAvailabilityWhere(availability, existing);
  if (availabilityWhere) {
    and.push(availabilityWhere);
  }

  const where: Prisma.itemsWhereInput = { AND: and };

  const [items, total] = await Promise.all([
    prisma.items.findMany({
      where,
      skip,
      take: limit,
      orderBy: buildOrderBy(sort),
      select: ITEM_SELECT,
    }),
    prisma.items.count({ where }),
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
      hasMore: page * limit < total,
    },
  };
}

export async function fetchBrowseCategoryCounts() {
  const rows = await prisma.items.groupBy({
    by: ['listId'],
    where: {
      deletedAt: null,
      lists: { isActive: true, isPublic: true, categoryId: { not: null } },
    },
    _count: { id: true },
  });

  const lists = await prisma.lists.findMany({
    where: { id: { in: rows.map((r) => r.listId) } },
    select: { id: true, categoryId: true },
  });

  const listCategory = new Map(lists.map((l) => [l.id, l.categoryId]));
  const counts = new Map<string, number>();

  for (const row of rows) {
    const categoryId = listCategory.get(row.listId);
    if (!categoryId) continue;
    counts.set(categoryId, (counts.get(categoryId) ?? 0) + row._count.id);
  }

  return Object.fromEntries(counts);
}

export async function fetchBrowseTotals(existing: ExistingInListKeys) {
  const baseWhere: Prisma.itemsWhereInput = {
    ...publicActiveItemWhere,
    lists: { isActive: true, isPublic: true },
  };

  const [totalPublic, inListTotal] = await Promise.all([
    prisma.items.count({ where: baseWhere }),
    existing.catalogItemIds.length > 0 || existing.titleKeys.length > 0
      ? prisma.items.count({
          where: {
            AND: [
              baseWhere,
              buildAvailabilityWhere('in-list', existing) ?? { id: { in: [] } },
            ],
          },
        })
      : Promise.resolve(0),
  ]);

  return {
    totalPublic,
    inList: inListTotal,
    available: Math.max(0, totalPublic - inListTotal),
  };
}
