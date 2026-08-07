/**
 * تبلیغات متنی اسپانسری — resolve، tracking، validation
 */

import { unstable_cache } from 'next/cache';
import type { PrismaClient } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';

export type SponsoredScopeType = 'CATEGORY_ALL' | 'CATEGORY_SELECTED' | 'LIST';
export type SponsoredSurface =
  | 'LIST_BANNER'
  | 'LIST_SIDEBAR'
  | 'LIST_AFTER_SIMILAR'
  | 'CATEGORY_BANNER';
export type SponsoredPlacementAction = 'IMPRESSION' | 'CLICK';

export type ListPagePlacements = {
  banner: SponsoredPlacementPublic[];
  sidebar: SponsoredPlacementPublic[];
  afterSimilar: SponsoredPlacementPublic[];
};

export const LIST_PAGE_SURFACES: SponsoredSurface[] = [
  'LIST_BANNER',
  'LIST_SIDEBAR',
  'LIST_AFTER_SIMILAR',
];

export const SPONSORED_SURFACE_META: Record<
  SponsoredSurface,
  { label: string; hint: string; page: 'list' | 'category' }
> = {
  LIST_BANNER: {
    label: 'بنر بالای محتوا',
    hint: 'زیر تب‌های آیتم / مشابه / نظرات — موبایل و دسکتاپ',
    page: 'list',
  },
  LIST_SIDEBAR: {
    label: 'سایدبار لیست',
    hint: 'ستون کناری دسکتاپ — زیر دکمه‌های مدیریت',
    page: 'list',
  },
  LIST_AFTER_SIMILAR: {
    label: 'زیر لیست‌های مشابه',
    hint: 'بعد از کاروسل لیست‌های مشابه، قبل از نظرات',
    page: 'list',
  },
  CATEGORY_BANNER: {
    label: 'بنر صفحه دسته',
    hint: 'بالای لیست‌های صفحه دسته‌بندی',
    page: 'category',
  },
};

export type SponsoredPlacementPublic = {
  id: string;
  headline: string;
  bodyText: string | null;
  ctaLabel: string;
  clickUrl: string;
  disclosureLabel: string;
  sponsorName: string | null;
};

type PlacementRow = {
  id: string;
  scopeType: string;
  categoryId: string | null;
  listIds: string[];
  listId: string | null;
  surface: string;
  headline: string;
  bodyText: string | null;
  ctaLabel: string;
  destinationUrl: string;
  sponsorName: string | null;
  disclosureLabel: string;
  startAt: Date;
  endAt: Date | null;
  isActive: boolean;
  priority: number;
};

const SCOPE_PRIORITY: Record<string, number> = {
  LIST: 3,
  CATEGORY_SELECTED: 2,
  CATEGORY_ALL: 1,
};

function isActivePlacement(row: PlacementRow, now: Date): boolean {
  if (!row.isActive) return false;
  if (row.startAt > now) return false;
  if (row.endAt && row.endAt <= now) return false;
  return true;
}

function toPublic(row: PlacementRow): SponsoredPlacementPublic {
  return {
    id: row.id,
    headline: row.headline,
    bodyText: row.bodyText,
    ctaLabel: row.ctaLabel,
    clickUrl: `/go/sp/${row.id}`,
    disclosureLabel: row.disclosureLabel || 'تبلیغ',
    sponsorName: row.sponsorName,
  };
}

function comparePlacements(a: PlacementRow, b: PlacementRow): number {
  const scopeDiff = (SCOPE_PRIORITY[b.scopeType] ?? 0) - (SCOPE_PRIORITY[a.scopeType] ?? 0);
  if (scopeDiff !== 0) return scopeDiff;
  const priorityDiff = b.priority - a.priority;
  if (priorityDiff !== 0) return priorityDiff;
  return b.startAt.getTime() - a.startAt.getTime();
}

function matchesListScope(row: PlacementRow, listId: string, categoryId: string | null): boolean {
  if (row.scopeType === 'LIST') return row.listId === listId;
  if (!categoryId || row.categoryId !== categoryId) return false;
  if (row.scopeType === 'CATEGORY_ALL') return true;
  if (row.scopeType === 'CATEGORY_SELECTED') {
    return row.listIds.length === 0 || row.listIds.includes(listId);
  }
  return false;
}

function matchesList(row: PlacementRow, listId: string, categoryId: string | null): boolean {
  if (!LIST_PAGE_SURFACES.includes(row.surface as SponsoredSurface)) return false;
  if (row.surface !== 'LIST_BANNER') return false;
  return matchesListScope(row, listId, categoryId);
}

function matchesListForSurface(
  row: PlacementRow,
  surface: SponsoredSurface,
  listId: string,
  categoryId: string | null
): boolean {
  if (row.surface !== surface) return false;
  return matchesListScope(row, listId, categoryId);
}

