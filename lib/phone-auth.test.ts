import { describe, expect, it } from 'vitest';
import { normalizeIranPhone, validatePhoneInput } from './phone-auth';

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

describe('validatePhoneInput', () => {
  it('passes for Persian mobile input', () => {
    expect(validatePhoneInput('۰۹۱۲۱۲۳۴۵۶۷')).toBeNull();
  });
});
