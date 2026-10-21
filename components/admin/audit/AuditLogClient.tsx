'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import DatePicker, { DateObject } from 'react-multi-date-picker';
import persian from 'react-date-object/calendars/persian';
import persian_fa from 'react-date-object/locales/persian_fa';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  Filter,
  Search,
  X,
} from 'lucide-react';
import { formatRelativeTime } from '@/lib/format-relative-time';
import { AdminCard, Badge, type BadgeVariant } from '@/components/admin/design-system';
import { AUDIT_ACTIONS, ENTITY_TYPES } from '@/lib/audit/actions';
import {
  getAuditActionLabel,
  getAuditDiffRows,
  getEntityTypeLabel,
  parseUserAgentShort,
} from '@/lib/audit/display';
import { getRoleLabel } from '@/lib/auth/roles';
import { faNumber } from '@/lib/utils';
import { formatPersianDateTime } from '@/lib/utils/persian-datetime';
import type { AuditDetailRow, AuditListRow } from '@/lib/admin/audit-query';

const ACTION_BADGE: Record<string, BadgeVariant> = {
  LIST_DELETE: 'danger',
  LIST_SOFT_DELETE: 'warning',
  CATEGORY_DELETE: 'danger',
  CATEGORY_SOFT_DELETE: 'warning',
  USER_SUSPEND: 'warning',
  USER_SOFT_DELETE: 'warning',
  USER_ROLE_CHANGE: 'warning',
  LIST_UPDATE: 'success',
  LIST_RESTORE: 'success',
  LIST_BOOST: 'success',
  CATEGORY_UPDATE: 'success',
  CATEGORY_RESTORE: 'success',
  REPORT_RESOLVE: 'success',
  COMMENT_DELETE: 'warning',
  COMMENT_PENALTY: 'warning',
  COMMENT_REPORTS_DISCARDED: 'success',
  COMMENT_RESTRICT: 'warning',
  COMMENT_UNRESTRICT: 'success',
  COMMENT_BAN: 'danger',
};

type DatePreset = '' | 'today' | '7d' | '30d';

const EMPTY_FILTERS = {
  actorQuery: '',
  action: '',
  entityType: '',
  dateFrom: '',
  dateTo: '',
};