function matchesCategory(row: PlacementRow, categoryId: string): boolean {
  if (row.surface !== 'CATEGORY_BANNER') return false;
  if (row.categoryId !== categoryId) return false;
  if (row.scopeType === 'CATEGORY_ALL') return true;
  if (row.scopeType === 'CATEGORY_SELECTED') return row.listIds.length === 0;
  return false;
}

async function fetchActivePlacementsForSurface(
  client: PrismaClient,
  surface: SponsoredSurface
): Promise<PlacementRow[]> {
  const now = new Date();
  const rows = await client.sponsored_placement.findMany({
    where: {
      surface,
      isActive: true,
      startAt: { lte: now },
      OR: [{ endAt: null }, { endAt: { gt: now } }],
    },
    select: {
      id: true,
      scopeType: true,
      categoryId: true,
      listIds: true,
      listId: true,
      surface: true,
      headline: true,
      bodyText: true,
      ctaLabel: true,
      destinationUrl: true,
      sponsorName: true,
      disclosureLabel: true,
      startAt: true,
      endAt: true,
      isActive: true,
      priority: true,
    },
  });
  return rows.filter((r) => isActivePlacement(r, now));
}

export async function resolveListPagePlacements(
  client: PrismaClient,
  listId: string,
  categoryId: string | null
): Promise<ListPagePlacements> {
  const now = new Date();
  const rows = await client.sponsored_placement.findMany({
    where: {
      surface: { in: LIST_PAGE_SURFACES },
      isActive: true,
      startAt: { lte: now },
      OR: [{ endAt: null }, { endAt: { gt: now } }],
    },
    select: {
      id: true,
      scopeType: true,
      categoryId: true,
      listIds: true,
      listId: true,
      surface: true,
      headline: true,
      bodyText: true,
      ctaLabel: true,
      destinationUrl: true,
      sponsorName: true,
      disclosureLabel: true,
      startAt: true,
      endAt: true,
      isActive: true,
      priority: true,
    },
  });

  const active = rows.filter((r) => isActivePlacement(r, now));
  const pickAll = (surface: SponsoredSurface) =>
    active
      .filter((r) => matchesListForSurface(r, surface, listId, categoryId))
      .sort(comparePlacements)
      .map(toPublic);

  return {
    banner: pickAll('LIST_BANNER'),
    sidebar: pickAll('LIST_SIDEBAR'),
    afterSimilar: pickAll('LIST_AFTER_SIMILAR'),
  };
}

export async function resolveListBannerPlacements(
  client: PrismaClient,
  listId: string,
  categoryId: string | null
): Promise<SponsoredPlacementPublic[]> {
  const page = await resolveListPagePlacements(client, listId, categoryId);
  return page.banner;
}

/** @deprecated use resolveListBannerPlacements */
export async function resolveListBannerPlacement(
  client: PrismaClient,
  listId: string,
  categoryId: string | null
): Promise<SponsoredPlacementPublic | null> {
  const placements = await resolveListBannerPlacements(client, listId, categoryId);
  return placements[0] ?? null;
}

export async function resolveCategoryBannerPlacements(
  client: PrismaClient,
  categoryId: string
): Promise<SponsoredPlacementPublic[]> {
  const rows = await fetchActivePlacementsForSurface(client, 'CATEGORY_BANNER');
  return rows
    .filter((r) => matchesCategory(r, categoryId))
    .sort(comparePlacements)
    .map(toPublic);
}

/** @deprecated use resolveCategoryBannerPlacements */
export async function resolveCategoryBannerPlacement(
  client: PrismaClient,
  categoryId: string
): Promise<SponsoredPlacementPublic | null> {
  const placements = await resolveCategoryBannerPlacements(client, categoryId);
  return placements[0] ?? null;
}

export function getCachedListPagePlacements(listId: string, categoryId: string | null) {
  return unstable_cache(
    () => dbQuery(() => resolveListPagePlacements(prisma, listId, categoryId)),
    [`sponsored-list-page-${listId}`],
    { revalidate: 90, tags: [`sponsored-list-${listId}`, 'sponsored-placements'] }
  )();
}

export function getCachedListBannerPlacement(listId: string, categoryId: string | null) {
  return unstable_cache(
    async () => {
      const page = await dbQuery(() => resolveListPagePlacements(prisma, listId, categoryId));
      return page.banner[0] ?? null;
    },
    [`sponsored-list-${listId}-banner`],
    { revalidate: 90, tags: [`sponsored-list-${listId}`, 'sponsored-placements'] }
  )();
}

export function getCachedCategoryBannerPlacements(categoryId: string) {
  return unstable_cache(
    () => dbQuery(() => resolveCategoryBannerPlacements(prisma, categoryId)),
    [`sponsored-category-${categoryId}`],
    { revalidate: 90, tags: [`sponsored-category-${categoryId}`, 'sponsored-placements'] }
  )();
}

