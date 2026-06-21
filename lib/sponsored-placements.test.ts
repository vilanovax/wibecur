import { describe, expect, it } from 'vitest';
import {
  isPlacementActive,
  pickBestCategoryPlacement,
  pickBestListPlacement,
  validateDestinationUrl,
  type SponsoredScopeType,
} from '@/lib/sponsored-placements';

type Row = {
  id: string;
  scopeType: string;
  categoryId: string | null;
  listIds: string[];
  listId: string | null;
  surface: string;
  headline: string;
  bodyText: string | null;
  ctaLabel: string;
  destinationUrl: string;
  sponsorName: string | null;
  disclosureLabel: string;
  startAt: Date;
  endAt: Date | null;
  isActive: boolean;
  priority: number;
};

function row(
  overrides: Partial<Row> & { id: string; scopeType: SponsoredScopeType }
): Row {
  return {
    categoryId: 'cat-book',
    listIds: [],
    listId: null,
    surface: 'LIST_BANNER',
    headline: 'Test',
    bodyText: null,
    ctaLabel: 'Go',
    destinationUrl: 'https://example.com',
    sponsorName: null,
    disclosureLabel: 'تبلیغ',
    startAt: new Date('2026-01-01'),
    endAt: null,
    isActive: true,
    priority: 0,
    ...overrides,
  };
}

describe('sponsored-placements resolver', () => {
  it('prefers LIST scope over category-wide', () => {
    const rows = [
      row({ id: 'all', scopeType: 'CATEGORY_ALL', priority: 10 }),
      row({ id: 'list', scopeType: 'LIST', listId: 'list-1', priority: 0 }),
    ];
    const best = pickBestListPlacement(rows, 'list-1', 'cat-book');
    expect(best?.id).toBe('list');
  });

  it('matches CATEGORY_SELECTED only for included lists', () => {
    const rows = [
      row({
        id: 'sel',
        scopeType: 'CATEGORY_SELECTED',
        listIds: ['list-a'],
        priority: 5,
      }),
    ];
    expect(pickBestListPlacement(rows, 'list-a', 'cat-book')?.id).toBe('sel');
    expect(pickBestListPlacement(rows, 'list-b', 'cat-book')).toBeNull();
  });

  it('resolves category banner for CATEGORY_ALL', () => {
    const rows = [
      row({
        id: 'cat',
        scopeType: 'CATEGORY_ALL',
        surface: 'CATEGORY_BANNER',
        categoryId: 'cat-movie',
      }),
    ];
    expect(pickBestCategoryPlacement(rows, 'cat-movie')?.id).toBe('cat');
    expect(pickBestCategoryPlacement(rows, 'cat-book')).toBeNull();
  });

  it('checks active window', () => {
    const active = row({ id: 'a', scopeType: 'LIST', listId: 'l1' });
    expect(isPlacementActive(active, new Date('2026-06-01'))).toBe(true);

    const expired = row({
      id: 'b',
      scopeType: 'LIST',
      listId: 'l2',
      endAt: new Date('2026-01-02'),
    });
    expect(isPlacementActive(expired, new Date('2026-06-01'))).toBe(false);
  });

  it('resolves sidebar surface independently from banner', () => {
    const rows = [
      row({ id: 'banner', scopeType: 'CATEGORY_ALL', surface: 'LIST_BANNER', priority: 1 }),
      row({
        id: 'sidebar',
        scopeType: 'CATEGORY_ALL',
        surface: 'LIST_SIDEBAR',
        priority: 0,
      }),
    ];
    expect(pickBestListPlacement(rows, 'list-1', 'cat-book', 'LIST_BANNER')?.id).toBe('banner');
    expect(pickBestListPlacement(rows, 'list-1', 'cat-book', 'LIST_SIDEBAR')?.id).toBe('sidebar');
  });

  it('validates destination URLs', () => {
    expect(validateDestinationUrl('https://example.com')).toBe(true);
    expect(validateDestinationUrl('http://example.com/path')).toBe(true);
    expect(validateDestinationUrl('javascript:alert(1)')).toBe(false);
    expect(validateDestinationUrl('not-a-url')).toBe(false);
  });
});
