import { describe, expect, it } from 'vitest';
import { CAFE_DISCOVERY_TOPICS } from '@/lib/category-discovery/cafe-catalog';
import { selectDiscoveryChips } from '@/lib/category-discovery/select-chips';
import type { DiscoveryScanList } from '@/lib/category-discovery/select-chips';

function makeList(
  id: string,
  title: string,
  items: Array<{ title: string; cuisine?: string; tip?: string }>
): DiscoveryScanList {
  return {
    id,
    title,
    description: null,
    tags: [],
    itemCount: items.length,
    saveCount: 10,
    items: items.map((it, i) => ({
      id: `${id}-${i}`,
      title: it.title,
      placeKey: `t:${it.title}`,
      metadata: {
        ...(it.cuisine ? { cuisine: it.cuisine } : {}),
        ...(it.tip ? { tip: it.tip } : {}),
      },
    })),
  };
}

describe('selectDiscoveryChips', () => {
  it('picks diverse dimensions and skips empty topics', () => {
    const lists: DiscoveryScanList[] = [
      makeList('l1', 'بهترین سوخاری‌ها', [
        { title: 'سوخاری ۱', cuisine: 'سوخاری' },
        { title: 'سوخاری ۲', cuisine: 'سوخاری' },
        { title: 'سوخاری ۳', cuisine: 'سوخاری' },
        { title: 'سوخاری ۴', cuisine: 'سوخاری' },
      ]),
      makeList('l2', 'کافه‌های روباز', [
        { title: 'کافه آ', tip: 'روباز' },
        { title: 'کافه ب', tip: 'فضای باز' },
        { title: 'کافه ج', tip: 'حیاط‌دار' },
      ]),
      makeList('l3', 'صبحانه‌خوری‌ها', [
        { title: 'صبحانه ۱', tip: 'صبحانه عالی' },
        { title: 'صبحانه ۲', tip: 'صبحانه' },
        { title: 'صبحانه ۳', tip: 'برانچ' },
      ]),
      makeList('l4', 'ایتالیایی‌ها', [
        { title: 'رستوران ا', cuisine: 'ایتالیایی' },
        { title: 'رستوران ب', cuisine: 'ایتالیایی' },
        { title: 'رستوران ج', cuisine: 'پاستا' },
      ]),
    ];

    const chips = selectDiscoveryChips(lists, CAFE_DISCOVERY_TOPICS, 6);
    expect(chips.length).toBeGreaterThan(0);
    expect(chips.length).toBeLessThanOrEqual(6);

    const dimensions = chips.map((c) => c.dimension);
    const uniqueDims = new Set(dimensions);
    // پاس اول تنوع می‌سازد؛ اگر چند بُعد موجود باشد نباید همه یک بُعد باشند
    expect(uniqueDims.size).toBeGreaterThanOrEqual(Math.min(3, chips.length));
  });

  it('returns fewer than max when data is thin', () => {
    const lists = [
      makeList('only', 'سوخاری‌ها', [
        { title: 'الف', cuisine: 'سوخاری' },
        { title: 'ب', cuisine: 'سوخاری' },
        { title: 'ج', cuisine: 'سوخاری' },
      ]),
    ];
    const chips = selectDiscoveryChips(lists, CAFE_DISCOVERY_TOPICS, 6);
    expect(chips.length).toBeLessThanOrEqual(2);
    expect(chips.every((c) => c.placeCount >= 3 || c.listCount >= 2)).toBe(true);
  });
});
