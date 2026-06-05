'use client';

import { useState } from 'react';
import { ChevronDown, History } from 'lucide-react';
import type { SlotItem } from '../FeaturedManagementClient';

type Props = {
  past: SlotItem[];
  formatDate: (s: string) => string;
};

export default function FeaturedHistoryAccordion({ past, formatDate }: Props) {
  const [open, setOpen] = useState(false);

  if (past.length === 0) return null;

  return (
    <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden" dir="rtl">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 text-right hover:bg-[var(--color-bg)] transition-colors"
      >
        <span className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-text)]">
          <History className="w-4 h-4 text-[var(--color-text-muted)]" />
          تاریخچه ({past.length.toLocaleString('fa-IR')})
        </span>
        <ChevronDown
          className={`w-5 h-5 text-[var(--color-text-muted)] transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="border-t border-[var(--color-border)] overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead className="bg-[var(--color-bg)]">
              <tr>
                <th className="p-3 font-medium text-[var(--color-text-muted)]">لیست</th>
                <th className="p-3 font-medium text-[var(--color-text-muted)]">بازه</th>
                <th className="p-3 font-medium text-[var(--color-text-muted)]">مشاهده</th>
                <th className="p-3 font-medium text-[var(--color-text-muted)]">ذخیره</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border-muted)]">
              {past.map((s) => (
                <tr key={s.id}>
                  <td className="p-3 text-[var(--color-text)]">{s.list.title}</td>
                  <td className="p-3 text-[var(--color-text-muted)]">
                    {formatDate(s.startAt)} – {s.endAt ? formatDate(s.endAt) : '—'}
                  </td>
                  <td className="p-3 tabular-nums">{s.viewListCount.toLocaleString('fa-IR')}</td>
                  <td className="p-3 tabular-nums">{s.quickSaveCount.toLocaleString('fa-IR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
