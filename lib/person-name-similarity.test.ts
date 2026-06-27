import { describe, expect, it } from 'vitest';
import {
  findSimilarPersonGroups,
  personNameSimilarityScore,
  personNamesLikelySamePerson,
} from '@/lib/person-name-similarity';

describe('person name similarity', () => {
  it('scores Persian spelling variants highly', () => {
    expect(personNameSimilarityScore('استفن کینگ', 'استیفن کینگ')).toBeGreaterThan(0.84);
    expect(personNamesLikelySamePerson('استفن کینگ', 'استیفن کینگ')).toBe(true);
  });

  it('does not match clearly different people', () => {
    expect(personNamesLikelySamePerson('استفن کینگ', 'جیمز کامرون')).toBe(false);
    expect(personNamesLikelySamePerson('Matt Damon', 'Brad Pitt')).toBe(false);
  });

  it('finds similar groups from discovery list', () => {
    const groups = findSimilarPersonGroups([
      {
        role: 'author',
        slug: 'estfn-king',
        displayName: 'استفن کینگ',
        itemCount: 4,
        hasBio: false,
      },
      {
        role: 'author',
        slug: 'estyfn-king',
        displayName: 'استیفن کینگ',
        itemCount: 6,
        hasBio: true,
      },
      {
        role: 'author',
        slug: 'james-cameron',
        displayName: 'جیمز کامرون',
        itemCount: 2,
        hasBio: false,
      },
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0]?.members).toHaveLength(2);
    expect(groups[0]?.suggestedCanonicalSlug).toBe('estyfn-king');
  });
});
