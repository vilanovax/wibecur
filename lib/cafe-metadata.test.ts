import { describe, expect, it } from 'vitest';
import {
  displayInstagramHandle,
  normalizeCafeMetadataFields,
  normalizeInstagramUrl,
  normalizeMapsUrl,
} from '@/lib/cafe-metadata';

describe('cafe metadata normalization', () => {
  it('normalizes instagram handle to url', () => {
    expect(normalizeInstagramUrl('@naderi.rest')).toBe('https://www.instagram.com/naderi.rest');
  });

  it('builds maps url from plain address', () => {
    const url = normalizeMapsUrl('تهران، جردن');
    expect(url).toContain('google.com/maps/search');
    expect(url).toContain(encodeURIComponent('تهران، جردن'));
  });

  it('keeps full cafe metadata fields', () => {
    const meta = normalizeCafeMetadataFields({
      address: 'تهران',
      priceRange: '$$',
      cuisine: 'ایرانی',
      phone: '021 1234 5678',
      instagram: 'naderi.rest',
      website: 'naderi.ir',
      mapsUrl: 'https://maps.google.com/?q=1,2',
      tip: 'رزرو کنید',
    });

    expect(meta.address).toBe('تهران');
    expect(meta.phone).toBe('021 1234 5678');
    expect(meta.instagram).toBe('https://www.instagram.com/naderi.rest');
    expect(meta.website).toBe('https://naderi.ir');
    expect(meta.mapsUrl).toBe('https://maps.google.com/?q=1,2');
  });

  it('formats instagram display handle', () => {
    expect(displayInstagramHandle('https://www.instagram.com/naderi.rest/')).toBe('@naderi.rest');
  });
});
