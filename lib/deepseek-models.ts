export type DeepSeekModelOption = {
  id: string;
  label: string;
  inputPer1M: number;
  outputPer1M: number;
  note: string;
};

export const DEFAULT_DEEPSEEK_MODEL = 'deepseek-chat';

export const DEEPSEEK_MODEL_OPTIONS: DeepSeekModelOption[] = [
  {
    id: 'deepseek-chat',
    label: 'DeepSeek Chat',
    inputPer1M: 0.27,
    outputPer1M: 1.1,
    note: 'مناسب تولید کامنت فارسی — سریع و اقتصادی',
  },
  {
    id: 'deepseek-reasoner',
    label: 'DeepSeek Reasoner',
    inputPer1M: 0.55,
    outputPer1M: 2.19,
    note: 'استدلال قوی‌تر — برای متن‌های پیچیده‌تر',
  },
];

const MODEL_MAP = new Map(DEEPSEEK_MODEL_OPTIONS.map((m) => [m.id, m]));

export function resolveDeepSeekModel(stored: string | null | undefined): string {
  const id = stored?.trim();
  if (id && MODEL_MAP.has(id)) return id;
  return DEFAULT_DEEPSEEK_MODEL;
}

export function getDeepSeekModelOption(
  id: string | null | undefined
): DeepSeekModelOption {
  return (
    MODEL_MAP.get(resolveDeepSeekModel(id)) ??
    MODEL_MAP.get(DEFAULT_DEEPSEEK_MODEL)!
  );
}

export function formatDeepSeekModelPricingFa(model: DeepSeekModelOption): string {
  return `ورودی $${model.inputPer1M} / خروجی $${model.outputPer1M} به ازای ۱M توکن`;
}
