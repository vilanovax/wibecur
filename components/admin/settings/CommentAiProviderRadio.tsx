'use client';

import type { CommentAiProvider } from '@/lib/comment-ai-provider';
import { COMMENT_AI_PROVIDER_OPTIONS } from '@/lib/comment-ai-provider';

type Props = {
  value: CommentAiProvider;
  onChange: (provider: CommentAiProvider) => void;
};

export default function CommentAiProviderRadio({ value, onChange }: Props) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-[var(--color-text)]">
        هوش مصنوعی تولید کامنت هوشمند
      </p>
      <p className="text-xs text-[var(--color-text-muted)] -mt-1">
        برای کمپین‌های کامنت ساختگی و بازتولید پیش‌نویس‌ها
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {COMMENT_AI_PROVIDER_OPTIONS.map((option) => {
          const active = value === option.value;
          return (
            <label
              key={option.value}
              className={`flex items-start gap-3 rounded-xl border px-3 py-3 cursor-pointer transition-colors ${
                active
                  ? 'border-[var(--primary)] bg-[var(--primary)]/5 ring-1 ring-[var(--primary)]/20'
                  : 'border-[var(--color-border)] hover:bg-[var(--color-bg)]'
              }`}
            >
              <input
                type="radio"
                name="comment-ai-provider"
                value={option.value}
                checked={active}
                onChange={() => onChange(option.value)}
                className="mt-0.5 text-[var(--primary)]"
              />
              <span className="min-w-0">
                <span className="block text-sm font-medium text-[var(--color-text)]">
                  {option.label}
                </span>
                <span className="block text-[11px] text-[var(--color-text-muted)] mt-0.5">
                  {option.description}
                </span>
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
