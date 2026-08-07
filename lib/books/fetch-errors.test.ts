import { describe, expect, it } from 'vitest';
import { formatBookFetchError } from '@/lib/books/fetch-errors';

describe('formatBookFetchError', () => {
  it('formats abort as timeout', () => {
    const err = new Error('aborted');
    err.name = 'AbortError';
    expect(formatBookFetchError(err, 'فیدیبو')).toContain('زمان انتظار');
  });

  it('shortens url context to hostname', () => {
    expect(
      formatBookFetchError(new Error('HTTP 503'), 'https://api.fidibo.com/flex/search')
    ).toContain('api.fidibo.com');
  });
});
