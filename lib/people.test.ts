import { describe, expect, it } from 'vitest';
import {
  extractPersonNamesFromMetadata,
  isPersonPublicReady,
  nameMatchesSlug,
  parseActorNames,
  personPagePath,
  personPublicPath,
  personSlug,
} from '@/lib/people';

describe('people helpers', () => {
  it('builds slug from latin names', () => {
    expect(personSlug('Paul Greengrass')).toBe('paul-greengrass');
    expect(personSlug('Matt Damon')).toBe('matt-damon');
  });

  it('matches hyphenated import slugs to discovered slugs', async () => {
    const { personSlugsMatch, nameMatchesSlug, personSlug } = await import('@/lib/people');
    expect(personSlugsMatch('joseph-gordon-levitt', 'joseph-gordonlevitt')).toBe(true);
    expect(nameMatchesSlug('Joseph Gordon-Levitt', 'joseph-gordon-levitt')).toBe(true);
    expect(nameMatchesSlug('Carrie-Anne Moss', 'carrie-anne-moss')).toBe(true);
    expect(personSlug('Zoë Kravitz')).toBe('zoe-kravitz');
    expect(personSlug('Léa Seydoux')).toBe('lea-seydoux');
    expect(personSlug('Branko Djuric')).toBe('branko-djuric');
    expect(personSlug('Branko Đurić')).toBe('branko-duric');
    const { personSlugsFuzzyMatch } = await import('@/lib/people');
    expect(personSlugsFuzzyMatch('branko-djuric', 'branko-duric')).toBe(true);
  });

  it('matches imported profile to slavic diacritic discovery entry', async () => {
    const {
      buildProfileLookup,
      findBestProfileForDiscoveredEntry,
      mergeDiscoveredPersonEntries,
      personIdentityMatches,
      personSlug,
    } = await import('@/lib/people');
    const profiles = [
      {
        role: 'actor' as const,
        slug: 'branko-djuric',
        displayName: 'برانکو جوریچ',
        bio: 'bio',
        externalUrl: 'https://www.imdb.com/name/nm0248383/',
      },
    ];
    const lookup = buildProfileLookup(profiles);
    const entry = {
      role: 'actor' as const,
      slug: personSlug('Branko Đurić'),
      displayName: 'Branko Đurić',
    };
    expect(entry.slug).toBe('branko-duric');
    expect(findBestProfileForDiscoveredEntry(entry, lookup)?.slug).toBe('branko-djuric');
    expect(
      personIdentityMatches(
        {
          role: 'actor',
          slug: 'branko-djuric',
          displayName: 'برانکو جوریچ',
          externalUrl: 'https://www.imdb.com/name/nm0248383/',
        },
        entry
      )
    ).toBe(true);
    const merged = mergeDiscoveredPersonEntries(
      [
        {
          role: 'actor',
          slug: 'branko-djuric',
          displayName: 'Branko Djuric',
          itemKeys: new Set(['a']),
        },
        {
          role: 'actor',
          slug: 'branko-duric',
          displayName: 'Branko Đurić',
          itemKeys: new Set(['b']),
        },
      ],
      profiles
    );
    expect(merged).toHaveLength(1);
    expect(merged[0]?.slug).toBe('branko-djuric');
  });

  it('builds slug from persian names via transliteration', () => {
    const slug = personSlug('میگل دو سروانتس');
    expect(slug.length).toBeGreaterThan(0);
    expect(nameMatchesSlug('میگل دو سروانتس', slug)).toBe(true);
  });

  it('parses actor lists', () => {
    expect(parseActorNames('Matt Damon, Franka Potente')).toEqual([
      'Matt Damon',
      'Franka Potente',
    ]);
    expect(parseActorNames('Matt Damon · Franka Potente')).toEqual([
      'Matt Damon',
      'Franka Potente',
    ]);
    expect(parseActorNames('کت هاوارد | تام فالر')).toEqual(['کت هاوارد', 'تام فالر']);
  });

  it('links author profile across Persian spelling variants', async () => {
    const { findBestProfileForDiscoveredEntry } = await import('@/lib/people');
    const profile = findBestProfileForDiscoveredEntry(
      { role: 'author', slug: 'astfn-king', displayName: 'استفن کینگ' },
      [
        {
          role: 'author',
          slug: 'stephen-king',
          displayName: 'استیفن کینگ',
          bio: 'bio',
          externalUrl: 'https://stephenking.com/',
        },
      ]
    );
    expect(profile?.slug).toBe('stephen-king');
    expect(profile?.bio).toBe('bio');

    const variant = findBestProfileForDiscoveredEntry(
      { role: 'author', slug: 'astion-king', displayName: 'استیون کینگ' },
      [
        {
          role: 'author',
          slug: 'stephen-king',
          displayName: 'استیفن کینگ',
          bio: 'bio',
          externalUrl: 'https://stephenking.com/',
        },
      ]
    );
    expect(variant?.slug).toBe('stephen-king');
  });

  it('links latin discovery name to profile with persian-only displayName via slug', async () => {
    const { findBestProfileForDiscoveredEntry } = await import('@/lib/people');
    const profile = findBestProfileForDiscoveredEntry(
      { role: 'actor', slug: 'jamie-lee-curtis', displayName: 'Jamie Lee Curtis' },
      [
        {
          role: 'actor',
          slug: 'jamie-lee-curtis',
          displayName: 'جیمی لی کرتیس',
          bio: 'bio',
          externalUrl: 'https://www.imdb.com/name/nm0000130/',
        },
      ]
    );
    expect(profile?.slug).toBe('jamie-lee-curtis');
    expect(profile?.bio).toBe('bio');
  });

  it('extracts person names by role', () => {
    expect(
      extractPersonNamesFromMetadata({ director: 'Paul Greengrass' }, 'director')
    ).toEqual(['Paul Greengrass']);

    expect(
      extractPersonNamesFromMetadata({ author: 'میگل دو سروانتس' }, 'author')
    ).toEqual(['میگل دو سروانتس']);

    expect(
      extractPersonNamesFromMetadata(
        { tip: 'مترجم: ذبیح‌الله منصوری' },
        'translator'
      )
    ).toEqual(['ذبیح‌الله منصوری']);
  });

  it('dedupes person items by catalog id or title', async () => {
    const { personItemDedupeKey, normalizePersonItemTitle } = await import('@/lib/people');
    expect(normalizePersonItemTitle('Fight Club - باشگاه مشت‌زنی')).toBe('fight club');
    expect(
      personItemDedupeKey({
        id: 'item-a',
        catalogItemId: 'cat-1',
        title: 'Fight Club',
      })
    ).toBe(
      personItemDedupeKey({
        id: 'item-b',
        catalogItemId: 'cat-1',
        title: 'Fight Club - باشگاه مشت‌زنی',
      })
    );
    expect(
      personItemDedupeKey({ id: 'item-a', catalogItemId: null, title: 'Enemy - دشمن' })
    ).toBe(personItemDedupeKey({ id: 'item-b', catalogItemId: null, title: 'Enemy - دشمن' }));
  });

  it('merges duplicate discovered entries via shared profile imdb', async () => {
    const { mergeDiscoveredPersonEntries, personIdentityMatches, extractImdbNameId } =
      await import('@/lib/people');
    const profiles = [
      {
        role: 'actor' as const,
        slug: 'branko-djuric',
        displayName: 'برانکو جوریچ',
        bio: 'bio',
        externalUrl: 'https://www.imdb.com/name/nm0248383/',
      },
    ];
    const merged = mergeDiscoveredPersonEntries(
      [
        {
          role: 'actor',
          slug: 'branko-djuric',
          displayName: 'Branko Djuric',
          itemKeys: new Set(['a']),
        },
        {
          role: 'actor',
          slug: 'branko-jorich',
          displayName: 'برانکو جوریچ',
          itemKeys: new Set(['b']),
        },
      ],
      profiles
    );
    expect(merged).toHaveLength(1);
    expect(merged[0]?.slug).toBe('branko-djuric');
    expect(merged[0]?.itemKeys.size).toBe(2);
    expect(
      personIdentityMatches(
        {
          role: 'actor',
          slug: 'branko-djuric',
          externalUrl: 'https://www.imdb.com/name/nm0248383/',
        },
        {
          role: 'actor',
          slug: 'branko-jorich',
          externalUrl: 'https://www.imdb.com/name/nm0248383/',
        }
      )
    ).toBe(true);
    expect(extractImdbNameId('https://www.imdb.com/name/nm0248383/')).toBe('0248383');
  });

  it('prefers profile with bio when slug variants exist', async () => {
    const { findBestProfileForDiscoveredEntry } = await import('@/lib/people');
    const profile = findBestProfileForDiscoveredEntry(
      { role: 'actor', slug: 'kalb-lndri-jonz', displayName: 'کالب لندری جونز' },
      [
        {
          role: 'actor',
          slug: 'kalb-lndri-jonz',
          displayName: 'کالب لندری جونز',
          bio: null,
          externalUrl: null,
        },
        {
          role: 'actor',
          slug: 'caleb-landry-jones',
          displayName: 'کالب لندری جونز',
          bio: 'bio واردشده',
          externalUrl: 'https://www.imdb.com/name/nm0427930/',
        },
      ]
    );
    expect(profile?.slug).toBe('caleb-landry-jones');
    expect(profile?.bio).toBe('bio واردشده');
  });

  it('builds person page path', async () => {
    const { personPagePath, personPublicPath } = await import('@/lib/people');
    expect(personPagePath('director', 'Paul Greengrass')).toBe(
      '/people/director/paul-greengrass'
    );
    expect(personPublicPath('actor', 'brad-pitt')).toBe('/people/actor/brad-pitt');
  });

  it('detects public-ready person', async () => {
    const { isPersonPublicReady } = await import('@/lib/people');
    expect(
      isPersonPublicReady({
        hasBio: true,
        hasProfile: true,
        profileStatus: 'published',
        itemCount: 3,
      })
    ).toBe(true);
    expect(
      isPersonPublicReady({
        hasBio: false,
        hasProfile: true,
        profileStatus: 'published',
        itemCount: 3,
      })
    ).toBe(false);
  });
});

describe('person bio stub', () => {
  it('builds fa-IR stub text', async () => {
    const { buildPersonBioStub } = await import('@/lib/people');
    expect(buildPersonBioStub('director', 12, 'کارگردان')).toContain('۱۲');
    expect(buildPersonBioStub('director', 12, 'کارگردان')).toContain('کارگردان');
  });
});
