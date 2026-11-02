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
    <section className="rounded-2xl border border-(--color-border) bg-(--color-surface) overflow-hidden" dir="rtl">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex min-h-11 w-full items-center justify-between gap-3 px-4 py-3 text-start hover:bg-(--color-bg)"
      >
        <span className="inline-flex items-center gap-2 text-sm font-medium text-(--color-text)">
          <History className="w-4 h-4 text-wibe-secondary" />
          تاریخچه ({past.length.toLocaleString('fa-IR')})
        </span>
        <ChevronDown
          className={`w-5 h-5 text-wibe-secondary transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="border-t border-(--color-border) overflow-x-auto">
          <table className="w-full text-sm text-start">
            <thead className="bg-(--color-bg)">
              <tr>
                <th className="p-3 font-medium text-wibe-secondary">لیست</th>
                <th className="p-3 font-medium text-wibe-secondary">بازه</th>
                <th className="p-3 font-medium text-wibe-secondary">مشاهده</th>
                <th className="p-3 font-medium text-wibe-secondary">ذخیره</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-(--color-border-muted)">
              {past.map((s) => (
                <tr key={s.id}>
                  <td className="p-3 text-(--color-text)">{s.list.title}</td>
                  <td className="p-3 text-wibe-secondary">
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
