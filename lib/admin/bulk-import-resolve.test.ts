import { describe, expect, it } from 'vitest';
import { isStrongCatalogExternalKey } from './bulk-import-resolve';

describe('isStrongCatalogExternalKey', () => {
  it('accepts isbn and imdb keys', () => {
    expect(isStrongCatalogExternalKey('isbn:9789640000000')).toBe(true);
    expect(isStrongCatalogExternalKey('imdb:tt0133093')).toBe(true);
    expect(isStrongCatalogExternalKey('tmdb:603')).toBe(true);
  });

  it('rejects title-based keys', () => {
    expect(isStrongCatalogExternalKey('title:books:golestan')).toBe(false);
    expect(isStrongCatalogExternalKey(null)).toBe(false);
  });
});
