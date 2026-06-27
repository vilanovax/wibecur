import { describe, expect, it } from 'vitest';
import {
  buildProfileLookup,
  findBestProfileForDiscoveredEntry,
  mergeDiscoveredPersonEntries,
  personSlug,
} from '@/lib/people';

describe('bilingual discovery duplicates', () => {
  it('links latin discovery entries to profiles by slug', () => {
    const entries = [
      {
        role: 'actor' as const,
        slug: 'jamie-lee-curtis',
        displayName: 'Jamie Lee Curtis',
        itemKeys: new Set(['movie-a']),
      },
      {
        role: 'actor' as const,
        slug: 'jimi-li-krtis',
        displayName: 'جیمی لی کرتیس',
        itemKeys: new Set(['movie-b']),
      },
    ];
    const profiles = [
      {
        role: 'actor' as const,
        slug: 'jamie-lee-curtis',
        displayName: 'Jamie Lee Curtis',
        bio: 'bio',
        externalUrl: 'https://www.imdb.com/name/nm0000130/',
      },
    ];

    const merged = mergeDiscoveredPersonEntries(entries, profiles);
    expect(merged).toHaveLength(2);

    const lookup = buildProfileLookup(profiles);
    expect(findBestProfileForDiscoveredEntry(merged[0]!, lookup)?.slug).toBe('jamie-lee-curtis');
  });

  it('links Persian discovery to profile after import stores both display names', () => {
    const entries = [
      {
        role: 'actor' as const,
        slug: 'jamie-lee-curtis',
        displayName: 'Jamie Lee Curtis',
        itemKeys: new Set(['movie-en']),
      },
      {
        role: 'actor' as const,
        slug: personSlug('جیمی لی کرتیس'),
        displayName: 'جیمی لی کرتیس',
        itemKeys: new Set(['movie-fa']),
      },
    ];
    const profiles = [
      {
        role: 'actor' as const,
        slug: 'jamie-lee-curtis',
        displayName: 'Jamie Lee Curtis · جیمی لی کرتیس',
        bio: 'bio',
        externalUrl: 'https://www.imdb.com/name/nm0000130/',
      },
    ];

    const lookup = buildProfileLookup(profiles);
    expect(findBestProfileForDiscoveredEntry(entries[1]!, lookup)?.bio?.trim()).toBeTruthy();
  });
});
