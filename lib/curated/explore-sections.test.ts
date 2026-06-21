import { describe, expect, it } from 'vitest';
import type { CuratedList } from '@/types/curated';
import { buildExploreSections } from '@/lib/curated/explore-sections';
import { scoreListKeywordMatch } from '@/lib/interest-keywords';

function makeList(overrides: Partial<CuratedList> & { id: string; title: string }): CuratedList {
  return {
    slug: overrides.id,
    categoryId: 'cat-1',
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
      makeList({ id: '2', title: 'فیلم‌های اکشن', tags: ['action', 'اکشن'], savesCount: 2 }),
      ...Array.from({ length: 8 }, (_, i) =>
        makeList({ id: `filler-${i}`, title: `لیست عمومی ${i}`, tags: [], savesCount: 1 })
      ),
    ];

    const sections = buildExploreSections(lists, '', {
      preferredKeywordIds: ['coffee', 'tehran'],
    });

    expect(sections.isPersonalized).toBe(true);
    expect(sections.forYou.some((l) => l.id === '1')).toBe(true);
  });

  it('scores 500 lists × 10 keywords under 15ms', () => {
    const lists = Array.from({ length: 500 }, (_, i) =>
      makeList({
        id: `list-${i}`,
        title: i % 3 === 0 ? 'کافه قهوه تهران' : i % 5 === 0 ? 'فیلم اکشن' : `لیست ${i}`,
        tags: i % 3 === 0 ? ['coffee'] : i % 5 === 0 ? ['action'] : [],
      })
    );
    const keywordIds = ['coffee', 'action', 'tehran', 'comedy', 'drama', 'novel', 'travel', 'cars', 'ai', 'dessert'];

    const start = performance.now();
    for (let run = 0; run < 20; run++) {
      buildExploreSections(lists, '', { preferredKeywordIds: keywordIds });
    }
    const elapsed = performance.now() - start;
    const perRun = elapsed / 20;

    expect(perRun).toBeLessThan(15);

    const singleScore = scoreListKeywordMatch(lists[0], keywordIds);
    expect(singleScore).toBeGreaterThanOrEqual(0);
  });
});
