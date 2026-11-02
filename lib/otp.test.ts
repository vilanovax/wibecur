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
  it('accepts the correct code once', async () => {
    await __setOtpForTests('989121234567', '12345', 'login');
    expect(await consumeOtp('989121234567', '12345')).toEqual({
      ok: true,
      purpose: 'login',
      name: undefined,
      avatarId: undefined,
    });
    expect((await consumeOtp('989121234567', '12345')).ok).toBe(false);
  });

  it('locks after too many mismatches', async () => {
    await saveOtp({ phone: '989121234567', code: '12345', purpose: 'login' });
    for (let i = 0; i < OTP_MAX_ATTEMPTS - 1; i++) {
      const result = await consumeOtp('989121234567', '00000');
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.reason).toBe('mismatch');
    }
    const locked = await consumeOtp('989121234567', '00000');
    expect(locked.ok).toBe(false);
    if (!locked.ok) expect(locked.reason).toBe('locked');
  });

  it('stores register profile fields', async () => {
    await saveOtp({
      phone: '989121234567',
      code: '54321',
      purpose: 'register',
      name: 'سارا',
      avatarId: 'vibe',
    });
    expect(await consumeOtp('989121234567', '54321')).toMatchObject({
      ok: true,
      purpose: 'register',
      name: 'سارا',
      avatarId: 'vibe',
    });
  });

  it('enforces resend cooldown', async () => {
    const now = 1_700_000_000_000;
    await saveOtp({ phone: '989121234567', code: '12345', purpose: 'login', now });
    expect(await getOtpResendRemainingMs('989121234567', now + 10_000)).toBeGreaterThan(0);
    expect(await getOtpResendRemainingMs('989121234567', now + 61_000)).toBe(0);
  });
});
