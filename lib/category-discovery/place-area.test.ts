import { describe, expect, it } from 'vitest';
import { buildAreaFacets, extractPlaceAreaLabel } from '@/lib/category-discovery/place-area';

describe('extractPlaceAreaLabel', () => {
  it('prefers explicit area', () => {
    expect(
      extractPlaceAreaLabel({
        title: 'مین چیک',
        area: 'سعادت‌آباد',
        address: 'تهران',
      })
    ).toBe('سعادت‌آباد');
  });

  it('extracts from title parentheses', () => {
    expect(extractPlaceAreaLabel({ title: 'مین چیک (سعادت‌آباد)' })).toBe('سعادت‌آباد');
  });

  it('finds west tehran in address', () => {
    expect(
      extractPlaceAreaLabel({
        title: 'رستوران',
        address: 'تهران، غرب تهران، شهرک غرب',
      })
    ).toMatch(/غرب تهران|شهرک غرب/);
  });
});

describe('buildAreaFacets', () => {
  it('counts and sorts areas', () => {
    const facets = buildAreaFacets([
      { areaLabel: 'ونک' },
      { areaLabel: 'ونک' },
      { areaLabel: 'سعادت‌آباد' },
      { areaLabel: null },
    ]);
    expect(facets[0]).toEqual({ label: 'ونک', count: 2 });
    expect(facets.some((f) => f.label === 'سعادت‌آباد')).toBe(true);
  });
});
