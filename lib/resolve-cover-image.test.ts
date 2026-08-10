import { describe, expect, it } from 'vitest';
import { coverLooksLikeCar, resolveCoverImage } from '@/lib/resolve-cover-image';
import { resolveListBannerImage } from '@/lib/list-display-images';

describe('resolveCoverImage — cafe cover trust', () => {
  it('pins cozy study cafe to cozy banner, never car.webp', () => {
    const url = resolveCoverImage({
      coverImage: '/images/banners/car.webp',
      listSlug: 'cozy-cafes-for-studying',
      listTitle: 'کافه‌های دنج برای مطالعه',
      categorySlug: 'cafe',
    });
    expect(url).toBe('/images/banners/cozy.webp');
    expect(coverLooksLikeCar(url)).toBe(false);
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
});
