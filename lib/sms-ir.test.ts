import { afterEach, describe, expect, it, vi } from 'vitest';
import { getSmsIrConfig, sendSmsIrVerify, toSmsIrMobile } from './sms-ir';

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  vi.restoreAllMocks();
});

describe('toSmsIrMobile', () => {
  it('converts E.164-like 98… to local 09…', () => {
    expect(toSmsIrMobile('989121234567')).toBe('09121234567');
  });
});

describe('getSmsIrConfig', () => {
  it('defaults template and param', () => {
    delete process.env.SMS_IR_API_KEY;
    delete process.env.SMS_IR_TEMPLATE_ID;
    delete process.env.SMS_IR_OTP_PARAM;
    process.env.NODE_ENV = 'development';
    const config = getSmsIrConfig();
    expect(config.templateId).toBe(727683);
    expect(config.paramName).toBe('CODE');
    expect(config.dryRun).toBe(true);
  });
});

describe('sendSmsIrVerify', () => {
  it('posts verify payload with x-api-key', async () => {
    const fetchImpl = vi.fn(async () =>
      Response.json({
        status: 1,
        message: 'موفق',
        data: { messageId: 42, cost: 1 },
      })
    );

    const result = await sendSmsIrVerify({
      mobile: '09121234567',
      templateId: 727683,
      parameters: [{ name: 'CODE', value: '12345' }],
      apiKey: 'test-key',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    expect(result).toEqual({ ok: true, messageId: 42, cost: 1 });
    expect(fetchImpl).toHaveBeenCalledOnce();
    const [, init] = fetchImpl.mock.calls[0]!;
    expect(init?.method).toBe('POST');
    expect((init?.headers as Record<string, string>)['x-api-key']).toBe('test-key');
    expect(JSON.parse(String(init?.body))).toEqual({
      mobile: '09121234567',
      templateId: 727683,
      parameters: [{ name: 'CODE', value: '12345' }],
    });
  });
});
