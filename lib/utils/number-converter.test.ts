import { describe, it, expect } from 'vitest';
import {
  persianToEnglish,
  jalaliToGregorian,
  isJalaliYear,
  parseYear,
} from './number-converter';

describe('persianToEnglish', () => {
  it('تبدیل اعداد فارسی به انگلیسی', () => {
    expect(persianToEnglish('۰۱۲۳۴۵۶۷۸۹')).toBe('0123456789');
    expect(persianToEnglish('۱۴۰۳')).toBe('1403');
  });

  it('تبدیل اعداد عربی-هندی به انگلیسی', () => {
    expect(persianToEnglish('٠١٢٣٤٥٦٧٨٩')).toBe('0123456789');
  });

  it('باقی ماندن متن غیرعددی', () => {
    expect(persianToEnglish('abc')).toBe('abc');
  });
});

describe('jalaliToGregorian', () => {
  it('تبدیل سال شمسی به میلادی', () => {
    expect(jalaliToGregorian(1403)).toBe(2024);
    expect(jalaliToGregorian(1350)).toBe(1971);
  });
});

describe('isJalaliYear', () => {
  it('تشخیص سال شمسی', () => {
    expect(isJalaliYear(1403)).toBe(true);
    expect(isJalaliYear(1200)).toBe(true);
    expect(isJalaliYear(1499)).toBe(true);
    expect(isJalaliYear(1500)).toBe(false);
    expect(isJalaliYear(2024)).toBe(false);
    expect(isJalaliYear(100)).toBe(false);
  });
});

describe('parseYear', () => {
  it('پارس سال انگلیسی', () => {
    expect(parseYear('2024')).toBe(2024);
    expect(parseYear('1990')).toBe(1990);
  });

  it('پارس سال فارسی و تبدیل به میلادی', () => {
    expect(parseYear('۱۴۰۳')).toBe(2024);
  });

  it('ورودی خالی', () => {
    expect(parseYear('')).toBe(null);
    expect(parseYear('   ')).toBe(null);
  });

  it('ورودی نامعتبر', () => {
    expect(parseYear('abc')).toBe(null);
    expect(parseYear('---')).toBe(null);
  });
});
