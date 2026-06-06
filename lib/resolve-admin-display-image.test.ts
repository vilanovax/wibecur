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

  it('returns castando proxy URL as stored in DB', () => {
    const proxied = `${CASTANDO_IMAGE_PROXY_PREFIX}https://image.tmdb.org/x.jpg`;
    expect(classifyAdminImageSource(proxied)).toBe('proxy');
    expect(resolveAdminDisplayImageSrc(proxied)).toBe(proxied);
  });
});
