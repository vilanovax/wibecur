import { describe, expect, it } from 'vitest';
import {
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

  it('prefers banner for LCP preload', () => {
    expect(selectHomeLcpImageUrl(sampleData)).toBe('/banner-f.jpg');
  });
});
