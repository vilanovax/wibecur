'use client';

import { Check, Trash2, User } from 'lucide-react';
import type { ToneMix } from '@/lib/comment-seed/types';

export type SeedDraftRow = {
  id: string;
  content: string;
  tone: string;
  status: string;
  scheduledAt: string;
  wordCount: number;
  persona: { id: string; displayName: string; username: string; avatarUrl?: string };
  items: { id: string; title: string };
};

type PersonaOption = { id: string; displayName: string; username: string };

const TONE_LABELS: Record<string, string> = {
  positive: 'مثبت',
  negative: 'منفی',
  neutral: 'خنثی',
  question: 'سوالی',
};

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-600',
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-rose-100 text-rose-700',
  published: 'bg-indigo-100 text-indigo-700',
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'پیش‌نویس',
  approved: 'تایید شده',
  rejected: 'رد شده',
  published: 'منتشر شده',
};

type DraftUpdatePatch = {
  content?: string;
  personaId?: string;
  scheduledAt?: string;
  status?: string;
  tone?: string;
};

interface CommentSeedDraftTableProps {
  drafts: SeedDraftRow[];
  personas: PersonaOption[];
  loading?: boolean;
  onUpdate: (id: string, patch: DraftUpdatePatch) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onApprove: (id: string) => Promise<void>;
}

export default function CommentSeedDraftTable({
  drafts,
  personas,
  loading,
  onUpdate,
  onDelete,
  onApprove,
}: CommentSeedDraftTableProps) {
  if (drafts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--color-border)] px-6 py-14 text-center">
        <p className="text-sm font-medium text-[var(--color-text)]">پیش‌نویسی وجود ندارد</p>
        <p className="mt-1 max-w-sm text-xs text-[var(--color-text-muted)]">
          در مرحله قبل دکمه «تولید پیش‌نویس‌ها» را بزنید تا AI کامنت‌ها را بسازد
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--color-border)]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm" dir="rtl">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg)] text-xs text-[var(--color-text-muted)]">
              <th className="px-3 py-2.5 text-right font-medium">آیتم</th>
              <th className="px-3 py-2.5 text-right font-medium">متن کامنت</th>
              <th className="px-3 py-2.5 text-right font-medium">پرسونا</th>
              <th className="px-3 py-2.5 text-right font-medium">لحن</th>
              <th className="px-3 py-2.5 text-right font-medium">تاریخ</th>
              <th className="px-3 py-2.5 text-right font-medium">وضعیت</th>
              <th className="px-3 py-2.5 text-center font-medium">عملیات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {drafts.map((d) => (
              <tr key={d.id} className="bg-[var(--color-surface)] hover:bg-[var(--color-bg)]/50">
                <td className="max-w-[140px] px-3 py-3 align-top">
                  <span className="line-clamp-2 text-xs font-medium text-[var(--color-text)]">
                    {d.items.title}
                  </span>
                </td>
                <td className="min-w-[240px] px-3 py-3 align-top">
                  <textarea
                    defaultValue={d.content}
                    rows={2}
                    disabled={loading || d.status === 'published'}
                    className="w-full resize-y rounded-lg border border-[var(--color-border)] bg-white px-2.5 py-1.5 text-sm leading-relaxed disabled:opacity-60"
                    onBlur={(e) => {
                      if (e.target.value !== d.content) {
                        void onUpdate(d.id, { content: e.target.value });
                      }
                    }}
                  />
                  <span className="mt-1 block text-[10px] text-[var(--color-text-muted)]">
                    {d.wordCount.toLocaleString('fa-IR')} کاراکتر
                  </span>
                </td>
                <td className="px-3 py-3 align-top">
                  <div className="flex items-center gap-2">
                    {d.persona.avatarUrl ? (
                      <img
                        src={d.persona.avatarUrl}
                        alt=""
                        className="h-7 w-7 rounded-full object-cover"
                      />
                    ) : (
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-bg)]">
                        <User className="h-3.5 w-3.5 text-[var(--color-text-muted)]" />
                      </span>
                    )}
                    <select
                      defaultValue={d.persona.id}
                      disabled={loading || d.status === 'published'}
                      className="max-w-[120px] rounded-lg border border-[var(--color-border)] px-2 py-1 text-xs disabled:opacity-60"
                      onChange={(e) => void onUpdate(d.id, { personaId: e.target.value })}
                    >
                      {personas.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.displayName}
                        </option>
                      ))}
                    </select>
                  </div>
                </td>
                <td className="px-3 py-3 align-top">
                  <span className="text-xs text-[var(--color-text-muted)]">
                    {TONE_LABELS[d.tone as keyof ToneMix] ?? d.tone}
                  </span>
                </td>
                <td className="whitespace-nowrap px-3 py-3 align-top text-xs text-[var(--color-text-muted)]">
                  {new Date(d.scheduledAt).toLocaleDateString('fa-IR')}
                </td>
                <td className="px-3 py-3 align-top">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      STATUS_STYLES[d.status] ?? STATUS_STYLES.draft
                    }`}
                  >
                    {STATUS_LABELS[d.status] ?? d.status}
                  </span>
                </td>
                <td className="px-3 py-3 align-top">
                  <div className="flex items-center justify-center gap-1">
                    {d.status === 'draft' && (
                      <button
                        type="button"
                        disabled={loading}
                        title="تایید"
                        onClick={() => void onApprove(d.id)}
                        className="rounded-lg p-1.5 text-emerald-600 transition hover:bg-emerald-50 disabled:opacity-50"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                    )}
                    {d.status !== 'published' && (
                      <button
                        type="button"
                        disabled={loading}
                        title="حذف"
                        onClick={() => void onDelete(d.id)}
                        className="rounded-lg p-1.5 text-rose-600 transition hover:bg-rose-50 disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
