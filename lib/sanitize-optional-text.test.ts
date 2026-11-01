import { describe, expect, it } from 'vitest';
import { sanitizeOptionalText } from '@/lib/utils';

describe('sanitizeOptionalText', () => {
  it('returns null for nullish and literal null/undefined strings', () => {
    expect(sanitizeOptionalText(null)).toBeNull();
    expect(sanitizeOptionalText(undefined)).toBeNull();
    expect(sanitizeOptionalText('null')).toBeNull();
    expect(sanitizeOptionalText('undefined')).toBeNull();
    expect(sanitizeOptionalText('  ')).toBeNull();
  });

  it('trims and respects max length', () => {
    expect(sanitizeOptionalText('  سلام  ')).toBe('سلام');
    expect(sanitizeOptionalText('abcdefghij', 5)).toBe('abcde');
  });
});
