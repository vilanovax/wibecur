import { describe, expect, it } from 'vitest';
import {
  dedupeActiveCategoriesByAlias,
  expandCategorySlugFilter,
  isSameCategorySlug,
} from '@/lib/category-slug-aliases';

describe('dedupeActiveCategoriesByAlias', () => {
  it('merges books and bookpodcast into one active category', () => {
    const result = dedupeActiveCategoriesByAlias([
      { slug: 'movies', name: 'فیلم و سریال', order: 1 },
      { slug: 'books', name: 'کتاب', order: 2 },
      { slug: 'bookpodcast', name: 'کتاب و پادکست', order: 3 },
      { slug: 'cafe', name: 'کافه و رستوران', order: 4 },
    ]);
    expect(result.map((c) => c.slug)).toEqual(['movies', 'bookpodcast', 'cafe']);
    expect(result.find((c) => c.slug === 'books')).toBeUndefined();
  });
});

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
