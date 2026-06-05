/**
 * تولید slug برای دسته‌بندی — transliteration فارسی + لاتین
 */

import { slugify } from '@/lib/utils/slug';
import { isValidCategorySlug } from '@/lib/admin/category-intelligence';

/** واژه‌های پرتکرار دسته‌ها */
const WORD_MAP: Record<string, string> = {
  'فیلم و سریال': 'film-serial',
  'فیلم‌وسریال': 'film-serial',
  'فیلم': 'film',
  'سریال': 'serial',
  'سینما': 'cinema',
  'کتاب': 'book',
  'ادبیات': 'literature',
  'کافه': 'cafe',
  'رستوران': 'restaurant',
  'غذا': 'food',
  'پادکست': 'podcast',
  'موسیقی': 'music',
  'لایف‌استایل': 'lifestyle',
  'لایف استایل': 'lifestyle',
  'ماشین': 'car',
  'تکنولوژی': 'tech',
  'فناوری': 'tech',
  'بازی': 'game',
  'ورزش': 'sport',
  'سفر': 'travel',
  'گردشگری': 'travel',
  'مد': 'fashion',
  'زیبایی': 'beauty',
  'سلامت': 'health',
  'آموزش': 'education',
  'هنر': 'art',
  'عکاسی': 'photo',
};

const CHAR_MAP: Record<string, string> = {
  ا: 'a',
  آ: 'a',
  ب: 'b',
  پ: 'p',
  ت: 't',
  ث: 's',
  ج: 'j',
  چ: 'ch',
  ح: 'h',
  خ: 'kh',
  د: 'd',
  ذ: 'z',
  ر: 'r',
  ز: 'z',
  ژ: 'zh',
  س: 's',
  ش: 'sh',
  ص: 's',
  ض: 'z',
  ط: 't',
  ظ: 'z',
  ع: 'a',
  غ: 'gh',
  ف: 'f',
  ق: 'gh',
  ک: 'k',
  ك: 'k',
  گ: 'g',
  ل: 'l',
  م: 'm',
  ن: 'n',
  و: 'o',
  ه: 'h',
  ة: 'h',
  ی: 'i',
  ي: 'i',
  ئ: 'i',
  ء: '',
  '‌': '-',
};

function transliteratePersianChunk(text: string): string {
  let out = '';
  for (const ch of text) {
    if (/[a-zA-Z0-9]/.test(ch)) {
      out += ch.toLowerCase();
    } else if (CHAR_MAP[ch] !== undefined) {
      out += CHAR_MAP[ch];
    } else if (/\s/.test(ch)) {
      out += ' ';
    }
  }
  return out;
}

/**
 * از نام فارسی/انگلیسی دسته، slug پیشنهادی می‌سازد.
 */
export function slugifyCategoryName(name: string): string {
  let text = name.trim().normalize('NFKC').replace(/\s+/g, ' ');
  if (!text) return '';

  text = text.replace(/\s+و\s+/g, ' ');

  const sortedWords = Object.keys(WORD_MAP).sort((a, b) => b.length - a.length);
  for (const word of sortedWords) {
    text = text.split(word).join(` ${WORD_MAP[word]} `);
  }

  const transliterated = transliteratePersianChunk(text);
  const slug = slugify(transliterated);
  if (slug) return slug;

  const latinOnly = slugify(name);
  return latinOnly || 'category';
}

/** نامک‌های پیشنهادی وقتی slug اشغال است: base-2, base-3, ... */
export function buildSlugCandidates(base: string, max = 12): string[] {
  const normalized = slugify(base) || 'category';
  const out = [normalized];
  for (let i = 2; i <= max + 1; i++) {
    out.push(`${normalized}-${i}`);
  }
  return out;
}

export { isValidCategorySlug };
