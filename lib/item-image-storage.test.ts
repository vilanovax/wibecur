import { describe, expect, it } from 'vitest';
import {
  getItemEffectiveImageUrl,
  isExternalDirectImageUrl,
  isAppObjectStorageImageUrl,
  itemUsesExternalDirectImage,
} from './item-image-storage';

describe('item-image-storage', () => {
  it('detects ParsPack URLs', () => {
    expect(
      isAppObjectStorageImageUrl(
        'https://c466145.parspack.net/c466145/wibe/6c1971ca-90e5-4ced-a6e1-d1dda43460e3.jpg'
      )
    ).toBe(true);
  });

  it('treats legacy Liara as external', () => {
    expect(
      isExternalDirectImageUrl('https://storage.c2.liara.space/wibe/items/x.jpg')
    ).toBe(true);
    expect(
      isAppObjectStorageImageUrl('https://storage.c2.liara.space/wibe/items/x.jpg')
    ).toBe(false);
  });

  it('detects external direct URLs', () => {
    expect(isExternalDirectImageUrl('https://m.media-amazon.com/x.jpg')).toBe(true);
    expect(
      isExternalDirectImageUrl(
        'https://c466145.parspack.net/c466145/wibe/items/x.webp'
      )
    ).toBe(false);
    expect(isExternalDirectImageUrl('')).toBe(false);
  });

  it('prefers item imageUrl over catalog', () => {
    expect(
      getItemEffectiveImageUrl({
        imageUrl: 'https://a.com/1.jpg',
        catalogImageUrl: 'https://b.com/2.jpg',
      })
    ).toBe('https://a.com/1.jpg');
  });

  it('itemUsesExternalDirectImage', () => {
    expect(
      itemUsesExternalDirectImage({
        imageUrl: 'https://image.tmdb.org/t/p/w500/x.jpg',
      })
    ).toBe(true);
    expect(
      itemUsesExternalDirectImage({
        imageUrl: 'https://c466145.parspack.net/c466145/wibe/x.webp',
      })
    ).toBe(false);
  });
});
