import { describe, expect, it } from 'vitest';
import {
  digitsFromPhoneInput,
  formatIranPhoneDisplay,
  formatPhoneDigitsForDisplay,
  normalizeIranPhone,
  validatePhoneInput,
} from './phone-auth';

describe('normalizeIranPhone', () => {
  it('accepts Persian digits', () => {
    expect(normalizeIranPhone('۰۹۱۲۱۲۳۴۵۶۷')).toBe('989121234567');
  });

  it('accepts Arabic-Indic digits', () => {
    expect(normalizeIranPhone('٠٩١٢١٢٣٤٥٦٧')).toBe('989121234567');
  });

  it('accepts English digits', () => {
    expect(normalizeIranPhone('09121234567')).toBe('989121234567');
  });
});

describe('formatPhoneDigitsForDisplay', () => {
  it('groups a partial number in Persian digits', () => {
    expect(formatPhoneDigitsForDisplay('0912')).toBe('۰۹۱۲');
    expect(formatPhoneDigitsForDisplay('0912123')).toBe('۰۹۱۲ ۱۲۳');
    expect(formatPhoneDigitsForDisplay('09121234567')).toBe('۰۹۱۲ ۱۲۳ ۴۵۶۷');
  });

  it('keeps only eleven digits from mixed input', () => {
    expect(digitsFromPhoneInput('۰۹۱۲-۱۲۳۴۵۶۷۸۹۹')).toBe('09121234567');
  });
});

describe('formatIranPhoneDisplay', () => {
  it('shows a normalized phone as a local grouped number', () => {
    expect(formatIranPhoneDisplay('989121234567')).toBe('۰۹۱۲ ۱۲۳ ۴۵۶۷');
  });
});

describe('validatePhoneInput', () => {
  it('passes for Persian mobile input', () => {
    expect(validatePhoneInput('۰۹۱۲۱۲۳۴۵۶۷')).toBeNull();
  });
});