function toYmd(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function presetToRange(preset: DatePreset): { dateFrom: string; dateTo: string } {
  const today = new Date();
  const end = toYmd(today);
  if (preset === 'today') return { dateFrom: end, dateTo: end };
  if (preset === '7d') {
    const start = new Date(today);
    start.setDate(start.getDate() - 6);
    return { dateFrom: toYmd(start), dateTo: end };
  }
  if (preset === '30d') {
    const start = new Date(today);
    start.setDate(start.getDate() - 29);
    return { dateFrom: toYmd(start), dateTo: end };
  }
  return { dateFrom: '', dateTo: '' };
}

function ymdToPersian(ymd: string): DateObject | null {
  if (!ymd) return null;
  const d = new Date(`${ymd}T12:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  return new DateObject({ date: d, calendar: persian, locale: persian_fa });
}

function persianToYmd(value: DateObject | null): string {
  if (!value) return '';
  return toYmd(value.toDate());
}

function PersianDayField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (ymd: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-[var(--color-text-muted)]">{label}</span>
      <DatePicker
        value={ymdToPersian(value)}
        onChange={(d) => onChange(persianToYmd((d as DateObject) ?? null))}
        calendar={persian}
        locale={persian_fa}
        calendarPosition="bottom-right"
        inputClass="w-full min-h-11 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-start"
        placeholder="تاریخ شمسی"
        format="YYYY/MM/DD"
      />
    </label>
  );
}

type InitialData = {
  rows: AuditListRow[];
  total: number;
  page: number;
  pageSize: number;
};

export default function AuditLogClient({
  initialData,
  initialActorQuery = '',
}: {
  initialData: InitialData;
  initialActorQuery?: string;
}) {
  const [items, setItems] = useState<AuditListRow[]>(initialData.rows);
  const [total, setTotal] = useState(initialData.total);
  const [page, setPage] = useState(initialData.page);
  const [pageSize, setPageSize] = useState(initialData.pageSize);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [draft, setDraft] = useState(() => ({
    ...EMPTY_FILTERS,
    actorQuery: initialActorQuery,
  }));
  const [applied, setApplied] = useState(() => ({
    ...EMPTY_FILTERS,
    actorQuery: initialActorQuery,
  }));
  const [datePreset, setDatePreset] = useState<DatePreset>('');
  const skipFirstFetch = useRef(true);

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (applied.actorQuery) n += 1;
    if (applied.action) n += 1;
    if (applied.entityType) n += 1;
    if (datePreset || applied.dateFrom || applied.dateTo) n += 1;
    return n;
  }, [applied, datePreset]);

  const fetchLogs = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      const params = new URLSearchParams();
      if (applied.actorQuery) params.set('actorQuery', applied.actorQuery);
      if (applied.action) params.set('action', applied.action);
      if (applied.entityType) params.set('entityType', applied.entityType);
      if (applied.dateFrom) params.set('dateFrom', applied.dateFrom);
      if (applied.dateTo) params.set('dateTo', applied.dateTo);
      params.set('page', String(page));
      params.set('pageSize', String(pageSize));
      try {
        const res = await fetch(`/api/admin/audit?${params}`, { signal });
        const json = await res.json();
        if (res.ok) {
          setItems(json.rows ?? []);
          setTotal(json.total ?? 0);
        }
      } catch (e) {
        if ((e as Error)?.name === 'AbortError') return;
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [applied, page, pageSize]
  );

  useEffect(() => {
    if (skipFirstFetch.current) {
      skipFirstFetch.current = false;
      return;
    }
    const ctrl = new AbortController();
    void fetchLogs(ctrl.signal);
    return () => ctrl.abort();
  }, [fetchLogs]);

  const applyFilters = (next = draft, preset: DatePreset = datePreset) => {
    setApplied(next);
    setDatePreset(preset);
    setPage(1);
  };

  const clearFilters = () => {
    setDraft(EMPTY_FILTERS);
    setApplied(EMPTY_FILTERS);
    setDatePreset('');
    setPage(1);
  };

  const setPreset = (preset: DatePreset) => {
    const range = presetToRange(preset);
    const next = { ...draft, ...range };
    setDraft(next);
    setDatePreset(preset);
    applyFilters(next, preset);
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <>
      <AdminCard padding="default" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setFiltersOpen((v) => !v)}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--color-border)] px-3 text-sm text-[var(--color-text)] hover:bg-[var(--color-bg)]"
            >
              <Filter className="h-4 w-4" strokeWidth={1.5} />
              فیلترها
              {activeFilterCount > 0 && (
                <span className="rounded-full bg-[var(--primary)]/10 px-2 py-0.5 text-xs font-medium text-[var(--primary)]">
                  {faNumber(activeFilterCount)}
                </span>
              )}
              <ChevronDown
                className={`h-4 w-4 transition-transform ${filtersOpen ? 'rotate-180' : ''}`}
                strokeWidth={1.5}
              />
            </button>
            <span className="text-sm text-[var(--color-text-muted)] tabular-nums">
              {faNumber(total)} رویداد
            </span>
          </div>
          <label className="inline-flex min-h-11 items-center gap-2 text-sm text-[var(--color-text-muted)]">
            در صفحه
            <select
              className="min-h-11 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text)]"
              value={pageSize}
              aria-label="تعداد در صفحه"
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
            >
              <option value={20}>۲۰</option>
              <option value={50}>۵۰</option>
            </select>
          </label>
        </div>

        {filtersOpen && (
          <div className="space-y-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-[var(--color-text-muted)]">
                  جستجوی عامل
                </span>
                <div className="relative">
                  <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-subtle)]" strokeWidth={1.5} />
                  <input
                    type="search"
                    placeholder="نام، ایمیل یا شناسه"
                    className="w-full min-h-11 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] pe-3 ps-9 text-sm text-[var(--color-text)]"
                    value={draft.actorQuery}
                    onChange={(e) => setDraft((f) => ({ ...f, actorQuery: e.target.value }))}
                    onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-medium text-[var(--color-text-muted)]">
                  نوع عملیات
                </span>
                <select
                  className="w-full min-h-11 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm"
                  value={draft.action}
                  onChange={(e) => setDraft((f) => ({ ...f, action: e.target.value }))}
                >
                  <option value="">همه</option>
                  {AUDIT_ACTIONS.map((a) => (
                    <option key={a} value={a}>
                      {getAuditActionLabel(a)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-medium text-[var(--color-text-muted)]">
                  موجودیت
                </span>
                <select
                  className="w-full min-h-11 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm"
                  value={draft.entityType}
                  onChange={(e) => setDraft((f) => ({ ...f, entityType: e.target.value }))}
                >
                  <option value="">همه</option>
                  {ENTITY_TYPES.map((e) => (
                    <option key={e} value={e}>
                      {getEntityTypeLabel(e)}
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid grid-cols-2 gap-2">
                <PersianDayField
                  label="از تاریخ"
                  value={draft.dateFrom}
                  onChange={(dateFrom) => {
                    setDatePreset('');
                    setDraft((f) => ({ ...f, dateFrom }));
                  }}
                />
                <PersianDayField
                  label="تا تاریخ"
                  value={draft.dateTo}
                  onChange={(dateTo) => {
                    setDatePreset('');
                    setDraft((f) => ({ ...f, dateTo }));
                  }}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {(
                [
                  ['', 'همه زمان‌ها'],
                  ['today', 'امروز'],
                  ['7d', '۷ روز اخیر'],
                  ['30d', '۳۰ روز اخیر'],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value || 'all'}
                  type="button"
                  onClick={() => setPreset(value)}
                  className={`min-h-9 rounded-xl px-3 text-xs font-medium ${
                    datePreset === value
                      ? 'bg-[var(--primary)] text-white'
                      : 'border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => applyFilters()}
                className="min-h-11 rounded-xl bg-[var(--primary)] px-4 text-sm font-medium text-white hover:opacity-90"
              >
                اعمال فیلتر
              </button>
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="min-h-11 rounded-xl border border-[var(--color-border)] px-4 text-sm text-[var(--color-text-muted)] hover:bg-[var(--color-surface)]"
                >
                  پاک کردن
                </button>
              )}
            </div>
          </div>
        )}
      </AdminCard>

      <AdminCard padding="default" className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 border-b border-[var(--color-border)] bg-[var(--color-bg)]">
              <tr>
                <th className="px-4 py-2.5 text-start text-xs font-semibold text-[var(--color-text-muted)]">زمان</th>
                <th className="px-4 py-2.5 text-start text-xs font-semibold text-[var(--color-text-muted)]">عملیات</th>
                <th className="px-4 py-2.5 text-start text-xs font-semibold text-[var(--color-text-muted)]">موجودیت</th>
                <th className="px-4 py-2.5 text-start text-xs font-semibold text-[var(--color-text-muted)]">عامل</th>
                <th className="px-4 py-2.5 text-start text-xs font-semibold text-[var(--color-text-muted)]">تغییرات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }, (_, i) => (
                  <tr key={i} className="border-b border-[var(--color-border)]">
                    <td colSpan={5} className="px-4 py-3">
                      <div className="h-8 animate-pulse rounded-lg bg-[var(--color-border-muted)]" />
                    </td>
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-[var(--color-text-muted)]">
                    رویدادی با این فیلترها یافت نشد.
                  </td>
                </tr>
              ) : (
                items.map((row) => (
                  <AuditTableRow
                    key={row.id}
                    row={row}
                    onSelect={() => setSelectedId(row.id)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {total > 0 && (
          <div className="flex items-center justify-between gap-3 border-t border-[var(--color-border)] px-4 py-3">
            <span className="text-xs text-[var(--color-text-muted)] tabular-nums">
              صفحه {faNumber(page)} از {faNumber(totalPages)}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => p - 1)}
                className="inline-flex min-h-11 items-center gap-1 rounded-xl border border-[var(--color-border)] px-3 text-sm disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" strokeWidth={1.5} />
                قبلی
              </button>
              <button
                type="button"
                disabled={page >= totalPages || loading}
                onClick={() => setPage((p) => p + 1)}
                className="inline-flex min-h-11 items-center gap-1 rounded-xl border border-[var(--color-border)] px-3 text-sm disabled:opacity-40"
              >
                بعدی
                <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
              </button>
            </div>
          </div>
        )}
      </AdminCard>

      {selectedId && (
        <AuditDetailModal id={selectedId} onClose={() => setSelectedId(null)} />
      )}
    </>
  );
}

