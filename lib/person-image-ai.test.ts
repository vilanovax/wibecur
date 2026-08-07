import { describe, expect, it } from 'vitest';
import {
  buildExternalAiImagePrompt,
  formatMissingImageNameList,
  parsePersonImageImportPayload,
  tryParsePersonImageImportPayload,
  PERSON_IMAGE_JSON_EXAMPLE,
  type PersonMissingImageEntry,
} from '@/lib/person-image-ai';

describe('person image import', () => {
  it('parses valid payload', () => {
    const parsed = parsePersonImageImportPayload(PERSON_IMAGE_JSON_EXAMPLE);
    expect(parsed.people).toHaveLength(1);
    expect(parsed.people[0]?.slug).toBe('alex-garland');
  });

  it('normalizes AI JSON with schema wrapper', () => {
    const parsed = parsePersonImageImportPayload({
      $schema: 'test',
      description: 'x',
      people: [
        { role: 'director', slug: 'nolan', displayName: 'Nolan', imageUrl: '' },
      ],
    });
    expect(parsed.people).toHaveLength(1);
  });

  it('builds external ai prompt with slugs', () => {
    const entry: PersonMissingImageEntry = {
      role: 'actor',
      slug: 'brad-pitt',
      displayName: 'Brad Pitt',
      itemCount: 3,
      imageStatus: 'none',
    };
    const prompt = buildExternalAiImagePrompt([entry]);
    expect(prompt).toContain('brad-pitt');
    expect(prompt).toContain('Brad Pitt');
    expect(prompt).toContain('imageUrl');
  });

  it('formats missing image name list', () => {
    const text = formatMissingImageNameList([
      {
        role: 'director',
        slug: 'nolan',
        displayName: 'Christopher Nolan',
        itemCount: 5,
        imageStatus: 'none',
      },
    ]);
    expect(text).toBe('Christopher Nolan');
  });

  it('rejects invalid url but allows empty for tmdb fallback', () => {
    const result = tryParsePersonImageImportPayload({
      people: [{ role: 'director', slug: 'nolan', displayName: 'Nolan', imageUrl: '' }],
    });
    expect(result.success).toBe(true);
  });
});
