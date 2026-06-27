import { describe, expect, it } from 'vitest';
import { personImageStorageStatus } from '@/lib/person-image-utils';

describe('personImageStorageStatus', () => {
  it('detects empty, storage, and external urls', () => {
    expect(personImageStorageStatus(null)).toBe('none');
    expect(personImageStorageStatus('')).toBe('none');
    expect(
      personImageStorageStatus('https://c466145.parspack.net/c466145/wibe/people/x.webp')
    ).toBe('storage');
    expect(personImageStorageStatus('https://image.tmdb.org/t/p/w500/abc.jpg')).toBe('external');
  });
});
