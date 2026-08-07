'use client';

import { Plus, Rocket, Sparkles } from 'lucide-react';

export type CampaignListItem = {
  id: string;
  title: string;
  status: string;
  targetType: 'item' | 'list' | 'category';
  _count?: { drafts: number; comments: number };
};

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  draft: { label: 'پیش‌نویس', className: 'bg-slate-100 text-slate-600' },
  generating: { label: 'در حال تولید', className: 'bg-blue-100 text-blue-700' },
  ready: { label: 'آماده', className: 'bg-indigo-100 text-indigo-700' },
  publishing: { label: 'در حال انتشار', className: 'bg-amber-100 text-amber-700' },
  published: { label: 'منتشر شده', className: 'bg-emerald-100 text-emerald-700' },
  paused: { label: 'متوقف', className: 'bg-orange-100 text-orange-700' },
  archived: { label: 'بایگانی', className: 'bg-gray-100 text-[var(--color-text-muted)]' },
};

const TARGET_LABELS: Record<string, string> = {
  item: 'آیتم',
  list: 'لیست',
  category: 'دسته',
};

interface CommentSeedCampaignSidebarProps {
  campaigns: CampaignListItem[];
  selectedId: string | null;
  isNew: boolean;
  onSelect: (id: string) => void;
  onNew: () => void;
}

export default function CommentSeedCampaignSidebar({
  campaigns,
  selectedId,
  isNew,
  onSelect,
  onNew,
}: CommentSeedCampaignSidebarProps) {
  return (
    <aside className="flex flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] lg:sticky lg:top-4 lg:max-h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold text-[var(--color-text)]">کمپین‌ها</h2>
          <p className="text-[11px] text-[var(--color-text-muted)]">
            {campaigns.length.toLocaleString('fa-IR')} مورد
          </p>
        </div>
        <button
          type="button"
          onClick={onNew}
          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
            isNew
              ? 'bg-primary text-white shadow-sm'
              : 'border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-bg)]'
          }`}
        >
          <Plus className="h-3.5 w-3.5" />
          جدید
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {campaigns.length === 0 ? (
          <div className="flex flex-col items-center px-3 py-8 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5">
              <Sparkles className="h-7 w-7 text-primary" />
            </div>
            <p className="text-sm font-semibold text-[var(--color-text)]">اولین کمپین را بسازید</p>
            <p className="mt-2 text-xs leading-relaxed text-[var(--color-text-muted)]">
              هدف را انتخاب کنید، تنظیمات را مشخص کنید، و کامنت‌ها را با AI تولید و منتشر کنید
            </p>
            <button
              type="button"
              onClick={onNew}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:opacity-90"
            >
              <Rocket className="h-3.5 w-3.5" />
              شروع کمپین جدید
            </button>
          </div>
        ) : (
          <div className="space-y-1">
            {campaigns.map((c) => {
              const status = STATUS_LABELS[c.status] ?? STATUS_LABELS.draft;
              const active = selectedId === c.id && !isNew;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onSelect(c.id)}
                  className={`w-full rounded-xl px-3 py-2.5 text-right transition ${
                    active
                      ? 'bg-primary/10 ring-1 ring-primary/25'
                      : 'hover:bg-[var(--color-bg)]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="truncate text-sm font-medium text-[var(--color-text)]">
                      {c.title}
                    </span>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${status.className}`}
                    >
                      {status.label}
                    </span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-2 text-[11px] text-[var(--color-text-muted)]">
                    <span className="rounded-md bg-[var(--color-bg)] px-1.5 py-0.5">
                      {TARGET_LABELS[c.targetType]}
                    </span>
                    <span>{(c._count?.drafts ?? 0).toLocaleString('fa-IR')} پیش‌نویس</span>
                    {(c._count?.comments ?? 0) > 0 && (
                      <span className="text-emerald-600">
                        {c._count!.comments!.toLocaleString('fa-IR')} منتشر
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}
