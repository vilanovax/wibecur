import { describe, expect, it } from 'vitest';
import {
  personImageStorageStatus,
  personImageStatusForDiscovered,
  resolvePersonImageProfileForDiscovered,
} from '@/lib/person-image-utils';

describe('personImageStorageStatus', () => {
  it('detects empty, storage, and external urls', () => {
    expect(personImageStorageStatus(null)).toBe('none');
    expect(personImageStorageStatus('')).toBe('none');
    expect(
      personImageStorageStatus('https://c466145.parspack.net/c466145/wibe/people/x.webp')
    ).toBe('storage');
    expect(personImageStorageStatus('https://image.tmdb.org/t/p/w500/abc.jpg')).toBe('external');
  });
});

describe('resolvePersonImageProfileForDiscovered', () => {
  const storageUrl = 'https://c466145.parspack.net/c466145/wibe/people/phoebe.webp';

  it('matches profile when discovered slug differs from profile slug', () => {
    const profiles = [
      {
        role: 'director' as const,
        slug: 'phoebe-waller-bridge',
        displayName: 'Phoebe Waller-Bridge',
        imageUrl: storageUrl,
      },
    ];

    const profile = resolvePersonImageProfileForDiscovered(
      {
        role: 'director',
        slug: 'phoebe-wallerbridge',
        displayName: 'Phoebe Waller-Bridge',
      },
      profiles
    );

    expect(profile?.slug).toBe('phoebe-waller-bridge');
    expect(personImageStatusForDiscovered(
      {
        role: 'director',
        slug: 'phoebe-wallerbridge',
        displayName: 'Phoebe Waller-Bridge',
      },
      profiles
    )).toBe('storage');
  });
});
