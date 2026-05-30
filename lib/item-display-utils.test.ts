import { describe, expect, it } from 'vitest';
import { filterItemsByQuery } from '@/lib/item-display-utils';

describe('filterItemsByQuery', () => {
  const items = [
    { title: 'ماتریکس', description: null, metadata: { year: 1999, genre: 'Sci-Fi' } },
    { title: 'ترمیناتور ۲', description: 'اکشن', metadata: { director: 'James Cameron' } },
    { title: 'راکی ۵', description: null, metadata: null },
  ];

  it('returns all when query empty', () => {
    expect(filterItemsByQuery(items, '')).toHaveLength(3);
  });

  it('matches title', () => {
    expect(filterItemsByQuery(items, 'ماتریکس')).toHaveLength(1);
  });

  it('matches metadata genre', () => {
    expect(filterItemsByQuery(items, 'sci-fi')).toHaveLength(1);
  });

  it('matches director', () => {
    expect(filterItemsByQuery(items, 'cameron')).toHaveLength(1);
  });
});
