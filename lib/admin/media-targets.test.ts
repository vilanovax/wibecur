import { describe, expect, it } from 'vitest';
import {
  missingMediaTarget,
  parseMediaImport,
  parseMediaRank,
  parseMediaState,
  parseMediaTarget,
  rankHeaviestImages,
  safeBannerFileName,
} from './media-targets';

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

  it('reads an inventory file and ignores the extra fields', () => {
    const parsed = parseMediaImport({
      images: [{ target: 'list-banner:cafe', url: 'https://cdn.example/a.webp', bytes: 1200, width: 1600 }],
    });
    expect(parsed).toEqual([{ target: 'list-banner:cafe', url: 'https://cdn.example/a.webp' }]);
  });

  it('reads a catalog title row, including a single object', () => {
    expect(
      parseMediaImport({
        target: 'catalog:VPXZ_j7XHk-QabwoUhIeG',
        title: 'Planet Earth - سیاره زمین',
      }),
    ).toEqual([
      { target: 'catalog:VPXZ_j7XHk-QabwoUhIeG', title: 'Planet Earth - سیاره زمین' },
    ]);
  });

  it('rejects an empty file and a bad target', () => {
    expect(parseMediaImport({ assignments: [] })).toEqual({ error: 'هیچ نسبتی در فایل نیست.' });
    expect(parseMediaImport({ assignments: [{ target: 'banner:a.webp', url: 'https://x' }] })).toEqual({
      error: 'هدف نامعتبر است: banner:a.webp',
    });
  });
});

describe('missingMediaTarget', () => {
  it('builds an import key for a slug, an id, and a person', () => {
    expect(missingMediaTarget('category', 'id1', 'cafe')).toBe('category:cafe');
    expect(missingMediaTarget('list-banner', 'id1', 'great-breakfast-cafes')).toBe(
      'list-banner:great-breakfast-cafes'
    );
    expect(missingMediaTarget('item', 'abc', 'یک لیست')).toBe('item:abc');
    expect(missingMediaTarget('person', 'id1', 'author/bozorg-alavi')).toBe('person:author:bozorg-alavi');
  });

  it('skips banners and unsafe keys', () => {
    expect(missingMediaTarget('banner', 'cafe.webp', 'فایل ثابت سایت')).toBeNull();
    expect(missingMediaTarget('category', 'id1', '../cafe')).toBeNull();
    expect(missingMediaTarget('person', 'id1', 'author')).toBeNull();
  });
});

describe('rankHeaviestImages', () => {
  it('keeps the 25 largest unique urls', () => {
    const rows = Array.from({ length: 30 }, (_, index) => ({
      url: `https://cdn.example/${index}.webp`,
      bytes: index + 1,
    }));
    rows.push({ url: rows[29].url, bytes: 999 });
    const ranked = rankHeaviestImages(rows);
    expect(ranked).toHaveLength(25);
    expect(ranked[0].bytes).toBe(30);
    expect(ranked[24].bytes).toBe(6);
    expect(ranked.filter((row) => row.url === rows[29].url)).toHaveLength(1);
  });
});

describe('parseMediaRank', () => {
  it('accepts only the bytes rank', () => {
    expect(parseMediaRank('bytes')).toBe('bytes');
    expect(parseMediaRank('name')).toBeNull();
  });
});

describe('parseMediaState', () => {
  it('keeps active and inactive and drops anything else', () => {
    expect(parseMediaState('active')).toBe('active');
    expect(parseMediaState('inactive')).toBe('inactive');
    expect(parseMediaState('nope')).toBe('all');
    expect(parseMediaState(undefined)).toBe('all');
  });
});

describe('safeBannerFileName', () => {
  it('keeps a plain webp name and drops paths', () => {
    expect(safeBannerFileName('cafe-2.webp')).toBe('cafe-2.webp');
    expect(safeBannerFileName('../cafe.webp')).toBeNull();
    expect(safeBannerFileName('cafe.jpg')).toBeNull();
  });
});
