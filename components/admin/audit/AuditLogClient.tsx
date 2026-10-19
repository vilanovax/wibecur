'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
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
  getEntityDisplayName,
  getEntityTypeLabel,
  parseUserAgentShort,
  summarizeChangedFields,
} from '@/lib/audit/display';
import { getRoleLabel } from '@/lib/auth/roles';

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

interface AuditRow {
  id: string;
  actorId: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: string;
  before: unknown;
  after: unknown;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  users: { id: string; name: string | null; email: string | null } | null;
}

const EMPTY_FILTERS = {
  actorQuery: '',
  action: '',
  entityType: '',
  dateFrom: '',
  dateTo: '',
};

function formatExact(s: string) {
  return new Date(s).toLocaleString('fa-IR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function toDateInputValue(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function presetToRange(preset: DatePreset): { dateFrom: string; dateTo: string } {
  const today = new Date();
  const end = toDateInputValue(today);
  if (preset === 'today') return { dateFrom: end, dateTo: end };
  if (preset === '7d') {
    const start = new Date(today);
    start.setDate(start.getDate() - 6);
    return { dateFrom: toDateInputValue(start), dateTo: end };
  }
  if (preset === '30d') {
    const start = new Date(today);
    start.setDate(start.getDate() - 29);
    return { dateFrom: toDateInputValue(start), dateTo: end };
  }
  return { dateFrom: '', dateTo: '' };
}

export default function AuditLogClient() {
  const [items, setItems] = useState<AuditRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<AuditRow | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [draft, setDraft] = useState(EMPTY_FILTERS);
  const [applied, setApplied] = useState(EMPTY_FILTERS);
  const [datePreset, setDatePreset] = useState<DatePreset>('');

  const activeFilterCount = useMemo(
    () =>
      Object.values(applied).filter(Boolean).length +
      (datePreset ? 1 : 0),
    [applied, datePreset]
  );

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
          setItems(json.rows ?? json.data ?? []);
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
    const ctrl = new AbortController();
    void fetchLogs(ctrl.signal);
    return () => ctrl.abort();
  }, [fetchLogs]);

  const applyFilters = () => {
    setApplied(draft);
    setPage(1);
  };

  const clearFilters = () => {
    setDraft(EMPTY_FILTERS);
    setApplied(EMPTY_FILTERS);
    setDatePreset('');
    setPage(1);
  };

  const setPreset = (preset: DatePreset) => {
    setDatePreset(preset);
    const range = presetToRange(preset);
    setDraft((f) => ({ ...f, ...range }));
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <>
      <AdminCard padding="default" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFiltersOpen((v) => !v)}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-600 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/40"
            >
              <Filter className="h-4 w-4" />
              فیلترها
              {activeFilterCount > 0 && (
                <span className="rounded-full bg-indigo-100 text-indigo-700 px-2 py-0.5 text-xs font-medium">
                  {activeFilterCount}
                </span>
              )}
              <ChevronDown
                className={`h-4 w-4 transition ${filtersOpen ? 'rotate-180' : ''}`}
              />
            </button>
            <span className="text-sm text-gray-500">{total.toLocaleString('fa-IR')} رویداد</span>
          </div>
          <select
            className="rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1.5 text-sm"
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
          >
            <option value={20}>۲۰ در صفحه</option>
            <option value={50}>۵۰ در صفحه</option>
          </select>
        </div>

        {filtersOpen && (
          <div className="space-y-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-800/40 p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-gray-500">جستجوی عامل</span>
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="نام، ایمیل یا شناسه"
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 pr-9 pl-3 py-2 text-sm"
                    value={draft.actorQuery}
                    onChange={(e) => setDraft((f) => ({ ...f, actorQuery: e.target.value }))}
                    onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-medium text-gray-500">نوع عملیات</span>
                <select
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
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
                <span className="mb-1 block text-xs font-medium text-gray-500">موجودیت</span>
                <select
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
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
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-gray-500">از تاریخ</span>
                  <input
                    type="date"
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                    value={draft.dateFrom}
                    onChange={(e) => {
                      setDatePreset('');
                      setDraft((f) => ({ ...f, dateFrom: e.target.value }));
                    }}
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-gray-500">تا تاریخ</span>
                  <input
                    type="date"
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                    value={draft.dateTo}
                    onChange={(e) => {
                      setDatePreset('');
                      setDraft((f) => ({ ...f, dateTo: e.target.value }));
                    }}
                  />
                </label>
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
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                    datePreset === value
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={applyFilters}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                اعمال فیلتر
              </button>
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="rounded-xl border border-gray-200 dark:border-gray-600 px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/40"
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
            <thead className="bg-gray-50 dark:bg-gray-800/95 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="text-right py-3 px-4 font-semibold text-gray-600">زمان</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-600">عملیات</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-600">موجودیت</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-600">عامل</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-600">تغییرات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-500">
                    در حال بارگذاری...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-500">
                    رویدادی با این فیلترها یافت نشد
                  </td>
                </tr>
              ) : (
                items.map((row) => (
                  <AuditTableRow key={row.id} row={row} onSelect={() => setSelected(row)} />
                ))
              )}
            </tbody>
          </table>
        </div>

        {total > 0 && (
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-gray-200 dark:border-gray-700">
            <span className="text-xs text-gray-500">
              صفحه {page.toLocaleString('fa-IR')} از {totalPages.toLocaleString('fa-IR')}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="inline-flex items-center gap-1 rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
                قبلی
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="inline-flex items-center gap-1 rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm disabled:opacity-40"
              >
                بعدی
                <ChevronLeft className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </AdminCard>

      {selected && <AuditDetailModal row={selected} onClose={() => setSelected(null)} />}
    </>
  );
}

