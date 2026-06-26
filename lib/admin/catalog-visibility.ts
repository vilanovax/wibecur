import type { Prisma, PrismaClient } from '@prisma/client';

export const CATALOG_ADMIN_DISABLED_KEY = 'adminDisabled';

export function isCatalogAdminDisabled(metadata: unknown): boolean {
  if (metadata == null || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return false;
  }
  return (metadata as Record<string, unknown>)[CATALOG_ADMIN_DISABLED_KEY] === true;
}

export function withCatalogAdminDisabled(
  metadata: unknown,
  disabled: boolean
): Prisma.InputJsonValue {
  const base =
    metadata != null && typeof metadata === 'object' && !Array.isArray(metadata)
      ? { ...(metadata as Record<string, unknown>) }
      : {};

  if (disabled) {
    base[CATALOG_ADMIN_DISABLED_KEY] = true;
  } else {
    delete base[CATALOG_ADMIN_DISABLED_KEY];
  }

  return base as Prisma.InputJsonValue;
}

export async function setCatalogAdminDisabledFlags(
  prisma: PrismaClient,
  catalogIds: string[],
  disabled: boolean
): Promise<void> {
  for (const id of catalogIds) {
    const row = await prisma.catalog_items.findUnique({
      where: { id },
      select: { metadata: true },
    });
    if (!row) continue;

    await prisma.catalog_items.update({
      where: { id },
      data: {
        metadata: withCatalogAdminDisabled(row.metadata, disabled),
        updatedAt: new Date(),
      },
    });
  }
}
