/**
 * کاتالوگ آیتم‌ها — موجودیت مشترک برای چندلیستی شدن بدون کپی دادهٔ پراکنده
 */

import { Prisma, type PrismaClient } from '@prisma/client';
import { nanoid } from 'nanoid';
import {
  catalogTitlesMatch,
  normalizeSuggestionTitle,
  primarySuggestionTitle,
} from '@/lib/suggestion-utils';
import {
  catalogMissingPosterImage,
  extractCatalogImdbId,
} from '@/lib/missing-image-utils';
import {
  catalogRefMetadata,
  type EntryKind,
  isLightweightEntryKind,
} from '@/lib/list-entry';
import { catalogHasSearchProfile } from '@/lib/catalog-search-profile';
import { isCatalogAdminDisabled } from '@/lib/admin/catalog-visibility';
import { expandCategorySlugFilter, dedupeActiveCategoriesByAlias, isSameCategorySlug } from '@/lib/category-slug-aliases';
import {
  buildCatalogItemSearchFilter,
  CATALOG_SEARCH_MIN_SCORE,
  catalogTitleMatchesQuery,
  scoreCatalogItemForSearch,
} from '@/lib/search-keywords';

const CATALOG_SEARCH_FETCH_CAP = 400;

export class CatalogNotReadyError extends Error {
  constructor() {
    super(
      'جدول کاتالوگ هنوز آماده نیست. در ترمینال اجرا کنید: npm run db:push && npx prisma generate — سپس سرور dev را restart کنید.'
    );
    this.name = 'CatalogNotReadyError';
  }
}

/** برخورد unique روی externalKey هنگام ویرایش عنوان/دسته */
export class CatalogExternalKeyConflictError extends Error {
  readonly conflictId: string;
  readonly conflictTitle: string;

