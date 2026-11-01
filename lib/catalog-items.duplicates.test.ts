import { describe, expect, it } from 'vitest';
import { catalogTitlesMatch, primarySuggestionTitle } from '@/lib/suggestion-utils';

describe('duplicate title clustering helpers', () => {
  it('matches bilingual book titles that auto-dup should catch', () => {
    expect(catalogTitlesMatch('گلستان', 'گلستان - سعدی')).toBe(true);
    expect(primarySuggestionTitle('گلستان - سعدی')).toBe('گلستان');
  });

  it('does not collapse different sequels that share a franchise prefix', () => {
    expect(
      catalogTitlesMatch('Mission: Impossible – Fallout', 'Mission: Impossible – Dead Reckoning')
    ).toBe(false);
  });
});
