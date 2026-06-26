'use client';

import {
  DEEPSEEK_MODEL_OPTIONS,
  formatDeepSeekModelPricingFa,
  getDeepSeekModelOption,
  resolveDeepSeekModel,
} from '@/lib/deepseek-models';

type Props = {
  value: string;
  onChange: (model: string) => void;
  disabled?: boolean;
};

export default function DeepSeekModelSelect({ value, onChange, disabled }: Props) {
  const selected = getDeepSeekModelOption(value);

  return (
    <div className="space-y-1.5">
      <label htmlFor="deepseek-model" className="block text-sm font-medium text-[var(--color-text)]">
        مدل DeepSeek
      </label>
      <select
        id="deepseek-model"
        value={resolveDeepSeekModel(value)}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full py-2 px-3 text-sm rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] focus:ring-2 focus:ring-[var(--primary)]/30"
      >
        {DEEPSEEK_MODEL_OPTIONS.map((m) => (
          <option key={m.id} value={m.id}>
            {m.label} — in ${m.inputPer1M} / out ${m.outputPer1M}
          </option>
        ))}
      </select>
      <div className="rounded-xl border border-violet-200/70 bg-violet-50/80 dark:bg-violet-950/30 dark:border-violet-900/50 px-3 py-2 text-xs text-violet-900 dark:text-violet-200">
        <p className="font-medium">{selected.label}</p>
        <p className="mt-0.5 tabular-nums">{formatDeepSeekModelPricingFa(selected)}</p>
        <p className="mt-1 text-[var(--color-text-muted)]">{selected.note}</p>
      </div>
    </div>
  );
}
