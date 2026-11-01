'use client';

import { Check } from 'lucide-react';

export type ListEditFormStep = 1 | 2 | 3;

const STEPS: { step: ListEditFormStep; title: string; subtitle: string }[] = [
  { step: 1, title: 'اطلاعات پایه', subtitle: 'عنوان، slug، دسته' },
  { step: 2, title: 'نمایش و ظاهر', subtitle: 'وضعیت، کاور، نشان' },
  { step: 3, title: 'آیتم‌ها', subtitle: 'ترتیب و مدیریت' },
];

interface ListEditFormStepperProps {
  current: ListEditFormStep;
  onStepClick?: (step: ListEditFormStep) => void;
  completedThrough: ListEditFormStep;
}

export default function ListEditFormStepper({
  current,
  onStepClick,
  completedThrough,
}: ListEditFormStepperProps) {
  return (
    <nav aria-label="مراحل ویرایش لیست" className="mb-4" dir="rtl">
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
                  clickable ? 'hover:bg-(--color-bg) cursor-pointer' : 'cursor-default'
                }`}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold border-2 transition-colors ${
                    active
                      ? 'border-(--primary) bg-primary text-white'
                      : done
                        ? 'border-emerald-500 bg-emerald-500 text-white'
                        : 'border-(--color-border) bg-(--color-surface) text-wibe-secondary'
                  }`}
                >
                  {done && !active ? <Check className="w-4 h-4" /> : item.step}
                </span>
                <span className="min-w-0 hidden sm:block">
                  <span
                    className={`block text-sm font-medium truncate ${
                      active ? 'text-(--color-text)' : 'text-wibe-secondary'
                    }`}
                  >
                    {item.title}
                  </span>
                  <span className="block text-[10px] text-wibe-secondary truncate">
                    {item.subtitle}
                  </span>
                </span>
              </button>
              {index < STEPS.length - 1 && (
                <div
                  className={`hidden sm:block h-0.5 flex-1 mx-2 min-w-4 rounded ${
                    item.step < current ? 'bg-emerald-400' : 'bg-(--color-border)'
                  }`}
                  aria-hidden
                />
              )}
            </li>
          );
        })}
      </ol>
      <p className="sm:hidden text-center text-xs text-wibe-secondary mt-2">
        مرحله {current.toLocaleString('fa-IR')} از ۳ — {STEPS[current - 1]?.title}
      </p>
    </nav>
  );
}

export { STEPS as LIST_EDIT_FORM_STEPS };
