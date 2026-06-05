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
