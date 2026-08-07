import { describe, expect, it } from 'vitest';
import { buildItemDescriptionPrompt, inferContentType } from '@/lib/admin/item-description-ai';

describe('item-description-ai', () => {
  it('infers podcast from list title in book category', () => {
    const type = inferContentType({
      title: 'رخ',
      categorySlug: 'book',
      categoryName: 'کتاب و پادکست',
      listTitle: 'پادکست‌های پیشنهادی',
    });
    expect(type).toBe('podcast');
  });

  it('builds podcast prompt using list context, not dictionary definition', () => {
    const prompt = buildItemDescriptionPrompt({
      title: 'رخ (Rokh)',
      categorySlug: 'book',
      categoryName: 'کتاب و پادکست',
      listTitle: 'پادکست‌های پیشنهادی',
      listNote: 'اپیزود مربوط به امیرکبیر از پرطرفدارترین قسمت‌هاست',
    });

    expect(prompt).toContain('پادکست');
    expect(prompt).toContain('پادکست‌های پیشنهادی');
    expect(prompt).toContain('رخ (Rokh)');
    expect(prompt).toContain('هرگز معنی واژه');
  });
});
