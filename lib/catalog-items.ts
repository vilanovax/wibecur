/**
 * کاتالوگ آیتم‌ها — موجودیت مشترک برای چندلیستی شدن بدون کپی دادهٔ پراکنده
 */

import type { Prisma, PrismaClient } from '@prisma/client';
import { nanoid } from 'nanoid';
import { normalizeSuggestionTitle } from '@/lib/suggestion-utils';

export class CatalogNotReadyError extends Error {
  constructor() {
    super(
      'جدول کاتالوگ هنوز آماده نیست. در ترمینال اجرا کنید: npm run db:push && npx prisma generate — سپس سرور dev را restart کنید.'
    );
    this.name = 'CatalogNotReadyError';
  }
}

/** Prisma Client بعد از schema جدید باید regenerate شود */
export function isCatalogClientReady(prisma: PrismaClient): boolean {
  const delegate = (prisma as { catalog_items?: { findMany?: unknown } }).catalog_items;
  return typeof delegate?.findMany === 'function';
}

function catalogDb(prisma: PrismaClient) {
  if (!isCatalogClientReady(prisma)) {
    throw new CatalogNotReadyError();
  }
  return prisma.catalog_items;
}

export type CatalogItemInput = {
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  externalUrl?: string | null;
  categorySlug?: string | null;
  metadata?: Prisma.InputJsonValue;
  externalKey?: string | null;
};

export type CatalogSearchRow = {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  categorySlug: string | null;
  externalKey: string | null;
  listCount: number;
  sampleListTitles: string[];
  alreadyInList: boolean;
};

function slugifyForKey(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\p{L}\p{N}-]+/gu, '')
    .slice(0, 80);
}

/** استخراج کلید یکتا از متادیتا (فیلم/کتاب) */
export function buildCatalogExternalKey(
  categorySlug: string | null | undefined,
  title: string,
  metadata: unknown
): string | null {
  const meta =
    metadata != null && typeof metadata === 'object' && !Array.isArray(metadata)
      ? (metadata as Record<string, unknown>)
      : {};

  const imdb =
    (typeof meta.imdbId === 'string' && meta.imdbId) ||
    (typeof meta.imdbID === 'string' && meta.imdbID) ||
    (typeof meta.imdb === 'string' && meta.imdb);
  if (imdb) return `imdb:${String(imdb).replace(/^tt/i, 'tt')}`;

  const tmdb = meta.tmdbId ?? meta.tmdbID;
  if (tmdb != null && String(tmdb).trim()) return `tmdb:${String(tmdb).trim()}`;

  const isbn = meta.isbn ?? meta.ISBN;
  if (isbn != null && String(isbn).trim()) return `isbn:${String(isbn).trim()}`;

  const slug = categorySlug || 'general';
  const norm = normalizeSuggestionTitle(title);
  if (!norm) return null;
  return `title:${slug}:${slugifyForKey(norm)}`;
}

export function catalogFieldsFromInput(input: CatalogItemInput) {
  const externalKey =
    input.externalKey !== undefined
      ? input.externalKey
      : buildCatalogExternalKey(input.categorySlug, input.title, input.metadata);

  return {
    title: input.title.trim(),
    description: input.description?.trim() || null,
    imageUrl: input.imageUrl?.trim() || null,
    externalUrl: input.externalUrl?.trim() || null,
    categorySlug: input.categorySlug || null,
    metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
    externalKey,
  };
}

/** فیلدهای denormalized روی items برای سازگاری با APIهای فعلی */
export function denormalizedItemFieldsFromCatalog(catalog: {
  title: string;
  description: string | null;
  imageUrl: string | null;
  externalUrl: string | null;
  metadata: Prisma.JsonValue;
}) {
  return {
    title: catalog.title,
    description: catalog.description,
    imageUrl: catalog.imageUrl,
    externalUrl: catalog.externalUrl,
    metadata: catalog.metadata ?? {},
  };
}

