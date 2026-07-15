import { describe, expect, it } from 'vitest';
import { buildCafePhotoSearchQuery, isCafeCategorySlug } from '@/lib/cafe-cover-search';

describe('isCafeCategorySlug', () => {
  it('matches cafe and restaurant slugs', () => {
    expect(isCafeCategorySlug('cafe')).toBe(true);
    expect(isCafeCategorySlug('restaurant')).toBe(true);
    expect(isCafeCategorySlug('books')).toBe(false);
  });
});

describe('buildCafePhotoSearchQuery', () => {
  it('builds simple restaurant cafe query from title', () => {
    const query = buildCafePhotoSearchQuery('آشکده دارچین', {
      address: 'جردن، تهران',
      cuisine: 'آبدوغ‌خیار',
    });
    expect(query).toBe('رستوران کافه آشکده دارچین');
  });

  it('ignores list title and metadata extras', () => {
    const query = buildCafePhotoSearchQuery('عمارت یار', null, 'بهترین کافه‌های تهران');
    expect(query).toBe('رستوران کافه عمارت یار');
  });
});
