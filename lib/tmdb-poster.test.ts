import { describe, expect, it } from 'vitest';
import { isGenericSeedMovieTitle, extractPosterSearchTitles } from './tmdb-poster';
import { itemNeedsPosterEnrich } from './item-poster-needs-enrich';

describe('tmdb-poster helpers', () => {
  it('detects generic seed movie titles', () => {
    expect(isGenericSeedMovieTitle('فیلم درام عاشقانه')).toBe(true);
    expect(isGenericSeedMovieTitle('ماتریکس')).toBe(false);
    expect(isGenericSeedMovieTitle('ترمیناتور 2')).toBe(false);
  });

  it('extracts alternative titles from metadata', () => {
    expect(
      extractPosterSearchTitles('ماتریکس', {
        originalTitle: 'The Matrix',
        year: 1999,
      })
    ).toEqual(['The Matrix']);
  });
});

describe('itemNeedsPosterEnrich', () => {
  it('needs enrich for broken Liara storage URL on movie lists', () => {
    expect(
      itemNeedsPosterEnrich({
        title: 'ماتریکس',
        imageUrl: 'https://storage.c2.liara.space/wibe/items/fake.jpg',
        categorySlug: 'movies',
      })
    ).toBe(true);
  });

  it('skips items that already have TMDB poster', () => {
    expect(
      itemNeedsPosterEnrich({
        title: 'ماتریکس',
        imageUrl: 'https://image.tmdb.org/t/p/w500/abc.jpg',
        categorySlug: 'movies',
      })
    ).toBe(false);
  });

  it('ignores non-movie categories', () => {
    expect(
      itemNeedsPosterEnrich({
        title: 'کافه نادری',
        imageUrl: null,
        categorySlug: 'cafe',
      })
    ).toBe(false);
  });
});
