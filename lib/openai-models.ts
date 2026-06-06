/** مدل‌های OpenAI پیشنهادی برای تولید متن در پنل ادمین — قیمت به ازای ۱M توکن (USD) */

export type OpenAIModelTier = 'nano' | 'mini' | 'standard' | 'legacy';

export type OpenAIModelOption = {
  id: string;
  label: string;
  tier: OpenAIModelTier;
  inputPer1M: number;
  outputPer1M: number;
  hint: string;
};

export const DEFAULT_OPENAI_MODEL = 'gpt-4o-mini';

/** از ارزان‌ترین به گران‌تر — مناسب تولید توضیحات کوتاه */
export const OPENAI_MODEL_OPTIONS: OpenAIModelOption[] = [
  {
    id: 'gpt-5-nano',
    label: 'GPT-5 Nano',
    tier: 'nano',
    inputPer1M: 0.05,
    outputPer1M: 0.4,
    hint: 'ارزان‌ترین · سریع · بدون temperature · مناسب JSON کوتاه',
  },
  {
    id: 'gpt-4.1-nano',
    label: 'GPT-4.1 Nano',
    tier: 'nano',
    inputPer1M: 0.1,
    outputPer1M: 0.4,
    hint: 'فوق‌سریع · دستورات ساده',
  },
  {
    id: 'gpt-4o-mini',
    label: 'GPT-4o Mini',
    tier: 'mini',
    inputPer1M: 0.15,
    outputPer1M: 0.6,
    hint: 'پیش‌فرض · توازن قیمت و کیفیت',
  },
  {
    id: 'gpt-5-mini',
    label: 'GPT-5 Mini',
    tier: 'mini',
    inputPer1M: 0.25,
    outputPer1M: 2.0,
    hint: 'استدلال سبک · کیفیت بالاتر از nano',
  },
  {
    id: 'gpt-4.1-mini',
    label: 'GPT-4.1 Mini',
    tier: 'mini',
    inputPer1M: 0.4,
    outputPer1M: 1.6,
    hint: 'دستورات دقیق · context بلند',
  },
  {
    id: 'gpt-3.5-turbo',
    label: 'GPT-3.5 Turbo',
    tier: 'legacy',
    inputPer1M: 0.5,
    outputPer1M: 1.5,
    hint: 'نسخهٔ قدیمی · ساده و ارزان',
  },
  {
    id: 'gpt-4.1',
    label: 'GPT-4.1',
    tier: 'standard',
    inputPer1M: 2.0,
    outputPer1M: 8.0,
    hint: 'کیفیت بالا · هزینه بیشتر',
  },
  {
    id: 'gpt-4o',
    label: 'GPT-4o',
    tier: 'standard',
    inputPer1M: 2.5,
    outputPer1M: 10.0,
    hint: 'چندوجهی · متن باکیفیت',
  },
  {
    id: 'gpt-5',
    label: 'GPT-5',
    tier: 'standard',
    inputPer1M: 1.25,
    outputPer1M: 10.0,
    hint: 'پرچمدار · فقط برای متن‌های مهم',
  },
];

const MODEL_MAP = new Map(OPENAI_MODEL_OPTIONS.map((m) => [m.id, m]));

export function resolveOpenAIModel(stored: string | null | undefined): string {
  const id = stored?.trim();
  if (id && MODEL_MAP.has(id)) return id;
  return DEFAULT_OPENAI_MODEL;
}

export function getOpenAIModelOption(id: string | null | undefined): OpenAIModelOption {
  return MODEL_MAP.get(resolveOpenAIModel(id)) ?? MODEL_MAP.get(DEFAULT_OPENAI_MODEL)!;
}

export function formatOpenAIModelPricing(model: OpenAIModelOption): string {
  return `ورودی $${model.inputPer1M} · خروجی $${model.outputPer1M} / ۱M توکن`;
}

export function formatOpenAIModelPricingFa(model: OpenAIModelOption): string {
  const inFa = model.inputPer1M.toLocaleString('en-US', { minimumFractionDigits: 2 });
  const outFa = model.outputPer1M.toLocaleString('en-US', { minimumFractionDigits: 2 });
  return `ورودی $${inFa} · خروجی $${outFa} به ازای هر ۱M توکن`;
}

export function openAIModelTierLabel(tier: OpenAIModelTier): string {
  switch (tier) {
    case 'nano':
      return 'Nano';
    case 'mini':
      return 'Mini';
    case 'legacy':
      return 'Legacy';
    default:
      return 'Standard';
  }
}

/** مدل‌های جدید OpenAI فقط max_completion_tokens می‌پذیرند (نه max_tokens) */
export function modelUsesMaxCompletionTokens(modelId: string): boolean {
  const id = modelId.toLowerCase();
  if (id.startsWith('gpt-5')) return true;
  if (id.startsWith('gpt-4.1')) return true;
  if (/^o[0-9]/.test(id)) return true;
  return false;
}

/** GPT-5 و o-series: temperature و سایر sampling params پشتیبانی نمی‌شود */
export function modelDisallowsSamplingParams(modelId: string): boolean {
  const id = modelId.toLowerCase();
  if (id.startsWith('gpt-5')) return true;
  if (/^o[0-9]/.test(id)) return true;
  return false;
}

/** برای کارهای کوتاه (توضیحات JSON) — مصرف reasoning token کمتر */
export function defaultReasoningEffortForModel(modelId: string): 'minimal' | undefined {
  if (modelId.toLowerCase().startsWith('gpt-5')) return 'minimal';
  return undefined;
}
