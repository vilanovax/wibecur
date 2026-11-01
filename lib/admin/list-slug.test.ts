import { describe, expect, it } from 'vitest';
import { finalizeListSlug, normalizeListSlug } from './list-slug';

describe('list slug typing', () => {
  it('keeps a trailing hyphen while typing', () => {
    expect(normalizeListSlug('great-')).toBe('great-');
    expect(normalizeListSlug('great-breakfast-')).toBe('great-breakfast-');
  });

  it('allows inserting hyphens mid-string', () => {
    expect(normalizeListSlug('greatbreakfastcafes'.replace('breakfast', '-breakfast-'))).toBe(
      'great-breakfast-cafes'
    );
    expect(normalizeListSlug('great-breakfast-cafes')).toBe('great-breakfast-cafes');
  });

  it('strips trailing hyphens only when finalizing', () => {
    expect(finalizeListSlug('great-breakfast-')).toBe('great-breakfast');
    expect(finalizeListSlug('-great-breakfast-')).toBe('great-breakfast');
  });
});
