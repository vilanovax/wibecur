import { describe, expect, it } from 'vitest';
import { mergeCatalogEnrichment } from './catalog-items';

describe('mergeCatalogEnrichment', () => {
  it('fills missing image and description from incoming data', () => {
    const merged = mergeCatalogEnrichment(
      {
        title: 'Fight Club',
        description: null,
        imageUrl: null,
        externalUrl: null,
        categorySlug: 'film',
        metadata: {},
      },
      {
        title: 'Fight Club - باشگاه مشت‌زنی',
        description: 'فیلم درام روانشناختی',
        imageUrl: 'https://cdn.example/poster.jpg',
        externalUrl: 'https://imdb.com/title/tt0137523',
        categorySlug: 'film',
        metadata: { imdbId: 'tt0137523' },
      }
    );

    expect(merged.description).toBe('فیلم درام روانشناختی');
    expect(merged.imageUrl).toBe('https://cdn.example/poster.jpg');
    expect(merged.externalUrl).toBe('https://imdb.com/title/tt0137523');
    expect(merged.metadata).toEqual({ imdbId: 'tt0137523' });
  });

  it('keeps existing rich fields when incoming is sparse', () => {
    const merged = mergeCatalogEnrichment(
      {
        title: 'Fight Club',
        description: 'Existing description',
        imageUrl: 'https://cdn.example/existing.jpg',
        externalUrl: null,
        categorySlug: 'film',
        metadata: { imdbId: 'tt0137523' },
      },
      {
        title: 'Fight Club',
        description: null,
        imageUrl: null,
        categorySlug: 'film',
      }
    );

    expect(merged.description).toBe('Existing description');
    expect(merged.imageUrl).toBe('https://cdn.example/existing.jpg');
  });
});
