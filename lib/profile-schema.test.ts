import { describe, expect, it } from 'vitest';
import { buildPublicProfileJsonLd } from '@/lib/profile-schema';

describe('buildPublicProfileJsonLd', () => {
  it('builds ProfilePage with Person mainEntity', () => {
    const schema = buildPublicProfileJsonLd({
      username: 'sara',
      name: 'سارا',
      bio: 'کیوریتور فیلم',
      image: '/uploads/avatar.jpg',
    });

    expect(schema['@type']).toBe('ProfilePage');
    expect(schema.url).toContain('/u/sara');
    const person = schema.mainEntity as Record<string, unknown>;
    expect(person['@type']).toBe('Person');
    expect(person.name).toBe('سارا');
    expect(person.alternateName).toBe('@sara');
    expect(person.description).toBe('کیوریتور فیلم');
  });
});
