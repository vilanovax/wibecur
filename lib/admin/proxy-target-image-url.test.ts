import { describe, expect, it } from 'vitest';
import {
  getItemProxyTargetUrl,
  itemNeedsCastandoProxyWrap,
} from '@/lib/admin/proxy-target-image-url';

describe('proxy-target-image-url', () => {
  it('uses metadata posterUrl when imageUrl is empty', () => {
    const row = {
      imageUrl: null,
      catalog_items: { imageUrl: null },
      metadata: {
        posterUrl: 'https://image.tmdb.org/t/p/w500/hA2ple9q4qnwxp3hKVNhroipsir.jpg',
      },
    };
    expect(getItemProxyTargetUrl(row)).toBe(
      'https://image.tmdb.org/t/p/w500/hA2ple9q4qnwxp3hKVNhroipsir.jpg'
    );
    expect(itemNeedsCastandoProxyWrap(row)).toBe(true);
  });

  it('skips when display URL is already castando proxy', () => {
    const proxied =
      'https://castando.ir/wibe/image-proxy.php?url=https://image.tmdb.org/t/p/w500/x.jpg';
    expect(
      itemNeedsCastandoProxyWrap({
        imageUrl: proxied,
        catalog_items: null,
        metadata: null,
      })
    ).toBe(false);
  });

  it('skips parspack URLs even in metadata fallback chain', () => {
    expect(
      itemNeedsCastandoProxyWrap({
        imageUrl: 'https://c466145.parspack.net/c466145/wibe/items/x.webp',
        catalog_items: null,
        metadata: {
          posterUrl: 'https://image.tmdb.org/t/p/w500/x.jpg',
        },
      })
    ).toBe(false);
  });

  it('wraps legacy liara URLs (not parspack)', () => {
    expect(
      itemNeedsCastandoProxyWrap({
        imageUrl: 'https://storage.c2.liara.space/wibe/items/x.jpg',
        catalog_items: null,
        metadata: null,
      })
    ).toBe(true);
  });
});
