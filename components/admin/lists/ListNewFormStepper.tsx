'use client';

import { Check } from 'lucide-react';

export type ListNewFormStep = 1 | 2;

const STEPS: { step: ListNewFormStep; title: string; subtitle: string }[] = [
  { step: 1, title: 'اطلاعات پایه', subtitle: 'عنوان، slug، دسته' },
  { step: 2, title: 'نمایش و ظاهر', subtitle: 'وضعیت، کاور، نشان' },
];

interface ListNewFormStepperProps {
  current: ListNewFormStep;
  onStepClick?: (step: ListNewFormStep) => void;
  completedThrough: ListNewFormStep;
}

export default function ListNewFormStepper({
  current,
  onStepClick,
  completedThrough,
}: ListNewFormStepperProps) {
  return (
    <nav aria-label="مراحل ایجاد لیست" className="mb-4" dir="rtl">
      <ol className="flex items-center gap-2 sm:gap-0">
        {STEPS.map((item, index) => {
          const done = item.step < current || item.step <= completedThrough;
          const active = item.step === current;
          const clickable = onStepClick && (done || item.step <= completedThrough + 1);

          return (
            <li key={item.step} className="flex items-center flex-1 min-w-0">
              <button
                type="button"
                disabled={!clickable}
                onClick={() => clickable && onStepClick?.(item.step)}
                className={`flex items-center gap-2 min-w-0 w-full text-right rounded-lg px-2 py-1.5 transition-colors ${
                  clickable ? 'hover:bg-[var(--color-bg)] cursor-pointer' : 'cursor-default'
                }`}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold border-2 transition-colors ${
                    active
                      ? 'border-[var(--primary)] bg-[var(--primary)] text-white'
                      : done
                        ? 'border-emerald-500 bg-emerald-500 text-white'
                        : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)]'
                  }`}
                >
                  {done && !active ? <Check className="w-4 h-4" /> : item.step}
                </span>
                <span className="min-w-0 hidden sm:block">
                  <span
                    className={`block text-sm font-medium truncate ${
                      active ? 'text-[var(--color-text)]' : 'text-[var(--color-text-muted)]'
                    }`}
                  >
                    {item.title}
                  </span>
                  <span className="block text-[10px] text-[var(--color-text-muted)] truncate">
                    {item.subtitle}
                  </span>
                </span>
              </button>
              {index < STEPS.length - 1 && (
                <div
                  className={`hidden sm:block h-0.5 flex-1 mx-2 min-w-[1rem] rounded ${
                    item.step < current ? 'bg-emerald-400' : 'bg-[var(--color-border)]'
                  }`}
                  aria-hidden
                />
              )}
            </li>
          );
        })}
      </ol>
      <p className="sm:hidden text-center text-xs text-[var(--color-text-muted)] mt-2">
        مرحله {current.toLocaleString('fa-IR')} از ۲ — {STEPS[current - 1]?.title}
      </p>
    </nav>
  );
}
