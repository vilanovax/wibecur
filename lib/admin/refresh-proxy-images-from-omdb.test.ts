import { describe, expect, it } from 'vitest';
import {
  extractImdbId,
  itemHasProxyImage,
} from '@/lib/admin/refresh-proxy-images-from-omdb';

describe('refresh-proxy-images-from-omdb', () => {
  it('detects castando proxy on imageUrl', () => {
    const row = {
      id: '1',
      title: 'Mad Max',
      imageUrl:
        'https://castando.ir/wibe/image-proxy.php?url=https://image.tmdb.org/t/p/w500/x.jpg',
      externalUrl: null,
      metadata: { imdbId: 'tt1392190' },
      catalogItemId: null,
      catalog_items: null,
    };
    expect(itemHasProxyImage(row)).toBe(true);
    expect(extractImdbId(row.metadata, row.externalUrl)).toBe('tt1392190');
  });

  it('extracts imdbId from externalUrl', () => {
    expect(
      extractImdbId({}, 'https://www.imdb.com/title/tt0133093/')
    ).toBe('tt0133093');
  });

  it('skips non-proxy items', () => {
    expect(
      itemHasProxyImage({
        id: '2',
        title: 'Test',
        imageUrl: 'https://image.tmdb.org/t/p/w500/x.jpg',
        externalUrl: null,
        metadata: null,
        catalogItemId: null,
        catalog_items: null,
      })
    ).toBe(false);
  });
});
