'use client';

import { Check, Rocket, Settings2, Target, Zap } from 'lucide-react';

export type CommentSeedStep = 1 | 2 | 3 | 4;

const STEPS: {
  step: CommentSeedStep;
  title: string;
  subtitle: string;
  icon: typeof Target;
}[] = [
  { step: 1, title: 'هدف', subtitle: 'آیتم، لیست یا دسته', icon: Target },
  { step: 2, title: 'تنظیمات', subtitle: 'تعداد، لحن، تاریخ', icon: Settings2 },
  { step: 3, title: 'تولید', subtitle: 'ساخت پیش‌نویس‌ها', icon: Zap },
  { step: 4, title: 'انتشار', subtitle: 'بررسی و انتشار', icon: Rocket },
];

interface CommentSeedStepperProps {
  current: CommentSeedStep;
  completedThrough: CommentSeedStep;
  onStepClick?: (step: CommentSeedStep) => void;
}

export default function CommentSeedStepper({
  current,
  completedThrough,
  onStepClick,
}: CommentSeedStepperProps) {
  return (
    <nav
      aria-label="مراحل کامنت هوشمند"
      className="mb-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)]/60 p-3"
      dir="rtl"
    >
      <ol className="grid grid-cols-4 gap-1">
        {STEPS.map((item) => {
          const done = item.step < current || item.step <= completedThrough;
          const active = item.step === current;
          const clickable = onStepClick && (done || item.step <= completedThrough + 1);
          const Icon = item.icon;

          return (
            <li key={item.step}>
              <button
                type="button"
                disabled={!clickable}
                onClick={() => clickable && onStepClick?.(item.step)}
                className={`flex w-full flex-col items-center gap-1.5 rounded-lg px-2 py-2.5 text-center transition ${
                  active
                    ? 'bg-[var(--color-surface)] shadow-sm ring-1 ring-primary/20'
                    : clickable
                      ? 'hover:bg-[var(--color-surface)]/80'
                      : 'opacity-60'
                } ${clickable ? 'cursor-pointer' : 'cursor-default'}`}
              >
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition-colors ${
                    active
                      ? 'border-primary bg-primary text-white'
                      : done
                        ? 'border-emerald-500 bg-emerald-500 text-white'
                        : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)]'
                  }`}
                >
                  {done && !active ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                </span>
                <span className="min-w-0">
                  <span
                    className={`block text-xs font-semibold ${
                      active ? 'text-[var(--color-text)]' : 'text-[var(--color-text-muted)]'
                    }`}
                  >
                    {item.title}
                  </span>
                  <span className="hidden text-[10px] text-[var(--color-text-muted)] sm:block">
                    {item.subtitle}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export { STEPS as COMMENT_SEED_STEPS };
