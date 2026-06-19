import { describe, expect, it } from 'vitest';
import {
  catalogHasSearchProfile,
  formatSearchProfileSummary,
  getSearchProfileFromMetadata,
  mergeSearchProfileIntoMetadata,
  parseSearchProfileResponse,
} from '@/lib/catalog-search-profile';

describe('catalog-search-profile', () => {
  it('parses LLM response into normalized profile', () => {
    const profile = parseSearchProfileResponse({
      genres: 'Action, اکشن',
      subgenres: ['Gun Fu', 'Revenge'],
      themes: ['سرقت', 'انتقام'],
      keywords: ['جان ویک', 'assassin', 'neo-noir'],
      searchText: 'فیلم اکشن انتقام‌جویانه با صحنه‌های مبارزه نزدیک.',
    });

    expect(profile.genres).toContain('Action');
    expect(profile.genres).toContain('اکشن');
    expect(profile.subgenres).toContain('Gun Fu');
    expect(profile.keywords).toContain('جان ویک');
    expect(profile.searchText.length).toBeGreaterThan(10);
    expect(profile.enrichedAt).toBeTruthy();
  });

  it('merges profile into metadata', () => {
    const merged = mergeSearchProfileIntoMetadata(
      { genre: 'Action', year: 2014 },
      {
        genres: ['اکشن'],
        subgenres: [],
        themes: ['انتقام'],
        keywords: ['جان ویک'],
        searchText: 'فیلم اکشن جان ویک',
      }
    );

    expect(merged.genre).toBe('Action');
    expect(catalogHasSearchProfile(merged)).toBe(true);
    expect(getSearchProfileFromMetadata(merged)?.keywords).toContain('جان ویک');
  });

  it('formats summary for UI', () => {
    const summary = formatSearchProfileSummary({
      genres: ['اکشن', 'Action'],
      subgenres: ['Gun Fu'],
      themes: ['انتقام'],
      keywords: ['جان ویک', 'assassin'],
      searchText: 'فیلم اکشن',
    });
    expect(summary).toContain('اکشن');
    expect(summary).toContain('جان ویک');
  });
});
