'use client';

import { EyeOff, Info, Shield, ToggleLeft, ToggleRight } from 'lucide-react';
import CommentSeedTargetPicker from './CommentSeedTargetPicker';

export type SeedRuleRow = {
  id: string;
  scopeType: 'category' | 'list' | 'item';
  scopeId: string;
  enabled: boolean;
};

const SCOPE_LABELS: Record<string, string> = {
  item: 'آیتم',
  list: 'لیست',
  category: 'دسته',
};

interface CommentSeedRulesPanelProps {
  rules: SeedRuleRow[];
  scopeType: 'category' | 'list' | 'item';
  scopeId: string;
  enabled: boolean;
  loading?: boolean;
  onScopeTypeChange: (v: 'category' | 'list' | 'item') => void;
  onScopeIdChange: (v: string) => void;
  onEnabledChange: (v: boolean) => void;
  onSave: () => void;
  onToggle: (rule: SeedRuleRow) => void;
}

export default function CommentSeedRulesPanel({
  rules,
  scopeType,
  scopeId,
  enabled,
  loading,
  onScopeTypeChange,
  onScopeIdChange,
  onEnabledChange,
  onSave,
  onToggle,
}: CommentSeedRulesPanelProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/70 px-4 py-3 text-sm text-blue-900">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <p className="leading-relaxed">
            غیرفعال کردن scope باعث مخفی شدن کامنت‌های seed در API عمومی می‌شود، بدون حذف از
            دیتابیس.
          </p>
        </div>
        <div className="flex items-start gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text-muted)]">
          <Shield className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-text)]" />
          <p className="leading-relaxed">
            {rules.length === 0
              ? 'بدون قانون، همه کامنت‌های seed نمایش داده می‌شوند.'
              : `${rules.length.toLocaleString('fa-IR')} قانون فعال — ${rules.filter((r) => !r.enabled).length.toLocaleString('fa-IR')} scope مخفی`}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <h3 className="text-sm font-semibold text-[var(--color-text)]">افزودن قانون جدید</h3>
        <p className="mt-1 text-xs text-[var(--color-text-muted)]">
          کنترل نمایش کامنت‌های seed در صفحات عمومی
        </p>

        <div className="mt-4 space-y-4">
          <div>
            <span className="text-xs font-medium text-[var(--color-text-muted)]">نوع scope</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {(['item', 'list', 'category'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    onScopeTypeChange(t);
                    onScopeIdChange('');
                  }}
                  className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                    scopeType === t
                      ? 'bg-primary text-white shadow-sm'
                      : 'border border-[var(--color-border)] hover:bg-[var(--color-bg)]'
                  }`}
                >
                  {SCOPE_LABELS[t]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="text-sm font-medium">محدوده</span>
            <div className="mt-2">
              <CommentSeedTargetPicker
                targetType={scopeType}
                selectedIds={scopeId ? [scopeId] : []}
                onChange={(ids) => onScopeIdChange(ids[0] ?? '')}
                multiple={false}
                disabled={loading}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-border)] pt-4">
            <label className="inline-flex cursor-pointer items-center gap-3 rounded-xl border border-[var(--color-border)] px-4 py-2.5 text-sm">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => onEnabledChange(e.target.checked)}
                className="h-4 w-4 rounded accent-primary"
              />
              <span>
                <span className="font-medium text-[var(--color-text)]">نمایش فعال</span>
                <span className="mr-2 text-xs text-[var(--color-text-muted)]">
                  {enabled ? 'کامنت‌ها در API عمومی دیده می‌شوند' : 'کامنت‌ها مخفی می‌شوند'}
                </span>
              </span>
            </label>
            <button
              type="button"
              disabled={loading || !scopeId.trim()}
              onClick={onSave}
              className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:opacity-50"
            >
              ذخیره قانون
            </button>
          </div>
        </div>
      </div>

      {rules.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-[var(--color-border)] px-6 py-12 text-center">
          <EyeOff className="mb-3 h-8 w-8 text-[var(--color-text-muted)]" />
          <p className="text-sm font-medium text-[var(--color-text)]">قانونی تعریف نشده</p>
          <p className="mt-1 max-w-md text-xs text-[var(--color-text-muted)]">
            همه کامنت‌های seed به‌صورت پیش‌فرض در API عمومی نمایش داده می‌شوند
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[var(--color-border)]">
          <table className="w-full text-sm" dir="rtl">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg)] text-xs text-[var(--color-text-muted)]">
                <th className="px-4 py-3 text-right font-medium">نوع</th>
                <th className="px-4 py-3 text-right font-medium">شناسه</th>
                <th className="px-4 py-3 text-center font-medium">نمایش عمومی</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {rules.map((r) => (
                <tr key={r.id} className="bg-[var(--color-surface)] hover:bg-[var(--color-bg)]/40">
                  <td className="px-4 py-3">
                    <span className="rounded-md bg-[var(--color-bg)] px-2 py-0.5 text-xs font-medium">
                      {SCOPE_LABELS[r.scopeType]}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-[var(--color-text)]">{r.scopeId}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => onToggle(r)}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                        r.enabled
                          ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {r.enabled ? (
                        <ToggleRight className="h-3.5 w-3.5" />
                      ) : (
                        <ToggleLeft className="h-3.5 w-3.5" />
                      )}
                      {r.enabled ? 'فعال' : 'مخفی'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
