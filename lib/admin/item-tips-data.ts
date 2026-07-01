import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import { resolveStoredItemTip, type ItemTipRow, type ItemTipsPageData } from '@/lib/admin/item-tip-import';

function dedupeItemTipRows(rows: ItemTipRow[]): ItemTipRow[] {
  const seen = new Map<string, ItemTipRow>();
  for (const row of rows) {
    const key = row.catalogItemId ?? row.id;
    if (!seen.has(key)) seen.set(key, row);
  }
  return [...seen.values()];
}

export async function loadItemTipsPageData(options?: {
  categoryId?: string;
  listId?: string;
}): Promise<ItemTipsPageData> {
  const [categoriesRaw, listsRaw] = await Promise.all([
    dbQuery(() =>
      prisma.categories.findMany({
        where: { deletedAt: null, isActive: true },
        orderBy: { order: 'asc' },
        select: { id: true, name: true, slug: true, icon: true },
      })
    ),
    dbQuery(() =>
      prisma.lists.findMany({
        where: { deletedAt: null, isActive: true },
        orderBy: { title: 'asc' },
        select: { id: true, title: true, categoryId: true, itemCount: true },
      })
    ),
  ]);

  const initialListId = options?.listId?.trim() || '';
  let initialCategoryId = options?.categoryId?.trim() || '';
  if (!initialCategoryId && !initialListId && categoriesRaw[0]) {
    initialCategoryId = categoriesRaw[0].id;
  }

  const listFilter = initialListId ? { id: initialListId } : undefined;
  const categoryFilter =
    !initialListId && initialCategoryId
      ? { categoryId: initialCategoryId }
      : undefined;

  const itemsRaw = await dbQuery(() =>
    prisma.items.findMany({
      where: {
        deletedAt: null,
        lists: {
          deletedAt: null,
          isActive: true,
          ...listFilter,
          ...categoryFilter,
        },
      },
      orderBy: [{ lists: { title: 'asc' } }, { order: 'asc' }],
      select: {
        id: true,
        title: true,
        metadata: true,
        catalogItemId: true,
        listId: true,
        lists: {
          select: {
            title: true,
            categoryId: true,
            categories: { select: { id: true, name: true } },
          },
        },
        catalog_items: { select: { metadata: true } },
      },
    })
  );

  const rows: ItemTipRow[] = itemsRaw.map((item) => {
    const itemMeta = asMetaRecord(item.metadata);
    const catalogMeta = asMetaRecord(item.catalog_items?.metadata);
    return {
      id: item.id,
      title: item.title,
      tip: resolveStoredItemTip(itemMeta, catalogMeta),
      listId: item.listId,
      listTitle: item.lists.title,
      categoryId: item.lists.categoryId,
      categoryName: item.lists.categories?.name ?? '—',
      catalogItemId: item.catalogItemId,
    };
  });

  const items =
    initialListId || !initialCategoryId ? rows : dedupeItemTipRows(rows);

  return {
    items,
    categories: categoriesRaw,
    lists: listsRaw,
    initialCategoryId,
    initialListId,
  };
}

function asMetaRecord(value: unknown): Record<string, unknown> | null {
  if (value != null && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}
