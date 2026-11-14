import { describe, expect, it } from 'vitest';
import {
  buildListItemQuickActions,
  itemHasMapLocation,
  mapsUrlToEmbedUrl,
} from '@/lib/list-item-quick-actions';

describe('buildListItemQuickActions', () => {
  it('returns phone, maps, instagram for cafe items', () => {
    const actions = buildListItemQuickActions(
      {
        phone: '021 1234 5678',
        address: 'تهران، ولیعصر',
        instagram: '@my_cafe',
      },
      'cafe'
    );

    expect(actions.map((a) => a.key)).toEqual(['phone', 'maps', 'instagram']);
    expect(actions[0]?.href).toBe('tel:02112345678');
    expect(actions[1]?.href).toContain('google.com/maps');
    expect(actions[2]?.href).toBe('https://www.instagram.com/my_cafe');
  });

  it('includes website and works for lifestyle places', () => {
    const actions = buildListItemQuickActions(
      {
        mapsUrl: 'https://balad.ir/p/abc',
        website: 'https://example.ir',
      },
      'lifestyle'
    );
    expect(actions.map((a) => a.key)).toEqual(['maps', 'website']);
    expect(actions[1]?.href).toBe('https://example.ir');
  });

  it('shows place actions from metadata even on movie when signals exist', () => {
    const actions = buildListItemQuickActions(
      { website: 'https://place.ir', mapsUrl: 'https://maps.google.com/?q=1' },
      'movie'
    );
    expect(actions.map((a) => a.key)).toEqual(['maps', 'website']);
  });

  it('returns empty for non-location categories without place signals', () => {
    expect(buildListItemQuickActions({}, 'movie')).toEqual([]);
  });
});

describe('itemHasMapLocation', () => {
  it('detects mapsUrl', () => {
    expect(
      itemHasMapLocation({ mapsUrl: 'https://maps.google.com/?q=Tehran' }, 'restaurant')
    ).toBe(true);
  });

  it('detects address fallback', () => {
    expect(itemHasMapLocation({ address: 'اصفهان، چهارباغ' }, 'cafe')).toBe(true);
  });
});

describe('mapsUrlToEmbedUrl', () => {
  it('converts search query url to embed', () => {
    const embed = mapsUrlToEmbedUrl(
      'https://www.google.com/maps/search/?api=1&query=Tehran'
    );
    expect(embed).toContain('output=embed');
    expect(embed).toContain('Tehran');
  });
});
