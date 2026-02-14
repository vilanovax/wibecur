import { describe, it, expect } from 'vitest';
import { slugify } from './slug';

describe('slugify', () => {
  it('تبدیل متن انگلیسی به slug', () => {
    expect(slugify('Hello World')).toBe('hello-world');
    expect(slugify('Best Movies 2024')).toBe('best-movies-2024');
  });

  it('حذف کاراکترهای غیر لاتین (فارسی و غیره)', () => {
    // slugify فقط a-z, 0-9, فاصله و - را نگه می‌دارد
    expect(slugify('فیلم')).toBe('');
    expect(slugify('hello123')).toBe('hello123');
  });

  it('حذف کاراکترهای غیرمجاز', () => {
    expect(slugify('test@#$%^&*()')).toBe('test');
    expect(slugify('hello.world')).toBe('helloworld');
  });

  it('جایگزینی فاصله‌ها با خط تیره', () => {
    expect(slugify('a  b   c')).toBe('a-b-c');
  });

  it('حذف خط تیره اضافی از ابتدا و انتها', () => {
    expect(slugify('  hello  ')).toBe('hello');
    expect(slugify('-hello-world-')).toBe('hello-world');
  });

  it('حالت خالی یا فقط فاصله', () => {
    expect(slugify('')).toBe('');
    expect(slugify('   ')).toBe('');
    expect(slugify('---')).toBe('');
  });
});
