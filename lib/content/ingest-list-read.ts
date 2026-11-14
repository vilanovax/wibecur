import type { PrismaClient } from '@prisma/client';
import { resolveEntryKind } from '@/lib/list-entry';

export type IngestListReadResult =
  | {
      ok: true;
      list: {
        id: string;
        slug: string;
        title: string;
        description: string | null;
        coverImage: string | null;
        horizontalImage: string | null;
        isActive: boolean;
        isPublic: boolean;
        categoryId: string;
        categorySlug: string;
        categoryName: string;
        itemCount: number;
        createdAt: string;
        updatedAt: string;
      };
      placements: Array<{
        placementId: string;
        listId: string;
        catalogItemId: string | null;
        order: number;
        title: string;
        description: string | null;
        imageUrl: string | null;
        externalUrl: string | null;
        listNote: string | null;
        entryKind: string;
        tip: string | null;
        metadata: Record<string, unknown>;
        updatedAt: string;
      }>;
    }
  | { ok: false; status: number; code: string; error: string };

function asMeta(value: unknown): Record<string, unknown> {
  if (value != null && typeof value === 'object' && !Array.isArray(value)) {
    return { ...(value as Record<string, unknown>) };
  }
  return {};
}

/**
 * خواندن مستقیم لیست برای بات — بدون کش عمومی، حتی اگر غیرفعال یا خصوصی باشد.
 * لیست زباله‌دان‌شده برنمی‌گردد.
 */
export async function getIngestList(
  db: PrismaClient,
  listIdOrSlug: string
): Promise<IngestListReadResult> {
  const key = listIdOrSlug.trim();
  if (!key) {
    return { ok: false, status: 404, code: 'not_found', error: 'لیست پیدا نشد' };
  }

  const list = await db.lists.findFirst({
    where: {
      deletedAt: null,
      OR: [{ id: key }, { slug: key }],
    },
    include: {
      categories: { select: { id: true, slug: true, name: true } },
    },
  });

  if (!list || !list.categories) {
    return { ok: false, status: 404, code: 'not_found', error: 'لیست پیدا نشد' };
  }

  const items = await db.items.findMany({
    where: { listId: list.id, deletedAt: null },
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    select: {
      id: true,
      listId: true,
      catalogItemId: true,
      order: true,
      title: true,
      description: true,
      imageUrl: true,
      externalUrl: true,
      listNote: true,
      metadata: true,
      updatedAt: true,
    },
  });

  const placements = items.map((item) => {
    const metadata = asMeta(item.metadata);
    const tip =
      typeof metadata.tip === 'string' && metadata.tip.trim() ? metadata.tip.trim() : null;
    return {
      placementId: item.id,
      listId: item.listId,
      catalogItemId: item.catalogItemId,
      order: item.order,
      title: item.title,
      description: item.description,
      imageUrl: item.imageUrl,
      externalUrl: item.externalUrl,
      listNote: item.listNote,
      entryKind: resolveEntryKind(item),
      tip,
      metadata,
      updatedAt: item.updatedAt.toISOString(),
    };
  });

  return {
    ok: true,
    list: {
      id: list.id,
      slug: list.slug,
      title: list.title,
      description: list.description,
      coverImage: list.coverImage,
      horizontalImage: list.horizontalImage,
      isActive: list.isActive,
      isPublic: list.isPublic,
      categoryId: list.categories.id,
      categorySlug: list.categories.slug,
      categoryName: list.categories.name,
      itemCount: placements.length,
      createdAt: list.createdAt.toISOString(),
      updatedAt: list.updatedAt.toISOString(),
    },
    placements,
  };
}
