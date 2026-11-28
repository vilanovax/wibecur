import type { PrismaClient } from '@prisma/client';
import { CAFE_DISCOVERY_TOPICS, resolveCafeTopic } from '@/lib/category-discovery/cafe-catalog';
import {
  extractItemDiscoveryFields,
  itemMatchesTopic,
  listTopicMatchLevel,
} from '@/lib/category-discovery/match';
import { normalizeDiscoveryText } from '@/lib/category-discovery/normalize';
import {
  selectDiscoveryChips,
  type DiscoveryScanList,
} from '@/lib/category-discovery/select-chips';
import type {
  DiscoveryPlaceCard,
  DiscoveryTopicBrowseResult,
  DiscoveryTopicChip,
  DiscoveryTopicDefinition,
} from '@/lib/category-discovery/types';
import {
  buildAreaFacets,
  extractPlaceAreaLabel,
} from '@/lib/category-discovery/place-area';
import type { CategoryListCard } from '@/types/category-page';
import { resolveItemDisplayImage } from '@/lib/resolve-item-image';

const LIST_SCAN_TAKE = 120;
const ITEMS_PER_LIST_SCAN = 80;
const RESULTS_LIST_LIMIT = 40;
const RESULTS_PLACE_LIMIT = 60;

type DbListRow = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  coverImage: string | null;
  horizontalImage: string | null;
  saveCount: number | null;
  likeCount: number | null;
  itemCount: number | null;
  badge: string | null;
  tags: string[];
  users: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
    curatorLevel: string | null;
  } | null;
  items: Array<{
    id: string;
    title: string;
    imageUrl: string | null;
    metadata: unknown;
    catalogItemId: string | null;
  }>;
};

function placeKeyFor(catalogItemId: string | null | undefined, title: string): string {
  if (catalogItemId) return `c:${catalogItemId}`;
  return `t:${normalizeDiscoveryText(title)}`;
}

function itemMeta(
  metadata: unknown
): Record<string, unknown> | null {
  if (metadata && typeof metadata === 'object' && !Array.isArray(metadata)) {
    return metadata as Record<string, unknown>;
  }
  return null;
}

async function loadDbLists(
  prisma: PrismaClient,
  categoryId: string
): Promise<DbListRow[]> {
  return prisma.lists.findMany({
    where: {
      categoryId,
      deletedAt: null,
      isActive: true,
      isPublic: true,
      users: { role: { not: 'USER' } },
    },
    orderBy: [{ saveCount: 'desc' }, { createdAt: 'desc' }],
    take: LIST_SCAN_TAKE,
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      coverImage: true,
      horizontalImage: true,
      saveCount: true,
      likeCount: true,
      itemCount: true,
      badge: true,
      tags: true,
      users: {
        select: {
          id: true,
          name: true,
          username: true,
          image: true,
          curatorLevel: true,
        },
      },
      items: {
        where: { deletedAt: null },
        take: ITEMS_PER_LIST_SCAN,
        select: {
          id: true,
          title: true,
          imageUrl: true,
          metadata: true,
          catalogItemId: true,
        },
      },
    },
  });
}

function toScanLists(rows: DbListRow[]): DiscoveryScanList[] {
  return rows.map((l) => ({
    id: l.id,
    title: l.title,
    description: l.description,
    tags: l.tags,
    itemCount: l.itemCount ?? l.items.length,
    saveCount: l.saveCount ?? 0,
    items: l.items.map((it) => ({
      id: it.id,
      title: it.title,
      metadata: itemMeta(it.metadata),
      placeKey: placeKeyFor(it.catalogItemId, it.title),
    })),
  }));
}

function toListCard(meta: DbListRow): CategoryListCard {
  return {
    id: meta.id,
    title: meta.title,
    slug: meta.slug,
    description: meta.description,
    coverImage: meta.coverImage,
    horizontalImage: meta.horizontalImage,
    saveCount: meta.saveCount ?? 0,
    likeCount: meta.likeCount ?? 0,
    itemCount: meta.itemCount ?? 0,
    badge: meta.badge,
    tags: (meta.tags ?? []).length > 0 ? meta.tags : undefined,
    creator: meta.users
      ? {
          id: meta.users.id,
          name: meta.users.name,
          username: meta.users.username,
          image: meta.users.image,
          curatorLevel: meta.users.curatorLevel ?? 'EXPLORER',
        }
      : {
          id: '',
          name: null,
          username: null,
          image: null,
          curatorLevel: 'EXPLORER',
        },
  };
}