/** @deprecated use getCachedCategoryBannerPlacements */
export function getCachedCategoryBannerPlacement(categoryId: string) {
  return getCachedCategoryBannerPlacements(categoryId).then((placements) => placements[0] ?? null);
}

export function validateDestinationUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export async function trackSponsoredImpression(
  client: PrismaClient,
  placementId: string,
  context?: { userId?: string | null; listId?: string; categoryId?: string }
): Promise<boolean> {
  const placement = await client.sponsored_placement.findUnique({
    where: { id: placementId },
    select: { id: true },
  });
  if (!placement) return false;

  await client.$transaction([
    client.sponsored_placement.update({
      where: { id: placementId },
      data: { impressions: { increment: 1 } },
    }),
    client.sponsored_placement_event.create({
      data: {
        placementId,
        action: 'IMPRESSION',
        userId: context?.userId ?? null,
        listId: context?.listId ?? null,
        categoryId: context?.categoryId ?? null,
      },
    }),
  ]);
  return true;
}

export async function trackSponsoredClick(
  client: PrismaClient,
  placementId: string,
  context?: { userId?: string | null; listId?: string; categoryId?: string }
): Promise<string | null> {
  const placement = await client.sponsored_placement.findUnique({
    where: { id: placementId },
    select: { id: true, destinationUrl: true, isActive: true, startAt: true, endAt: true },
  });
  if (!placement) return null;

  const now = new Date();
  if (!placement.isActive || placement.startAt > now) return null;
  if (placement.endAt && placement.endAt <= now) return null;
  if (!validateDestinationUrl(placement.destinationUrl)) return null;

  await client.$transaction([
    client.sponsored_placement.update({
      where: { id: placementId },
      data: { clicks: { increment: 1 } },
    }),
    client.sponsored_placement_event.create({
      data: {
        placementId,
        action: 'CLICK',
        userId: context?.userId ?? null,
        listId: context?.listId ?? null,
        categoryId: context?.categoryId ?? null,
      },
    }),
  ]);

  return placement.destinationUrl;
}

export type SponsoredPerformanceResult = {
  impressions: number;
  clicks: number;
  ctr: number;
  daily: { date: string; impressions: number; clicks: number }[];
};

export async function getSponsoredPerformance(
  client: PrismaClient,
  placementId: string,
  days = 14
): Promise<SponsoredPerformanceResult | null> {
  const placement = await client.sponsored_placement.findUnique({
    where: { id: placementId },
    select: { impressions: true, clicks: true },
  });
  if (!placement) return null;

  const since = new Date();
  since.setDate(since.getDate() - days);

  const events = await client.sponsored_placement_event.findMany({
    where: { placementId, createdAt: { gte: since } },
    select: { action: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });

  const dailyMap = new Map<string, { impressions: number; clicks: number }>();
  for (const ev of events) {
    const date = ev.createdAt.toISOString().slice(0, 10);
    const bucket = dailyMap.get(date) ?? { impressions: 0, clicks: 0 };
    if (ev.action === 'IMPRESSION') bucket.impressions += 1;
    if (ev.action === 'CLICK') bucket.clicks += 1;
    dailyMap.set(date, bucket);
  }

  const impressions = placement.impressions ?? 0;
  const clicks = placement.clicks ?? 0;

  return {
    impressions,
    clicks,
    ctr: impressions > 0 ? clicks / impressions : 0,
    daily: [...dailyMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, stats]) => ({ date, ...stats })),
  };
}

/** برای تست unit — export matching helpers */
export function pickAllListPlacements(
  rows: PlacementRow[],
  listId: string,
  categoryId: string | null,
  surface: SponsoredSurface = 'LIST_BANNER'
): PlacementRow[] {
  return rows
    .filter((r) => matchesListForSurface(r, surface, listId, categoryId))
    .sort(comparePlacements);
}

export function pickBestListPlacement(
  rows: PlacementRow[],
  listId: string,
  categoryId: string | null,
  surface: SponsoredSurface = 'LIST_BANNER'
): PlacementRow | null {
  return pickAllListPlacements(rows, listId, categoryId, surface)[0] ?? null;
}

export function pickAllCategoryPlacements(rows: PlacementRow[], categoryId: string): PlacementRow[] {
  return rows.filter((r) => matchesCategory(r, categoryId)).sort(comparePlacements);
}

export function pickBestCategoryPlacement(rows: PlacementRow[], categoryId: string): PlacementRow | null {
  return pickAllCategoryPlacements(rows, categoryId)[0] ?? null;
}

export function isPlacementActive(row: PlacementRow, now = new Date()): boolean {
  return isActivePlacement(row, now);
}