export async function findCatalogByExternalKey(
  prisma: PrismaClient,
  externalKey: string | null | undefined
) {
  if (!externalKey) return null;
  return catalogDb(prisma).findUnique({ where: { externalKey } });
}

export async function createCatalogItem(
  prisma: PrismaClient,
  input: CatalogItemInput
) {
  const fields = catalogFieldsFromInput(input);

  if (fields.externalKey) {
    const existing = await findCatalogByExternalKey(prisma, fields.externalKey);
    if (existing) return existing;
  }

  return catalogDb(prisma).create({
    data: {
      id: nanoid(),
      ...fields,
      updatedAt: new Date(),
    },
  });
}

export async function syncPlacementsFromCatalog(
  prisma: PrismaClient,
  catalogItemId: string
) {
  const catalog = await catalogDb(prisma).findUnique({
    where: { id: catalogItemId },
  });
  if (!catalog) return;

  const patch = denormalizedItemFieldsFromCatalog(catalog);
  await prisma.items.updateMany({
    where: { catalogItemId },
    data: { ...patch, updatedAt: new Date() },
  });
}

export async function isCatalogInList(
  prisma: PrismaClient,
  catalogItemId: string,
  listId: string
) {
  const row = await prisma.items.findFirst({
    where: { catalogItemId, listId },
    select: { id: true },
  });
  return !!row;
}

export type AddToListOptions = {
  catalogItemId: string;
  listId: string;
  order?: number;
  listNote?: string | null;
  commentsEnabled?: boolean;
  maxComments?: number | null;
};

/** عضویت کاتالوگ در یک لیست — بدون کپی محتوا */
export async function addCatalogItemToList(
  prisma: PrismaClient,
  opts: AddToListOptions
) {
  const { catalogItemId, listId } = opts;

  const [catalog, list] = await Promise.all([
    catalogDb(prisma).findUnique({ where: { id: catalogItemId } }),
    prisma.lists.findUnique({
      where: { id: listId },
      include: { categories: true },
    }),
  ]);

  if (!catalog) throw new Error('آیتم کاتالوگ یافت نشد');
  if (!list) throw new Error('لیست یافت نشد');

  const exists = await isCatalogInList(prisma, catalogItemId, listId);
  if (exists) {
    throw new Error('این آیتم قبلاً در این لیست وجود دارد');
  }

  let order = opts.order;
  if (order === undefined) {
    const maxOrder = await prisma.items.aggregate({
      where: { listId },
      _max: { order: true },
    });
    order = (maxOrder._max.order ?? -1) + 1;
  }

  const denorm = denormalizedItemFieldsFromCatalog(catalog);
  const item = await prisma.items.create({
    data: {
      id: nanoid(),
      ...denorm,
      listId,
      catalogItemId,
      listNote: opts.listNote?.trim() || null,
      order,
      commentsEnabled: opts.commentsEnabled ?? true,
      maxComments: opts.maxComments ?? null,
      updatedAt: new Date(),
    },
    include: {
      lists: { include: { categories: true } },
      catalog_items: true,
    },
  });

  await prisma.lists.update({
    where: { id: listId },
    data: { itemCount: { increment: 1 } },
  });

  return item;
}

