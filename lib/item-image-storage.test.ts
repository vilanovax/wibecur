import { describe, expect, it } from 'vitest';
import {
  getItemEffectiveImageUrl,
  hasBannerPathInUrl,
  hasParsPackInUrl,
  isExternalDirectImageUrl,
  isAppObjectStorageImageUrl,
  itemUsesExternalDirectImage,
  needsS3MigrationImageUrl,
  resolveUrlForS3Migration,
} from './item-image-storage';

describe('item-image-storage', () => {
  it('detects ParsPack URLs', () => {
    expect(
      isAppObjectStorageImageUrl(
        'https://c466145.parspack.net/c466145/wibe/6c1971ca-90e5-4ced-a6e1-d1dda43460e3.jpg'
      )
    ).toBe(true);
  });

  it('treats legacy Liara as external', () => {
    expect(
      isExternalDirectImageUrl('https://storage.c2.liara.space/wibe/items/x.jpg')
    ).toBe(true);
    expect(
      isAppObjectStorageImageUrl('https://storage.c2.liara.space/wibe/items/x.jpg')
    ).toBe(false);
  });

  it('detects external direct URLs', () => {
    expect(isExternalDirectImageUrl('https://m.media-amazon.com/x.jpg')).toBe(true);
    expect(
      isExternalDirectImageUrl(
        'https://c466145.parspack.net/c466145/wibe/items/x.webp'
      )
    ).toBe(false);
    expect(isExternalDirectImageUrl('')).toBe(false);
  });

  it('prefers item imageUrl over catalog', () => {
    expect(
      getItemEffectiveImageUrl({
        imageUrl: 'https://a.com/1.jpg',
        catalogImageUrl: 'https://b.com/2.jpg',
      })
    ).toBe('https://a.com/1.jpg');
  });

  it('itemUsesExternalDirectImage', () => {
    expect(
      itemUsesExternalDirectImage({
        imageUrl: 'https://image.tmdb.org/t/p/w500/x.jpg',
      })
    ).toBe(true);
    expect(
      itemUsesExternalDirectImage({
        imageUrl: 'https://c466145.parspack.net/c466145/wibe/x.webp',
      })
    ).toBe(false);
  });

  it('needsS3MigrationImageUrl includes banner/banners paths and excludes ParsPack', () => {
    expect(needsS3MigrationImageUrl('/images/banners/cafe.jpg')).toBe(true);
    expect(needsS3MigrationImageUrl('/images/Banners/restaurant-2.jpg')).toBe(true);
    expect(needsS3MigrationImageUrl('/images/BANNER/foo.jpg')).toBe(true);
    expect(needsS3MigrationImageUrl('https://s3.castbox.fm/foo.jpg')).toBe(true);
    expect(
      needsS3MigrationImageUrl('https://c466145.parspack.net/c466145/wibe/x.webp')
    ).toBe(false);
    expect(needsS3MigrationImageUrl('/images/placeholder-cover.svg')).toBe(false);
  });

  it('hasBannerPathInUrl matches banner and banners case-insensitively', () => {
    expect(hasBannerPathInUrl('/images/banners/cafe.jpg')).toBe(true);
    expect(hasBannerPathInUrl('/images/Banner/x.jpg')).toBe(true);
    expect(hasBannerPathInUrl('https://x.com/poster.jpg')).toBe(false);
  });

  it('hasParsPackInUrl is case-insensitive', () => {
    expect(hasParsPackInUrl('https://c466145.parspack.net/x.jpg')).toBe(true);
    expect(hasParsPackInUrl('https://c466145.PARSPACK.net/x.jpg')).toBe(true);
    expect(hasParsPackInUrl('https://example.com/x.jpg')).toBe(false);
  });

  it('resolveUrlForS3Migration absolutizes relative paths', () => {
    expect(resolveUrlForS3Migration('/images/banners/cafe.jpg')).toContain(
      '/images/banners/cafe.jpg'
    );
    expect(resolveUrlForS3Migration('https://example.com/a.jpg')).toBe(
      'https://example.com/a.jpg'
    );
  });
});