export async function getCategoryDiscoveryChips(
  prisma: PrismaClient,
  categoryId: string,
  catalog: DiscoveryTopicDefinition[] = CAFE_DISCOVERY_TOPICS
): Promise<DiscoveryTopicChip[]> {
  const rows = await loadDbLists(prisma, categoryId);
  return selectDiscoveryChips(toScanLists(rows), catalog);
}

export async function browseCategoryDiscoveryTopic(
  prisma: PrismaClient,
  categoryId: string,
  categorySlug: string,
  topicRaw: string
): Promise<DiscoveryTopicBrowseResult | null> {
  const topic = resolveCafeTopic(topicRaw);
  if (!topic) return null;

  const rows = await loadDbLists(prisma, categoryId);
  const byId = new Map(rows.map((r) => [r.id, r]));
  const scanLists = toScanLists(rows);

  const strongLists: CategoryListCard[] = [];
  const strongListIds = new Set<string>();
  type PlaceAcc = DiscoveryPlaceCard & { saveHint: number };
  const placeMap = new Map<string, PlaceAcc>();

  for (const list of scanLists) {
    let matched = 0;
    for (const item of list.items) {
      const fields = extractItemDiscoveryFields(item.title, item.metadata);
      if (itemMatchesTopic(fields, topic)) matched += 1;
    }
    const level = listTopicMatchLevel(
      {
        title: list.title,
        description: list.description,
        tags: list.tags,
        itemCount: list.itemCount || list.items.length,
      },
      topic,
      matched
    );
    if (level === 'strong') {
      const meta = byId.get(list.id)!;
      strongLists.push(toListCard(meta));
      strongListIds.add(list.id);
    }
  }

  function upsertPlace(
    list: (typeof scanLists)[number],
    item: (typeof scanLists)[number]['items'][number],
    viaStrongList: boolean
  ) {
    const meta = byId.get(list.id)!;
    const raw = meta.items.find((i) => i.id === item.id);
    const fields = extractItemDiscoveryFields(item.title, item.metadata);
    const areaLabel = extractPlaceAreaLabel({
      title: item.title,
      area: fields.area,
      region: fields.region,
      address: fields.address,
    });
    const existing = placeMap.get(item.placeKey);
    if (existing) {
      existing.listAppearances += 1;
      existing.saveHint = Math.max(existing.saveHint, meta.saveCount ?? 0);
      if (viaStrongList) existing.viaStrongList = true;
      if (!existing.areaLabel && areaLabel) existing.areaLabel = areaLabel;
      return;
    }
    const imageUrl = raw?.imageUrl ?? null;
    placeMap.set(item.placeKey, {
      id: item.id,
      title: item.title,
      imageUrl,
      displayImageUrl: resolveItemDisplayImage({
        id: item.id,
        imageUrl,
        title: item.title,
        metadata: item.metadata,
        categorySlug,
      }),
      listSlug: meta.slug,
      listTitle: meta.title,
      listAppearances: 1,
      area: fields.area,
      areaLabel,
      cuisine: fields.cuisine,
      viaStrongList,
      saveHint: meta.saveCount ?? 0,
    });
  }

  // همهٔ مکان‌های لیست‌های strong + مکان‌های match‌شده در بقیه
  for (const list of scanLists) {
    const isStrong = strongListIds.has(list.id);
    for (const item of list.items) {
      if (isStrong) {
        upsertPlace(list, item, true);
        continue;
      }
      const fields = extractItemDiscoveryFields(item.title, item.metadata);
      if (itemMatchesTopic(fields, topic)) {
        upsertPlace(list, item, false);
      }
    }
  }

  strongLists.sort((a, b) => (b.saveCount ?? 0) - (a.saveCount ?? 0));

  const places: DiscoveryPlaceCard[] = [...placeMap.values()]
    .sort(
      (a, b) =>
        Number(b.viaStrongList) - Number(a.viaStrongList) ||
        b.listAppearances - a.listAppearances ||
        b.saveHint - a.saveHint
    )
    .slice(0, RESULTS_PLACE_LIMIT)
    .map(({ saveHint: _s, ...rest }) => rest);

  const areaFacets = buildAreaFacets(places);

  return {
    topic: {
      slug: topic.slug,
      label: topic.label,
      dimension: topic.dimension,
      icon: topic.icon,
      listCount: strongLists.length,
      placeCount: placeMap.size,
    },
    lists: strongLists.slice(0, RESULTS_LIST_LIMIT),
    places,
    areaFacets,
    listCount: strongLists.length,
    placeCount: placeMap.size,
  };
}