export async function searchCatalogItems(
  prisma: PrismaClient,
  q: string,
  options?: { limit?: number; listId?: string; categorySlug?: string }
): Promise<CatalogSearchRow[]> {
  const limit = options?.limit ?? 12;
  const query = q.trim();
  if (query.length < 2) return [];

  const where: Prisma.catalog_itemsWhereInput = {
    OR: [
      { title: { contains: query, mode: 'insensitive' } },
      { description: { contains: query, mode: 'insensitive' } },
      { externalKey: { contains: query, mode: 'insensitive' } },
    ],
    ...(options?.categorySlug
      ? { categorySlug: options.categorySlug }
      : {}),
  };

  const rows = await catalogDb(prisma).findMany({
    where,
    take: limit,
    orderBy: { updatedAt: 'desc' },
    include: {
      _count: { select: { items: true } },
      items: {
        select: {
          listId: true,
          lists: { select: { title: true } },
        },
        take: 5,
      },
    },
  });

  const listId = options?.listId;
  let inListSet = new Set<string>();
  if (listId) {
    const inList = await prisma.items.findMany({
      where: { listId, catalogItemId: { in: rows.map((r) => r.id) } },
      select: { catalogItemId: true },
    });
    inListSet = new Set(
      inList.map((r) => r.catalogItemId).filter((id): id is string => !!id)
    );
  }

  return rows.map((row) => {
    const titles = [
      ...new Set(row.items.map((i) => i.lists?.title).filter(Boolean)),
    ] as string[];
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      imageUrl: row.imageUrl,
      categorySlug: row.categorySlug,
      externalKey: row.externalKey,
      listCount: row._count.items,
      sampleListTitles: titles.slice(0, 3),
      alreadyInList: listId ? inListSet.has(row.id) : false,
    };
  });
}

/** برای آیتم‌های قدیمی بدون catalogItemId */
export async function backfillCatalogForItem(
  prisma: PrismaClient,
  itemId: string
) {
  const item = await prisma.items.findUnique({
    where: { id: itemId },
    include: { lists: { include: { categories: true } } },
  });
  if (!item) return null;
  if (item.catalogItemId) {
    return catalogDb(prisma).findUnique({ where: { id: item.catalogItemId } });
  }

  const categorySlug = item.lists?.categories?.slug ?? null;
  const catalog = await createCatalogItem(prisma, {
    title: item.title,
    description: item.description,
    imageUrl: item.imageUrl,
    externalUrl: item.externalUrl,
    categorySlug,
    metadata: item.metadata ?? {},
  });

  await prisma.items.update({
    where: { id: itemId },
    data: { catalogItemId: catalog.id, updatedAt: new Date() },
  });

  return catalog;
}

export type CatalogListRow = {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  categorySlug: string | null;
  externalKey: string | null;
  listCount: number;
  updatedAt: string;
};

export type CatalogDetailPlacement = {
  itemId: string;
  listId: string;
  listTitle: string;
  listSlug: string;
  order: number;
};

export type DuplicateCatalogGroup = {
  groupKey: string;
  categorySlug: string | null;
  normalizedTitle: string;
  catalogs: Array<{
    id: string;
    title: string;
    externalKey: string | null;
    listCount: number;
  }>;
};

export async function listCatalogItems(
  prisma: PrismaClient,
  options: {
    q?: string;
    categorySlug?: string;
    page?: number;
    perPage?: number;
  }
): Promise<{ rows: CatalogListRow[]; total: number }> {
  const page = Math.max(1, options.page ?? 1);
  const perPage = Math.min(50, Math.max(10, options.perPage ?? 24));
  const q = options.q?.trim();

  const where: Prisma.catalog_itemsWhereInput = {
    ...(q && q.length >= 2
      ? {
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { externalKey: { contains: q, mode: 'insensitive' } },
          ],
        }
      : {}),
    ...(options.categorySlug === '__none__'
      ? { categorySlug: null }
      : options.categorySlug
        ? { categorySlug: options.categorySlug }
        : {}),
  };

  const [rows, total] = await Promise.all([
    catalogDb(prisma).findMany({
      where,
      skip: (page - 1) * perPage,
      take: perPage,
      orderBy: { updatedAt: 'desc' },
      include: { _count: { select: { items: true } } },
    }),
    catalogDb(prisma).count({ where }),
  ]);

  return {
    total,
    rows: rows.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      imageUrl: r.imageUrl,
      categorySlug: r.categorySlug,
      externalKey: r.externalKey,
      listCount: r._count.items,
      updatedAt: r.updatedAt.toISOString(),
    })),
  };
}

