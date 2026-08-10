import { describe, expect, it } from 'vitest';
import {
  buildItemSearchHaystack,
  buildCatalogItemSearchFilter,
  buildItemSearchWhere,
  detectBroadQuery,
  expandSearchTerms,
  meaningfulSearchTokens,
  scoreCatalogItemForSearch,
  scoreItemForSearch,
} from '@/lib/search-keywords';

describe('expandSearchTerms', () => {
  it('includes normalized query and tokens', () => {
    const terms = expandSearchTerms('جان ویک');
    expect(terms).toContain('جان ویک');
    expect(terms).toContain('جان');
    expect(terms).toContain('ویک');
  });

  it('expands action synonyms from Persian', () => {
    const terms = expandSearchTerms('اکشن');
    expect(terms).toContain('اکشن');
    expect(terms).toContain('action');
  });

  it('expands heist synonyms', () => {
    const terms = expandSearchTerms('سرقت');
    expect(terms).toContain('heist');
    expect(terms).toContain('robbery');
  });
});

describe('buildItemSearchHaystack', () => {
  it('includes metadata genre and actors', () => {
    const haystack = buildItemSearchHaystack({
      title: 'John Wick',
      metadata: { genre: 'Action', actors: ['Keanu Reeves'] },
    });
    expect(haystack).toContain('action');
    expect(haystack).toContain('keanu reeves');
  });

  it('includes catalog and list tags', () => {
    const haystack = buildItemSearchHaystack({
      title: 'Film',
      catalogTitle: 'Heat',
      catalogMetadata: { genre: 'Crime' },
      listTags: ['اکشن'],
      categoryName: 'فیلم',
    });
    expect(haystack).toContain('heat');
    expect(haystack).toContain('crime');
    expect(haystack).toContain('اکشن');
  });
});

describe('scoreItemForSearch', () => {
  it('ranks exact title highest', () => {
    const exact = scoreItemForSearch({ title: 'John Wick' }, 'John Wick');
    const genre = scoreItemForSearch(
      { title: 'Another Film', metadata: { genre: 'Action' } },
      'اکشن'
    );
    expect(exact.score).toBeGreaterThan(genre.score);
  });

  it('returns genre hint for genre matches', () => {
    const result = scoreItemForSearch(
      { title: 'Heat', metadata: { genre: 'Action, Crime' } },
      'اکشن'
    );
    expect(result.score).toBeGreaterThan(0);
    expect(result.reason).toBe('genre');
    expect(result.matchHint).toContain('ژانر');
  });

  it('classifies list-context-only matches as indirect', () => {
    const result = scoreItemForSearch(
      { title: 'John Wick', listTitle: 'بهترین فیلم‌های اکشن' },
      'اکشن'
    );
    expect(result.score).toBeGreaterThan(0);
    expect(result.matchTier).toBe('indirect');
    expect(result.matchHint).toContain('در لیست');
  });

  it('classifies genre metadata as indirect', () => {
    const result = scoreItemForSearch(
      { title: 'Heat', metadata: { genre: 'Action, Crime' } },
      'اکشن'
    );
    expect(result.matchTier).toBe('indirect');
    expect(result.matchHint).toContain('ژانر');
  });

  it('zeros score when multi-token location query misses a token', () => {
    const cafeOnly = scoreItemForSearch(
      { title: 'کافه رمان', metadata: { neighborhood: 'جردن' } },
      'کافه ولیعصر'
    );
    const both = scoreItemForSearch(
      { title: 'کافه ولیعصر', metadata: { neighborhood: 'ولیعصر' } },
      'کافه ولیعصر'
    );
    expect(cafeOnly.score).toBe(0);
    expect(both.score).toBeGreaterThan(0);
  });
});

describe('buildItemSearchWhere', () => {
  it('ANDs meaningful tokens for location-style queries', () => {
    const where = buildItemSearchWhere('کافه ولیعصر', { isPublic: true });
    expect(where).toHaveProperty('AND');
    const and = (where as { AND: unknown[] }).AND;
    expect(Array.isArray(and)).toBe(true);
    // moderation clause + one clause per meaningful token
    expect(and.length).toBeGreaterThanOrEqual(3);
  });
});

describe('meaningfulSearchTokens', () => {
  it('drops filler words like خیلی', () => {
    expect(meaningfulSearchTokens('خیلی جاسوسی')).toEqual(['جاسوسی']);
  });

  it('keeps multi-word meaningful queries', () => {
    expect(meaningfulSearchTokens('جان ویک')).toEqual(['جان', 'ویک']);
  });
});

describe('buildCatalogItemSearchFilter', () => {
  it('builds AND filter for multiple meaningful tokens', () => {
    const filter = buildCatalogItemSearchFilter('جان ویک');
    expect(filter).toHaveProperty('AND');
    expect(Array.isArray((filter as { AND: unknown[] }).AND)).toBe(true);
  });

  it('ignores filler-only queries', () => {
    const filter = buildCatalogItemSearchFilter('خیلی');
    expect(filter).toEqual({ id: { in: [] } });
  });
});

describe('scoreCatalogItemForSearch', () => {
  it('ranks spy profile higher than unrelated title', () => {
    const spy = scoreCatalogItemForSearch(
      {
        title: 'Tinker Tailor Soldier Spy',
        metadata: {
          genre: 'Thriller',
          searchProfile: { searchText: 'جاسوسی سرد جنگ سرد', keywords: ['espionage'] },
        },
      },
      'خیلی جاسوسی'
    );
    const other = scoreCatalogItemForSearch(
      { title: 'Westworld', metadata: { genre: 'Sci-Fi' } },
      'خیلی جاسوسی'
    );
    expect(spy.score).toBeGreaterThan(other.score);
  });
});

describe('detectBroadQuery', () => {
  it('detects action as broad query', () => {
    const result = detectBroadQuery('اکشن');
    expect(result.isBroad).toBe(true);
    expect(result.subThemes.length).toBeGreaterThan(0);
  });

  it('does not treat specific title search as broad', () => {
    expect(detectBroadQuery('جان ویک').isBroad).toBe(false);
    expect(detectBroadQuery('Christopher Nolan').isBroad).toBe(false);
  });

  it('detects horror as broad', () => {
    expect(detectBroadQuery('ترسناک').isBroad).toBe(true);
  });
});