function AuditTableRow({ row, onSelect }: { row: AuditRow; onSelect: () => void }) {
  const entityName = getEntityDisplayName(row.entityType, row.before, row.after);
  const changeSummary = summarizeChangedFields(row.before, row.after);
  const actorName = row.users?.name ?? row.users?.email ?? row.actorId;

  return (
    <tr
      className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-indigo-50/40 dark:hover:bg-indigo-500/5 cursor-pointer transition"
      onClick={onSelect}
    >
      <td className="py-3 px-4 text-gray-600 whitespace-nowrap" title={formatExact(row.createdAt)}>
        {formatRelativeTime(row.createdAt)}
      </td>
      <td className="py-3 px-4">
        <Badge variant={ACTION_BADGE[row.action] ?? 'neutral'}>
          {getAuditActionLabel(row.action)}
        </Badge>
      </td>
      <td className="py-3 px-4">
        <div className="font-medium text-gray-900 dark:text-gray-100">
          {entityName ?? getEntityTypeLabel(row.entityType)}
        </div>
        <div className="text-xs text-gray-500 mt-0.5">
          {getEntityTypeLabel(row.entityType)} · {row.entityId.slice(0, 12)}…
        </div>
      </td>
      <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
        <div>{actorName}</div>
        <div className="text-xs text-gray-500">{getRoleLabel(row.actorRole)}</div>
      </td>
      <td className="py-3 px-4 text-xs text-gray-500 max-w-[180px] truncate">
        {changeSummary || '—'}
      </td>
    </tr>
  );
}

