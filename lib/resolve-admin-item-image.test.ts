import { describe, expect, it } from 'vitest';
import { normalizeAdminImageUrl, resolveAdminItemThumbnail } from './resolve-admin-item-image';

describe('resolveAdminItemThumbnail', () => {
  it('prefers item imageUrl', () => {
    expect(
      resolveAdminItemThumbnail({
        imageUrl: 'https://storage.c2.liara.space/wibe/items/a.jpg',
      })
    ).toBe('https://storage.c2.liara.space/wibe/items/a.jpg');
  });

  it('allows TMDB in admin', () => {
    expect(
      resolveAdminItemThumbnail({
        imageUrl: 'https://image.tmdb.org/t/p/w500/test.jpg',
      })
    ).toBe('https://image.tmdb.org/t/p/w500/test.jpg');
  });

  it('normalizes liara path without scheme', () => {
    expect(normalizeAdminImageUrl('storage.c2.liara.space/wibe/items/x.jpg')).toBe(
      'https://storage.c2.liara.space/wibe/items/x.jpg'
    );
  });
});
