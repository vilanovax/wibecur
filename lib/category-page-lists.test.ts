import { describe, expect, it } from 'vitest';
import { pickCategoryNewLists } from '@/lib/category-page-lists';

const trending = Array.from({ length: 10 }, (_, index) => ({
  id: `hot-${index + 1}`,
}));

describe('pickCategoryNewLists', () => {
  it('removes lists shown in the trending grid and backfills', () => {
    const candidates = [
      { id: 'hot-1' },
      { id: 'hot-3' },
      { id: 'fresh-1' },
      { id: 'hot-8' },
      { id: 'fresh-2' },
      { id: 'fresh-3' },
      { id: 'fresh-4' },
      { id: 'hot-9' },
    ];

    expect(pickCategoryNewLists(candidates, trending, null, 4).map((list) => list.id)).toEqual([
      'fresh-1',
      'fresh-2',
      'fresh-3',
      'fresh-4',
    ]);
  });

  it('keeps a trending list past the visible grid', () => {
    const candidates = [{ id: 'hot-9' }, { id: 'fresh-1' }];
    expect(pickCategoryNewLists(candidates, trending, null, 4).map((list) => list.id)).toEqual([
      'hot-9',
      'fresh-1',
    ]);
  });

  it('also drops a viral spotlight that is not the first trending card', () => {
    const candidates = [{ id: 'viral' }, { id: 'fresh-1' }, { id: 'fresh-2' }];
    expect(
      pickCategoryNewLists(candidates, trending, { id: 'viral' }, 4).map((list) => list.id)
    ).toEqual(['fresh-1', 'fresh-2']);
  });

  it('does not double-count a viral card that is already the first trending card', () => {
    const candidates = [{ id: 'hot-1' }, { id: 'fresh-1' }];
    expect(
      pickCategoryNewLists(candidates, trending, { id: 'hot-1' }, 4).map((list) => list.id)
    ).toEqual(['fresh-1']);
  });
});
