import { describe, expect, it } from 'vitest';
import {
  personLinkKey,
  personPublicPath,
  personSlug,
  type PersonProfileIdentity,
} from '@/lib/people';
import { matchPublicPersonHrefs } from '@/lib/person-hrefs';

const riley: PersonProfileIdentity = {
  role: 'author',
  slug: personSlug('ریلی سیجر'),
  displayName: 'ریلی سیجر',
  bio: 'نویسنده تریلرهای روان‌شناختی.',
  status: 'published',
};

describe('matchPublicPersonHrefs', () => {
  it('links a published profile with a bio', () => {
    expect(
      matchPublicPersonHrefs([{ role: 'author', name: 'ریلی سیجر' }], [riley])
    ).toEqual({
      [personLinkKey('author', 'ریلی سیجر')]: personPublicPath('author', riley.slug),
    });
  });

  it('skips drafts, empty bios, and unknown names', () => {
    const draft: PersonProfileIdentity = { ...riley, status: 'draft' };
    const emptyBio: PersonProfileIdentity = {
      ...riley,
      slug: personSlug('نویسنده دیگر'),
      displayName: 'نویسنده دیگر',
      bio: '   ',
    };

    expect(
      matchPublicPersonHrefs(
        [
          { role: 'author', name: 'ریلی سیجر' },
          { role: 'author', name: 'نویسنده دیگر' },
          { role: 'author', name: 'ناشناس' },
        ],
        [draft, emptyBio]
      )
    ).toEqual({});
  });
});
