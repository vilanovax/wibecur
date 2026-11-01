import { describe, expect, it } from 'vitest';
import { filterListsByQuery, normalizeSearchQuery } from '@/lib/list-search';

describe('normalizeSearchQuery', () => {
  it('trims and collapses whitespace', () => {
    expect(normalizeSearchQuery('  کافه   دنج  ')).toBe('کافه دنج');
  });

  it('maps Arabic kaf/yeh/teh-marbuta to Persian forms', () => {
    expect(normalizeSearchQuery('كافه')).toBe('کافه');
    expect(normalizeSearchQuery('فيلم')).toBe('فیلم');
    expect(normalizeSearchQuery('مكة')).toBe('مکه');
  });
});

describe('filterListsByQuery', () => {
  const lists = [
    { title: 'کافه‌های صبحانه عالی', description: null, categories: { name: 'کافه' } },
    { title: 'فیلم‌های جاسوسی', description: 'لیست فیلم', categories: { name: 'فیلم' } },
  ];

  it('matches Arabic kaf query against Persian titles', () => {
    expect(filterListsByQuery(lists, 'كافه')).toHaveLength(1);
    expect(filterListsByQuery(lists, 'كافه')[0]?.title).toContain('کافه');
  });

  it('matches Persian kaf as before', () => {
    expect(filterListsByQuery(lists, 'کافه')).toHaveLength(1);
  });
});
