import { describe, expect, it } from 'vitest';
import type { CuratedList } from '@/types/curated';
import {
  buildExploreSections,
  scoreListForForYou,
  selectExploreTrendingLists,
} from '@/lib/curated/explore-sections';
import { scoreListKeywordMatch } from '@/lib/interest-keywords';

function makeList(
  overrides: Partial<CuratedList> & { id: string; title: string; categoryId?: string }
): CuratedList {
  return {
    slug: overrides.id,
    categoryId: overrides.categoryId ?? 'cat-cafe',
    coverUrl: null,
    itemsCount: 5,
    savesCount: 10,
    likesCount: 3,
    badges: [],
    creator: {
      id: 'u1',
      name: 'User',
      username: 'user',
      avatarUrl: null,
      levelTitle: 'Explorer',
      badges: [],
    },
    createdAt: new Date().toISOString(),
    trendScore: 1,
    ...overrides,
  };
}

describe('buildExploreSections keyword personalization', () => {
  it('prioritizes lists matching user keywords', () => {
    const lists = [
      makeList({ id: '1', title: 'بهترین کافه‌های تهران', tags: ['قهوه', 'تهران'], savesCount: 1 }),
      makeList({ id: '2', title: 'فیلم‌های اکشن', categoryId: 'cat-movie', tags: ['action', 'اکشن'], savesCount: 2 }),
      ...Array.from({ length: 8 }, (_, i) =>
        makeList({ id: `filler-${i}`, title: `لیست عمومی ${i}`, tags: [], savesCount: 1 })
      ),
    ];

    const sections = buildExploreSections(lists, '', {
      preferredKeywordIds: ['coffee', 'tehran'],
      activeCategoryIds: ['cat-cafe', 'cat-movie'],
    });

    expect(sections.isPersonalized).toBe(true);
    expect(sections.forYou.some((l) => l.id === '1')).toBe(true);
  });

  it('includes at least one list per active category even with cafe-only keywords', () => {
    const lists = [
      makeList({
        id: 'cafe-1',
        title: 'کافه صبحانه عالی',
        categoryId: 'cat-cafe',
        tags: ['breakfast', 'coffee'],
        savesCount: 50,
        trendScore: 5,
      }),
      makeList({
        id: 'movie-1',
        title: 'فیلم‌های اکشن برتر',
        categoryId: 'cat-movie',
        tags: ['action'],
        savesCount: 40,
        trendScore: 4,
      }),
      makeList({
        id: 'book-1',
        title: 'رمان‌های برتر',
        categoryId: 'cat-book',
        tags: ['novel'],
        savesCount: 30,
        trendScore: 3,
      }),
    ];

    const sections = buildExploreSections(lists, '', {
      preferredKeywordIds: ['coffee', 'breakfast', 'restaurant'],
      activeCategoryIds: ['cat-cafe', 'cat-movie', 'cat-book'],
    });

    expect(sections.diverseCategories).toBe(true);
    expect(sections.forYou.some((l) => l.categoryId === 'cat-movie')).toBe(true);
    expect(sections.forYou.some((l) => l.categoryId === 'cat-book')).toBe(true);
    expect(sections.forYou.some((l) => l.categoryId === 'cat-cafe')).toBe(true);
  });

  it('scores 500 lists × 10 keywords under 15ms', () => {
    const lists = Array.from({ length: 500 }, (_, i) =>
      makeList({
        id: `list-${i}`,
        title: i % 3 === 0 ? 'کافه قهوه تهران' : i % 5 === 0 ? 'فیلم اکشن' : `لیست ${i}`,
        tags: i % 3 === 0 ? ['coffee'] : i % 5 === 0 ? ['action'] : [],
        categoryId: i % 5 === 0 ? 'cat-movie' : 'cat-cafe',
      })
    );
    const keywordIds = ['coffee', 'action', 'tehran', 'comedy', 'drama', 'novel', 'travel', 'cars', 'ai', 'dessert'];

    const start = performance.now();
    for (let run = 0; run < 20; run++) {
      buildExploreSections(lists, '', {
        preferredKeywordIds: keywordIds,
        activeCategoryIds: ['cat-cafe', 'cat-movie'],
      });
    }
    const elapsed = performance.now() - start;
    const perRun = elapsed / 20;

    expect(perRun).toBeLessThan(15);

    const singleScore = scoreListKeywordMatch(lists[0], keywordIds);
    expect(singleScore).toBeGreaterThanOrEqual(0);
  });

  it('selectExploreTrendingLists returns trending slice', () => {
    const lists = [
      ...Array.from({ length: 5 }, (_, i) =>
        makeList({
          id: `trending-${i}`,
          title: `ترند ${i}`,
          badges: ['trending'],
          savesCount: 30 + i,
        })
      ),
      ...Array.from({ length: 10 }, (_, i) =>
        makeList({ id: `filler-${i}`, title: `لیست ${i}`, savesCount: 1 })
      ),
    ];
    const trending = selectExploreTrendingLists(lists);
    expect(trending.length).toBeGreaterThan(0);
  });
});

describe('scoreListForForYou', () => {
  it('boosts preferred category and keywords', () => {
    const cafe = makeList({ id: 'c1', title: 'کافه قهوه', tags: ['coffee'] });
    const movie = makeList({ id: 'm1', title: 'فیلم', categoryId: 'cat-movie' });

    const cafeScore = scoreListForForYou(cafe, ['coffee'], new Set(['cat-cafe']));
    const movieScore = scoreListForForYou(movie, ['coffee'], new Set(['cat-cafe']));

    expect(cafeScore).toBeGreaterThan(movieScore);
  });
});

describe('buildExploreSections cover trust', () => {
  it('avoids duplicate cover assets across forYou when alternatives exist', () => {
    const shared = '/images/banners/cafe-2.webp';
    const lists = [
      makeList({
        id: 'cafe-a',
        title: 'کافه صبحانه',
        categoryId: 'cat-cafe',
        coverUrl: shared,
        savesCount: 80,
        trendScore: 9,
        badges: ['featured'],
      }),
      makeList({
        id: 'cafe-b',
        title: 'کافه فضای باز',
        categoryId: 'cat-cafe',
        coverUrl: shared,
        savesCount: 70,
        trendScore: 8,
      }),
      makeList({
        id: 'cafe-c',
        title: 'کافه دنج',
        categoryId: 'cat-cafe',
        coverUrl: '/images/banners/cafe-3.webp',
        savesCount: 60,
        trendScore: 7,
      }),
      makeList({
        id: 'movie-1',
        title: 'فیلم‌های اکشن',
        categoryId: 'cat-movie',
        coverUrl: '/images/banners/movies.webp',
        savesCount: 50,
        trendScore: 6,
      }),
      makeList({
        id: 'book-1',
        title: 'رمان‌ها',
        categoryId: 'cat-book',
        coverUrl: '/images/banners/books.webp',
        savesCount: 40,
        trendScore: 5,
      }),
    ];

    const sections = buildExploreSections(lists, '', {
      activeCategoryIds: ['cat-cafe', 'cat-movie', 'cat-book'],
    });

    const forYouCovers = sections.forYou
      .map((l) => l.coverUrl)
      .filter((url): url is string => Boolean(url));
    const unique = new Set(forYouCovers);
    expect(unique.size).toBe(forYouCovers.length);
    expect(sections.forYou.some((l) => l.id === 'cafe-c')).toBe(true);
  });
});
