'use client';

export type UserFilterKind =
  | 'all'
  | 'most_active'
  | 'growing'
  | 'curators'
  | 'suspicious'
  | 'new';

const pills: { value: UserFilterKind; label: string }[] = [
  { value: 'all', label: 'همه' },
  { value: 'most_active', label: 'فعال‌ترین' },
  { value: 'growing', label: 'در حال رشد' },
  { value: 'curators', label: 'کیوریتورها' },
  { value: 'suspicious', label: 'مشکوک' },
  { value: 'new', label: 'جدیدها' },
];

interface SmartFilterBarProps {
  value: UserFilterKind;
  onChange: (value: UserFilterKind) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSearchSubmit: () => void;
}

export default function SmartFilterBar({
  value,
  onChange,
  searchQuery,
  onSearchChange,
  onSearchSubmit,
}: SmartFilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 mb-6">
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
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSearchSubmit();
        }}
        className="flex items-center gap-2 flex-1 min-w-[200px]"
      >
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="جستجو نام، ایمیل..."
          className="flex-1 min-w-0 px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
        />
        <button
          type="submit"
          className="px-4 py-2 rounded-xl bg-[var(--primary)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
        >
          جستجو
        </button>
      </form>
    </div>
  );
}
