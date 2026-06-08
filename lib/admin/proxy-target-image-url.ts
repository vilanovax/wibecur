import type { Prisma } from '@prisma/client';
import { resolveAdminItemThumbnail } from '@/lib/resolve-admin-item-image';
import { needsCastandoProxyWrap } from '@/lib/castando-image-proxy';

export type ItemProxyRow = {
  imageUrl: string | null;
  catalogItemId?: string | null;
  catalog_items?: { imageUrl: string | null } | null;
  metadata?: Prisma.JsonValue | Record<string, unknown> | unknown | null;
};

/** همان URLی که در کارت ادمین نمایش داده می‌شود */
export function getItemProxyTargetUrl(row: ItemProxyRow): string {
  const meta =
    row.metadata && typeof row.metadata === 'object' && !Array.isArray(row.metadata)
      ? (row.metadata as Record<string, unknown>)
      : null;

  return resolveAdminItemThumbnail({
    imageUrl: row.imageUrl,
    catalogImageUrl: row.catalog_items?.imageUrl ?? null,
    metadata: meta,
  });
}

export function itemNeedsCastandoProxyWrap(row: ItemProxyRow): boolean {
  const url = getItemProxyTargetUrl(row);
  return needsCastandoProxyWrap(url);
}
