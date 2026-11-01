/**
 * کلاینت ارسال Verify از sms.ir
 * docs: https://sms.ir/rest-api/ → POST /v1/send/verify
 */

export type SmsIrParameter = {
  name: string;
  value: string;
};

export type SmsIrVerifyResult =
  | { ok: true; messageId: number; cost: number }
  | { ok: false; status?: number; message: string };

type SmsIrVerifyResponse = {
  status?: number;
  message?: string;
  data?: {
    messageId?: number;
    cost?: number;
  };
};

const SMS_IR_VERIFY_URL = 'https://api.sms.ir/v1/send/verify';

export function getSmsIrConfig() {
  const apiKey = process.env.SMS_IR_API_KEY?.trim() || '';
  const templateIdRaw = process.env.SMS_IR_TEMPLATE_ID?.trim() || '727683';
  const templateId = Number(templateIdRaw);
  const paramName = process.env.SMS_IR_OTP_PARAM?.trim() || 'CODE';
  const dryRun =
    process.env.SMS_IR_DRY_RUN === '1' ||
    process.env.SMS_IR_DRY_RUN === 'true' ||
    (!apiKey && process.env.NODE_ENV !== 'production');

  return {
    apiKey,
    templateId: Number.isFinite(templateId) && templateId > 0 ? templateId : 727683,
    paramName,
    dryRun,
  };
}

/** شماره نرمال‌شدهٔ ۹۸… را به قالب مورد انتظار sms.ir (۰۹…) تبدیل می‌کند */
export function toSmsIrMobile(normalizedPhone98: string): string {
  if (normalizedPhone98.startsWith('98') && normalizedPhone98.length === 12) {
    return `0${normalizedPhone98.slice(2)}`;
  }
  return normalizedPhone98;
}

export async function sendSmsIrVerify(options: {
  mobile: string;
  templateId?: number;
  parameters: SmsIrParameter[];
  apiKey?: string;
  fetchImpl?: typeof fetch;
}): Promise<SmsIrVerifyResult> {
  const config = getSmsIrConfig();
  const apiKey = options.apiKey ?? config.apiKey;
  const templateId = options.templateId ?? config.templateId;
  const fetchImpl = options.fetchImpl ?? fetch;

  if (!apiKey) {
    return { ok: false, message: 'کلید وب‌سرویس پیامک تنظیم نشده است' };
  }

  if (!Number.isFinite(templateId) || templateId <= 0) {
    return { ok: false, message: 'شناسه قالب پیامک نامعتبر است' };
  }

  let response: Response;
  try {
    response = await fetchImpl(SMS_IR_VERIFY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({
        mobile: options.mobile,
        templateId,
        parameters: options.parameters,
      }),
    });
  } catch (error) {
    console.error('[sms.ir] network error', error);
    return { ok: false, message: 'ارتباط با سرویس پیامک برقرار نشد' };
  }

  let payload: SmsIrVerifyResponse = {};
  try {
    payload = (await response.json()) as SmsIrVerifyResponse;
  } catch {
    return {
      ok: false,
      status: response.status,
      message: 'پاسخ نامعتبر از سرویس پیامک',
    };
  }

  if (!response.ok || payload.status !== 1) {
    const message =
      (typeof payload.message === 'string' && payload.message.trim()) ||
      'ارسال پیامک ناموفق بود';
    console.error('[sms.ir] verify failed', {
      http: response.status,
      status: payload.status,
      message,
    });
    return { ok: false, status: payload.status, message };
  }

  return {
    ok: true,
    messageId: Number(payload.data?.messageId ?? 0),
    cost: Number(payload.data?.cost ?? 0),
  };
}

export async function sendOtpSms(mobileLocal09: string, code: string): Promise<SmsIrVerifyResult> {
  const config = getSmsIrConfig();

  if (config.dryRun) {
    console.info('[sms.ir] dry-run OTP', { mobile: mobileLocal09, code });
    return { ok: true, messageId: 0, cost: 0 };
  }

  return sendSmsIrVerify({
    mobile: mobileLocal09,
    templateId: config.templateId,
    parameters: [{ name: config.paramName, value: code }],
  });
}
