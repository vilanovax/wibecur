'use client';

export const WEIGHT_LEVELS = [
  { value: 0.8 as const, label: 'کاهش', short: 'کاهش' },
  { value: 1.0 as const, label: 'نرمال', short: 'نرمال' },
  { value: 1.2 as const, label: 'تقویت', short: 'تقویت' },
  { value: 1.4 as const, label: 'تقویت قوی', short: 'تقویت قوی' },
] as const;

export type WeightValue = (typeof WEIGHT_LEVELS)[number]['value'];

const EXPLANATIONS: Record<WeightValue, string> = {
  0.8: 'این دسته حدود ۲۰٪ کمتر در رتبه‌بندی ترندینگ تاثیر خواهد داشت.',
  1.0: 'این دسته با ضریب استاندارد در رتبه‌بندی ترندینگ لحاظ می‌شود.',
  1.2: 'این دسته حدود ۲۰٪ بیشتر در رتبه‌بندی ترندینگ تاثیر خواهد داشت.',
  1.4: 'این دسته حدود ۴۰٪ بیشتر در رتبه‌بندی ترندینگ تاثیر خواهد داشت.',
};

const EXAMPLE_RAW = 300;

interface CategoryWeightCardProps {
  value: WeightValue;
  onChange: (value: WeightValue) => void;
  canEdit?: boolean;
  className?: string;
}

export default function CategoryWeightCard({
  value,
  onChange,
  canEdit = true,
  className = '',
}: CategoryWeightCardProps) {
  const rounded = Math.round(EXAMPLE_RAW * value);
  const explanation = EXPLANATIONS[value];

  return (
    <div
      className={`rounded-xl border border-(--color-border) bg-(--color-bg) p-5 space-y-4 ${className}`}
      style={{ direction: 'rtl' }}
    >
      <div>
        <h3 className="font-semibold text-(--color-text) mb-0.5">
          وزن الگوریتمی دسته
        </h3>
        <p className="text-xs text-wibe-secondary">
          وزن در محاسبه امتیاز نهایی ترندینگ ضرب می‌شود.
        </p>
      </div>

      <div>
        <p className="text-sm font-medium text-(--color-text) mb-2">
          سطح تقویت
        </p>
        <div className="flex flex-wrap gap-2">
          {WEIGHT_LEVELS.map((level) => (
            <button
              key={level.value}
              type="button"
              disabled={!canEdit}
              onClick={() => canEdit && onChange(level.value)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                value === level.value
                  ? 'bg-primary text-white'
                  : 'bg-(--color-surface) text-wibe-secondary border border-(--color-border) hover:bg-(--color-border)'
              } ${!canEdit ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {level.label}
            </button>
          ))}
        </div>
      </div>

      <div className="text-sm">
        <p className="font-medium text-(--color-text)">
          ضریب فعلی: {value}x
        </p>
        <p className="text-wibe-secondary mt-1">{explanation}</p>
      </div>

      <div className="rounded-lg bg-(--color-surface) border border-(--color-border) p-3">
        <p className="text-xs font-medium text-wibe-secondary mb-1">
          پیش‌نمایش تاثیر
        </p>
        <p className="text-sm text-(--color-text) font-mono">
          امتیاز {EXAMPLE_RAW} → با وزن فعلی → {rounded}
        </p>
      </div>

      {!canEdit && (
        <p className="text-xs text-amber-600">
          فقط نقش مدیر با دسترسی «تنظیم وزن دسته» می‌تواند این مقدار را تغییر دهد.
        </p>
      )}
    </div>
  );
}
