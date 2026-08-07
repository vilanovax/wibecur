import { describe, expect, it } from 'vitest';
import {
  buildProfileLookup,
  findBestProfileForDiscoveredEntry,
  mergeDiscoveredPersonEntries,
  personIdentityMatches,
  personSlug,
  personSlugsFuzzyMatch,
  personSlugsPrefixMatch,
} from '@/lib/people';

describe('actor name variant matching', () => {
  it('maps long discovery names to short import slugs', () => {
    expect(personSlug('Tony Leung')).toBe('tony-leung');
    expect(personSlug('Tony Leung Chiu-wai')).toBe('tony-leung-chiuwai');
    expect(personSlug('Jamie Lee Curtis')).toBe('jamie-lee-curtis');
    expect(personSlug('Jude Law')).toBe('jude-law');
    expect(personSlugsFuzzyMatch('tony-leung', 'tony-leung-chiuwai')).toBe(false);
    expect(personSlugsPrefixMatch('tony-leung', 'tony-leung-chiuwai')).toBe(true);
  });

  it('finds imported profile for Tony Leung Chiu-wai discovery entry', () => {
    const profiles = [
      {
        role: 'actor' as const,
        slug: 'tony-leung',
        displayName: 'تونی لیانگ',
        bio: 'bio',
        externalUrl: 'https://www.imdb.com/name/nm0504897/',
      },
    ];
    const lookup = buildProfileLookup(profiles);
    const entry = {
      role: 'actor' as const,
      slug: personSlug('Tony Leung Chiu-wai'),
      displayName: 'Tony Leung Chiu-wai',
    };
    expect(entry.slug).toBe('tony-leung-chiuwai');
    expect(findBestProfileForDiscoveredEntry(entry, lookup)?.slug).toBe('tony-leung');
    expect(
      personIdentityMatches(
        {
          role: 'actor',
          slug: 'tony-leung',
          displayName: 'تونی لیانگ',
          externalUrl: 'https://www.imdb.com/name/nm0504897/',
        },
        entry
      )
    ).toBe(true);
  });

  it('merges tony-leung and tony-leung-chiu-wai via imdb profile', () => {
    const profiles = [
      {
        role: 'actor' as const,
        slug: 'tony-leung',
        displayName: 'تونی لیانگ',
        bio: 'bio',
        externalUrl: 'https://www.imdb.com/name/nm0504897/',
      },
    ];
    const merged = mergeDiscoveredPersonEntries(
      [
        {
          role: 'actor',
          slug: 'tony-leung',
          displayName: 'Tony Leung',
          itemKeys: new Set(['a']),
        },
        {
          role: 'actor',
          slug: 'tony-leung-chiuwai',
          displayName: 'Tony Leung Chiu-wai',
          itemKeys: new Set(['b']),
        },
      ],
      profiles
    );
    expect(merged).toHaveLength(1);
    expect(merged[0]?.slug).toBe('tony-leung');
  });
});
