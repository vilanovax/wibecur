import { describe, expect, it } from 'vitest';
import { parseMediaImport, parseMediaTarget, safeBannerFileName } from './media-targets';

describe('parseMediaTarget', () => {
  it('reads a category slug and a list banner slug', () => {
    expect(parseMediaTarget('category:cafe')).toEqual({ kind: 'category', id: 'cafe' });
    expect(parseMediaTarget('list-banner:great-breakfast-cafes')).toEqual({
      kind: 'list-banner',
      id: 'great-breakfast-cafes',
    });
  });

  it('reads a person role and slug', () => {
    expect(parseMediaTarget('person:author:bozorg-alavi')).toEqual({
      kind: 'person',
      role: 'author',
      slug: 'bozorg-alavi',
    });
  });

  it('rejects paths and unknown kinds', () => {
    expect(parseMediaTarget('banner:cafe.webp')).toBeNull();
    expect(parseMediaTarget('category:../cafe')).toBeNull();
    expect(parseMediaTarget('category:')).toBeNull();
    expect(parseMediaTarget('person:author')).toBeNull();
  });
});

describe('parseMediaImport', () => {
  it('accepts an assignments array', () => {
    const parsed = parseMediaImport({
      assignments: [{ target: 'item:abc', url: 'https://cdn.example/a.webp' }],
    });
    expect(parsed).toEqual([{ target: 'item:abc', url: 'https://cdn.example/a.webp' }]);
  });

  it('rejects an empty file and a bad target', () => {
    expect(parseMediaImport({ assignments: [] })).toEqual({ error: 'هیچ نسبتی در فایل نیست.' });
    expect(parseMediaImport({ assignments: [{ target: 'banner:a.webp', url: 'https://x' }] })).toEqual({
      error: 'هدف نامعتبر است: banner:a.webp',
    });
  });
});

describe('safeBannerFileName', () => {
  it('keeps a plain webp name and drops paths', () => {
    expect(safeBannerFileName('cafe-2.webp')).toBe('cafe-2.webp');
    expect(safeBannerFileName('../cafe.webp')).toBeNull();
    expect(safeBannerFileName('cafe.jpg')).toBeNull();
  });
});
