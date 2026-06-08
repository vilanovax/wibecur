import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import { getListIntelligenceForEdit } from '@/lib/admin/trending-debug';
import { resolveAdminItemThumbnail } from '@/lib/resolve-admin-item-image';
import { notFound } from 'next/navigation';

export type ListWorkspaceItem = {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  displayImageUrl: string;
  order: number;
  catalogItemId: string | null;
  externalUrl: string | null;
  metadata: Record<string, unknown> | null;
};

export type ListWorkspaceData = {
  list: {
    id: string;
    title: string;
    slug: string;
    description: string | null;
    coverImage: string | null;
    horizontalImage: string | null;
    isPublic: boolean;
    isFeatured: boolean;
    isActive: boolean;
    saveCount: number;
    viewCount: number;
    likeCount: number;
    itemCount: number;
    createdAt: string;
    deletedAt: string | null;
    categories: {
      id: string;
      name: string;
      slug: string;
      icon: string;
      color: string;
    } | null;
  };
  items: ListWorkspaceItem[];
  intelligence: Awaited<ReturnType<typeof getListIntelligenceForEdit>>;
};

export async function getListWorkspaceData(listId: string): Promise<ListWorkspaceData> {
  const [list, intelligence] = await Promise.all([
    dbQuery(() =>
      prisma.lists.findUnique({
        where: { id: listId },
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          coverImage: true,
          horizontalImage: true,
          isPublic: true,
          isFeatured: true,
          isActive: true,
          saveCount: true,
          viewCount: true,
          likeCount: true,
          itemCount: true,
          createdAt: true,
          deletedAt: true,
          categories: {
            select: { id: true, name: true, slug: true, icon: true, color: true },
          },
          items: {
            orderBy: { order: 'asc' },
            select: {
              id: true,
              title: true,
              description: true,
              imageUrl: true,
              order: true,
              catalogItemId: true,
              externalUrl: true,
              metadata: true,
              catalog_items: { select: { imageUrl: true } },
            },
          },
        },
      })
    ),
    getListIntelligenceForEdit(listId),
  ]);

  if (!list) notFound();

  const items: ListWorkspaceItem[] = list.items.map((item) => {
    const meta =
      item.metadata != null &&
      typeof item.metadata === 'object' &&
      !Array.isArray(item.metadata)
        ? (item.metadata as Record<string, unknown>)
        : null;

    const displayImageUrl = resolveAdminItemThumbnail({
      imageUrl: item.imageUrl,
      metadata: meta,
      catalogImageUrl: item.catalog_items?.imageUrl ?? null,
      allowTmdb: true,
    });

    return {
      id: item.id,
      title: item.title,
      description: item.description,
      imageUrl: item.imageUrl,
      displayImageUrl,
      order: item.order,
      catalogItemId: item.catalogItemId,
      externalUrl: item.externalUrl,
      metadata: meta,
    };
  });

  return {
    list: {
      ...list,
      createdAt: list.createdAt.toISOString(),
      deletedAt: list.deletedAt?.toISOString() ?? null,
    },
    items,
    intelligence,
  };
}
