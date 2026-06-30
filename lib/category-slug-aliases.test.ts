import { describe, expect, it } from 'vitest';
import {
  expandCategorySlugFilter,
  isSameCategorySlug,
} from '@/lib/category-slug-aliases';

describe('isSameCategorySlug', () => {
  it('treats book aliases as one category', () => {
    expect(isSameCategorySlug('book', 'books')).toBe(true);
    expect(isSameCategorySlug('book', 'bookpodcast')).toBe(true);
    expect(isSameCategorySlug('books', 'bookpodcast')).toBe(true);
  });

  it('keeps unrelated categories distinct', () => {
    expect(isSameCategorySlug('book', 'cafe')).toBe(false);
    expect(isSameCategorySlug('movies', 'movie')).toBe(true);
    expect(isSameCategorySlug('movies', 'cafe')).toBe(false);
  });
});

describe('expandCategorySlugFilter', () => {
  it('expands book chip filter to all book aliases', () => {
    const slugs = expandCategorySlugFilter('bookpodcast');
    expect(slugs).toContain('book');
    expect(slugs).toContain('books');
    expect(slugs).toContain('bookpodcast');
  });

  it('returns single slug for unknown categories', () => {
    expect(expandCategorySlugFilter('cafe')).toEqual(['cafe']);
  });
});
