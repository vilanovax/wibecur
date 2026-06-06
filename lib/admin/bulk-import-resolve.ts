import type { PrismaClient } from '@prisma/client';
import { validateMetadata } from '@/lib/schemas/item-metadata';
import {
  buildCatalogExternalKey,
  findCatalogByExternalKey,
  isCatalogInList,
} from '@/lib/catalog-items';
export type BulkImportMatchKind = 'new' | 'existing_catalog' | 'already_in_list';

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

export async function resolveBulkImportMatch(
  prisma: PrismaClient,
  categorySlug: string,
  listId: string,
  row: { title?: string; metadata?: unknown }
): Promise<BulkImportMatch> {
  const title = row.title?.trim();
  if (!title) {
    return {
      kind: 'new',
      externalKey: null,
      catalogId: null,
      catalogTitle: null,
      listCount: 0,
      inTargetList: false,
      sampleListTitles: [],
      error: 'عنوان خالی',
    };
  }

  const metaResult = validateMetadata(categorySlug, row.metadata ?? {});
  const meta = metaResult.success ? metaResult.data ?? {} : {};
  const externalKey = buildCatalogExternalKey(categorySlug, title, meta);

  let catalog =
    externalKey != null ? await findCatalogByExternalKey(prisma, externalKey) : null;

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

  const [listCount, inTargetList, placements] = await Promise.all([
    prisma.items.count({ where: { catalogItemId: catalog.id } }),
    isCatalogInList(prisma, catalog.id, listId),
    prisma.items.findMany({
      where: { catalogItemId: catalog.id },
      select: { lists: { select: { title: true } } },
      take: 4,
    }),
  ]);

  const sampleListTitles = [
    ...new Set(placements.map((p) => p.lists?.title).filter(Boolean)),
  ] as string[];

  return {
    kind: inTargetList ? 'already_in_list' : 'existing_catalog',
    externalKey,
    catalogId: catalog.id,
    catalogTitle: catalog.title,
    listCount,
    inTargetList,
    sampleListTitles,
  };
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

/** تطبیق گروهی — چند کوئری به‌جای N× کوئری جدا */
export async function resolveBulkImportMatchesBatch(
  prisma: PrismaClient,
  categorySlug: string,
  listId: string,
  rows: { title?: string; metadata?: unknown }[]
): Promise<BulkImportMatch[]> {
  type RowKey = {
    index: number;
    title: string;
    externalKey: string | null;
  };

  const rowKeys: RowKey[] = rows.map((row, index) => {
    const title = row.title?.trim() ?? '';
    if (!title) return { index, title: '', externalKey: null };
    const metaResult = validateMetadata(categorySlug, row.metadata ?? {});
    const meta = metaResult.success ? metaResult.data ?? {} : {};
    const externalKey = buildCatalogExternalKey(categorySlug, title, meta);
    return { index, title, externalKey };
  });

  const uniqueKeys = [
    ...new Set(rowKeys.map((r) => r.externalKey).filter(Boolean)),
  ] as string[];

  const catalogs =
    uniqueKeys.length > 0
      ? await prisma.catalog_items.findMany({
          where: { externalKey: { in: uniqueKeys } },
          select: { id: true, title: true, externalKey: true },
        })
      : [];

  const catalogByKey = new Map(
    catalogs
      .filter((c) => c.externalKey)
      .map((c) => [c.externalKey as string, c])
  );
  const catalogIds = catalogs.map((c) => c.id);

  const [inListPlacements, listCounts, allPlacements] = await Promise.all([
    catalogIds.length > 0
      ? prisma.items.findMany({
          where: { catalogItemId: { in: catalogIds }, listId },
          select: { catalogItemId: true },
        })
      : Promise.resolve([]),
    catalogIds.length > 0
      ? prisma.items.groupBy({
          by: ['catalogItemId'],
          where: { catalogItemId: { in: catalogIds } },
          _count: { id: true },
        })
      : Promise.resolve([]),
    catalogIds.length > 0
      ? prisma.items.findMany({
          where: { catalogItemId: { in: catalogIds } },
          select: {
            catalogItemId: true,
            lists: { select: { title: true } },
          },
        })
      : Promise.resolve([]),
  ]);

  const inTargetSet = new Set(
    inListPlacements.map((p) => p.catalogItemId).filter(Boolean)
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

  return rowKeys.map(({ title, externalKey }) => {
    if (!title) return emptyMatch('عنوان خالی');
    if (!externalKey) {
      return { ...emptyMatch(), kind: 'new' as const, externalKey: null };
    }

    const catalog = catalogByKey.get(externalKey);
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
  });
}
