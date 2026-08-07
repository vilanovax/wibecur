import { describe, expect, it } from 'vitest';
import { buildTmdbPersonSearchQueries } from '@/lib/person-enrich/tmdb-person';

describe('buildTmdbPersonSearchQueries', () => {
  it('uses latin slug when display name is persian', () => {
    expect(
      buildTmdbPersonSearchQueries('جان کیوسک', { slug: 'john-cusack' })
    ).toContain('John Cusack');
  });

  it('includes latin segments from combined display names', () => {
    const queries = buildTmdbPersonSearchQueries('Brad Pitt · براد پیت', {
      slug: 'brad-pitt',
    });
    expect(queries).toContain('Brad Pitt');
    expect(queries).toContain('Brad Pitt · براد پیت');
  });
});