function AuditTableRow({
  row,
  onSelect,
}: {
  row: AuditListRow;
  onSelect: () => void;
}) {
  const actorName = row.users?.name ?? row.users?.email ?? row.actorId;

  return (
    <tr
      className="cursor-pointer border-b border-[var(--color-border)] transition-colors hover:bg-[var(--color-bg)]"
      onClick={onSelect}
    >
      <td
        className="whitespace-nowrap px-4 py-2.5 text-[var(--color-text-muted)]"
        title={formatPersianDateTime(row.createdAt)}
      >
        {formatRelativeTime(row.createdAt)}
      </td>
      <td className="px-4 py-2.5">
        <Badge variant={ACTION_BADGE[row.action] ?? 'neutral'}>
          {getAuditActionLabel(row.action)}
        </Badge>
      </td>
      <td className="px-4 py-2.5">
        <div className="font-medium text-[var(--color-text)]">
          {row.entityName ?? getEntityTypeLabel(row.entityType)}
        </div>
        <div className="mt-0.5 text-xs text-[var(--color-text-muted)]">
          {getEntityTypeLabel(row.entityType)}
        </div>
      </td>
      <td className="px-4 py-2.5 text-[var(--color-text)]">
        <div>{actorName}</div>
        <div className="text-xs text-[var(--color-text-muted)]">{getRoleLabel(row.actorRole)}</div>
      </td>
      <td className="max-w-44 truncate px-4 py-2.5 text-xs text-[var(--color-text-muted)]">
        {row.changeSummary || '—'}
      </td>
    </tr>
  );
}

