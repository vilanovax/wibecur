import { describe, expect, it } from 'vitest';
import {
  classifyAdminImageSource,
  resolveAdminDisplayImageSrc,
} from '@/lib/resolve-admin-display-image';
import { CASTANDO_IMAGE_PROXY_PREFIX } from '@/lib/castando-image-proxy';

describe('resolve-admin-display-image', () => {
  it('does not auto-proxy TMDB — only DB value', () => {
    const tmdb = 'https://image.tmdb.org/t/p/w500/x.jpg';
    expect(resolveAdminDisplayImageSrc(tmdb)).toBe(tmdb);
    expect(classifyAdminImageSource(tmdb)).toBe('external');
  });

  it('returns the public ParsPack URL for item images', () => {
    const poster = 'https://c466145.parspack.net/c466145/wibe/items/poster.webp';
    expect(resolveAdminDisplayImageSrc(poster)).toBe(poster);
    expect(classifyAdminImageSource(poster)).toBe('storage');
  });

  it('unwraps a stored list-cover proxy to the public ParsPack URL', () => {
    const cover = 'https://c466145.parspack.net/c466145/wibe/lists/cover.webp';
    const wrapped = `/api/liara-image?url=${encodeURIComponent(cover)}`;
    expect(resolveAdminDisplayImageSrc(wrapped)).toBe(cover);
  });

  it('returns castando proxy URL as stored in DB', () => {
    const proxied = `${CASTANDO_IMAGE_PROXY_PREFIX}https://image.tmdb.org/x.jpg`;
    expect(classifyAdminImageSource(proxied)).toBe('proxy');
    expect(resolveAdminDisplayImageSrc(proxied)).toBe(proxied);
  });
});
