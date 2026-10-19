import { describe, expect, it } from 'vitest';
import {
  selectForYouHomeLists,
  selectHomeLcpImageUrl,
  selectHomeRisingLists,
  selectHomeTrendingDesktopLists,
  selectHomeTrendingLists,
} from '@/lib/home-list-selectors';
import type { HomeData } from '@/types/home-data';

const sampleData: HomeData = {
  featured: {
    id: 'f1',
    title: 'Featured',
    slug: 'featured',
    description: '',
    coverImage: '/cover-f.jpg',
    bannerImage: '/banner-f.jpg',
    saveCount: 10,
    itemCount: 5,
    likes: 2,
  },
  featuredSlotId: 'slot-1',
  trending: [
    {
      id: 'f1',
      title: 'Featured dup',
      slug: 'featured',
      description: '',
      coverImage: '/t0.jpg',
      saveCount: 1,
      itemCount: 1,
      likes: 0,
    },
    {
      id: 't1',
      title: 'Trend 1',
      slug: 't1',
      description: '',
      coverImage: '/t1.jpg',
      saveCount: 1,
      itemCount: 1,
      likes: 0,
    },
  ],
  rising: [
    {
      id: 'r1',
      title: 'Rise 1',
      slug: 'r1',
      description: '',
      coverImage: '/r1.jpg',
      saveCount: 1,
      itemCount: 1,
      likes: 0,
      isFastRising: true,
    },
  ],
  recommendations: [],
};

describe('home-list-selectors', () => {
  it('excludes featured from trending lists', () => {
    const lists = selectHomeTrendingLists(sampleData, { limit: 8 });
    expect(lists.map((l) => l.id)).toEqual(['t1']);
  });

  it('pads desktop trending with rising lists', () => {
    const lists = selectHomeTrendingDesktopLists(sampleData, { limit: 8 });
    expect(lists.map((l) => l.id)).toEqual(['t1', 'r1']);
  });

  it('selects rising lists with limit', () => {
    const lists = selectHomeRisingLists(sampleData, { limit: 4 });
    expect(lists).toHaveLength(1);
    expect(lists[0]?.id).toBe('r1');
  });

  it('keeps for-you lists that are not already on the trending row', () => {
    const picked = selectForYouHomeLists({
      recommendations: [
        { id: 't1' },
        { id: 'fresh' },
        { id: 'f1' },
      ],
      trending: sampleData.trending,
      featuredId: 'f1',
      rising: [{ id: 'r1' }, { id: 'fresh' }],
    });
    expect(picked.pool.map((list) => list.id)).toEqual(['fresh', 'r1']);
    expect(picked.mobile.map((list) => list.id)).toEqual(['fresh', 'r1']);
    expect(picked.usedRisingOnly).toBe(false);
  });

  it('uses the far end of recommendations when they repeat the trending row', () => {
    const picked = selectForYouHomeLists({
      recommendations: [
        { id: 't1' },
        { id: 't2' },
        { id: 't3' },
        { id: 't4' },
      ],
      trending: [{ id: 't1' }, { id: 't2' }, { id: 't3' }, { id: 't4' }],
      featuredId: 'f1',
    });
    expect(picked.mobile.map((list) => list.id)).toEqual(['t2', 't3', 't4']);
    expect(picked.usedRisingOnly).toBe(false);
  });

  it('returns no for-you row when nothing can be suggested', () => {
    const picked = selectForYouHomeLists({
      recommendations: [],
      trending: sampleData.trending,
      featuredId: 'f1',
      rising: [{ id: 'f1' }, { id: 't1' }],
    });
    expect(picked.pool).toEqual([]);
  });

  it('prefers banner for LCP preload', () => {
    expect(selectHomeLcpImageUrl(sampleData)).toBe('/banner-f.jpg');
  });
});