function AuditDetailModal({ id, onClose }: { id: string; onClose: () => void }) {
  const [row, setRow] = useState<AuditDetailRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRaw, setShowRaw] = useState(false);
  const [showTechnical, setShowTechnical] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    setError(null);
    fetch(`/api/admin/audit/${id}`, { signal: ctrl.signal })
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'خطا در دریافت جزئیات');
        setRow(json.row);
      })
      .catch((e) => {
        if ((e as Error)?.name === 'AbortError') return;
        setError(e instanceof Error ? e.message : 'خطا در دریافت جزئیات');
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false);
      });
    return () => ctrl.abort();
  }, [id]);

  const diffRows = row ? getAuditDiffRows(row.before, row.after) : [];
  const mainRows = diffRows.filter((r) => !r.technical);
  const technicalRows = diffRows.filter((r) => r.technical);
  const actorName = row?.users?.name ?? row?.users?.email ?? row?.actorId ?? '';
  const uaShort = parseUserAgentShort(row?.userAgent);

  const copyId = () => {
    if (!row) return;
    void navigator.clipboard.writeText(row.entityId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="جزئیات رویداد"
        className="flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xl sm:max-w-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-[var(--color-border)] p-4">
          <div className="min-w-0">
            {row && (
              <>
                <Badge variant={ACTION_BADGE[row.action] ?? 'neutral'}>
                  {getAuditActionLabel(row.action)}
                </Badge>
                <h2 className="mt-2 truncate text-lg font-semibold text-[var(--color-text)]">
                  {row.entityName ?? getEntityTypeLabel(row.entityType)}
                </h2>
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                  {getEntityTypeLabel(row.entityType)} · {actorName} ·{' '}
                  {formatPersianDateTime(row.createdAt)}
                </p>
              </>
            )}
            {loading && (
              <div className="h-16 w-48 animate-pulse rounded-xl bg-[var(--color-border-muted)]" />
            )}
            {error && <p className="text-sm text-red-700">{error}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-2 text-[var(--color-text-muted)] hover:bg-[var(--color-bg)]"
            aria-label="بستن"
          >
            <X className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {loading && (
            <div className="space-y-2">
              <div className="h-10 animate-pulse rounded-lg bg-[var(--color-border-muted)]" />
              <div className="h-10 animate-pulse rounded-lg bg-[var(--color-border-muted)]" />
              <div className="h-10 animate-pulse rounded-lg bg-[var(--color-border-muted)]" />
            </div>
          )}

          {!loading && row && mainRows.length > 0 && (
            <div className="overflow-hidden rounded-xl border border-[var(--color-border)]">
              <table className="w-full text-sm">
                <thead className="bg-[var(--color-bg)]">
                  <tr>
                    <th className="px-3 py-2 text-start font-medium text-[var(--color-text-muted)]">فیلد</th>
                    <th className="px-3 py-2 text-start font-medium text-[var(--color-text-muted)]">قبل</th>
                    <th className="px-3 py-2 text-start font-medium text-[var(--color-text-muted)]">بعد</th>
                  </tr>
                </thead>
                <tbody>
                  {mainRows.map((r) => (
                    <tr key={r.key} className="border-t border-[var(--color-border)]">
                      <td className="px-3 py-2.5 font-medium text-[var(--color-text)]">{r.label}</td>
                      <td className="px-3 py-2.5 text-red-700 line-through">{r.before}</td>
                      <td className="px-3 py-2.5 font-medium text-emerald-700">{r.after}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && row && mainRows.length === 0 && technicalRows.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              تغییر محتوایی ثبت نشده — فقط متادیتای فنی (مثل زمان به‌روزرسانی) متفاوت است.
            </div>
          )}

          {!loading && row && mainRows.length === 0 && technicalRows.length === 0 && (
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-6 text-center text-sm text-[var(--color-text-muted)]">
              {row.before == null && row.after != null
                ? 'رکورد جدید ایجاد شده'
                : row.before != null && row.after == null
                  ? 'رکورد حذف شده'
                  : 'دادهٔ قبل/بعد ثبت نشده'}
            </div>
          )}

          {technicalRows.length > 0 && (
            <div>
              <button
                type="button"
                onClick={() => setShowTechnical((v) => !v)}
                className="inline-flex items-center gap-1 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              >
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform ${showTechnical ? 'rotate-180' : ''}`}
                  strokeWidth={1.5}
                />
                {showTechnical ? 'پنهان کردن' : 'نمایش'} فیلدهای فنی ({faNumber(technicalRows.length)})
              </button>
              {showTechnical && (
                <div className="mt-2 overflow-hidden rounded-lg border border-[var(--color-border)]">
                  <table className="w-full text-xs">
                    <tbody>
                      {technicalRows.map((r) => (
                        <tr key={r.key} className="border-t border-[var(--color-border)] first:border-0">
                          <td className="w-28 px-3 py-2 text-[var(--color-text-muted)]">{r.label}</td>
                          <td className="px-3 py-2 text-[var(--color-text)]" dir="ltr">
                            {r.before}
                          </td>
                          <td className="px-3 py-2 text-[var(--color-text)]" dir="ltr">
                            {r.after}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {row && (
            <div>
              <button
                type="button"
                onClick={() => setShowRaw((v) => !v)}
                className="inline-flex items-center gap-1 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              >
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform ${showRaw ? 'rotate-180' : ''}`}
                  strokeWidth={1.5}
                />
                {showRaw ? 'پنهان کردن' : 'نمایش'} JSON خام
              </button>
              {showRaw && (
                <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <JsonBlock title="قبل" data={row.before} />
                  <JsonBlock title="بعد" data={row.after} />
                </div>
              )}
            </div>
          )}
        </div>

        {row && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--color-border)] px-4 py-3 text-xs text-[var(--color-text-muted)]">
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {row.ipAddress && <span>IP: {row.ipAddress}</span>}
              {uaShort && <span title={row.userAgent ?? undefined}>مرورگر: {uaShort}</span>}
            </div>
            <button
              type="button"
              onClick={copyId}
              className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-[var(--color-border)] px-2.5 hover:bg-[var(--color-bg)]"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-emerald-600" strokeWidth={2} />
              ) : (
                <Copy className="h-3.5 w-3.5" strokeWidth={1.5} />
              )}
              کپی شناسه
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function JsonBlock({ title, data }: { title: string; data: unknown }) {
  const text = data != null ? JSON.stringify(data, null, 2) : '—';
  return (
    <div>
      <div className="mb-1 text-xs font-medium text-[var(--color-text-muted)]">{title}</div>
      <pre
        dir="ltr"
        className="overflow-x-auto rounded-lg bg-[var(--color-bg)] p-3 text-xs leading-relaxed text-start font-mono"
      >
        {text}
      </pre>
    </div>
  );
}
