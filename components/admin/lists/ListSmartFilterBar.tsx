'use client';

export type ListFilterKind =
  | 'all'
  | 'rising'
  | 'trending_top'
  | 'low_engagement'
  | 'suspicious'
  | 'needs_review'
  | 'zero_save';

const pills: { value: ListFilterKind; label: string }[] = [
  { value: 'all', label: 'همه' },
  { value: 'rising', label: 'در حال رشد' },
  { value: 'trending_top', label: 'Trending Top 10' },
  { value: 'low_engagement', label: 'کم‌تعامل' },
  { value: 'suspicious', label: 'مشکوک' },
  { value: 'needs_review', label: 'نیازمند بررسی' },
  { value: 'zero_save', label: 'بدون ذخیره' },
];

interface ListSmartFilterBarProps {
  value: ListFilterKind;
  onChange: (value: ListFilterKind) => void;
  sortBy: string;
  onSortChange: (value: string) => void;
  viewMode: 'grid' | 'table';
  onViewModeChange: (mode: 'grid' | 'table') => void;
}

export default function ListSmartFilterBar({
  value,
  onChange,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
}: ListSmartFilterBarProps) {
  return (
    <div className="rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border-muted)] p-4 shadow-[var(--shadow-card)]">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <h2 className="text-sm font-semibold text-[var(--color-text)]">
          فیلتر و مرتب‌سازی
        </h2>
        <div className="flex items-center gap-3">
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          >
            <option value="score_desc">امتیاز ترند (بیشترین)</option>
            <option value="score_asc">امتیاز ترند (کمترین)</option>
            <option value="saves_desc">ذخیره (بیشترین)</option>
            <option value="saves_asc">ذخیره (کمترین)</option>
            <option value="24h_desc">۲۴h (بیشترین)</option>
            <option value="date_desc">تاریخ (جدیدترین)</option>
            <option value="date_asc">تاریخ (قدیمی‌ترین)</option>
          </select>
          <div className="flex rounded-xl border border-[var(--color-border)] overflow-hidden">
            <button
              type="button"
              onClick={() => onViewModeChange('grid')}
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                viewMode === 'grid'
                  ? 'bg-[var(--primary)] text-white'
                  : 'bg-[var(--color-bg)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
              }`}
              title="گرید"
            >
              گرید
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('table')}
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                viewMode === 'table'
                  ? 'bg-[var(--primary)] text-white'
                  : 'bg-[var(--color-bg)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
              }`}
              title="جدول"
            >
              جدول
            </button>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {pills.map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => onChange(p.value)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              value === p.value
                ? 'bg-[var(--primary)] text-white shadow-sm'
                : 'bg-[var(--color-bg)] text-[var(--color-text-muted)] hover:bg-[var(--color-border)] hover:text-[var(--color-text)]'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
