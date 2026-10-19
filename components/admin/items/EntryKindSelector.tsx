'use client';

import {
  ENTRY_KIND_LABELS,
  ENTRY_KINDS,
  type EntryKind,
} from '@/lib/list-entry';

type Props = {
  value: EntryKind;
  onChange: (kind: EntryKind) => void;
  /** فقط انواع سبک — بدون catalog_ref */
  lightweightOnly?: boolean;
  /** نمایش گزینهٔ «موجودیت کامل» برای لیست‌های ترکیبی */
  includeCatalogEntity?: boolean;
};

const LIGHTWEIGHT_KINDS = ENTRY_KINDS.filter((k) => k !== 'catalog_ref');

const ENTRY_KIND_LABELS_UI: Record<EntryKind, string> = {
  ...ENTRY_KIND_LABELS,
  catalog_ref: 'موجودیت کامل',
};

export default function EntryKindSelector({
  value,
  onChange,
  lightweightOnly = true,
  includeCatalogEntity = false,
}: Props) {
  const kinds = lightweightOnly
    ? includeCatalogEntity
      ? [...LIGHTWEIGHT_KINDS, 'catalog_ref' as const]
      : LIGHTWEIGHT_KINDS
    : [...ENTRY_KINDS];

  return (
    <div className="space-y-2" dir="rtl">
      <p className="text-sm font-medium text-admin-text-primary dark:text-white">
        نوع ورودی
      </p>
      <div className="flex flex-wrap gap-2">
        {kinds.map((kind) => (
          <button
            key={kind}
            type="button"
            onClick={() => onChange(kind)}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-sm font-semibold transition-all ${
              value === kind
                ? 'border-violet-500 bg-violet-50 text-violet-800 shadow-sm dark:bg-violet-900/30 dark:text-violet-200'
                : 'border-admin-border bg-white text-[var(--color-text-muted)] hover:border-violet-300 dark:border-gray-600 dark:bg-gray-800 dark:text-[var(--color-text-subtle)]'
            }`}
          >
            {ENTRY_KIND_LABELS_UI[kind]}
          </button>
        ))}
      </div>
    </div>
  );
}
