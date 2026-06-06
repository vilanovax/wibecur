'use client';

import {
  OPENAI_MODEL_OPTIONS,
  formatOpenAIModelPricingFa,
  getOpenAIModelOption,
  openAIModelTierLabel,
  resolveOpenAIModel,
} from '@/lib/openai-models';

type Props = {
  value: string;
  onChange: (modelId: string) => void;
  disabled?: boolean;
};

export default function OpenAIModelSelect({ value, onChange, disabled }: Props) {
  const selected = getOpenAIModelOption(value);

  return (
    <div className="space-y-2">
      <label htmlFor="openai-model" className="block text-sm font-medium text-[var(--color-text)]">
        مدل OpenAI
      </label>
      <select
        id="openai-model"
        value={resolveOpenAIModel(value)}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        dir="ltr"
        className="w-full px-3 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-text)] focus:ring-2 focus:ring-[var(--primary)]"
      >
        {OPENAI_MODEL_OPTIONS.map((m) => (
          <option key={m.id} value={m.id}>
            {m.label} ({openAIModelTierLabel(m.tier)}) — in ${m.inputPer1M} / out ${m.outputPer1M}
          </option>
        ))}
      </select>
      <div className="rounded-xl bg-violet-50/80 dark:bg-violet-950/30 border border-violet-100 dark:border-violet-900/40 px-3 py-2.5 text-xs text-violet-900 dark:text-violet-200">
        <p className="font-semibold">
          {selected.label}{' '}
          <span className="font-normal text-violet-700 dark:text-violet-300">
            · {openAIModelTierLabel(selected.tier)}
          </span>
        </p>
        <p className="mt-0.5 tabular-nums">{formatOpenAIModelPricingFa(selected)}</p>
        <p className="mt-1 text-violet-800/80 dark:text-violet-300/80">{selected.hint}</p>
      </div>
      <p className="text-[11px] text-[var(--color-text-muted)]">
        برای توضیحات کوتاه فارسی، معمولاً <strong>GPT-4o Mini</strong> یا{' '}
        <strong>GPT-5 Nano</strong> کافی و به‌صرفه‌ترین‌اند.
      </p>
    </div>
  );
}
