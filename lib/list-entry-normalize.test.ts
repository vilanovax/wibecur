import { describe, expect, it } from 'vitest';
import { normalizeEntryKindInput, parseEntryKind } from '@/lib/list-entry';

describe('normalizeEntryKindInput', () => {
  it('maps new and empty to undefined (catalog create)', () => {
    expect(normalizeEntryKindInput('new')).toBeUndefined();
    expect(normalizeEntryKindInput('NEW')).toBeUndefined();
    expect(normalizeEntryKindInput('')).toBeUndefined();
    expect(normalizeEntryKindInput('   ')).toBeUndefined();
  });

  it('maps catalog to catalog_ref', () => {
    expect(normalizeEntryKindInput('catalog')).toBe('catalog_ref');
    expect(parseEntryKind('catalog')).toBe('catalog_ref');
  });

  it('keeps valid kinds', () => {
    expect(parseEntryKind('tip')).toBe('tip');
    expect(parseEntryKind('catalog_ref')).toBe('catalog_ref');
    expect(parseEntryKind('fact')).toBe('fact');
    expect(parseEntryKind('link')).toBe('link');
  });

  it('rejects unknown strings', () => {
    expect(parseEntryKind('entity')).toBeNull();
  });
});