  constructor(conflictId: string, conflictTitle: string) {
    super(
      `عنوان با موجودیت دیگری در کاتالوگ تداخل دارد («${conflictTitle}»). یا آن را ادغام کنید یا عنوان را عوض کنید.`
    );
    this.name = 'CatalogExternalKeyConflictError';
    this.conflictId = conflictId;
    this.conflictTitle = conflictTitle;
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

  const source = meta.source;
  const sourceId = meta.sourceId ?? meta.source_id;
  if (
    typeof source === 'string' &&
    ['taaghche', 'fidibo', 'ketabrah'].includes(source) &&
    sourceId != null &&
    String(sourceId).trim()
  ) {
    return `${source}:${String(sourceId).trim()}`;
  }

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

function asMetadataRecord(value: unknown): Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function pickRicherString(existing: string | null | undefined, incoming: string | null | undefined) {
  const inc = incoming?.trim();
  if (inc) return inc;
  const ex = existing?.trim();
  return ex || null;
}

function pickRicherTitle(existing: string, incoming: string) {
  const inc = incoming.trim();
  if (!inc) return existing;
  if (!existing.trim()) return inc;
  return inc.length >= existing.length ? inc : existing;
}

/** ادغام دادهٔ جدید روی کاتالوگ موجود — فیلدهای خالی با دادهٔ غنی‌تر پر می‌شوند */
export function mergeCatalogEnrichment(
  existing: {
    title: string;
    description: string | null;
    imageUrl: string | null;
    externalUrl: string | null;
    categorySlug: string | null;
    metadata: Prisma.JsonValue;
    externalKey?: string | null;
  },
  input: CatalogItemInput
) {
  const incoming = catalogFieldsFromInput(input);
  const existingMeta = asMetadataRecord(existing.metadata);
  const incomingMeta = asMetadataRecord(incoming.metadata);

  const merged = {
    title: pickRicherTitle(existing.title, incoming.title),
    description: pickRicherString(existing.description, incoming.description),
    imageUrl: pickRicherString(existing.imageUrl, incoming.imageUrl),
    externalUrl: pickRicherString(existing.externalUrl, incoming.externalUrl),
    categorySlug: incoming.categorySlug || existing.categorySlug,
    metadata: { ...existingMeta, ...incomingMeta } as Prisma.InputJsonValue,
  };

  const externalKey =
    existing.externalKey ||
    incoming.externalKey ||
    buildCatalogExternalKey(merged.categorySlug, merged.title, merged.metadata);

  return { ...merged, externalKey };
}

async function enrichAndUpdateCatalogIfNeeded(
  prisma: PrismaClient,
  existing: {
    id: string;
    title: string;
    description: string | null;
    imageUrl: string | null;
    externalUrl: string | null;
    categorySlug: string | null;
    metadata: Prisma.JsonValue;
    externalKey: string | null;
  },
  input: CatalogItemInput
) {
  const merged = mergeCatalogEnrichment(existing, input);

  const changed =
    merged.title !== existing.title ||
    merged.description !== existing.description ||
    merged.imageUrl !== existing.imageUrl ||
    merged.externalUrl !== existing.externalUrl ||
    merged.categorySlug !== existing.categorySlug ||
    merged.externalKey !== existing.externalKey ||
    JSON.stringify(merged.metadata) !== JSON.stringify(existing.metadata ?? {});

  if (!changed) return existing;

  return updateCatalogItem(prisma, existing.id, {
    title: merged.title,
    description: merged.description,
    imageUrl: merged.imageUrl,
    externalUrl: merged.externalUrl,
    categorySlug: merged.categorySlug,
    metadata: merged.metadata,
    externalKey: merged.externalKey,
  });
}

/** جستجوی کاتالوگ موجود با عنوان مشابه در همان دسته */
export async function findCatalogByTitleMatch(
  prisma: PrismaClient,
  categorySlug: string | null | undefined,
  title: string
) {
  const searchToken = primarySuggestionTitle(title);
  if (searchToken.length < 2) return null;

  // مستقیم روی catalog_items — حتی قبل از ساخته شدن جایگاه (ضد race ایمپورت موازی)
  const directCatalogs = await catalogDb(prisma).findMany({
    where: {
      title: { contains: searchToken, mode: 'insensitive' },
      ...(categorySlug ? { categorySlug } : {}),
    },
    take: 40,
    orderBy: { updatedAt: 'desc' },
  });
  for (const catalog of directCatalogs) {
    if (catalogTitlesMatch(title, catalog.title)) {
      return catalog;
    }
  }

  // اگر categorySlug تنگ بود و چیزی پیدا نشد، بدون فیلتر دسته هم یک‌بار چک کن
  if (categorySlug && directCatalogs.length === 0) {
    const anyCategory = await catalogDb(prisma).findMany({
      where: { title: { contains: searchToken, mode: 'insensitive' } },
      take: 40,
      orderBy: { updatedAt: 'desc' },
    });
    for (const catalog of anyCategory) {
      if (catalogTitlesMatch(title, catalog.title)) {
        return catalog;
      }
    }
  }

  const candidates = await prisma.items.findMany({
    where: {
      catalogItemId: { not: null },
      title: { contains: searchToken, mode: 'insensitive' },
      ...(categorySlug
        ? { lists: { categories: { slug: categorySlug }, deletedAt: null } }
        : { lists: { deletedAt: null } }),
    },
    select: {
      title: true,
      catalog_items: true,
    },
    take: 40,
    orderBy: { updatedAt: 'desc' },
  });

  for (const row of candidates) {
    const catalog = row.catalog_items;
    if (!catalog) continue;
    if (catalogTitlesMatch(title, row.title) || catalogTitlesMatch(title, catalog.title)) {
      return catalog;
    }
  }

  return null;
}

/**
 * پیدا کردن یا ساخت کاتالوگ — اگر از قبل وجود داشت، دادهٔ جدید را merge می‌کند
 * (برای تأیید پیشنهاد وقتی آیتم در لیست دیگر هم هست)
 */
export async function resolveOrCreateCatalogItem(
  prisma: PrismaClient,
  input: CatalogItemInput
) {
  let fields = catalogFieldsFromInput(input);

  let existing =
    fields.externalKey != null
      ? await findCatalogByExternalKey(prisma, fields.externalKey)
      : null;

  const strongKey =
    typeof fields.externalKey === 'string' &&
    /^(imdb|tmdb|isbn|taaghche|fidibo|ketabrah):/i.test(fields.externalKey);

  // کلید پایدار (ISBN/IMDb) را حتی با اختلاف جزئی عنوان نگه می‌داریم تا تکراری ساخته نشود.
  if (existing && !catalogTitlesMatch(input.title, existing.title) && !strongKey) {
    existing = null;
    const meta = { ...asMetadataRecord(fields.metadata) };
    delete meta.imdbId;
    delete meta.imdbID;
    delete meta.imdb;
    fields = {
      ...fields,
      externalKey: buildCatalogExternalKey(fields.categorySlug, fields.title, meta),
    };
  }

  if (!existing) {
    existing = await findCatalogByTitleMatch(prisma, input.categorySlug, input.title);
  }

  if (existing) {
    return enrichAndUpdateCatalogIfNeeded(prisma, existing, input);
  }

  try {
    return await catalogDb(prisma).create({
      data: {
        id: nanoid(),
        ...fields,
        updatedAt: new Date(),
      },
    });
  } catch (error) {
    // مسابقهٔ همزمان import روی همان externalKey
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002' &&
      fields.externalKey
    ) {
      const raced = await findCatalogByExternalKey(prisma, fields.externalKey);
      if (raced) return enrichAndUpdateCatalogIfNeeded(prisma, raced, input);
    }
    throw error;
  }
}

export async function createCatalogItem(
  prisma: PrismaClient,
  input: CatalogItemInput
) {
  return resolveOrCreateCatalogItem(prisma, input);
}

export async function syncPlacementsFromCatalog(
  prisma: PrismaClient,
  catalogItemId: string
) {
  const catalog = await catalogDb(prisma).findUnique({
    where: { id: catalogItemId },
  });
  if (!catalog) return;

  const { mergeCatalogIntoPlacement } = await import('@/lib/admin/placement-overrides');

  const placements = await prisma.items.findMany({
    where: { catalogItemId },
    select: {
      id: true,
      title: true,
      description: true,
      imageUrl: true,
      externalUrl: true,
      metadata: true,
    },
  });

  const now = new Date();
  for (const placement of placements) {
    const merged = mergeCatalogIntoPlacement({
      catalog,
      placement,
      catalogRefMetadata,
    });
    await prisma.items.update({
      where: { id: placement.id },
      data: {
        title: merged.title,
        description: merged.description,
        imageUrl: merged.imageUrl,
        externalUrl: merged.externalUrl,
        metadata: merged.metadata as Prisma.InputJsonValue,
        updatedAt: now,
      },
    });
  }
}

export async function isCatalogInList(
  prisma: PrismaClient,
  catalogItemId: string,
  listId: string
) {
  const row = await prisma.items.findFirst({
    where: { catalogItemId, listId, deletedAt: null },
    select: { id: true },
  });
  return !!row;
}

/**
 * آیتم‌های بدون تصویر/توضیح را به کاتالوگ غنی‌تر موجود وصل می‌کند
 * (برای تعمیر آیتم‌های تأییدشدهٔ قبلی)
 */
export async function relinkSparseItemToMatchingCatalog(
  prisma: PrismaClient,
  itemId: string
) {
  const item = await prisma.items.findUnique({
    where: { id: itemId },
    include: { lists: { include: { categories: true } } },
  });
  if (!item) return null;

  const categorySlug = item.lists?.categories?.slug ?? null;
  const matched = await findCatalogByTitleMatch(prisma, categorySlug, item.title);
  if (!matched) return null;

  const denorm = denormalizedItemFieldsFromCatalog(matched);
  const hasRicherData =
    (!item.imageUrl && denorm.imageUrl) ||
    (!item.description && denorm.description) ||
    (item.catalogItemId !== matched.id);

  if (!hasRicherData) return matched;

  const conflict = await prisma.items.findFirst({
    where: {
      listId: item.listId,
      catalogItemId: matched.id,
      NOT: { id: item.id },
    },
    select: { id: true },
  });
  if (conflict) return matched;

  await prisma.items.update({
    where: { id: itemId },
    data: {
      catalogItemId: matched.id,
      ...denorm,
      updatedAt: new Date(),
    },
  });

  return matched;
}

export type AddToListOptions = {
  catalogItemId: string;
  listId: string;
  order?: number;
  /**
   * insert — درج در موقعیت (با شیفت)؛ مقادیر بزرگ‌تر از انتها به انتهای لیست چسبانده می‌شوند.
   * absolute — همان عدد ذخیره‌ای (برای import موازی با ترتیب ازپیش‌یکتا).
   */
  orderMode?: 'insert' | 'absolute';
  listNote?: string | null;
  commentsEnabled?: boolean;
  maxComments?: number | null;
};

/** جایگاه درج در لیست؛ در صورت نیاز آیتم‌های بعدی را جابه‌جا می‌کند */
export async function resolveInsertOrder(
  prisma: PrismaClient,
  listId: string,
  requestedOrder: number | undefined,
  orderMode: 'insert' | 'absolute' = 'insert'
): Promise<number> {
  if (
    orderMode === 'absolute' &&
    requestedOrder !== undefined &&
    requestedOrder !== null &&
    !Number.isNaN(Number(requestedOrder))
  ) {
    return Math.max(0, Math.floor(Number(requestedOrder)));
  }

  const maxOrder = await prisma.items.aggregate({
    where: { listId, deletedAt: null },
    _max: { order: true },
  });
  const nextAppend = (maxOrder._max.order ?? -1) + 1;
  if (
    requestedOrder === undefined ||
    requestedOrder === null ||
    Number.isNaN(Number(requestedOrder))
  ) {
    return nextAppend;
  }
  const desired = Math.max(0, Math.floor(Number(requestedOrder)));
  if (desired >= nextAppend) return nextAppend;
  await prisma.items.updateMany({
    where: { listId, deletedAt: null, order: { gte: desired } },
    data: { order: { increment: 1 } },
  });
  return desired;
}

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

