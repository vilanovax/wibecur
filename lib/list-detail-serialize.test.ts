import { describe, expect, it } from 'vitest';
import { prepareListDetailForClient } from '@/lib/list-detail-serialize';

describe('prepareListDetailForClient', () => {
  it('trims metadata to client-facing keys only', () => {
    const result = prepareListDetailForClient({
      id: 'l1',
      items: [
        {
          title: 'Film',
          description: 'x'.repeat(400),
          metadata: {
            director: 'Nolan',
            year: 2010,
            heavyBlob: { nested: true },
            actors: ['Leo'],
          },
        },
      ],
    });

    expect(result.items[0].metadata).toEqual({
      director: 'Nolan',
      year: 2010,
      actors: ['Leo'],
    });
    expect(result.items[0].description?.endsWith('…')).toBe(true);
    expect(result.items[0].description?.length).toBeLessThanOrEqual(321);
  });
});
