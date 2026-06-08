import type { PrismaClient } from '@prisma/client';
import { validateMetadata } from '@/lib/schemas/item-metadata';
import { normalizeBulkImportMetadata, isBulkImportLightweightRow } from '@/lib/admin/bulk-import';
import {
  buildCatalogExternalKey,
  findCatalogByExternalKey,
  findCatalogByTitleMatch,
  isCatalogInList,
} from '@/lib/catalog-items';

export type BulkImportMatchKind = 'new' | 'existing_catalog' | 'already_in_list' | 'lightweight';

export type BulkImportMatch = {
  kind: BulkImportMatchKind;
  externalKey: string | null;
  catalogId: string | null;
  catalogTitle: string | null;
  listCount: number;
  inTargetList: boolean;
  sampleListTitles: string[];
  error?: string;
};

export type BulkImportRowInput = {
  title?: string;
  description?: string;
  metadata?: unknown;
  externalUrl?: string | null;
  entryKind?: string;
  imageUrl?: string | null;
};

function lightweightMatch(): BulkImportMatch {
  return {
    kind: 'lightweight',
    externalKey: null,
    catalogId: null,
    catalogTitle: null,
    listCount: 0,
    inTargetList: false,
    sampleListTitles: [],
  };
}

type CatalogRef = {
  id: string;
  title: string;
  externalKey: string | null;
};

/** کلید خارجی + متادیتا — imdb از externalUrl هم لحاظ می‌شود */
export function buildBulkImportExternalKey(
  categorySlug: string,
  row: BulkImportRowInput
): { title: string; externalKey: string | null } {
  const title = row.title?.trim() ?? '';
  if (!title) return { title: '', externalKey: null };

  const metaInput = normalizeBulkImportMetadata(
    categorySlug,
    (row.metadata ?? {}) as Record<string, unknown>,
    row.externalUrl
  );
  const metaResult = validateMetadata(categorySlug, metaInput);
  const meta = metaResult.success ? metaResult.data ?? {} : {};
  const externalKey = buildCatalogExternalKey(categorySlug, title, meta);
  return { title, externalKey };
}

async function resolveCatalogByTitlesBatch(
  prisma: PrismaClient,
  categorySlug: string,
  titles: string[]
): Promise<Map<string, CatalogRef>> {
  const result = new Map<string, CatalogRef>();
  const unique = [...new Set(titles.filter(Boolean))];
  await Promise.all(
    unique.map(async (title) => {
      const found = await findCatalogByTitleMatch(prisma, categorySlug, title);
      if (found) {
        result.set(title, {
          id: found.id,
          title: found.title,
          externalKey: found.externalKey,
        });
      }
    })
  );
  return result;
}

function emptyMatch(error?: string): BulkImportMatch {
  return {
    kind: 'new',
    externalKey: null,
    catalogId: null,
    catalogTitle: null,
    listCount: 0,
    inTargetList: false,
    sampleListTitles: [],
    error,
  };
}

function matchFromCatalog(
  externalKey: string | null,
  catalog: CatalogRef,
  inTargetSet: Set<string>,
  countByCatalog: Map<string | null, number>,
  samplesByCatalog: Map<string, string[]>
): BulkImportMatch {
  const inTargetList = inTargetSet.has(catalog.id);
  return {
    kind: inTargetList ? 'already_in_list' : 'existing_catalog',
    externalKey,
    catalogId: catalog.id,
    catalogTitle: catalog.title,
    listCount: countByCatalog.get(catalog.id) ?? 0,
    inTargetList,
    sampleListTitles: samplesByCatalog.get(catalog.id) ?? [],
  };
}

async function loadCatalogListStats(
  prisma: PrismaClient,
  catalogIds: string[],
  listId: string
) {
  if (catalogIds.length === 0) {
    return {
      inTargetSet: new Set<string>(),
      countByCatalog: new Map<string | null, number>(),
      samplesByCatalog: new Map<string, string[]>(),
    };
  }

  const [inListPlacements, listCounts, allPlacements] = await Promise.all([
    prisma.items.findMany({
      where: { catalogItemId: { in: catalogIds }, listId },
      select: { catalogItemId: true },
    }),
    prisma.items.groupBy({
      by: ['catalogItemId'],
      where: { catalogItemId: { in: catalogIds } },
      _count: { id: true },
    }),
    prisma.items.findMany({
      where: { catalogItemId: { in: catalogIds } },
      select: {
        catalogItemId: true,
        lists: { select: { title: true } },
      },
    }),
  ]);

  const inTargetSet = new Set(
    inListPlacements.map((p) => p.catalogItemId).filter(Boolean) as string[]
  );
  const countByCatalog = new Map(
    listCounts.map((g) => [g.catalogItemId, g._count.id])
  );
  const samplesByCatalog = new Map<string, string[]>();
  for (const p of allPlacements) {
    if (!p.catalogItemId) continue;
    const listTitle = p.lists?.title;
    if (!listTitle) continue;
    const arr = samplesByCatalog.get(p.catalogItemId) ?? [];
    if (!arr.includes(listTitle) && arr.length < 4) arr.push(listTitle);
    samplesByCatalog.set(p.catalogItemId, arr);
  }

  return { inTargetSet, countByCatalog, samplesByCatalog };
}

