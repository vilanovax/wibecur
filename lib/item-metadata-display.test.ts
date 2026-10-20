import { describe, expect, it } from 'vitest';
import { buildItemMetadataFacts } from '@/lib/item-metadata-display';

describe('person links in item facts', () => {
  it('keeps author as plain text when no public profile is known', () => {
    const facts = buildItemMetadataFacts(
      { author: 'آرمان آرین' },
      'bookspodcast'
    );
    const author = facts.find((fact) => fact.key === 'author');
    expect(author?.value).toBe('آرمان آرین');
    expect(author?.href).toBeUndefined();
  });

  it('links an author only when the resolver returns a page', () => {
    const facts = buildItemMetadataFacts({ author: 'استیفن کینگ' }, 'books', {
      personHref: (role, name) =>
        role === 'author' && name === 'استیفن کینگ' ? '/people/author/stephen-king' : undefined,
    });
    expect(facts.find((fact) => fact.key === 'author')?.href).toBe(
      '/people/author/stephen-king'
    );
  });

  it('links only the actors that have a public page', () => {
    const facts = buildItemMetadataFacts(
      { actors: ['مت دیمون', 'بازیگر ناشناس'] },
      'movies',
      {
        personHref: (role, name) =>
          role === 'actor' && name === 'مت دیمون' ? '/people/actor/matt-damon' : undefined,
      }
    );
    const actors = facts.find((fact) => fact.key === 'actors');
    expect(actors?.profileLinks).toEqual([
      { name: 'مت دیمون', href: '/people/actor/matt-damon' },
      { name: 'بازیگر ناشناس', href: undefined },
    ]);
  });
});
