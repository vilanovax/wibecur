import { CAFE_DISCOVERY_TOPICS } from '@/lib/category-discovery/cafe-catalog';
import {
  normalizeDiscoveryText,
  splitDiscoveryField,
  textIncludesPhrase,
} from '@/lib/category-discovery/normalize';
import {
  AREA_TO_REGION,
  extractPlaceAreaLabel,
} from '@/lib/category-discovery/place-area';

export type CafeMetaSuggestion = {
  cuisine?: string;
  area?: string;
  region?: string;
  cuisineSources: string[];
  areaSources: string[];
  /** high = از چند سیگنال؛ medium = یک سیگنال قوی؛ low = حدس ضعیف */
  confidence: 'high' | 'medium' | 'low';
};

const CUISINE_TOPICS = CAFE_DISCOVERY_TOPICS.filter((t) => t.dimension === 'cuisine');
const AREA_TOPICS = CAFE_DISCOVERY_TOPICS.filter((t) => t.dimension === 'area');

const REGION_LABELS = ['غرب تهران', 'شرق تهران', 'شمال تهران', 'مرکز تهران'] as const;

function findCuisineLabelsInText(text: string): string[] {
  const found: string[] = [];
  for (const topic of CUISINE_TOPICS) {
    const phrases = [topic.label, ...topic.aliases];
    if (phrases.some((p) => textIncludesPhrase(text, p))) {
      found.push(topic.label);
    }
  }
  return [...new Set(found)];
}

function mergeCuisine(existing: string | null | undefined, suggested: string[]): string | null {
  const parts = new Set<string>();
  for (const p of splitDiscoveryField(existing)) {
    const n = p.trim();
    if (n) parts.add(n);
  }
  for (const s of suggested) {
    const already = [...parts].some(
      (p) =>
        normalizeDiscoveryText(p) === normalizeDiscoveryText(s) ||
        textIncludesPhrase(p, s) ||
        textIncludesPhrase(s, p)
    );
    if (!already) parts.add(s);
  }
  if (parts.size === 0) return null;
  return [...parts].slice(0, 4).join(' | ');
}

/**
 * پیشنهاد cuisine/area/region از عنوان آیتم، عنوان لیست، آدرس.
 * فقط پیشنهاد است — تأیید با تیم محتوا.
 */
export function suggestCafeMeta(input: {
  itemTitle: string;
  listTitle?: string | null;
  address?: string | null;
  existingCuisine?: string | null;
  existingArea?: string | null;
  existingRegion?: string | null;
}): CafeMetaSuggestion {
  const cuisineSources: string[] = [];
  const areaSources: string[] = [];
  const cuisineHits = new Set<string>();

  const listTitle = input.listTitle?.trim() ?? '';
  if (listTitle) {
    for (const label of findCuisineLabelsInText(listTitle)) {
      cuisineHits.add(label);
      cuisineSources.push(`listTitle:${label}`);
    }
  }

  const itemTitle = input.itemTitle.trim();
  for (const label of findCuisineLabelsInText(itemTitle)) {
    cuisineHits.add(label);
    cuisineSources.push(`itemTitle:${label}`);
  }

  const address = input.address?.trim() ?? '';
  // آدرس معمولاً cuisine ندارد؛ فقط area

  const suggestedCuisine = mergeCuisine(input.existingCuisine, [...cuisineHits]);

  let area = input.existingArea?.trim() || null;
  let region = input.existingRegion?.trim() || null;

  if (!area) {
    const extracted = extractPlaceAreaLabel({
      title: itemTitle,
      address: address || null,
      region: region,
    });
    if (extracted) {
      // اگر پهنه است → region؛ وگرنه area
      if ((REGION_LABELS as readonly string[]).includes(extracted)) {
        if (!region) {
          region = extracted;
          areaSources.push(`extract:region:${extracted}`);
        }
      } else {
        area = extracted;
        areaSources.push(`extract:area:${extracted}`);
      }
    }
  }

  if (!region && listTitle) {
    for (const label of REGION_LABELS) {
      if (textIncludesPhrase(listTitle, label)) {
        region = label;
        areaSources.push(`listTitle:region:${label}`);
        break;
      }
    }
  }

  if (!area && listTitle) {
    for (const topic of AREA_TOPICS) {
      if ((REGION_LABELS as readonly string[]).includes(topic.label)) continue;
      if (textIncludesPhrase(listTitle, topic.label) || topic.aliases.some((a) => textIncludesPhrase(listTitle, a))) {
        area = topic.label;
        areaSources.push(`listTitle:area:${topic.label}`);
        break;
      }
    }
  }

  // اگر محله مشخص است و پهنه خالی → از نگاشت رسمی
  if (area && !region && AREA_TO_REGION[area]) {
    region = AREA_TO_REGION[area];
    areaSources.push(`map:region:${region}`);
  }

  const needsCuisine = !input.existingCuisine?.trim();
  const needsArea = !input.existingArea?.trim();
  const needsRegion = !input.existingRegion?.trim();

  // فقط فیلدهای خالی را پیشنهاد بده (بک‌فیل امن)
  const outCuisine = needsCuisine ? suggestedCuisine ?? undefined : undefined;
  const outArea = needsArea ? area ?? undefined : undefined;
  const outRegion = needsRegion ? region ?? undefined : undefined;

  let confidence: CafeMetaSuggestion['confidence'] = 'low';
  const signalCount =
    (outCuisine ? Math.min(cuisineSources.length, 2) : 0) +
    (outArea || outRegion ? Math.min(areaSources.length, 2) : 0);
  if (
    signalCount >= 2 ||
    (outCuisine && cuisineSources.some((s) => s.startsWith('listTitle:')))
  ) {
    confidence = 'high';
  } else if (outCuisine || outArea || outRegion) {
    confidence = 'medium';
  }

  return {
    cuisine: outCuisine,
    area: outArea,
    region: outRegion,
    cuisineSources,
    areaSources,
    confidence,
  };
}

export function cafeMetaNeedsAttention(meta: {
  cuisine?: string | null;
  area?: string | null;
  region?: string | null;
  address?: string | null;
}): { missingCuisine: boolean; missingPlace: boolean } {
  const missingCuisine = !meta.cuisine?.trim();
  const missingPlace = !meta.area?.trim() && !meta.region?.trim();
  return { missingCuisine, missingPlace };
}
