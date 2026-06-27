import { describe, expect, it } from 'vitest';
import {
  personIdentityMatches,
  personSlugsFuzzyMatch,
  personSlugsPrefixMatch,
  shouldRemoveDuplicateProfileOnImport,
} from '@/lib/people';

describe('import orphan cleanup safety', () => {
  const jamieImport = {
    role: 'actor' as const,
    slug: 'jamie-lee-curtis',
    displayName: 'جیمی لی کرتیس',
    externalUrl: 'https://www.imdb.com/name/nm0000130/',
  };

  const judeImport = {
    role: 'actor' as const,
    slug: 'jude-law',
    displayName: 'جود لا',
    externalUrl: 'https://www.imdb.com/name/nm0000175/',
  };

  it('does not treat substring slug parts as the same person', () => {
    expect(personSlugsFuzzyMatch('jude-law', 'jude-lawless')).toBe(false);
    expect(personSlugsFuzzyMatch('jude-law', 'jude-lawrence')).toBe(false);
    expect(personSlugsPrefixMatch('jamie-lee-curtis', 'jamie-leeson')).toBe(false);
    expect(personSlugsPrefixMatch('dan', 'daniel-day-lewis')).toBe(false);
  });

  it('does not delete unrelated profiles when importing Jamie Lee Curtis', () => {
    const unrelated = [
      'jamie-leeson',
      'jamie-fox',
      'jude-law',
      'brad-pitt',
      'lee-pace',
      'matthew-broderick',
    ];
    for (const slug of unrelated) {
      expect(
        shouldRemoveDuplicateProfileOnImport(jamieImport, {
          role: 'actor',
          slug,
          displayName: slug,
          externalUrl: null,
        })
      ).toBe(false);
    }
  });

  it('does not delete unrelated profiles when importing Jude Law', () => {
    const unrelated = ['jude-lawless', 'jude-lawrence', 'jamie-lee-curtis', 'brad-pitt'];
    for (const slug of unrelated) {
      expect(
        shouldRemoveDuplicateProfileOnImport(judeImport, {
          role: 'actor',
          slug,
          displayName: slug,
          externalUrl: null,
        })
      ).toBe(false);
    }
  });

  it('removes hyphen slug variants of the same import', () => {
    expect(
      shouldRemoveDuplicateProfileOnImport(
        {
          role: 'actor',
          slug: 'joseph-gordon-levitt',
          displayName: 'Joseph Gordon-Levitt',
          externalUrl: 'https://www.imdb.com/name/nm0330687/',
        },
        {
          role: 'actor',
          slug: 'joseph-gordonlevitt',
          displayName: 'Joseph Gordon-Levitt',
          externalUrl: null,
        }
      )
    ).toBe(true);
  });

  it('removes prefix slug variant when import has imdb — Tony Leung', () => {
    expect(
      shouldRemoveDuplicateProfileOnImport(
        {
          role: 'actor',
          slug: 'tony-leung',
          displayName: 'تونی لیانگ',
          externalUrl: 'https://www.imdb.com/name/nm0504897/',
        },
        {
          role: 'actor',
          slug: 'tony-leung-chiuwai',
          displayName: 'Tony Leung Chiu-wai',
          externalUrl: null,
        }
      )
    ).toBe(true);
    expect(personIdentityMatches(
      { role: 'actor', slug: 'tony-leung', displayName: 'تونی لیانگ', externalUrl: 'https://www.imdb.com/name/nm0504897/' },
      { role: 'actor', slug: 'tony-leung-chiuwai', displayName: 'Tony Leung Chiu-wai', externalUrl: null }
    )).toBe(true);
  });

  it('removes fuzzy slug variant with same imdb — Branko Djuric', () => {
    expect(
      shouldRemoveDuplicateProfileOnImport(
        {
          role: 'actor',
          slug: 'branko-djuric',
          displayName: 'برانکو جوریچ',
          externalUrl: 'https://www.imdb.com/name/nm0248383/',
        },
        {
          role: 'actor',
          slug: 'branko-duric',
          displayName: 'Branko Đurić',
          externalUrl: 'https://www.imdb.com/name/nm0248383/',
        }
      )
    ).toBe(true);
  });
});
