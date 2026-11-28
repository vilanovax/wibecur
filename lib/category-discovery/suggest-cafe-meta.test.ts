import { describe, expect, it } from 'vitest';
import {
  cafeMetaNeedsAttention,
  suggestCafeMeta,
} from '@/lib/category-discovery/suggest-cafe-meta';

describe('suggestCafeMeta', () => {
  it('suggests cuisine from list title when item cuisine empty', () => {
    const s = suggestCafeMeta({
      itemTitle: 'مین چیک',
      listTitle: 'سوخاری‌های خوب تهران',
      existingCuisine: null,
    });
    expect(s.cuisine).toContain('سوخاری');
    expect(s.confidence).toBe('high');
  });

  it('does not overwrite existing cuisine', () => {
    const s = suggestCafeMeta({
      itemTitle: 'مین چیک',
      listTitle: 'سوخاری‌های خوب تهران',
      existingCuisine: 'فست‌فود',
    });
    expect(s.cuisine).toBeUndefined();
  });

  it('suggests area from title parentheses', () => {
    const s = suggestCafeMeta({
      itemTitle: 'کافه موج (سعادت‌آباد)',
      existingArea: null,
    });
    expect(s.area).toBe('سعادت‌آباد');
  });

  it('suggests region from list title', () => {
    const s = suggestCafeMeta({
      itemTitle: 'رستوران الف',
      listTitle: 'رستوران‌های غرب تهران',
      existingRegion: null,
    });
    expect(s.region).toBe('غرب تهران');
  });

  it('maps area to official region', () => {
    const s = suggestCafeMeta({
      itemTitle: 'پاستا فکتوری (میرداماد)',
      existingArea: null,
      existingRegion: null,
    });
    expect(s.area).toBe('میرداماد');
    expect(s.region).toBe('شمال تهران');
  });
});

describe('cafeMetaNeedsAttention', () => {
  it('flags missing cuisine and place', () => {
    expect(cafeMetaNeedsAttention({ cuisine: null, area: null, region: null })).toEqual({
      missingCuisine: true,
      missingPlace: true,
    });
    expect(
      cafeMetaNeedsAttention({ cuisine: 'برگر', area: 'ونک', region: null })
    ).toEqual({ missingCuisine: false, missingPlace: false });
  });
});
