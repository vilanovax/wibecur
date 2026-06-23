import { describe, expect, it } from 'vitest';
import { resolveNextImageSrc } from './next-image-src';

describe('resolveNextImageSrc', () => {
  it('unwraps liara-image proxy to direct HTTPS for optimization', () => {
    const storage =
      'https://c466145.parspack.net/c466145/wibe/hubs/fac6a6ed-8f73-413b-a298-c57e89628298.webp';
    const proxy = `/api/liara-image?url=${encodeURIComponent(storage)}`;
    const result = resolveNextImageSrc(proxy);
    expect(result.src).toBe(storage);
    expect(result.unoptimized).toBe(false);
  });

  it('marks local proxy URLs as unoptimized', () => {
    const proxy = '/api/storage-image?key=wibe%2Fcovers%2Fx.jpg&url=https%3A%2F%2Fexample.com%2Fx.jpg';
    const result = resolveNextImageSrc(proxy);
    expect(result.src).toBe(proxy);
    expect(result.unoptimized).toBe(true);
  });
});
