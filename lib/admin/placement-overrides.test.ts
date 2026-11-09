import { describe, expect, it } from 'vitest';
import {
  mergeCatalogIntoPlacement,
  readPlacementOverrides,
  withPlacementOverrides,
} from './placement-overrides';

describe('placement overrides', () => {
  it('marks override fields on metadata', () => {
    const next = withPlacementOverrides({ tip: 'a' }, ['title', 'tip']);
    expect(readPlacementOverrides(next)).toEqual({ title: true, tip: true });
  });

  it('keeps overridden title/image when merging catalog', () => {
    const merged = mergeCatalogIntoPlacement({
      catalog: {
        title: 'Catalog Title',
        description: 'Catalog desc',
        imageUrl: 'https://cdn.example/catalog.jpg',
        externalUrl: 'https://imdb.example/1',
        metadata: { tip: 'catalog tip' },
      },
      placement: {
        title: 'List Title',
        description: 'List desc',
        imageUrl: 'https://cdn.example/list.jpg',
        externalUrl: null,
        metadata: withPlacementOverrides({ tip: 'list tip' }, ['title', 'imageUrl', 'tip']),
      },
      catalogRefMetadata: (_catalog, existing) => ({
        ...(existing as Record<string, unknown>),
        entryKind: 'catalog_ref',
      }),
    });

    expect(merged.title).toBe('List Title');
    expect(merged.imageUrl).toBe('https://cdn.example/list.jpg');
    expect(merged.description).toBe('Catalog desc');
    expect(merged.metadata.tip).toBe('list tip');
  });
});