export async function getCatalogItemDetail(prisma: PrismaClient, id: string) {
  const catalog = await catalogDb(prisma).findUnique({
    where: { id },
    include: {
      items: {
        orderBy: { order: 'asc' },
        select: {
          id: true,
          listId: true,
          order: true,
          lists: { select: { id: true, title: true, slug: true } },
        },
      },
    },
  });
  if (!catalog) return null;

  const placements: CatalogDetailPlacement[] = catalog.items.map((i) => ({
    itemId: i.id,
    listId: i.listId,
    listTitle: i.lists.title,
    listSlug: i.lists.slug,
    order: i.order,
  }));

  return {
    id: catalog.id,
    title: catalog.title,
    description: catalog.description,
    imageUrl: catalog.imageUrl,
    externalUrl: catalog.externalUrl,
    categorySlug: catalog.categorySlug,
    externalKey: catalog.externalKey,
    metadata: catalog.metadata,
    placements,
    listCount: placements.length,
  };
}

export async function getRecentCatalogItems(
  prisma: PrismaClient,
  limit = 10,
  options?: { listId?: string; categorySlug?: string }
): Promise<CatalogSearchRow[]> {
  const rows = await catalogDb(prisma).findMany({
    take: limit,
    orderBy: { updatedAt: 'desc' },
    where: {
      ...(options?.categorySlug === '__none__'
        ? { categorySlug: null }
        : options?.categorySlug
          ? { categorySlug: options.categorySlug }
          : {}),
    },
    include: {
      _count: { select: { items: true } },
      items: {
        select: {
          listId: true,
          lists: { select: { title: true } },
        },
        take: 5,
      },
    },
  });

  const listId = options?.listId;
  let inListSet = new Set<string>();
  if (listId) {
    const inList = await prisma.items.findMany({
      where: { listId, catalogItemId: { in: rows.map((r) => r.id) } },
      select: { catalogItemId: true },
    });
    inListSet = new Set(
      inList.map((r) => r.catalogItemId).filter((id): id is string => !!id)
    );
  }

  return rows.map((row) => {
    const titles = [
      ...new Set(row.items.map((i) => i.lists?.title).filter(Boolean)),
    ] as string[];
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      imageUrl: row.imageUrl,
      categorySlug: row.categorySlug,
      externalKey: row.externalKey,
      listCount: row._count.items,
      sampleListTitles: titles.slice(0, 3),
      alreadyInList: listId ? inListSet.has(row.id) : false,
    };
  });
}

export type CatalogCategoryFilter = { slug: string | null; count: number };

