import { CAFE_DISCOVERY_TOPICS } from '@/lib/category-discovery/cafe-catalog';
import { normalizeDiscoveryText } from '@/lib/category-discovery/normalize';
import { supportsCategoryDiscovery } from '@/lib/category-discovery/supports';
import type { DiscoveryTopicDefinition } from '@/lib/category-discovery/types';

/**
 * فقط وقتی کل کوئری دقیقاً یک موضوع/alias است (نه «سوخاری امیرآباد»).
 * برای هدایت سرچ → صفحهٔ کشف.
 */
export function resolveExactCafeDiscoveryTopic(
  rawQuery: string
): DiscoveryTopicDefinition | null {
  const n = normalizeDiscoveryText(rawQuery);
  if (!n || n.length < 2) return null;

  for (const topic of CAFE_DISCOVERY_TOPICS) {
    if (topic.slug === rawQuery.trim() || topic.slug === n) return topic;
    if (normalizeDiscoveryText(topic.label) === n) return topic;
    if (topic.aliases.some((a) => normalizeDiscoveryText(a) === n)) return topic;
  }
  return null;
}

/**
 * اگر کوئری دقیقاً با یک موضوع کشف دسته یکی باشد، URL صفحهٔ discover را برمی‌گرداند.
 * وگرنه null — سرچ متنی عادی (با cuisine در WHERE) بماند.
 */
export function discoveryTopicResultsHref(
  categorySlug: string,
  rawQuery: string,
  tab: 'lists' | 'places' = 'lists'
): string | null {
  if (!supportsCategoryDiscovery(categorySlug)) return null;
  const q = rawQuery.trim();
  if (q.length < 2) return null;

  const topic = resolveExactCafeDiscoveryTopic(q);
  if (!topic) return null;

  const params = new URLSearchParams();
  params.set('topic', topic.slug);
  if (tab !== 'lists') params.set('tab', tab);
  return `/categories/${encodeURIComponent(categorySlug)}/discover?${params.toString()}`;
}
