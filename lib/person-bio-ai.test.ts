import { describe, expect, it } from 'vitest';
import {
  buildExternalAiPrompt,
  formatMissingBioCopyList,
  parsePersonBioImportPayload,
  PERSON_BIO_JSON_EXAMPLE,
} from '@/lib/person-bio-ai';

describe('person bio import', () => {
  it('parses valid payload', () => {
    const parsed = parsePersonBioImportPayload(PERSON_BIO_JSON_EXAMPLE);
    expect(parsed.people).toHaveLength(1);
    expect(parsed.people[0]?.bio.length).toBeGreaterThan(10);
  });

  it('builds external ai prompt with slugs', () => {
    const prompt = buildExternalAiPrompt([
      {
        role: 'actor',
        slug: 'brad-pitt',
        displayName: 'Brad Pitt',
        itemCount: 3,
        hasProfile: false,
        hasBio: false,
        profileStatus: null,
      },
    ]);
    expect(prompt).toContain('brad-pitt');
    expect(prompt).toContain('Brad Pitt');
  });

  it('formats missing bio copy list', () => {
    const text = formatMissingBioCopyList([
      {
        role: 'director',
        slug: 'nolan',
        displayName: 'Christopher Nolan',
        itemCount: 5,
        hasProfile: false,
        hasBio: false,
        profileStatus: null,
      },
    ]);
    expect(text).toContain('Christopher Nolan');
    expect(text).toContain('nolan');
  });
});
