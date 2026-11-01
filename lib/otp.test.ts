import { afterEach, describe, expect, it } from 'vitest';
import {
  __setOtpForTests,
  clearOtpsForTests,
  consumeOtp,
  generateOtpCode,
  getOtpResendRemainingMs,
  OTP_LENGTH,
  OTP_MAX_ATTEMPTS,
  saveOtp,
} from './otp';
import { normalizeOtpInput, validateOtpInput } from './otp-shared';

afterEach(() => {
  clearOtpsForTests();
});

describe('generateOtpCode', () => {
  it('returns a numeric code with the configured length', () => {
    const code = generateOtpCode();
    expect(code).toMatch(new RegExp(`^\\d{${OTP_LENGTH}}$`));
  });
});

describe('normalizeOtpInput / validateOtpInput', () => {
  it('accepts Persian digits', () => {
    expect(normalizeOtpInput('۱۲۳۴۵')).toBe('12345');
    expect(validateOtpInput('۱۲۳۴۵')).toBeNull();
  });

  it('rejects short codes', () => {
    expect(validateOtpInput('۱۲۳')).toMatch(/۵ رقم/);
  });
});

describe('saveOtp / consumeOtp', () => {
  it('accepts the correct code once', () => {
    __setOtpForTests('989121234567', '12345', 'login');
    expect(consumeOtp('989121234567', '12345')).toEqual({
      ok: true,
      purpose: 'login',
      name: undefined,
      avatarId: undefined,
    });
    expect(consumeOtp('989121234567', '12345').ok).toBe(false);
  });

  it('locks after too many mismatches', () => {
    saveOtp({ phone: '989121234567', code: '12345', purpose: 'login' });
    for (let i = 0; i < OTP_MAX_ATTEMPTS - 1; i++) {
      expect(consumeOtp('989121234567', '00000').reason).toBe('mismatch');
    }
    expect(consumeOtp('989121234567', '00000').reason).toBe('locked');
  });

  it('stores register profile fields', () => {
    saveOtp({
      phone: '989121234567',
      code: '54321',
      purpose: 'register',
      name: 'سارا',
      avatarId: 'vibe',
    });
    expect(consumeOtp('989121234567', '54321')).toMatchObject({
      ok: true,
      purpose: 'register',
      name: 'سارا',
      avatarId: 'vibe',
    });
  });

  it('enforces resend cooldown', () => {
    const now = 1_700_000_000_000;
    saveOtp({ phone: '989121234567', code: '12345', purpose: 'login', now });
    expect(getOtpResendRemainingMs('989121234567', now + 10_000)).toBeGreaterThan(0);
    expect(getOtpResendRemainingMs('989121234567', now + 61_000)).toBe(0);
  });
});