export async function resolveBulkImportMatch(
  prisma: PrismaClient,
  categorySlug: string,
  listId: string,
  row: BulkImportRowInput
): Promise<BulkImportMatch> {
  const { title, externalKey } = buildBulkImportExternalKey(categorySlug, row);
  if (!title) return emptyMatch('عنوان خالی');

  let catalog: CatalogRef | null = null;
  if (externalKey != null) {
    const byKey = await findCatalogByExternalKey(prisma, externalKey);
    if (byKey) {
      catalog = {
        id: byKey.id,
        title: byKey.title,
        externalKey: byKey.externalKey,
      };
    }
  }
  if (!catalog) {
    const byTitle = await findCatalogByTitleMatch(prisma, categorySlug, title);
    if (byTitle) {
      catalog = {
        id: byTitle.id,
        title: byTitle.title,
        externalKey: byTitle.externalKey,
      };
    }
  }

  if (!catalog) {
    return {
      kind: 'new',
      externalKey,
      catalogId: null,
      catalogTitle: null,
      listCount: 0,
      inTargetList: false,
      sampleListTitles: [],
    };
  }

  const { inTargetSet, countByCatalog, samplesByCatalog } = await loadCatalogListStats(
    prisma,
    [catalog.id],
    listId
  );

  return matchFromCatalog(externalKey, catalog, inTargetSet, countByCatalog, samplesByCatalog);
}

/** تطبیق گروهی — کلید خارجی + تطبیق عنوان، چند کوئری به‌جای N× کوئری جدا */
export async function resolveBulkImportMatchesBatch(
  prisma: PrismaClient,
  categorySlug: string,
  listId: string,
  rows: BulkImportRowInput[]
): Promise<BulkImportMatch[]> {
  type RowKey = {
    index: number;
    title: string;
    externalKey: string | null;
  };

  const rowKeys: RowKey[] = rows.map((row, index) => {
    const { title, externalKey } = buildBulkImportExternalKey(categorySlug, row);
    return { index, title, externalKey };
  });

  const uniqueKeys = [
    ...new Set(rowKeys.map((r) => r.externalKey).filter(Boolean)),
  ] as string[];

  const catalogsByKey =
    uniqueKeys.length > 0
      ? await prisma.catalog_items.findMany({
          where: { externalKey: { in: uniqueKeys } },
          select: { id: true, title: true, externalKey: true },
        })
      : [];

  const catalogByKey = new Map(
    catalogsByKey
      .filter((c) => c.externalKey)
      .map((c) => [c.externalKey as string, c])
  );

  const catalogByRowIndex = new Map<number, CatalogRef>();
  for (let i = 0; i < rowKeys.length; i++) {
    const { externalKey } = rowKeys[i];
    if (!externalKey) continue;
    const catalog = catalogByKey.get(externalKey);
    if (catalog) catalogByRowIndex.set(i, catalog);
  }

  const titlesForMatch: string[] = [];
  for (let i = 0; i < rowKeys.length; i++) {
    if (catalogByRowIndex.has(i)) continue;
    const { title } = rowKeys[i];
    if (title) titlesForMatch.push(title);
  }

  const catalogByTitle = await resolveCatalogByTitlesBatch(
    prisma,
    categorySlug,
    titlesForMatch
  );
  for (let i = 0; i < rowKeys.length; i++) {
    if (catalogByRowIndex.has(i)) continue;
    const { title } = rowKeys[i];
    const catalog = title ? catalogByTitle.get(title) : undefined;
    if (catalog) catalogByRowIndex.set(i, catalog);
  }

  const allCatalogIds = [...new Set([...catalogByRowIndex.values()].map((c) => c.id))];
  const { inTargetSet, countByCatalog, samplesByCatalog } = await loadCatalogListStats(
    prisma,
    allCatalogIds,
    listId
  );

  return rowKeys.map(({ title, externalKey }, index) => {
    const row = rows[index];
    const meta = normalizeBulkImportMetadata(
      categorySlug,
      (row.metadata ?? {}) as Record<string, unknown>,
      row.externalUrl
    );
    if (
      isBulkImportLightweightRow(categorySlug, {
        metadata: meta,
        entryKind: row.entryKind ?? meta.entryKind,
      })
    ) {
      return lightweightMatch();
    }

    if (!title) return emptyMatch('عنوان خالی');

    const catalog = catalogByRowIndex.get(index);
    if (!catalog) {
      return {
        kind: 'new',
        externalKey,
        catalogId: null,
        catalogTitle: null,
        listCount: 0,
        inTargetList: false,
        sampleListTitles: [],
      };
    }

    return matchFromCatalog(
      externalKey,
      catalog,
      inTargetSet,
      countByCatalog,
      samplesByCatalog
    );
  });
}

/** پیدا کردن کاتالوگ موجود برای import — کلید + عنوان */
export async function resolveBulkImportCatalogId(
  prisma: PrismaClient,
  categorySlug: string,
  row: BulkImportRowInput
): Promise<string | null> {
  const { title, externalKey } = buildBulkImportExternalKey(categorySlug, row);
  if (!title) return null;

  if (externalKey != null) {
    const byKey = await findCatalogByExternalKey(prisma, externalKey);
    if (byKey) return byKey.id;
  }

  const byTitle = await findCatalogByTitleMatch(prisma, categorySlug, title);
  return byTitle?.id ?? null;
}
