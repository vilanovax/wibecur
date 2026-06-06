import { describe, expect, it } from 'vitest';
import {
  buildGoogleImageSearchQuery,
  buildMoviePosterSearchQuery,
  extractEnglishMovieTitle,
} from './item-image-search-query';
import { buildMoviePosterSearchQueries } from './movie-poster-search';

describe('item-image-search-query', () => {
  it('extracts English title from bilingual item title', () => {
    expect(extractEnglishMovieTitle('Coherence - همبستگی')).toBe('Coherence');
    expect(extractEnglishMovieTitle('فیلم و سریال Coherence - همبستگی')).toBe('Coherence');
    expect(extractEnglishMovieTitle('Fight Club - باشگاه مشت‌زنی')).toBe('Fight Club');
  });

  it('builds Google query with type + full title', () => {
    expect(
      buildGoogleImageSearchQuery({
        title: 'Coherence - همبستگی',
        categorySlug: 'movies',
      })
    ).toBe('فیلم و سریال Coherence - همبستگی');
  });

  it('uses English-only for TMDb default query', () => {
    expect(
      buildMoviePosterSearchQuery('فیلم و سریال Coherence - همبستگی')
    ).toBe('Coherence');
  });
});

describe('buildMoviePosterSearchQueries', () => {
  it('starts with English title', () => {
    const q = buildMoviePosterSearchQueries('Coherence - همبستگی');
    expect(q[0]).toBe('Coherence');
  });
});
