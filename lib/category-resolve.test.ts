import { describe, expect, it } from 'vitest';

// Mirror detection logic from lib/category-resolve.ts
function isLikelyCategoryId(param: string): boolean {
  const raw = param.trim();
  if (raw.length < 12 || !/^[a-zA-Z0-9_-]+$/.test(raw)) return false;
  if (/[A-Z]/.test(raw) || raw.includes('_')) return true;
  return raw.length >= 20 && !raw.includes('-');
}

describe('isLikelyCategoryId', () => {
  it('detects nanoid ids with underscore', () => {
    expect(isLikelyCategoryId('NgpAJPIjccPPKoPjYNZ_e')).toBe(true);
  });

  it('treats short slugs as slugs', () => {
    expect(isLikelyCategoryId('movie')).toBe(false);
    expect(isLikelyCategoryId('movies-before-sleep')).toBe(false);
  });
});
