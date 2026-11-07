import { describe, expect, it } from 'vitest';
import { getForYouReasonLabel, type ForYouList } from './useForYouRecommendations';

function list(partial: Partial<ForYouList> = {}): ForYouList {
  return {
    id: '1',
    title: 'نمونه',
    slug: 'sample',
    description: '',
    coverImage: '',
    saveCount: 0,
    itemCount: 0,
    likes: 0,
    categories: {
      id: 'c1',
      name: 'کافه و رستوران',
      slug: 'cafe',
      icon: '🍽',
    },
    ...partial,
  };
}

describe('getForYouReasonLabel', () => {
  it('returns short similar reason without category name', () => {
    expect(getForYouReasonLabel(list({ reasonType: 'similar' }), true)).toBe('مشابه ذخیره‌ها');
  });

  it('returns short category reason without repeating category', () => {
    expect(getForYouReasonLabel(list({ reasonType: 'category' }), true)).toBe('بر اساس علاقه‌ات');
  });

  it('returns popular reason', () => {
    expect(getForYouReasonLabel(list({ reasonType: 'popular' }), true)).toBe('محبوب در وایب');
  });

  it('hides badge when feed is not personalized', () => {
    expect(getForYouReasonLabel(list({ reasonType: 'category' }), false)).toBeNull();
  });
});