function AuditDetailModal({ row, onClose }: { row: AuditRow; onClose: () => void }) {
  const [showRaw, setShowRaw] = useState(false);
  const [showTechnical, setShowTechnical] = useState(false);
  const [copied, setCopied] = useState(false);

  const diffRows = getAuditDiffRows(row.before, row.after);
  const mainRows = diffRows.filter((r) => !r.technical);
  const technicalRows = diffRows.filter((r) => r.technical);
  const entityName = getEntityDisplayName(row.entityType, row.before, row.after);
  const actorName = row.users?.name ?? row.users?.email ?? row.actorId;
  const uaShort = parseUserAgentShort(row.userAgent);

  const copyId = () => {
    void navigator.clipboard.writeText(row.entityId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50"
      onClick={onClose}
    >
      <div
        className="rounded-t-2xl sm:rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl w-full sm:max-w-2xl max-h-[92vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Badge variant={ACTION_BADGE[row.action] ?? 'neutral'}>
              {getAuditActionLabel(row.action)}
            </Badge>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mt-2 truncate">
              {entityName ?? getEntityTypeLabel(row.entityType)}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {getEntityTypeLabel(row.entityType)} · {actorName} · {formatExact(row.createdAt)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="بستن"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          {mainRows.length > 0 ? (
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-900/50">
                  <tr>
                    <th className="text-right py-2 px-3 font-medium text-gray-500">فیلد</th>
                    <th className="text-right py-2 px-3 font-medium text-gray-500">قبل</th>
                    <th className="text-right py-2 px-3 font-medium text-gray-500">بعد</th>
                  </tr>
                </thead>
                <tbody>
                  {mainRows.map((r) => (
                    <tr key={r.key} className="border-t border-gray-100 dark:border-gray-700/60">
                      <td className="py-2.5 px-3 font-medium text-gray-700 dark:text-gray-200">
                        {r.label}
                      </td>
                      <td className="py-2.5 px-3 text-red-600/90 dark:text-red-400 line-through decoration-red-300/60">
                        {r.before}
                      </td>
                      <td className="py-2.5 px-3 text-emerald-700 dark:text-emerald-400 font-medium">
                        {r.after}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : technicalRows.length > 0 ? (
            <div className="rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
              تغییر محتوایی ثبت نشده — فقط متادیتای فنی (مثل زمان به‌روزرسانی) متفاوت است.
            </div>
          ) : (
            <div className="rounded-xl bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700 px-4 py-6 text-center text-sm text-gray-500">
              {row.before == null && row.after != null
                ? 'رکورد جدید ایجاد شده'
                : row.before != null && row.after == null
                  ? 'رکورد حذف شده'
                  : 'داده قبل/بعد ثبت نشده'}
            </div>
          )}

          {technicalRows.length > 0 && (
            <div>
              <button
                type="button"
                onClick={() => setShowTechnical((v) => !v)}
                className="text-xs text-gray-500 hover:text-gray-700 inline-flex items-center gap-1"
              >
                <ChevronDown className={`h-3.5 w-3.5 transition ${showTechnical ? 'rotate-180' : ''}`} />
                {showTechnical ? 'پنهان کردن' : 'نمایش'} فیلدهای فنی ({technicalRows.length})
              </button>
              {showTechnical && (
                <div className="mt-2 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <table className="w-full text-xs">
                    <tbody>
                      {technicalRows.map((r) => (
                        <tr key={r.key} className="border-t border-gray-100 dark:border-gray-700/60 first:border-0">
                          <td className="py-2 px-3 text-gray-500 w-28">{r.label}</td>
                          <td className="py-2 px-3 text-gray-600" dir="ltr">{r.before}</td>
                          <td className="py-2 px-3 text-gray-600" dir="ltr">{r.after}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          <div>
            <button
              type="button"
              onClick={() => setShowRaw((v) => !v)}
              className="text-xs text-gray-500 hover:text-gray-700 inline-flex items-center gap-1"
            >
              <ChevronDown className={`h-3.5 w-3.5 transition ${showRaw ? 'rotate-180' : ''}`} />
              {showRaw ? 'پنهان کردن' : 'نمایش'} JSON خام
            </button>
            {showRaw && (
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <JsonBlock title="قبل" data={row.before} />
                <JsonBlock title="بعد" data={row.after} />
              </div>
            )}
          </div>
        </div>

        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {row.ipAddress && <span>IP: {row.ipAddress}</span>}
            {uaShort && <span title={row.userAgent ?? undefined}>مرورگر: {uaShort}</span>}
          </div>
          <button
            type="button"
            onClick={copyId}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 dark:border-gray-600 px-2.5 py-1 hover:bg-gray-50 dark:hover:bg-gray-700/40"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
            کپی شناسه
          </button>
        </div>
      </div>
    </div>
  );
}

function JsonBlock({ title, data }: { title: string; data: unknown }) {
  const text = data != null ? JSON.stringify(data, null, 2) : '—';
  return (
    <div>
      <div className="text-xs font-medium text-gray-500 mb-1">{title}</div>
      <pre
        dir="ltr"
        className="rounded-lg bg-gray-100 dark:bg-gray-900 p-3 text-[11px] leading-relaxed overflow-x-auto text-left font-mono"
      >
        {text}
      </pre>
    </div>
  );
}