export async function getCatalogCategoryFilters(
  prisma: PrismaClient
): Promise<{ total: number; categories: CatalogCategoryFilter[] }> {
  const [total, grouped] = await Promise.all([
    catalogDb(prisma).count(),
    catalogDb(prisma).groupBy({
      by: ['categorySlug'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    }),
  ]);
  return {
    total,
    categories: grouped.map((g) => ({
      slug: g.categorySlug,
      count: g._count.id,
    })),
  };
}

export async function updateCatalogItem(
  prisma: PrismaClient,
  id: string,
  input: Partial<CatalogItemInput>
) {
  const existing = await catalogDb(prisma).findUnique({ where: { id } });
  if (!existing) throw new Error('کاتالوگ یافت نشد');

  const title = input.title?.trim() ?? existing.title;
  const categorySlug = input.categorySlug !== undefined ? input.categorySlug : existing.categorySlug;
  const metadata = input.metadata !== undefined ? input.metadata : existing.metadata;
  const externalKey =
    input.externalKey !== undefined
      ? input.externalKey
      : buildCatalogExternalKey(categorySlug, title, metadata);

  const updated = await catalogDb(prisma).update({
    where: { id },
    data: {
      ...(input.title !== undefined && { title }),
      ...(input.description !== undefined && { description: input.description?.trim() || null }),
      ...(input.imageUrl !== undefined && { imageUrl: input.imageUrl?.trim() || null }),
      ...(input.externalUrl !== undefined && { externalUrl: input.externalUrl?.trim() || null }),
      ...(input.categorySlug !== undefined && { categorySlug }),
      ...(input.metadata !== undefined && { metadata: metadata as Prisma.InputJsonValue }),
      externalKey,
      updatedAt: new Date(),
    },
  });

  await syncPlacementsFromCatalog(prisma, id);
  return updated;
}

/** گروه‌های احتمالاً تکراری (عنوان نرمال + دسته) */
export async function findDuplicateCatalogGroups(
  prisma: PrismaClient,
  options?: { limit?: number }
): Promise<DuplicateCatalogGroup[]> {
  const limit = options?.limit ?? 40;
  const rows = await catalogDb(prisma).findMany({
    select: {
      id: true,
      title: true,
      categorySlug: true,
      externalKey: true,
      _count: { select: { items: true } },
    },
    orderBy: { title: 'asc' },
    take: 8000,
  });

  const byKey = new Map<string, DuplicateCatalogGroup['catalogs']>();

  for (const row of rows) {
    const norm = normalizeSuggestionTitle(row.title);
    if (!norm) continue;
    const key = `${row.categorySlug ?? ''}::${norm}`;
    const list = byKey.get(key) ?? [];
    list.push({
      id: row.id,
      title: row.title,
      externalKey: row.externalKey,
      listCount: row._count.items,
    });
    byKey.set(key, list);
  }

  return [...byKey.entries()]
    .filter(([, catalogs]) => catalogs.length >= 2)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, limit)
    .map(([groupKey, catalogs]) => {
      const sep = groupKey.indexOf('::');
      const categorySlug = sep > 0 ? groupKey.slice(0, sep) || null : null;
      const normalizedTitle = sep > 0 ? groupKey.slice(sep + 2) : groupKey;
      return { groupKey, categorySlug, normalizedTitle, catalogs };
    });
}

export type MergeCatalogResult = {
  mergedPlacements: number;
  removedDuplicatePlacements: number;
  deletedCatalogs: number;
};

/** ادغام چند کاتالوگ در یک مقصد */
export async function mergeCatalogItems(
  prisma: PrismaClient,
  targetCatalogId: string,
  sourceCatalogIds: string[]
): Promise<MergeCatalogResult> {
  const sources = [...new Set(sourceCatalogIds.filter((id) => id && id !== targetCatalogId))];
  if (sources.length === 0) {
    throw new Error('حداقل یک کاتالوگ مبدأ برای ادغام لازم است');
  }

  return prisma.$transaction(async (tx) => {
    const target = await tx.catalog_items.findUnique({ where: { id: targetCatalogId } });
    if (!target) throw new Error('کاتالوگ مقصد یافت نشد');

    const denorm = denormalizedItemFieldsFromCatalog(target);
    let mergedPlacements = 0;
    let removedDuplicatePlacements = 0;

    for (const sourceId of sources) {
      const source = await tx.catalog_items.findUnique({ where: { id: sourceId } });
      if (!source) continue;

      const placements = await tx.items.findMany({
        where: { catalogItemId: sourceId },
        select: { id: true, listId: true },
      });

      for (const placement of placements) {
        const conflict = await tx.items.findFirst({
          where: {
            listId: placement.listId,
            catalogItemId: targetCatalogId,
            NOT: { id: placement.id },
          },
        });

        if (conflict) {
          await tx.items.delete({ where: { id: placement.id } });
          await tx.lists.update({
            where: { id: placement.listId },
            data: { itemCount: { decrement: 1 } },
          });
          removedDuplicatePlacements++;
        } else {
          await tx.items.update({
            where: { id: placement.id },
            data: {
              catalogItemId: targetCatalogId,
              ...denorm,
              updatedAt: new Date(),
            },
          });
          mergedPlacements++;
        }
      }

      await tx.catalog_items.delete({ where: { id: sourceId } });
    }

    return {
      mergedPlacements,
      removedDuplicatePlacements,
      deletedCatalogs: sources.length,
    };
  });
}
