import { describe, expect, it } from 'vitest';
import { getDisplayListTitle, isMostlyLatinTitle } from '@/lib/list-display-title';

describe('list-display-title', () => {
  it('detects mostly latin titles', () => {
    expect(isMostlyLatinTitle('Relaxing Movies 2')).toBe(true);
    expect(isMostlyLatinTitle('فیلم‌های قبل خواب')).toBe(false);
  });

  it('localizes common english movie titles', () => {
    expect(
      getDisplayListTitle({ title: 'Relaxing Movies 2', slug: 'list-123' })
    ).toBe('فیلم‌های آرامش‌بخش ۲');
  });

  it('uses slug map when available', () => {
    expect(
      getDisplayListTitle({ title: 'Movies Before Sleep', slug: 'movies-before-sleep' })
    ).toBe('فیلم‌های قبل خواب');
  });

  it('keeps persian titles unchanged', () => {
    expect(
      getDisplayListTitle({ title: 'فیلم‌های قبل خواب', slug: 'movies-before-sleep' })
    ).toBe('فیلم‌های قبل خواب');
  });
});
