import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockCheckActionRateLimit = vi.fn();
const mockGetOtpResendRemainingMs = vi.fn();
const mockGenerateOtpCode = vi.fn();
const mockSaveOtp = vi.fn();
const mockGetSmsIrConfig = vi.fn();
const mockSendOtpSms = vi.fn();
const mockToSmsIrMobile = vi.fn();

vi.mock('@/lib/rate-limit', () => ({
  checkActionRateLimit: (...args: unknown[]) => mockCheckActionRateLimit(...args),
}));

vi.mock('@/lib/otp', () => ({
  generateOtpCode: (...args: unknown[]) => mockGenerateOtpCode(...args),
  getOtpResendRemainingMs: (...args: unknown[]) => mockGetOtpResendRemainingMs(...args),
  OTP_RESEND_COOLDOWN_MS: 60_000,
  saveOtp: (...args: unknown[]) => mockSaveOtp(...args),
}));

vi.mock('@/lib/sms-ir', () => ({
  getSmsIrConfig: (...args: unknown[]) => mockGetSmsIrConfig(...args),
  sendOtpSms: (...args: unknown[]) => mockSendOtpSms(...args),
  toSmsIrMobile: (...args: unknown[]) => mockToSmsIrMobile(...args),
}));

describe('sendPhoneOtp security', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckActionRateLimit.mockResolvedValue({ success: true });
    mockGetOtpResendRemainingMs.mockReturnValue(0);
    mockGenerateOtpCode.mockReturnValue('12345');
    mockToSmsIrMobile.mockReturnValue('09121234567');
    mockSendOtpSms.mockResolvedValue({ ok: true, messageId: 1, cost: 0 });
    mockSaveOtp.mockResolvedValue({
      expiresAt: Date.now() + 60_000,
      resendAt: Date.now() + 60_000,
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('never returns devCode in production even if dryRun is true', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    mockGetSmsIrConfig.mockReturnValue({
      apiKey: 'key',
      dryRun: true,
      templateId: 1,
      paramName: 'CODE',
    });
    const { sendPhoneOtp } = await import('./send-otp-sms');
    const result = await sendPhoneOtp({
      normalizedPhone: '989121234567',
      purpose: 'login',
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.devCode).toBeUndefined();
    }
  });

  it('returns devCode in development dry-run', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    mockGetSmsIrConfig.mockReturnValue({
      apiKey: '',
      dryRun: true,
      templateId: 1,
      paramName: 'CODE',
    });
    const { sendPhoneOtp } = await import('./send-otp-sms');
    const result = await sendPhoneOtp({
      normalizedPhone: '989121234567',
      purpose: 'login',
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.devCode).toBe('12345');
    }
  });
});
