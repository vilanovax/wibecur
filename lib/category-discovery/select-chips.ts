import { CAFE_DISCOVERY_TOPICS } from '@/lib/category-discovery/cafe-catalog';
import {
  extractItemDiscoveryFields,
  itemMatchesTopic,
  listTopicMatchLevel,
} from '@/lib/category-discovery/match';
import type {
  DiscoveryDimension,
  DiscoveryTopicChip,
  DiscoveryTopicDefinition,
} from '@/lib/category-discovery/types';

export const DISCOVERY_CHIP_MAX = 6;
/** حداقل مکان یا لیست قوی برای نمایش در پیشنهادها */
export const DISCOVERY_CHIP_MIN_PLACES = 3;
export const DISCOVERY_CHIP_MIN_STRONG_LISTS = 2;
/** اگر موضوع بیش از این نسبت از کل مکان‌ها را بگیرد، کم‌ارزش است */
export const DISCOVERY_MAX_PLACE_COVERAGE = 0.7;

export type DiscoveryScanList = {
  id: string;
  title: string;
  description?: string | null;
  tags?: string[] | null;
  itemCount: number;
  saveCount?: number;
  items: Array<{
    id: string;
    title: string;
    metadata?: Record<string, unknown> | null;
    /** کلید dedupe مکان — catalogItemId یا title نرمال */
    placeKey: string;
  }>;
};

type TopicStats = {
  topic: DiscoveryTopicDefinition;
  strongListIds: Set<string>;
  placeKeys: Set<string>;
  /** امتیاز برای رتبه‌بندی داخل بُعد */
  score: number;
};

function scoreTopic(stats: TopicStats, totalPlaces: number): number {
  const placeCount = stats.placeKeys.size;
  const listCount = stats.strongListIds.size;
  const coverage = totalPlaces > 0 ? placeCount / totalPlaces : 0;
  // selectivity: پوشش خیلی بالا امتیاز را کم می‌کند
  const selectivity =
    coverage >= DISCOVERY_MAX_PLACE_COVERAGE ? 0.15 : 1 - coverage * 0.5;
  return (listCount * 3 + placeCount) * selectivity;
}

/**
 * از اسکن لیست/آیتم‌های دسته، چیپ‌های متنوع پیشنهادی می‌سازد.
 * حداکثر یک موضوع از هر بُعد در ردیف اول؛ بقیه برای پر کردن تا ۶.
 */
export function selectDiscoveryChips(
  lists: DiscoveryScanList[],
  catalog: DiscoveryTopicDefinition[] = CAFE_DISCOVERY_TOPICS,
  maxChips: number = DISCOVERY_CHIP_MAX
): DiscoveryTopicChip[] {
  const allPlaceKeys = new Set<string>();
  for (const list of lists) {
    for (const item of list.items) allPlaceKeys.add(item.placeKey);
  }
  const totalPlaces = allPlaceKeys.size;

  const statsBySlug = new Map<string, TopicStats>();
  for (const topic of catalog) {
    statsBySlug.set(topic.slug, {
      topic,
      strongListIds: new Set(),
      placeKeys: new Set(),
      score: 0,
    });
  }

  for (const list of lists) {
    const matchedCountByTopic = new Map<string, number>();
    for (const item of list.items) {
      const fields = extractItemDiscoveryFields(item.title, item.metadata);
      for (const topic of catalog) {
        if (!itemMatchesTopic(fields, topic)) continue;
        const stats = statsBySlug.get(topic.slug)!;
        stats.placeKeys.add(item.placeKey);
        matchedCountByTopic.set(
          topic.slug,
          (matchedCountByTopic.get(topic.slug) ?? 0) + 1
        );
      }
    }
    for (const topic of catalog) {
      const matched = matchedCountByTopic.get(topic.slug) ?? 0;
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
        statsBySlug.get(topic.slug)!.strongListIds.add(list.id);
      }
    }
  }

  const eligible: TopicStats[] = [];
  for (const stats of statsBySlug.values()) {
    const placeCount = stats.placeKeys.size;
    const listCount = stats.strongListIds.size;
    if (
      placeCount < DISCOVERY_CHIP_MIN_PLACES &&
      listCount < DISCOVERY_CHIP_MIN_STRONG_LISTS
    ) {
      continue;
    }
    const coverage = totalPlaces > 0 ? placeCount / totalPlaces : 0;
    if (coverage >= DISCOVERY_MAX_PLACE_COVERAGE && listCount < 3) {
      continue;
    }
    stats.score = scoreTopic(stats, totalPlaces);
    eligible.push(stats);
  }

  eligible.sort((a, b) => b.score - a.score);

  const picked: TopicStats[] = [];
  const usedDimensions = new Set<DiscoveryDimension>();

  // پاس ۱: حداکثر یکی از هر بُعد
  for (const stats of eligible) {
    if (picked.length >= maxChips) break;
    if (usedDimensions.has(stats.topic.dimension)) continue;
    picked.push(stats);
    usedDimensions.add(stats.topic.dimension);
  }

  // پاس ۲: پر کردن جاهای خالی با بهترین باقی‌مانده
  if (picked.length < maxChips) {
    for (const stats of eligible) {
      if (picked.length >= maxChips) break;
      if (picked.some((p) => p.topic.slug === stats.topic.slug)) continue;
      picked.push(stats);
    }
  }

  return picked.map((stats) => ({
    slug: stats.topic.slug,
    label: stats.topic.label,
    dimension: stats.topic.dimension,
    icon: stats.topic.icon,
    listCount: stats.strongListIds.size,
    placeCount: stats.placeKeys.size,
  }));
}
