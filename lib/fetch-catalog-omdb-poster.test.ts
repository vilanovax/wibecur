import { describe, expect, it } from 'vitest';
import {
  catalogMissingPosterImage,
  extractCatalogImdbId,
} from '@/lib/missing-image-utils';

describe('extractCatalogImdbId', () => {
  it('reads imdbId from metadata', () => {
    expect(
      extractCatalogImdbId({
        metadata: { imdbId: 'tt2713180' },
        externalUrl: null,
        externalKey: null,
      })
    ).toBe('tt2713180');
  });

  it('reads imdbId from externalKey', () => {
    expect(
      extractCatalogImdbId({
        metadata: null,
        externalUrl: null,
        externalKey: 'imdb:tt2713180',
      })
    ).toBe('tt2713180');
  });
});

describe('catalogMissingPosterImage', () => {
  it('treats null and empty as missing', () => {
    expect(catalogMissingPosterImage(null)).toBe(true);
    expect(catalogMissingPosterImage('')).toBe(true);
    expect(catalogMissingPosterImage('   ')).toBe(true);
  });

  it('treats placeholder as missing', () => {
    expect(catalogMissingPosterImage('/images/placeholder-cover.png')).toBe(true);
  });

  it('treats real URL as present', () => {
    expect(
      catalogMissingPosterImage('https://storage.parspack.com/bucket/items/foo.webp')
    ).toBe(false);
  });
});