  const existingPlacement = await prisma.items.findFirst({
    where: { catalogItemId, listId },
    select: { id: true, deletedAt: true },
  });
  if (existingPlacement && !existingPlacement.deletedAt) {
    throw new Error('این آیتم قبلاً در این لیست وجود دارد');
  }

  const order = await resolveInsertOrder(
    prisma,
    listId,
    opts.order,
    opts.orderMode ?? 'insert'
  );

  const denorm = denormalizedItemFieldsFromCatalog(catalog);
  const placementMetadata = catalogRefMetadata(catalog, denorm.metadata);

  if (existingPlacement?.deletedAt) {
    const item = await prisma.items.update({
      where: { id: existingPlacement.id },
      data: {
        ...denorm,
        metadata: placementMetadata as Prisma.InputJsonValue,
        listNote: opts.listNote?.trim() || null,
        order,
        deletedAt: null,
        deletedById: null,
        deleteReason: null,
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

    if (isCatalogAdminDisabled(catalog.metadata)) {
      await prisma.item_moderation.upsert({
        where: { itemId: item.id },
        create: { itemId: item.id, status: 'HIDDEN', flagScore: 0 },
        update: { status: 'HIDDEN' },
      });
    }

    return item;
  }
  const item = await prisma.items.create({
    data: {
      id: nanoid(),
      ...denorm,
      metadata: placementMetadata as Prisma.InputJsonValue,
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

  if (isCatalogAdminDisabled(catalog.metadata)) {
    await prisma.item_moderation.upsert({
      where: { itemId: item.id },
      create: { itemId: item.id, status: 'HIDDEN', flagScore: 0 },
      update: { status: 'HIDDEN' },
    });
  }

  return item;
}

export type LightweightListItemInput = {
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  externalUrl?: string | null;
  listId: string;
  order?: number;
  listNote?: string | null;
  commentsEnabled?: boolean;
  maxComments?: number | null;
  metadata?: Prisma.InputJsonValue;
  entryKind?: EntryKind;
};

/** ورودی سبک در لیست — بدون کاتالوگ (tip/fact/link) */
export async function createLightweightListItem(
  prisma: PrismaClient,
  input: LightweightListItemInput
) {
  const entryKind = input.entryKind ?? 'tip';
  if (!isLightweightEntryKind(entryKind)) {
    throw new Error('نوع ورودی برای آیتم سبک نامعتبر است');
  }

  const list = await prisma.lists.findUnique({ where: { id: input.listId } });
  if (!list) throw new Error('لیست یافت نشد');

  let order = input.order;
  if (order === undefined) {
    const maxOrder = await prisma.items.aggregate({
      where: { listId: input.listId },
      _max: { order: true },
    });
    order = (maxOrder._max.order ?? -1) + 1;
  }

  const meta = {
    ...(input.metadata != null && typeof input.metadata === 'object' && !Array.isArray(input.metadata)
      ? (input.metadata as Record<string, unknown>)
      : {}),
    entryKind,
  };

  const item = await prisma.items.create({
    data: {
      id: nanoid(),
      title: input.title.trim(),
      description: input.description?.trim() || null,
      imageUrl: input.imageUrl?.trim() || null,
      externalUrl: input.externalUrl?.trim() || null,
      listId: input.listId,
      catalogItemId: null,
      listNote: input.listNote?.trim() || null,
      order,
      metadata: meta as Prisma.InputJsonValue,
      commentsEnabled: input.commentsEnabled ?? true,
      maxComments: input.maxComments ?? null,
      updatedAt: new Date(),
    },
    include: {
      lists: { include: { categories: true } },
    },
  });

  await prisma.lists.update({
    where: { id: input.listId },
    data: { itemCount: { increment: 1 } },
  });

  return item;
}

function rankCatalogSearchCandidates<
  T extends {
    title: string;
    description: string | null;
    metadata: unknown;
    updatedAt: Date;
  },
>(rows: T[], query: string): T[] {
  return rows
    .map((row) => ({
      row,
      score: scoreCatalogItemForSearch({
        title: row.title,
        description: row.description,
        metadata: row.metadata as Record<string, unknown> | null,
      }, query).score,
    }))
    .filter((entry) => entry.score >= CATALOG_SEARCH_MIN_SCORE)
    .filter((entry) => catalogTitleMatchesQuery(entry.row.title, query))
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.row.updatedAt.getTime() - a.row.updatedAt.getTime()
    )
    .map((entry) => entry.row);
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
    ...buildCatalogItemSearchFilter(query),
    ...(options?.categorySlug
      ? { categorySlug: options.categorySlug }
      : {}),
  };

  const candidates = await catalogDb(prisma).findMany({
    where,
    take: CATALOG_SEARCH_FETCH_CAP,
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

  const rows = rankCatalogSearchCandidates(candidates, query).slice(0, limit);

  const listId = options?.listId;
  let inListSet = new Set<string>();
  if (listId) {
    const inList = await prisma.items.findMany({
      where: { listId, catalogItemId: { in: rows.map((r) => r.id) }, deletedAt: null },
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

export type CatalogListFilter = {
  id: string;
  title: string;
  icon: string | null;
  count: number;
};

function catalogCategoryWhere(categorySlug?: string): Prisma.catalog_itemsWhereInput | undefined {
  if (!categorySlug) return undefined;
  if (categorySlug === '__none__') return { categorySlug: null };
  const slugs = expandCategorySlugFilter(categorySlug);
  if (slugs.length === 0) return undefined;
  if (slugs.length === 1) return { categorySlug: slugs[0] };
  return { categorySlug: { in: slugs } };
}

function itemsCategoryWhere(categorySlug?: string): Prisma.itemsWhereInput | undefined {
  const catalogWhere = catalogCategoryWhere(categorySlug);
  if (!catalogWhere) return undefined;
  return { catalog_items: { is: catalogWhere } };
}

export async function getCatalogListFilters(
  prisma: PrismaClient,
  options?: { categorySlug?: string }
): Promise<CatalogListFilter[]> {
  const itemWhere: Prisma.itemsWhereInput = {
    catalogItemId: { not: null },
    ...itemsCategoryWhere(options?.categorySlug),
  };

  const [lists, grouped] = await Promise.all([
    prisma.lists.findMany({
      where: { isActive: true, deletedAt: null },
      orderBy: { title: 'asc' },
      select: {
        id: true,
        title: true,
        categories: { select: { icon: true } },
      },
    }),
    prisma.items.groupBy({
      by: ['listId'],
      where: itemWhere,
      _count: { _all: true },
    }),
  ]);

  const countMap = new Map(grouped.map((g) => [g.listId, g._count._all]));

  const mapped = lists.map((l) => ({
    id: l.id,
    title: l.title,
    icon: l.categories?.icon ?? null,
    count: countMap.get(l.id) ?? 0,
  }));

  return mapped;
}

/** تعداد موجودیت‌هایی که در بیش از یک لیست قرار دارند */
export async function countMultiListCatalogItems(
  prisma: PrismaClient,
  options?: { categorySlug?: string; listId?: string }
): Promise<number> {
  const groups = await prisma.items.groupBy({
    by: ['catalogItemId'],
    where: {
      catalogItemId: { not: null },
      ...(options?.listId ? { listId: options.listId } : {}),
      ...itemsCategoryWhere(options?.categorySlug),
    },
    having: {
      catalogItemId: {
        _count: { gt: 1 },
      },
    },
  });

  return groups.filter((g) => g.catalogItemId != null).length;
}

async function catalogIdsInMultipleLists(
  prisma: PrismaClient,
  options: { categorySlug?: string; listId?: string }
): Promise<string[]> {
  const groups = await prisma.items.groupBy({
    by: ['catalogItemId'],
    where: {
      catalogItemId: { not: null },
      ...(options.listId ? { listId: options.listId } : {}),
      ...itemsCategoryWhere(options.categorySlug),
    },
    having: {
      catalogItemId: {
        _count: { gt: 1 },
      },
    },
  });

  return groups.map((g) => g.catalogItemId).filter((id): id is string => id != null);
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
  hasSearchProfile?: boolean;
  isDisabled?: boolean;
  /** وقتی placementListId داده شده — آیا در آن لیست جایگاه دارد */
  alreadyInList?: boolean;
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
    imageUrl: string | null;
    listCount: number;
  }>;
};

export async function listCatalogItems(
  prisma: PrismaClient,
  options: {
    q?: string;
    categorySlug?: string;
    listId?: string;
    /** لیست مقصد برای افزودن — فقط alreadyInList را پر می‌کند، فیلتر نمی‌کند */
    placementListId?: string;
    multiListOnly?: boolean;
    page?: number;
    perPage?: number;
  }
): Promise<{ rows: CatalogListRow[]; total: number }> {
  const page = Math.max(1, options.page ?? 1);
  const perPage = Math.min(50, Math.max(10, options.perPage ?? 24));
  const q = options.q?.trim();

  const where: Prisma.catalog_itemsWhereInput = {
    ...(q && q.length >= 2 ? buildCatalogItemSearchFilter(q) : {}),
    ...(catalogCategoryWhere(options.categorySlug) ?? {}),
    ...(options.listId
      ? { items: { some: { listId: options.listId, deletedAt: null } } }
      : {}),
  };

  if (options.multiListOnly) {
    const multiIds = await catalogIdsInMultipleLists(prisma, {
      categorySlug: options.categorySlug,
      listId: options.listId,
    });
    if (multiIds.length === 0) {
      return { rows: [], total: 0 };
    }
    where.id = { in: multiIds };
  }

  if (q && q.length >= 2) {
    const candidates = await catalogDb(prisma).findMany({
      where,
      take: CATALOG_SEARCH_FETCH_CAP,
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        description: true,
        imageUrl: true,
        categorySlug: true,
        externalKey: true,
        metadata: true,
        updatedAt: true,
        _count: { select: { items: true } },
      },
    });

    const ranked = rankCatalogSearchCandidates(candidates, q);
    const total = ranked.length;
    const pageRows = ranked.slice((page - 1) * perPage, page * perPage);

    let inPlacementListSet = new Set<string>();
    if (options.placementListId && pageRows.length > 0) {
      const placements = await prisma.items.findMany({
        where: {
          listId: options.placementListId,
          catalogItemId: { in: pageRows.map((r) => r.id) },
          deletedAt: null,
        },
        select: { catalogItemId: true },
      });
      inPlacementListSet = new Set(
        placements.map((p) => p.catalogItemId).filter((id): id is string => Boolean(id))
      );
    }

    return {
      total,
      rows: pageRows.map((r) => ({
        id: r.id,
        title: r.title,
        description: r.description,
        imageUrl: r.imageUrl,
        categorySlug: r.categorySlug,
        externalKey: r.externalKey,
        listCount: r._count.items,
        updatedAt: r.updatedAt.toISOString(),
        hasSearchProfile: catalogHasSearchProfile(r.metadata),
        isDisabled: isCatalogAdminDisabled(r.metadata),
        ...(options.placementListId
          ? { alreadyInList: inPlacementListSet.has(r.id) }
          : {}),
      })),
    };
  }

  const [rows, total] = await Promise.all([
    catalogDb(prisma).findMany({
      where,
      skip: (page - 1) * perPage,
      take: perPage,
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        imageUrl: true,
        categorySlug: true,
        externalKey: true,
        metadata: true,
        updatedAt: true,
        _count: { select: { items: true } },
      },
    }),
    catalogDb(prisma).count({ where }),
  ]);

  let inPlacementListSet = new Set<string>();
  if (options.placementListId && rows.length > 0) {
    const placements = await prisma.items.findMany({
      where: {
        listId: options.placementListId,
        catalogItemId: { in: rows.map((r) => r.id) },
        deletedAt: null,
      },
      select: { catalogItemId: true },
    });
    inPlacementListSet = new Set(
      placements.map((p) => p.catalogItemId).filter((id): id is string => Boolean(id))
    );
  }

  return {
    total,
      rows: rows.map((r) => ({
      id: r.id,
      title: r.title,
      description: null,
      imageUrl: r.imageUrl,
      categorySlug: r.categorySlug,
      externalKey: r.externalKey,
      listCount: r._count.items,
      updatedAt: r.updatedAt.toISOString(),
      hasSearchProfile: catalogHasSearchProfile(r.metadata),
      isDisabled: isCatalogAdminDisabled(r.metadata),
      ...(options.placementListId
        ? { alreadyInList: inPlacementListSet.has(r.id) }
        : {}),
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
    isDisabled: isCatalogAdminDisabled(catalog.metadata),
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
      where: { listId, catalogItemId: { in: rows.map((r) => r.id) }, deletedAt: null },
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

export type CatalogCategoryFilter = { slug: string | null; count: number; name?: string | null };

export async function getCatalogCategoryFilters(
  prisma: PrismaClient
): Promise<{ total: number; categories: CatalogCategoryFilter[] }> {
  const [total, grouped, dbCategories] = await Promise.all([
    catalogDb(prisma).count(),
    catalogDb(prisma).groupBy({
      by: ['categorySlug'],
      _count: { id: true },
    }),
    prisma.categories.findMany({
      where: { deletedAt: null, isActive: true },
      orderBy: { order: 'asc' },
      select: { slug: true, name: true, order: true },
    }),
  ]);

  const canonicalCategories = dedupeActiveCategoriesByAlias(dbCategories);
  const countByCanonical = new Map<string, number>(
    canonicalCategories.map((cat) => [cat.slug, 0])
  );
  let uncategorized = 0;

  for (const g of grouped) {
    const raw = g.categorySlug;
    const n = g._count.id;
    if (!raw) {
      uncategorized += n;
      continue;
    }

    const canonical = canonicalCategories.find((c) => isSameCategorySlug(c.slug, raw));
    if (canonical) {
      countByCanonical.set(canonical.slug, (countByCanonical.get(canonical.slug) ?? 0) + n);
    } else {
      uncategorized += n;
    }
  }

  const categories: CatalogCategoryFilter[] = canonicalCategories
    .map((cat) => ({
      slug: cat.slug,
      name: cat.name,
      count: countByCanonical.get(cat.slug) ?? 0,
    }))
    .filter((entry) => entry.count > 0);

  if (uncategorized > 0) {
    categories.push({ slug: '__none__', name: 'بدون دسته', count: uncategorized });
  }

  return { total, categories };
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

  if (externalKey && externalKey !== existing.externalKey) {
    const conflict = await findCatalogByExternalKey(prisma, externalKey);
    if (conflict && conflict.id !== id) {
      const livePlacements = await prisma.items.count({
        where: { catalogItemId: conflict.id, deletedAt: null },
      });
      if (livePlacements === 0) {
        // تکراری یتیم (فقط زباله یا بدون جایگاه) — کلید را آزاد کن
        await mergeCatalogItems(prisma, id, [conflict.id]);
      } else {
        throw new CatalogExternalKeyConflictError(conflict.id, conflict.title);
      }
    }
  }

  try {
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
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      const raced =
        externalKey != null ? await findCatalogByExternalKey(prisma, externalKey) : null;
      if (raced && raced.id !== id) {
        throw new CatalogExternalKeyConflictError(raced.id, raced.title);
      }
    }
    throw error;
  }
}

/** گروه‌های احتمالاً تکراری (عنوان نرمال + دسته) */
export type SimilarCatalogMatchReason =
  | 'exact_title'
  | 'primary_title'
  | 'external_key'
  | 'text_search';

export type SimilarCatalogRow = CatalogListRow & {
  matchReason: SimilarCatalogMatchReason;
  score: number;
};

const SIMILAR_MATCH_LABELS: Record<SimilarCatalogMatchReason, string> = {
  exact_title: 'عنوان یکسان',
  primary_title: 'عنوان اصلی مشابه',
  external_key: 'شناسه خارجی یکسان',
  text_search: 'جستجوی متنی',
};

export function similarCatalogMatchLabel(reason: SimilarCatalogMatchReason): string {
  return SIMILAR_MATCH_LABELS[reason];
}

function scoreCatalogSimilarity(
  anchor: { title: string; externalKey: string | null; categorySlug: string | null },
  candidate: { title: string; externalKey: string | null; categorySlug: string | null },
  textQuery?: string
): { score: number; matchReason: SimilarCatalogMatchReason } | null {
  if (
    anchor.externalKey &&
    candidate.externalKey &&
    anchor.externalKey.trim() === candidate.externalKey.trim()
  ) {
    return { score: 100, matchReason: 'external_key' };
  }

  const na = normalizeSuggestionTitle(anchor.title);
  const nc = normalizeSuggestionTitle(candidate.title);
  if (na && na === nc) {
    return { score: 95, matchReason: 'exact_title' };
  }

  if (catalogTitlesMatch(anchor.title, candidate.title)) {
    return { score: 85, matchReason: 'primary_title' };
  }

  if (textQuery && textQuery.trim().length >= 2) {
    const q = textQuery.trim().toLowerCase();
    if (
      nc.includes(q) ||
      candidate.externalKey?.toLowerCase().includes(q) ||
      normalizeSuggestionTitle(candidate.title).includes(q)
    ) {
      let score = 50;
      if (anchor.categorySlug && candidate.categorySlug === anchor.categorySlug) score += 10;
      return { score, matchReason: 'text_search' };
    }
  }

  return null;
}

function mapSimilarCatalogRow(
  row: {
    id: string;
    title: string;
    description: string | null;
    imageUrl: string | null;
    categorySlug: string | null;
    externalKey: string | null;
    updatedAt: Date;
    _count: { items: number };
  },
  scored: { score: number; matchReason: SimilarCatalogMatchReason }
): SimilarCatalogRow {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    imageUrl: row.imageUrl,
    categorySlug: row.categorySlug,
    externalKey: row.externalKey,
    listCount: row._count.items,
    updatedAt: row.updatedAt.toISOString(),
    score: scored.score,
    matchReason: scored.matchReason,
  };
}

/** جستجوی آیتم‌های مشابه کاتالوگ — بر اساس catalogId یا عبارت q */
export async function findSimilarCatalogItems(
  prisma: PrismaClient,
  options: {
    catalogId?: string;
    q?: string;
    categorySlug?: string;
    limit?: number;
  }
): Promise<{ anchor: { id: string | null; title: string; categorySlug: string | null } | null; rows: SimilarCatalogRow[] }> {
  const limit = Math.min(Math.max(options.limit ?? 20, 1), 50);
  const excludeId = options.catalogId?.trim() || null;
  const q = options.q?.trim() || '';
  const categorySlug = options.categorySlug?.trim() || undefined;

  let anchor: { id: string | null; title: string; externalKey: string | null; categorySlug: string | null } | null =
    null;

  if (excludeId) {
    const row = await catalogDb(prisma).findUnique({
      where: { id: excludeId },
      select: {
        id: true,
        title: true,
        externalKey: true,
        categorySlug: true,
      },
    });
    if (!row) return { anchor: null, rows: [] };
    anchor = row;
  } else if (q.length >= 2) {
    anchor = { id: null, title: q, externalKey: null, categorySlug: categorySlug ?? null };
  } else {
    return { anchor: null, rows: [] };
  }

  const orConditions: Prisma.catalog_itemsWhereInput[] = [];
  const primary = primarySuggestionTitle(anchor.title);
  const normalized = normalizeSuggestionTitle(anchor.title);

  if (primary.length >= 3) {
    orConditions.push({ title: { contains: primary, mode: 'insensitive' } });
  }
  if (anchor.externalKey?.trim()) {
    orConditions.push({ externalKey: anchor.externalKey.trim() });
  }
  if (normalized.length >= 4) {
    orConditions.push({
      title: { contains: normalized.slice(0, Math.min(24, normalized.length)), mode: 'insensitive' },
    });
  }
  if (q.length >= 2 && !excludeId) {
    orConditions.push(
      { title: { contains: q, mode: 'insensitive' } },
      { externalKey: { contains: q, mode: 'insensitive' } }
    );
  }

  if (orConditions.length === 0) {
    return { anchor: { id: anchor.id, title: anchor.title, categorySlug: anchor.categorySlug }, rows: [] };
  }

  const where: Prisma.catalog_itemsWhereInput = {
    OR: orConditions,
    ...(excludeId ? { NOT: { id: excludeId } } : {}),
    ...(categorySlug ? { categorySlug } : anchor.categorySlug ? { categorySlug: anchor.categorySlug } : {}),
  };

  const candidates = await catalogDb(prisma).findMany({
    where,
    take: 120,
    orderBy: { updatedAt: 'desc' },
    include: { _count: { select: { items: true } } },
  });

  const scoredMap = new Map<string, SimilarCatalogRow>();
  for (const row of candidates) {
    const scored = scoreCatalogSimilarity(anchor, row, q || anchor.title);
    if (!scored) continue;
    const existing = scoredMap.get(row.id);
    if (!existing || scored.score > existing.score) {
      scoredMap.set(row.id, mapSimilarCatalogRow(row, scored));
    }
  }

  const rows = [...scoredMap.values()]
    .sort((a, b) => b.score - a.score || b.listCount - a.listCount)
    .slice(0, limit);

  return {
    anchor: { id: anchor.id, title: anchor.title, categorySlug: anchor.categorySlug },
    rows,
  };
}

type DuplicateCatalogMember = DuplicateCatalogGroup['catalogs'][number];

function toDuplicateMember(row: {
  id: string;
  title: string;
  externalKey: string | null;
  imageUrl: string | null;
  _count: { items: number };
}): DuplicateCatalogMember {
  return {
    id: row.id,
    title: row.title,
    externalKey: row.externalKey,
    imageUrl: row.imageUrl,
    listCount: row._count.items,
  };
}

/** خوشه‌بندی با اتحاد عناوینی که catalogTitlesMatch می‌شوند */
function clusterByTitleMatch<T extends { id: string; title: string }>(
  candidates: T[]
): T[][] {
  if (candidates.length < 2) return [];
  const parent = new Map<string, string>();
  for (const c of candidates) parent.set(c.id, c.id);
  const find = (id: string): string => {
    const p = parent.get(id) ?? id;
    if (p !== id) {
      const root = find(p);
      parent.set(id, root);
      return root;
    }
    return p;
  };
  const union = (a: string, b: string) => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent.set(ra, rb);
  };

  for (let i = 0; i < candidates.length; i++) {
    for (let j = i + 1; j < candidates.length; j++) {
      if (catalogTitlesMatch(candidates[i]!.title, candidates[j]!.title)) {
        union(candidates[i]!.id, candidates[j]!.id);
      }
    }
  }

  const clusters = new Map<string, T[]>();
  for (const c of candidates) {
    const root = find(c.id);
    const list = clusters.get(root) ?? [];
    list.push(c);
    clusters.set(root, list);
  }
  return [...clusters.values()].filter((list) => list.length >= 2);
}

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
      imageUrl: true,
      _count: { select: { items: true } },
    },
    orderBy: { title: 'asc' },
    take: 8000,
  });

  const groups: DuplicateCatalogGroup[] = [];
  const covered = new Set<string>();

  const byExact = new Map<string, typeof rows>();
  for (const row of rows) {
    const norm = normalizeSuggestionTitle(row.title);
    if (!norm) continue;
    const key = `${row.categorySlug ?? ''}::exact::${norm}`;
    const list = byExact.get(key) ?? [];
    list.push(row);
    byExact.set(key, list);
  }

  for (const [groupKey, groupRows] of byExact) {
    if (groupRows.length < 2) continue;
    const catalogs = sortCatalogsForMerge(groupRows.map(toDuplicateMember));
    for (const c of catalogs) covered.add(c.id);
    const sep = groupKey.indexOf('::exact::');
    const categorySlug = sep > 0 ? groupKey.slice(0, sep) || null : null;
    const normalizedTitle = sep >= 0 ? groupKey.slice(sep + '::exact::'.length) : groupKey;
    groups.push({ groupKey, categorySlug, normalizedTitle, catalogs });
  }

  const byPrimary = new Map<string, typeof rows>();
  for (const row of rows) {
    if (covered.has(row.id)) continue;
    const primary = primarySuggestionTitle(row.title);
    if (primary.length < 3) continue;
    const key = `${row.categorySlug ?? ''}::primary::${primary}`;
    const list = byPrimary.get(key) ?? [];
    list.push(row);
    byPrimary.set(key, list);
  }

  for (const [groupKey, groupRows] of byPrimary) {
    const available = groupRows.filter((r) => !covered.has(r.id));
    if (available.length < 2) continue;
    for (const cluster of clusterByTitleMatch(available)) {
      const catalogs = sortCatalogsForMerge(cluster.map(toDuplicateMember));
      for (const c of catalogs) covered.add(c.id);
      const sep = groupKey.indexOf('::primary::');
      const categorySlug = sep > 0 ? groupKey.slice(0, sep) || null : null;
      const primaryLabel = sep >= 0 ? groupKey.slice(sep + '::primary::'.length) : groupKey;
      groups.push({
        groupKey: `${groupKey}::${catalogs.map((c) => c.id).sort().join('+')}`,
        categorySlug,
        normalizedTitle: primaryLabel,
        catalogs,
      });
    }
  }

  return groups
    .sort((a, b) => b.catalogs.length - a.catalogs.length)
    .slice(0, limit);
}

/** مقصد پیشنهادی اول — بیشترین جایگاه در لیست */
export function pickSuggestedMergeTarget(
  catalogs: DuplicateCatalogGroup['catalogs']
): string {
  return sortCatalogsForMerge(catalogs)[0]?.id ?? '';
}

function sortCatalogsForMerge(catalogs: DuplicateCatalogGroup['catalogs']) {
  return [...catalogs].sort((a, b) => b.listCount - a.listCount || a.title.localeCompare(b.title, 'fa'));
}

export type MergeCatalogResult = {
  mergedPlacements: number;
  removedDuplicatePlacements: number;
  deletedCatalogs: number;
};

/** حذف کامل موجودیت کاتالوگ و انتقال جایگاه‌ها به زباله‌دان */
export async function deleteCatalogItemCompletely(
  prisma: PrismaClient,
  catalogId: string,
  deletedById?: string | null
): Promise<{ softDeletedPlacements: number; deletedCatalog: boolean }> {
  const catalog = await catalogDb(prisma).findUnique({
    where: { id: catalogId },
    select: { id: true },
  });
  if (!catalog) throw new Error('آیتم کاتالوگ یافت نشد');

  const { softDeleteItems } = await import('@/lib/admin/item-trash');
  const placements = await prisma.items.findMany({
    where: { catalogItemId: catalogId, deletedAt: null },
    select: { id: true },
  });
  const softDeletedPlacements = await softDeleteItems(
    prisma,
    placements.map((p) => p.id),
    deletedById,
    'حذف کامل کاتالوگ'
  );
  await prisma.catalog_items.delete({ where: { id: catalogId } });
  return { softDeletedPlacements, deletedCatalog: true };
}

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

export type CatalogExternalImageRow = {
  id: string;
  title: string;
  imageUrl: string;
  listCount: number;
  host: string;
  isHidden: boolean;
};

/** موجودیت‌های کاتالوگ با تصویر خارج از ParsPack — همان فیلترهای صفحه مرور */
export async function listCatalogExternalImageItems(
  prisma: PrismaClient,
  options: {
    categorySlug?: string;
    listId?: string;
    multiListOnly?: boolean;
  }
): Promise<CatalogExternalImageRow[]> {
  const { externalImageHost, needsS3MigrationImageUrl } = await import('@/lib/item-image-storage');

  const where: Prisma.catalog_itemsWhereInput = {
    ...(catalogCategoryWhere(options.categorySlug) ?? {}),
    ...(options.listId ? { items: { some: { listId: options.listId, deletedAt: null } } } : {}),
  };

  if (options.multiListOnly) {
    const multiIds = await catalogIdsInMultipleLists(prisma, {
      categorySlug: options.categorySlug,
      listId: options.listId,
    });
    if (multiIds.length === 0) return [];
    where.id = { in: multiIds };
  }

  const rows = await catalogDb(prisma).findMany({
    where,
    orderBy: { title: 'asc' },
    include: { _count: { select: { items: true } } },
  });

  return rows
    .map((r) => ({
      id: r.id,
      title: r.title,
      imageUrl: r.imageUrl?.trim() || '',
      listCount: r._count.items,
      host: r.imageUrl ? externalImageHost(r.imageUrl) : '',
      isHidden: isCatalogAdminDisabled(r.metadata),
    }))
    .filter((r) => needsS3MigrationImageUrl(r.imageUrl));
}

export type CatalogMissingPosterRow = {
  id: string;
  title: string;
  imdbId: string | null;
  listCount: number;
  isHidden: boolean;
};

/** موجودیت‌های کاتالوگ بدون تصویر معتبر — با یا بدون شناسه IMDb */
export async function listCatalogMissingPosterItems(
  prisma: PrismaClient,
  options: {
    categorySlug?: string;
    listId?: string;
    multiListOnly?: boolean;
  }
): Promise<CatalogMissingPosterRow[]> {
  const where: Prisma.catalog_itemsWhereInput = {
    ...(catalogCategoryWhere(options.categorySlug) ?? {}),
    ...(options.listId ? { items: { some: { listId: options.listId, deletedAt: null } } } : {}),
  };

  if (options.multiListOnly) {
    const multiIds = await catalogIdsInMultipleLists(prisma, {
      categorySlug: options.categorySlug,
      listId: options.listId,
    });
    if (multiIds.length === 0) return [];
    where.id = { in: multiIds };
  }

  const rows = await catalogDb(prisma).findMany({
    where,
    orderBy: { title: 'asc' },
    include: { _count: { select: { items: true } } },
  });

  return rows
    .filter((r) => catalogMissingPosterImage(r.imageUrl))
    .map((r) => ({
      id: r.id,
      title: r.title,
      imdbId: extractCatalogImdbId({
        metadata: r.metadata,
        externalUrl: r.externalUrl,
        externalKey: r.externalKey,
      }),
      listCount: r._count.items,
      isHidden: isCatalogAdminDisabled(r.metadata),
    }));
}
