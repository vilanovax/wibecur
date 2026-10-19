import { describe, expect, it } from 'vitest';
import { resolveNextImageSrc } from './next-image-src';

describe('resolveNextImageSrc', () => {
  it('unwraps a hub proxy URL to the public ParsPack file', () => {
    const storage =
      'https://c466145.parspack.net/c466145/wibe/hubs/fac6a6ed-8f73-413b-a298-c57e89628298.webp';
    const proxy = `/api/liara-image?url=${encodeURIComponent(storage)}`;
    const result = resolveNextImageSrc(proxy);
    expect(result.src).toBe(storage);
    expect(result.unoptimized).toBe(true);
  });

  it('keeps item posters as the public ParsPack URL', () => {
    const storage = 'https://c466145.parspack.net/c466145/wibe/items/poster.webp';
    const wrapped = `/api/liara-image?url=${encodeURIComponent(storage)}`;
    expect(resolveNextImageSrc(storage)).toEqual({ src: storage, unoptimized: true });
    expect(resolveNextImageSrc(wrapped)).toEqual({ src: storage, unoptimized: true });
  });

  it('keeps list covers as the public ParsPack URL', () => {
    const storage =
      'https://c466145.parspack.net/c466145/wibe/lists/288c83e8-723e-4861-8427-bc264df35ff3.webp';
    const result = resolveNextImageSrc(storage);
    expect(result.src).toBe(storage);
    expect(result.unoptimized).toBe(true);
  });

  it('unwraps storage-image proxy URLs to the inner address', () => {
    const proxy =
      '/api/storage-image?key=wibe%2Fcovers%2Fx.jpg&url=https%3A%2F%2Fexample.com%2Fx.jpg';
    const result = resolveNextImageSrc(proxy);
    expect(result.src).toBe('https://example.com/x.jpg');
    expect(result.unoptimized).toBe(false);
  });

  it('keeps legacy liara avatar URLs as the public object address', () => {
    const legacy =
      'https://storage.c2.liara.space/wibe/avatars/7040ec89e38f8d5529ed73f0f7f17313.jpg';
    const result = resolveNextImageSrc(legacy);
    expect(result.src).toBe(legacy);
    expect(result.unoptimized).toBe(true);
  });

  it('rewrites missing local jpg banners to the webp file', () => {
    const result = resolveNextImageSrc('/images/banners/cafe.jpg');
    expect(result.src).toBe('/images/banners/cafe.webp');
    expect(result.unoptimized).toBe(false);
  });

  it('allows optimization for non-parspack external HTTPS URLs', () => {
    const url = 'https://images.example.com/poster.jpg';
    const result = resolveNextImageSrc(url);
    expect(result.src).toBe(url);
    expect(result.unoptimized).toBe(false);
  });
});
