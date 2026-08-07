'use client';

import { useMemo, useState } from 'react';
import {
  ArrowDownUp,
  Ban,
  Check,
  RefreshCw,
  Sparkles,
  Trash2,
  User,
} from 'lucide-react';
import { formatPersianDateTime, isoToPersianDateObject, isoToTimeString } from '@/lib/utils/persian-datetime';
import PersianDateTimeField from '@/components/admin/shared/PersianDateTimeField';
import type { ToneMix } from '@/lib/comment-seed/types';
import { DateObject } from 'react-multi-date-picker';

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

type SortKey = 'date' | 'tone' | 'item' | 'status';

interface CommentSeedDraftTableProps {
  drafts: SeedDraftRow[];
  personas: PersonaOption[];
  loading?: boolean;
  selectedIds: Set<string>;
  onSelectionChange: (ids: Set<string>) => void;
  searchQuery: string;
  onUpdate: (id: string, patch: DraftUpdatePatch) => Promise<void>;
  onDeleteRequest: (id: string) => void;
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string) => Promise<void>;
  onRegenerateRequest: (draft: SeedDraftRow) => void;
}

export default function CommentSeedDraftTable({
  drafts,
  personas,
  loading,
  selectedIds,
  onSelectionChange,
  searchQuery,
  onUpdate,
  onDeleteRequest,
  onApprove,
  onReject,
  onRegenerateRequest,
}: CommentSeedDraftTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortAsc, setSortAsc] = useState(false);

  const sortedDrafts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let rows = drafts;
    if (q) {
      rows = rows.filter(
        (d) =>
          d.content.toLowerCase().includes(q) ||
          d.items.title.toLowerCase().includes(q) ||
          d.persona.displayName.toLowerCase().includes(q)
      );
    }
    const sorted = [...rows].sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'date') {
        cmp = new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
      } else if (sortKey === 'tone') {
        cmp = a.tone.localeCompare(b.tone);
      } else if (sortKey === 'item') {
        cmp = a.items.title.localeCompare(b.items.title, 'fa');
      } else {
        cmp = a.status.localeCompare(b.status);
      }
      return sortAsc ? cmp : -cmp;
    });
    return sorted;
  }, [drafts, searchQuery, sortKey, sortAsc]);

  const editableIds = sortedDrafts.filter((d) => d.status !== 'published').map((d) => d.id);
  const allSelected =
    editableIds.length > 0 && editableIds.every((id) => selectedIds.has(id));

  function toggleAll(checked: boolean) {
    if (checked) {
      onSelectionChange(new Set(editableIds));
    } else {
      onSelectionChange(new Set());
    }
  }

  function toggleOne(id: string) {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSelectionChange(next);
  }

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc((v) => !v);
    else {
      setSortKey(key);
      setSortAsc(false);
    }
  }

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
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--color-text-muted)]">
        <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 font-medium text-violet-700">
          <Sparkles className="h-3 w-3" />
          پیش‌نویس AI
        </span>
        <span>·</span>
        <span>{sortedDrafts.length.toLocaleString('fa-IR')} مورد</span>
        <span className="mr-auto flex gap-1">
          {(['date', 'item', 'tone', 'status'] as SortKey[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => toggleSort(key)}
              className={`inline-flex items-center gap-0.5 rounded-lg px-2 py-1 transition ${
                sortKey === key
                  ? 'bg-primary/10 text-primary'
                  : 'hover:bg-[var(--color-bg)]'
              }`}
            >
              <ArrowDownUp className="h-3 w-3" />
              {key === 'date'
                ? 'تاریخ'
                : key === 'item'
                  ? 'آیتم'
                  : key === 'tone'
                    ? 'لحن'
                    : 'وضعیت'}
            </button>
          ))}
        </span>
      </div>

      <div className="overflow-hidden rounded-xl border border-[var(--color-border)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm" dir="rtl">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg)] text-xs text-[var(--color-text-muted)]">
                <th className="w-10 px-2 py-2.5">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={(e) => toggleAll(e.target.checked)}
                    disabled={editableIds.length === 0}
                    aria-label="انتخاب همه"
                  />
                </th>
                <th className="px-3 py-2.5 text-right font-medium">آیتم</th>
                <th className="px-3 py-2.5 text-right font-medium">متن کامنت</th>
                <th className="px-3 py-2.5 text-right font-medium">پرسونا</th>
                <th className="px-3 py-2.5 text-right font-medium">لحن</th>
                <th className="px-3 py-2.5 text-right font-medium">تاریخ شمسی</th>
                <th className="px-3 py-2.5 text-right font-medium">وضعیت</th>
                <th className="px-3 py-2.5 text-center font-medium">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {sortedDrafts.map((d) => {
                const isPublished = d.status === 'published';
                const editable = !isPublished;
                return (
                  <tr
                    key={d.id}
                    className={`bg-[var(--color-surface)] hover:bg-[var(--color-bg)]/50 ${
                      selectedIds.has(d.id) ? 'ring-1 ring-inset ring-primary/20' : ''
                    }`}
                  >
                    <td className="px-2 py-3 align-top">
                      {editable && (
                        <input
                          type="checkbox"
                          checked={selectedIds.has(d.id)}
                          onChange={() => toggleOne(d.id)}
                          aria-label="انتخاب"
                        />
                      )}
                    </td>
                    <td className="max-w-[120px] px-3 py-3 align-top">
                      <span className="line-clamp-2 text-xs font-medium text-[var(--color-text)]">
                        {d.items.title}
                      </span>
                    </td>
                    <td className="min-w-[220px] px-3 py-3 align-top">
                      <textarea
                        key={`${d.id}-${d.content.slice(0, 20)}`}
                        defaultValue={d.content}
                        rows={2}
                        disabled={loading || isPublished}
                        className="w-full resize-y rounded-lg border border-[var(--color-border)] bg-white px-2.5 py-1.5 text-sm leading-relaxed disabled:opacity-60"
                        onBlur={(e) => {
                          if (e.target.value !== d.content) {
                            void onUpdate(d.id, { content: e.target.value });
                          }
                        }}
                      />
                      <span className="mt-1 block text-[10px] text-[var(--color-text-muted)]">
                        {d.content.length.toLocaleString('fa-IR')} کاراکتر
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
                          disabled={loading || isPublished}
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
                      <select
                        defaultValue={d.tone}
                        disabled={loading || isPublished}
                        className="rounded-lg border border-[var(--color-border)] px-2 py-1 text-xs disabled:opacity-60"
                        onChange={(e) => void onUpdate(d.id, { tone: e.target.value })}
                      >
                        {(Object.keys(TONE_LABELS) as Array<keyof ToneMix>).map((t) => (
                          <option key={t} value={t}>
                            {TONE_LABELS[t]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="min-w-[140px] px-3 py-3 align-top">
                      {editable ? (
                        <DraftDateEditor
                          scheduledAt={d.scheduledAt}
                          disabled={loading}
                          onSave={(iso) => void onUpdate(d.id, { scheduledAt: iso })}
                        />
                      ) : (
                        <span className="text-xs text-[var(--color-text-muted)]">
                          {formatPersianDateTime(d.scheduledAt)}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3 align-top">
                      <div className="flex flex-col gap-1">
                        <span
                          className={`inline-flex w-fit rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            STATUS_STYLES[d.status] ?? STATUS_STYLES.draft
                          }`}
                        >
                          {STATUS_LABELS[d.status] ?? d.status}
                        </span>
                        <span className="inline-flex w-fit items-center gap-0.5 rounded-full bg-violet-50 px-1.5 py-0.5 text-[9px] font-medium text-violet-600">
                          <Sparkles className="h-2.5 w-2.5" />
                          ساختگی
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3 align-top">
                      <div className="flex items-center justify-center gap-0.5">
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
                        {editable && (
                          <>
                            <button
                              type="button"
                              disabled={loading}
                              title="بازتولید"
                              onClick={() => onRegenerateRequest(d)}
                              className="rounded-lg p-1.5 text-primary transition hover:bg-primary/10 disabled:opacity-50"
                            >
                              <RefreshCw className="h-4 w-4" />
                            </button>
                            {(d.status === 'draft' || d.status === 'approved') && (
                              <button
                                type="button"
                                disabled={loading}
                                title="رد / غیرفعال"
                                onClick={() => void onReject(d.id)}
                                className="rounded-lg p-1.5 text-amber-600 transition hover:bg-amber-50 disabled:opacity-50"
                              >
                                <Ban className="h-4 w-4" />
                              </button>
                            )}
                            <button
                              type="button"
                              disabled={loading}
                              title="حذف"
                              onClick={() => onDeleteRequest(d.id)}
                              className="rounded-lg p-1.5 text-rose-600 transition hover:bg-rose-50 disabled:opacity-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {searchQuery && sortedDrafts.length === 0 && (
        <p className="text-center text-sm text-[var(--color-text-muted)]">نتیجه‌ای یافت نشد</p>
      )}
    </div>
  );
}

function DraftDateEditor({
  scheduledAt,
  disabled,
  onSave,
}: {
  scheduledAt: string;
  disabled?: boolean;
  onSave: (iso: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [date, setDate] = useState<DateObject | null>(null);
  const [time, setTime] = useState(isoToTimeString(scheduledAt));

  function openEditor() {
    setDate(isoToPersianDateObject(scheduledAt));
    setTime(isoToTimeString(scheduledAt));
    setEditing(true);
  }

  function save() {
    if (!date) return;
    const d = date.toDate();
    const [h, m] = time.split(':').map((x) => parseInt(x, 10));
    d.setHours(Number.isFinite(h) ? h : 0, Number.isFinite(m) ? m : 0, 0, 0);
    onSave(d.toISOString());
    setEditing(false);
  }

  if (!editing) {
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={openEditor}
        className="text-right text-xs text-[var(--color-text-muted)] hover:text-primary disabled:opacity-60"
      >
        {formatPersianDateTime(scheduledAt)}
      </button>
    );
  }

  return (
    <div className="space-y-1">
      <PersianDateTimeField
        label=""
        date={date}
        time={time}
        onDateChange={setDate}
        onTimeChange={setTime}
      />
      <div className="flex gap-1">
        <button type="button" onClick={save} className="text-[10px] text-primary hover:underline">
          ذخیره
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="text-[10px] text-[var(--color-text-muted)] hover:underline"
        >
          انصراف
        </button>
      </div>
    </div>
  );
}
