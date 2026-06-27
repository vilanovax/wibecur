import { describe, expect, it } from 'vitest';
import {
  buildExternalAiPrompt,
  formatMissingBioCopyList,
  normalizePersonBioImportRaw,
  parsePersonBioImportPayload,
  resolvePersonBioChatProvider,
  tryParsePersonBioImportPayload,
  PERSON_BIO_JSON_EXAMPLE,
} from '@/lib/person-bio-ai';
import { findDiscoveredPersonMatch, type DiscoveredPerson } from '@/lib/person-profiles';

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
    expect(text).toBe('Christopher Nolan');
  });

  it('filters template rows from schema doc JSON', () => {
    const raw = {
      $schema: 'وایب',
      description: 'test',
      people: [
        {
          role: 'director | actor',
          slug: 'slug-لاتین-از-لیست',
          displayName: 'نام',
          bio: '۲ تا ۴ جمله فارسی',
        },
        {
          role: 'actor',
          slug: 'matt-damon',
          displayName: 'Matt Damon',
          bio: 'مت دیمون بازیگر آمریکایی است که در فیلم‌های متنوع حضور داشته.',
          status: 'published',
        },
      ],
    };
    const result = tryParsePersonBioImportPayload(raw);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.people).toHaveLength(1);
      expect(result.data.people[0]?.slug).toBe('matt-damon');
    }
    expect(normalizePersonBioImportRaw(raw)).toEqual({
      people: [raw.people[1]],
    });
  });

  it('matches import slug to discovered person despite hyphen differences', () => {
    const discovered: DiscoveredPerson[] = [
      {
        role: 'actor',
        slug: 'joseph-gordonlevitt',
        displayName: 'Joseph Gordon-Levitt',
        itemCount: 2,
        hasProfile: false,
        hasBio: false,
        profileStatus: null,
      },
    ];
    const match = findDiscoveredPersonMatch(discovered, {
      role: 'actor',
      slug: 'joseph-gordon-levitt',
      displayName: 'جوزف گوردون-لویت',
    });
    expect(match?.slug).toBe('joseph-gordonlevitt');
  });

  it('falls back to OpenAI when DeepSeek key is missing', () => {
    expect(
      resolvePersonBioChatProvider('deepseek', {
        openaiApiKey: 'sk-test',
        deepseekApiKey: null,
      })
    ).toBe('openai');
  });

  it('throws when no AI keys are configured', () => {
    expect(() =>
      resolvePersonBioChatProvider('openai', {
        openaiApiKey: null,
        deepseekApiKey: null,
      })
    ).toThrow(/هیچ کلید هوش مصنوعی فعال نیست/);
  });
});
