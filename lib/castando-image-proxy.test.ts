import { describe, expect, it } from 'vitest';
import {
  CASTANDO_IMAGE_PROXY_PREFIX,
  containsParsPackStorage,
  isCastandoImageProxyUrl,
  needsCastandoProxyWrap,
  unwrapCastandoImageProxyUrl,
  wrapWithCastandoImageProxy,
} from '@/lib/castando-image-proxy';

describe('castando-image-proxy', () => {
  it('wraps Mad Max TMDB URL exactly as proxy + original', () => {
    const src =
      'https://image.tmdb.org/t/p/w500/hA2ple9q4qnwxp3hKVNhroipsir.jpg';
    expect(wrapWithCastandoImageProxy(src)).toBe(
      'https://castando.ir/wibe/image-proxy.php?url=https://image.tmdb.org/t/p/w500/hA2ple9q4qnwxp3hKVNhroipsir.jpg'
    );
  });

  it('skips ParsPack storage URLs', () => {
    const src = 'https://wibe.parspack.net/wibe/items/x.webp';
    expect(wrapWithCastandoImageProxy(src)).toBeNull();
    expect(needsCastandoProxyWrap(src)).toBe(false);
    expect(containsParsPackStorage(src)).toBe(true);
  });

  it('skips banner/cover paths', () => {
    expect(needsCastandoProxyWrap('https://example.com/covers/list-banner.jpg')).toBe(false);
    expect(needsCastandoProxyWrap('https://example.com/lists/foo.jpg')).toBe(false);
    expect(needsCastandoProxyWrap('https://image.tmdb.org/t/p/w500/poster.jpg')).toBe(true);
  });

  it('does not double-wrap castando proxy', () => {
    const wrapped =
      'https://castando.ir/wibe/image-proxy.php?url=https://image.tmdb.org/t/p/w500/x.jpg';
    expect(isCastandoImageProxyUrl(wrapped)).toBe(true);
    expect(needsCastandoProxyWrap(wrapped)).toBe(false);
    expect(wrapWithCastandoImageProxy(wrapped)).toBe(wrapped);
    expect(unwrapCastandoImageProxyUrl(wrapped)).toBe(
      'https://image.tmdb.org/t/p/w500/x.jpg'
    );
  });
});
