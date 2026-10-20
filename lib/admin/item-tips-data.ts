import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import { type ItemTipRow, type ItemTipsPageData } from '@/lib/admin/item-tip-import';

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

  const rows = await dbQuery(() => loadTipRows(initialCategoryId, initialListId));

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

type TipSqlRow = {
  id: string;
  title: string;
  catalogItemId: string | null;
  listId: string;
  listTitle: string;
  categoryId: string | null;
  categoryName: string | null;
  tip: string | null;
};

/** فقط متن نکته، بدون کل metadata آیتم و کاتالوگ. */
async function loadTipRows(categoryId: string, listId: string): Promise<ItemTipRow[]> {
  const rows = await prisma.$queryRaw<TipSqlRow[]>(Prisma.sql`
    SELECT
      i.id,
      i.title,
      i."catalogItemId",
      i."listId",
      l.title AS "listTitle",
      l."categoryId",
      cat.name AS "categoryName",
      NULLIF(
        btrim(
          COALESCE(
            NULLIF(btrim(i.metadata->>'tip'), ''),
            NULLIF(btrim(c.metadata->>'tip'), '')
          )
        ),
        ''
      ) AS tip
    FROM items i
    INNER JOIN lists l ON i."listId" = l.id
    LEFT JOIN categories cat ON l."categoryId" = cat.id
    LEFT JOIN catalog_items c ON i."catalogItemId" = c.id
    WHERE i."deletedAt" IS NULL
      AND l."deletedAt" IS NULL
      AND l."isActive" = true
      AND (
        (${listId} <> '' AND l.id = ${listId})
        OR (
          ${listId} = ''
          AND (${categoryId} = '' OR l."categoryId" = ${categoryId})
        )
      )
    ORDER BY l.title ASC, i."order" ASC
  `);

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    tip: row.tip,
    listId: row.listId,
    listTitle: row.listTitle,
    categoryId: row.categoryId,
    categoryName: row.categoryName ?? '—',
    catalogItemId: row.catalogItemId,
  }));
}
