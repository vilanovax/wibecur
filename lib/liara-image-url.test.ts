import { describe, expect, it } from 'vitest';
import { toStorageImageSrc } from '@/lib/liara-image-url';

const poster = 'https://c466145.parspack.net/c466145/wibe/items/poster.webp';

describe('toStorageImageSrc', () => {
  it('keeps the public ParsPack URL when the cover should load directly', () => {
    expect(toStorageImageSrc(poster, { preferDirect: true })).toBe(poster);
  });

  it('falls back to the same-origin proxy when direct loading is not requested', () => {
    expect(toStorageImageSrc(poster)).toBe(
      `/api/liara-image?url=${encodeURIComponent(poster)}`
    );
  });
});
