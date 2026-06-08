import { describe, expect, it } from 'vitest';
import {
  catalogTitlesMatch,
  normalizeSuggestionTitle,
  primarySuggestionTitle,
} from './suggestion-utils';

describe('catalogTitlesMatch', () => {
  it('matches exact normalized titles', () => {
    expect(catalogTitlesMatch('Tenet', 'tenet')).toBe(true);
  });

  it('matches bilingual titles via primary segment', () => {
    expect(
      catalogTitlesMatch('Fight Club - باشگاه مشت‌زنی', 'Fight Club')
    ).toBe(true);
    expect(
      catalogTitlesMatch('Tenet', 'Tenet - تنت')
    ).toBe(true);
  });

  it('does not match unrelated titles', () => {
    expect(catalogTitlesMatch('Tenet', 'Inception')).toBe(false);
  });
});

describe('primarySuggestionTitle', () => {
  it('extracts english segment before dash', () => {
    expect(primarySuggestionTitle('Fight Club - باشگاه مشت‌زنی')).toBe('fight club');
    expect(normalizeSuggestionTitle('Fight Club')).toBe('fight club');
  });
});
