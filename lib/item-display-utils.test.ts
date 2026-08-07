import { describe, expect, it } from 'vitest';
import { getItemCardSubtitle } from '@/lib/item-display-utils';

describe('getItemCardSubtitle cafe', () => {
  it('shows address, cuisine and price for restaurant items', () => {
    const subtitle = getItemCardSubtitle({
      categorySlug: 'cafe',
      metadata: {
        address: 'تهران، جردن، کوچه ۲۳',
        cuisine: 'ایرانی',
        priceRange: '$$',
      },
    });
    expect(subtitle).toContain('ایرانی');
    expect(subtitle).toContain('متوسط');
    expect(subtitle).toContain('جردن');
  });
});

describe('getItemCardSubtitle book', () => {
  it('prefers author for book categories', () => {
    const subtitle = getItemCardSubtitle({
      categorySlug: 'books',
      metadata: {
        author: 'افلاطون',
        genre: 'فلسفه',
        year: 380,
      },
    });
    expect(subtitle).toBe('افلاطون');
  });
});
