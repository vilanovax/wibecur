import { prisma } from '@/lib/prisma';

export type TrashEntity = 'lists' | 'categories' | 'items';

export type TrashCounts = {
  lists: number;
  categories: number;
  items: number;
  total: number;
};

export type TrashListRow = {
  id: string;
  title: string;
  slug: string;
  deletedAt: string;
  deleteReason: string | null;
  saveCount: number;
  itemCount: number;
  deletedBy: { name: string | null; email: string | null } | null;
};

export type TrashCategoryRow = {
  id: string;
  name: string;
  slug: string;
  icon: string;
  deletedAt: string;
  deleteReason: string | null;
  listCount: number;
  deletedBy: { name: string | null; email: string | null } | null;
};

export type TrashItemRow = {
  id: string;
  title: string;
  deletedAt: string;
  deleteReason: string | null;
  list: { id: string; title: string; slug: string } | null;
  deletedBy: { name: string | null; email: string | null } | null;
};

const DELETED_BY_SELECT = {
  select: { name: true, email: true },
} as const;

export async function getTrashCounts(): Promise<TrashCounts> {
  const [lists, categories, items] = await Promise.all([
    prisma.lists.count({ where: { deletedAt: { not: null } } }),
    prisma.categories.count({ where: { deletedAt: { not: null } } }),
    prisma.items.count({ where: { deletedAt: { not: null } } }),
  ]);

  return {
    lists,
    categories,
    items,
    total: lists + categories + items,
  };
}

export async function getTrashLists(): Promise<TrashListRow[]> {
  const rows = await prisma.lists.findMany({
    where: { deletedAt: { not: null } },
    orderBy: { deletedAt: 'desc' },
    select: {
      id: true,
      title: true,
      slug: true,
      deletedAt: true,
      deleteReason: true,
      saveCount: true,
      itemCount: true,
      deletedBy: DELETED_BY_SELECT,
    },
  });

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    slug: row.slug,
    deletedAt: row.deletedAt!.toISOString(),
    deleteReason: row.deleteReason,
    saveCount: row.saveCount,
    itemCount: row.itemCount,
    deletedBy: row.deletedBy,
  }));
}

export async function getTrashCategories(): Promise<TrashCategoryRow[]> {
  const rows = await prisma.categories.findMany({
    where: { deletedAt: { not: null } },
    orderBy: { deletedAt: 'desc' },
    select: {
      id: true,
      name: true,
      slug: true,
      icon: true,
      deletedAt: true,
      deleteReason: true,
      deletedBy: DELETED_BY_SELECT,
      _count: { select: { lists: true } },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    icon: row.icon,
    deletedAt: row.deletedAt!.toISOString(),
    deleteReason: row.deleteReason,
    listCount: row._count.lists,
    deletedBy: row.deletedBy,
  }));
}

export async function getTrashItems(): Promise<TrashItemRow[]> {
  const rows = await prisma.items.findMany({
    where: { deletedAt: { not: null } },
    orderBy: { deletedAt: 'desc' },
    take: 200,
    select: {
      id: true,
      title: true,
      deletedAt: true,
      deleteReason: true,
      deletedBy: DELETED_BY_SELECT,
      lists: { select: { id: true, title: true, slug: true } },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    deletedAt: row.deletedAt!.toISOString(),
    deleteReason: row.deleteReason,
    list: row.lists,
    deletedBy: row.deletedBy,
  }));
}
