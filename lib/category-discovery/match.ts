import {
  normalizeDiscoveryText,
  splitDiscoveryField,
  textIncludesPhrase,
} from '@/lib/category-discovery/normalize';
import type {
  DiscoveryDimension,
  DiscoveryTopicDefinition,
  ListTopicMatchLevel,
} from '@/lib/category-discovery/types';

export type ItemDiscoveryFields = {
  title: string;
  tip?: string | null;
  cuisine?: string | null;
  area?: string | null;
  region?: string | null;
  address?: string | null;
  /** tags / features آزاد در metadata */
  freeTags?: string[];
};

export type ListDiscoveryFields = {
  title: string;
  description?: string | null;
  tags?: string[] | null;
  itemCount: number;
};

const MIN_MATCHED_ITEMS = 3;
const MIN_COVERAGE_RATIO = 0.35;

function allPhrases(topic: DiscoveryTopicDefinition): string[] {
  const set = new Set<string>([topic.label, ...topic.aliases]);
  return [...set].filter((p) => normalizeDiscoveryText(p).length >= 2);
}

function fieldBlobForDimension(
  item: ItemDiscoveryFields,
  dimension: DiscoveryDimension
): string {
  const free = (item.freeTags ?? []).join(' ');
  const tip = item.tip ?? '';
  switch (dimension) {
    case 'cuisine':
      return [item.cuisine ?? '', item.title, tip, free].join(' ');
    case 'area':
      return [item.area ?? '', item.region ?? '', item.address ?? '', item.title, free].join(
        ' '
      );
    case 'space':
    case 'occasion':
    case 'amenity':
      return [item.title, tip, free, item.cuisine ?? ''].join(' ');
    default:
      return [item.title, tip, free].join(' ');
  }
}

/** آیا آیتم (مکان) با موضوع match می‌کند؟ */
export function itemMatchesTopic(
  item: ItemDiscoveryFields,
  topic: DiscoveryTopicDefinition
): boolean {
  const phrases = allPhrases(topic);

  // cuisine: هر بخش جدا را دقیق‌تر چک کن
  if (topic.dimension === 'cuisine') {
    const parts = splitDiscoveryField(item.cuisine);
    for (const part of parts) {
      for (const phrase of phrases) {
        if (textIncludesPhrase(part, phrase) || textIncludesPhrase(phrase, part)) {
          return true;
        }
      }
    }
  }

  if (topic.dimension === 'area') {
    for (const field of [item.area, item.region]) {
      if (!field) continue;
      for (const phrase of phrases) {
        if (textIncludesPhrase(field, phrase)) return true;
      }
    }
  }

  const blob = fieldBlobForDimension(item, topic.dimension);
  for (const phrase of phrases) {
    if (textIncludesPhrase(blob, phrase)) return true;
  }
  return false;
}

function listTextMatchesTopic(
  list: ListDiscoveryFields,
  topic: DiscoveryTopicDefinition
): boolean {
  const phrases = allPhrases(topic);
  const tags = list.tags ?? [];
  for (const tag of tags) {
    for (const phrase of phrases) {
      if (
        normalizeDiscoveryText(tag) === normalizeDiscoveryText(phrase) ||
        textIncludesPhrase(tag, phrase)
      ) {
        return true;
      }
    }
  }
  const text = `${list.title} ${list.description ?? ''}`;
  for (const phrase of phrases) {
    if (textIncludesPhrase(text, phrase)) return true;
  }
  return false;
}

/**
 * سطح match لیست با موضوع.
 * strong → تب لیست‌ها
 * weak → فقط از مسیر مکان‌ها
 */
export function listTopicMatchLevel(
  list: ListDiscoveryFields,
  topic: DiscoveryTopicDefinition,
  matchedItemCount: number
): ListTopicMatchLevel {
  if (listTextMatchesTopic(list, topic)) return 'strong';

  if (matchedItemCount <= 0) return 'none';

  const total = Math.max(list.itemCount, matchedItemCount);
  const coverage = matchedItemCount / total;

  if (matchedItemCount >= MIN_MATCHED_ITEMS && coverage >= MIN_COVERAGE_RATIO) {
    return 'strong';
  }

  // لیست‌های خیلی کوچک: حداقل ۳ آیتم match
  if (total < 5 && matchedItemCount >= MIN_MATCHED_ITEMS) {
    return 'strong';
  }

  return 'weak';
}

export function extractItemDiscoveryFields(
  title: string,
  metadata: Record<string, unknown> | null | undefined
): ItemDiscoveryFields {
  const meta = metadata && typeof metadata === 'object' ? metadata : {};
  const freeTags: string[] = [];
  if (Array.isArray(meta.tags)) {
    for (const t of meta.tags) {
      if (typeof t === 'string' && t.trim()) freeTags.push(t.trim());
    }
  }
  if (Array.isArray(meta.features)) {
    for (const t of meta.features) {
      if (typeof t === 'string' && t.trim()) freeTags.push(t.trim());
    }
  }

  return {
    title,
    tip: typeof meta.tip === 'string' ? meta.tip : null,
    cuisine: typeof meta.cuisine === 'string' ? meta.cuisine : null,
    area: typeof meta.area === 'string' ? meta.area : null,
    region: typeof meta.region === 'string' ? meta.region : null,
    address: typeof meta.address === 'string' ? meta.address : null,
    freeTags,
  };
}

export const DISCOVERY_MATCH_THRESHOLDS = {
  MIN_MATCHED_ITEMS,
  MIN_COVERAGE_RATIO,
} as const;
