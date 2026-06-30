import { describe, expect, it } from 'vitest';
import { detectBookUrl } from '@/lib/books/url-detect';

describe('detectBookUrl', () => {
  it('detects fidibo category', () => {
    const r = detectBookUrl('https://fidibo.com/ebooks/story-persian-criminal');
    expect(r?.source).toBe('fidibo');
    expect(r?.mode).toBe('category');
  });

  it('detects taaghche category', () => {
    const r = detectBookUrl('https://taaghche.com/category/کتاب-تاریخ-جهان');
    expect(r?.source).toBe('taaghche');
    expect(r?.mode).toBe('category');
  });

  it('detects ketabrah category', () => {
    const r = detectBookUrl('https://ketabrah.com/books/کتاب-مدیریت-رهبری');
    expect(r?.source).toBe('ketabrah');
    expect(r?.mode).toBe('category');
  });

  it('detects ketabrah search', () => {
    const r = detectBookUrl('https://ketabrah.com/search?q=کیمیاگر');
    expect(r?.source).toBe('ketabrah');
    expect(r?.mode).toBe('search');
  });
});
