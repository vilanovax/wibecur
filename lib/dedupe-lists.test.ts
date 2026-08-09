import { describe, expect, it } from 'vitest';
import {
  dedupeListsByDisplayTitle,
  normalizeDisplayTitleKey,
} from '@/lib/dedupe-lists';

describe('dedupeListsByDisplayTitle', () => {
  it('keeps one list when display titles collide', () => {
    const lists = [
      {
        id: 'a',
        title: 'فیلم‌هایی برای بقا',
        slug: 'movies-for-survival-a',
        saveCount: 3,
      },
      {
        id: 'b',
        title: 'فیلمهایی برای بقا',
        slug: 'movies-for-survival-b',
        saveCount: 12,
      },
    ];
    const out = dedupeListsByDisplayTitle(lists);
    expect(out).toHaveLength(1);
    expect(out[0]?.id).toBe('b');
  });

  it('prefers featured over higher saves when featured', () => {
    const lists = [
      { id: 'a', title: 'کافه‌های دنج', slug: 'a', saveCount: 99 },
      { id: 'b', title: 'کافه‌های دنج', slug: 'b', saveCount: 1, isFeatured: true },
    ];
    const out = dedupeListsByDisplayTitle(lists);
    expect(out).toHaveLength(1);
    expect(out[0]?.id).toBe('b');
  });

  it('keeps distinct titles', () => {
    const lists = [
      { id: 'a', title: 'فیلم‌های کمدی', slug: 'comedy' },
      { id: 'b', title: 'فیلم‌های جاسوسی', slug: 'spy' },
    ];
    expect(dedupeListsByDisplayTitle(lists)).toHaveLength(2);
  });
});

describe('normalizeDisplayTitleKey', () => {
  it('collapses zwnj and spacing', () => {
    expect(normalizeDisplayTitleKey('فیلم‌هایی برای بقا')).toBe(
      normalizeDisplayTitleKey('فیلمهایی برای بقا')
    );
  });
});
