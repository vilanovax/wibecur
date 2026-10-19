import { describe, expect, it } from 'vitest';
import { toAdminStorageImageSrc, toStorageImageSrc } from '@/lib/liara-image-url';

const poster = 'https://c466145.parspack.net/c466145/wibe/items/poster.webp';
const listCover = 'https://c466145.parspack.net/c466145/wibe/lists/cover.webp';

describe('toStorageImageSrc', () => {
  it('keeps the public ParsPack URL for item posters and list covers', () => {
    expect(toStorageImageSrc(poster)).toBe(poster);
    expect(toStorageImageSrc(listCover)).toBe(listCover);
    expect(toStorageImageSrc(`/api/liara-image?url=${encodeURIComponent(listCover)}`)).toBe(
      listCover
    );
  });
});

describe('toAdminStorageImageSrc', () => {
  it('returns the public ParsPack URL for item images and list covers', () => {
    const wrapped = `/api/liara-image?url=${encodeURIComponent(poster)}`;
    expect(toAdminStorageImageSrc(poster)).toBe(poster);
    expect(toAdminStorageImageSrc(wrapped)).toBe(poster);
    expect(toAdminStorageImageSrc(listCover)).toBe(listCover);
  });
});
