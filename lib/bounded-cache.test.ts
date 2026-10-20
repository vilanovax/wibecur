import { describe, expect, it } from 'vitest';
import { createBoundedCache } from './bounded-cache';

describe('createBoundedCache', () => {
  it('drops the oldest entry past the cap and keeps a recently read one', () => {
    const cache = createBoundedCache<string, string>(2);
    cache.set('a', '1');
    cache.set('b', '2');
    cache.set('c', '3');
    expect(cache.size).toBe(2);
    expect(cache.get('a')).toBeUndefined();

    expect(cache.get('b')).toBe('2');
    cache.set('d', '4');
    expect(cache.get('c')).toBeUndefined();
    expect(cache.get('b')).toBe('2');
    expect(cache.get('d')).toBe('4');
  });
});
