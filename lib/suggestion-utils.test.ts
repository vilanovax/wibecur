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

  it('does not collapse a sequel onto another film in the same franchise', () => {
    expect(
      catalogTitlesMatch(
        'Mission: Impossible – The Final Reckoning',
        'Mission: Impossible – Fallout'
      )
    ).toBe(false);
    expect(
      catalogTitlesMatch('Mission: Impossible – The Final Reckoning', 'Mission: Impossible')
    ).toBe(false);
    expect(
      catalogTitlesMatch('Spider-Man – Brand New Day', 'Spider-Man: No Way Home')
    ).toBe(false);
    expect(catalogTitlesMatch('Spider-Man – Brand New Day', 'Spider-Man')).toBe(false);
  });

  it('still matches the same sequel when only the dash character differs', () => {
    expect(
      catalogTitlesMatch(
        'Mission: Impossible – The Final Reckoning',
        'Mission: Impossible - The Final Reckoning'
      )
    ).toBe(true);
  });
});

describe('primarySuggestionTitle', () => {
  it('extracts english segment before dash', () => {
    expect(primarySuggestionTitle('Fight Club - باشگاه مشت‌زنی')).toBe('fight club');
    expect(normalizeSuggestionTitle('Fight Club')).toBe('fight club');
  });
});
