import { describe, expect, it } from 'vitest';
import { resolveNextImageSrc } from './next-image-src';

describe('resolveNextImageSrc', () => {
  it('uses same-origin proxy (unoptimized) for parspack liara-image proxy', () => {
    const storage =
      'https://c466145.parspack.net/c466145/wibe/hubs/fac6a6ed-8f73-413b-a298-c57e89628298.webp';
    const proxy = `/api/liara-image?url=${encodeURIComponent(storage)}`;
    const result = resolveNextImageSrc(proxy);
    expect(result.src).toBe(proxy);
    expect(result.unoptimized).toBe(true);
  });

  it('wraps direct parspack URLs in proxy and marks unoptimized', () => {
    const storage =
      'https://c466145.parspack.net/c466145/wibe/lists/288c83e8-723e-4861-8427-bc264df35ff3.webp';
    const result = resolveNextImageSrc(storage);
    expect(result.src).toBe(`/api/liara-image?url=${encodeURIComponent(storage)}`);
    expect(result.unoptimized).toBe(true);
  });

  it('marks local proxy URLs as unoptimized', () => {
    const proxy = '/api/storage-image?key=wibe%2Fcovers%2Fx.jpg&url=https%3A%2F%2Fexample.com%2Fx.jpg';
    const result = resolveNextImageSrc(proxy);
    expect(result.src).toBe(proxy);
    expect(result.unoptimized).toBe(true);
  });

  it('wraps legacy liara avatar URLs in storage-image proxy', () => {
    const legacy =
      'https://storage.c2.liara.space/wibe/avatars/7040ec89e38f8d5529ed73f0f7f17313.jpg';
    const result = resolveNextImageSrc(legacy);
    expect(result.src).toContain('/api/storage-image?');
    expect(result.src).toContain('key=wibe%2Favatars%2F');
    expect(result.unoptimized).toBe(true);
  });

  it('allows optimization for non-parspack external HTTPS URLs', () => {
    const url = 'https://images.example.com/poster.jpg';
    const result = resolveNextImageSrc(url);
    expect(result.src).toBe(url);
    expect(result.unoptimized).toBe(false);
  });
});
