import { describe, expect, it } from 'vitest';
import {
  extractPersonNamesFromMetadata,
  nameMatchesSlug,
  parseActorNames,
  personPagePath,
  personSlug,
} from '@/lib/people';

describe('people helpers', () => {
  it('builds slug from latin names', () => {
    expect(personSlug('Paul Greengrass')).toBe('paul-greengrass');
    expect(personSlug('Matt Damon')).toBe('matt-damon');
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

  it('builds person page path', () => {
    expect(personPagePath('director', 'Paul Greengrass')).toBe(
      '/people/director/paul-greengrass'
    );
  });
});

describe('person bio stub', () => {
  it('builds fa-IR stub text', async () => {
    const { buildPersonBioStub } = await import('@/lib/people');
    expect(buildPersonBioStub('director', 12, 'کارگردان')).toContain('۱۲');
    expect(buildPersonBioStub('director', 12, 'کارگردان')).toContain('کارگردان');
  });
});
