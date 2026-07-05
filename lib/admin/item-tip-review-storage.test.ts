import { beforeEach, describe, expect, it } from 'vitest';
import {
  getItemTipReviewKey,
  isItemTipReviewed,
  markItemTipReviewed,
  syncItemTipReviewedIds,
} from '@/lib/admin/item-tip-review-storage';

const STORAGE_KEY = 'wibe-admin-item-tips-reviewed';

describe('item-tip-review-storage', () => {
  beforeEach(() => {
    localStorage.removeItem(STORAGE_KEY);
  });

  it('uses catalogItemId as stable review key', () => {
    expect(
      getItemTipReviewKey({ id: 'placement-a', catalogItemId: 'catalog-1' })
    ).toBe('catalog-1');
    expect(getItemTipReviewKey({ id: 'placement-a', catalogItemId: null })).toBe('placement-a');
  });

  it('treats catalog key as reviewed across placements', () => {
    const reviewed = new Set(['catalog-1']);
    expect(
      isItemTipReviewed({ id: 'placement-b', catalogItemId: 'catalog-1' }, reviewed)
    ).toBe(true);
  });

  it('migrates legacy placement ids to catalog keys', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(['placement-a']));

    const migrated = syncItemTipReviewedIds([
      { id: 'placement-a', catalogItemId: 'catalog-1' },
      { id: 'placement-b', catalogItemId: 'catalog-1' },
    ]);

    expect(migrated.has('catalog-1')).toBe(true);
    expect(
      isItemTipReviewed({ id: 'placement-b', catalogItemId: 'catalog-1' }, migrated)
    ).toBe(true);
  });

  it('stores catalog key when marking reviewed', () => {
    const next = markItemTipReviewed({
      id: 'placement-a',
      catalogItemId: 'catalog-1',
    });
    expect(next.has('catalog-1')).toBe(true);
    expect(
      isItemTipReviewed({ id: 'placement-b', catalogItemId: 'catalog-1' }, next)
    ).toBe(true);
  });
});
