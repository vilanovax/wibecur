import { describe, expect, it } from 'vitest';
import { coverLooksLikeCar, resolveCoverImage } from '@/lib/resolve-cover-image';
import { resolveListBannerImage } from '@/lib/list-display-images';

describe('resolveCoverImage — cafe cover trust', () => {
  it('replaces a wrong car banner with the pinned cozy seed when no real cover exists', () => {
    const url = resolveCoverImage({
      coverImage: '/images/banners/car.webp',
      listSlug: 'cozy-cafes-for-studying',
      listTitle: 'کافه‌های دنج برای مطالعه',
      categorySlug: 'cafe',
    });
    expect(url).toBe('/images/banners/cozy.webp');
    expect(coverLooksLikeCar(url)).toBe(false);
  });

  it('keeps a real storage cover over the pinned seed for breakfast cafes', () => {
    const stored =
      'https://c466145.parspack.net/c466145/wibe/lists/list-great-breakfast-cafes-cover-v3.webp';
    const url = resolveCoverImage({
      coverImage: stored,
      listSlug: 'great-breakfast-cafes',
      listTitle: 'کافه‌های صبحانه عالی',
      categorySlug: 'cafe',
    });
    expect(url).toBe(stored);
  });

  it('uses the pinned seed only when the list has no real cover', () => {
    const url = resolveCoverImage({
      coverImage: null,
      listSlug: 'great-breakfast-cafes',
      listTitle: 'کافه‌های صبحانه عالی',
      categorySlug: 'cafe',
    });
    expect(url).toBe('/images/banners/cafe-2.webp');
  });

  it('rejects Wey Coffee 02 style car URLs for cafe lists', () => {
    expect(
      coverLooksLikeCar(
        'https://upload.wikimedia.org/wikipedia/commons/1/18/Wey_Coffee_02_IAA_2021_1X7A0099.jpg'
      )
    ).toBe(true);

    const url = resolveCoverImage({
      coverImage:
        'https://upload.wikimedia.org/wikipedia/commons/1/18/Wey_Coffee_02_IAA_2021_1X7A0099.jpg',
      listSlug: 'some-cafe-list',
      listTitle: 'کافه‌های دنج برای مطالعه',
      categorySlug: 'cafe',
    });
    expect(coverLooksLikeCar(url)).toBe(false);
    expect(url).not.toContain('car.webp');
  });

  it('falls back from mismatched horizontal car banner to coverImage', () => {
    const banner = resolveListBannerImage({
      coverImage: '/images/banners/cafe.webp',
      horizontalImage: '/images/banners/car.webp',
      slug: 'instagrammable-cafes',
      title: 'کافه‌های اینستاگرامی',
      categorySlug: 'cafe',
    });
    expect(banner).toBe('/images/banners/cafe.webp');
  });

  it('prefers trusted horizontal when cover is generic placeholder', () => {
    const url = resolveCoverImage({
      coverImage: '/images/placeholder-cover.svg',
      horizontalImage: '/images/banners/cafe-2.webp',
      listSlug: 'random-cafe',
      listTitle: 'کافه تست',
      categorySlug: 'cafe',
    });
    expect(url).toBe('/images/banners/cafe-2.webp');
  });

  it('rewrites a stored jpg banner to the webp file on disk', () => {
    const url = resolveCoverImage({
      coverImage: '/images/banners/cafe-3.jpg',
      listSlug: 'not-pinned',
      categorySlug: 'cafe',
    });
    expect(url).toBe('/images/banners/cafe-3.webp');
  });

  it('keeps a trusted stored banner instead of overriding with the pin', () => {
    const url = resolveCoverImage({
      coverImage: '/images/banners/cozy.webp',
      listSlug: 'cafes-with-great-views',
      listTitle: 'کافه‌های با منظره زیبا',
      categorySlug: 'cafe',
    });
    expect(url).toBe('/images/banners/cozy.webp');
  });

  it('pins view cafes to cafe-3 when no cover is stored', () => {
    const url = resolveCoverImage({
      coverImage: null,
      listSlug: 'cafes-with-great-views',
      listTitle: 'کافه‌های با منظره زیبا',
      categorySlug: 'cafe',
    });
    expect(url).toBe('/images/banners/cafe-3.webp');
  });
});
