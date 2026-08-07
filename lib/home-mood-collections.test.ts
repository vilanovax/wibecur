import { describe, expect, it } from 'vitest';
import {
  buildHomeMoodCollections,
  pickFreshMoodLists,
  pickQuickMoodLists,
  pickWeekendMoodLists,
} from '@/lib/home-mood-collections';
import type { HomeListData, RisingListData } from '@/types/home-data';

function list(
  partial: Partial<HomeListData> & Pick<HomeListData, 'id' | 'title' | 'slug'>
): HomeListData {
  return {
    description: '',
    coverImage: '/covers/real.jpg',
    saveCount: 10,
    itemCount: 8,
    likes: 0,
    categories: { id: '1', name: 'کافه', slug: 'cafe', icon: '☕' },
    ...partial,
  };
}

describe('pickWeekendMoodLists', () => {
  it('prefers one list per weekend category bucket', () => {
    const pool = [
      list({ id: '1', title: 'کافه', slug: 'cafe-1', categories: { id: '1', name: 'کافه', slug: 'cafe', icon: '☕' } }),
      list({ id: '2', title: 'فیلم', slug: 'film-1', categories: { id: '2', name: 'فیلم', slug: 'movie', icon: '🎬' } }),
      list({ id: '3', title: 'سفر', slug: 'travel-1', categories: { id: '3', name: 'سفر', slug: 'travel', icon: '🌍' } }),
      list({ id: '4', title: 'کتاب', slug: 'book-1', categories: { id: '4', name: 'کتاب', slug: 'book', icon: '📚' } }),
    ];
    const used = new Set<string>();
    const picked = pickWeekendMoodLists(pool, used);

    expect(picked).toHaveLength(3);
    expect(picked.map((l) => l.id)).toEqual(['1', '2', '3']);
    expect(used.size).toBe(3);
  });

  it('does not include book lists when enough weekend lists exist', () => {
    const pool = [
      list({ id: 'b', title: 'کتاب', slug: 'book', categories: { id: '4', name: 'کتاب', slug: 'book', icon: '📚' } }),
      list({ id: 'c', title: 'کافه', slug: 'cafe', categories: { id: '1', name: 'کافه', slug: 'cafe', icon: '☕' } }),
      list({ id: 'f', title: 'فیلم', slug: 'film', categories: { id: '2', name: 'فیلم', slug: 'movie', icon: '🎬' } }),
    ];
    const used = new Set<string>();
    const picked = pickWeekendMoodLists(pool, used);

    expect(picked.some((l) => l.id === 'b')).toBe(false);
  });
});

describe('pickQuickMoodLists', () => {
  it('only picks lists with itemCount at or below quick max', () => {
    const pool = [
      list({ id: 'short', title: 'کوتاه', slug: 'short', itemCount: 5 }),
      list({ id: 'long', title: 'بلند', slug: 'long', itemCount: 40 }),
    ];
    const used = new Set<string>();
    const picked = pickQuickMoodLists(pool, used);

    expect(picked.map((l) => l.id)).toEqual(['short']);
  });
});

describe('pickFreshMoodLists', () => {
  it('prioritizes fast-rising lists', () => {
    const rising: RisingListData[] = [
      { ...list({ id: 'slow', title: 'آهسته', slug: 'slow' }), isFastRising: false },
      { ...list({ id: 'fast', title: 'سریع', slug: 'fast' }), isFastRising: true },
    ];
    const used = new Set<string>();
    const picked = pickFreshMoodLists(rising, [], used);

    expect(picked[0]?.id).toBe('fast');
  });
});

describe('buildHomeMoodCollections', () => {
  it('deduplicates lists across mood cards', () => {
    const shared = list({ id: 'shared', title: 'مشترک', slug: 'shared', itemCount: 5 });
    const moods = buildHomeMoodCollections({
      featured: null,
      featuredSlotId: null,
      trending: [
        shared,
        list({ id: 'cafe', title: 'کافه', slug: 'cafe', categories: { id: '1', name: 'کافه', slug: 'cafe', icon: '☕' } }),
        list({ id: 'film', title: 'فیلم', slug: 'film', categories: { id: '2', name: 'فیلم', slug: 'movie', icon: '🎬' } }),
        list({ id: 'travel', title: 'سفر', slug: 'travel', categories: { id: '3', name: 'سفر', slug: 'travel', icon: '🌍' } }),
      ],
      rising: [{ ...list({ id: 'rise', title: 'رشد', slug: 'rise', itemCount: 40 }), isFastRising: true }],
      recommendations: [],
    });

    const allIds = moods.flatMap((m) => m.lists.map((l) => l.id));
    expect(new Set(allIds).size).toBe(allIds.length);
  });
});
