'use client';

import { useState, useEffect, useCallback } from 'react';
import { Eye, Copy, Check } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { faIR } from 'date-fns/locale';
import { AdminCard, Badge, type BadgeVariant } from '@/components/admin/design-system';
import { AUDIT_ACTIONS, ENTITY_TYPES } from '@/lib/audit/actions';
import { getRoleLabel } from '@/lib/auth/roles';

const ACTION_BADGE: Record<string, BadgeVariant> = {
  LIST_DELETE: 'danger',
  CATEGORY_DELETE: 'danger',
  USER_SUSPEND: 'warning',
  USER_ROLE_CHANGE: 'warning',
  LIST_UPDATE: 'success',
  LIST_BOOST: 'success',
  CATEGORY_UPDATE: 'success',
  REPORT_RESOLVE: 'success',
  COMMENT_DELETE: 'warning',
};

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

export default function AuditLogClient() {
  const [items, setItems] = useState<AuditRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<AuditRow | null>(null);
  const [filters, setFilters] = useState({
    actorId: '',
    action: '',
    entityType: '',
    dateFrom: '',
    dateTo: '',
  });

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.actorId) params.set('actorId', filters.actorId);
    if (filters.action) params.set('action', filters.action);
    if (filters.entityType) params.set('entityType', filters.entityType);
    if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.set('dateTo', filters.dateTo);
    params.set('page', String(page));
    params.set('pageSize', String(pageSize));
    try {
      const res = await fetch(`/api/admin/audit?${params}`);
      const json = await res.json();
      if (res.ok) {
        const rows = json.rows ?? json.data ?? [];
        setItems(rows);
        setTotal(json.total ?? 0);
      }
    } finally {
      setLoading(false);
    }
  }, [filters, page, pageSize]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const formatExact = (s: string) =>
    new Date(s).toLocaleString('fa-IR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

  return (
    <>
      <AdminCard padding="default" className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <input
            type="text"
            placeholder="عامل (نام / ایمیل / ID)"
            className="rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
            value={filters.actorId}
            onChange={(e) => setFilters((f) => ({ ...f, actorId: e.target.value }))}
          />
          <select
            className="rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
            value={filters.action}
            onChange={(e) => setFilters((f) => ({ ...f, action: e.target.value }))}
          >
            <option value="">همه اکشن‌ها</option>
            {AUDIT_ACTIONS.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          <select
            className="rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
            value={filters.entityType}
            onChange={(e) => setFilters((f) => ({ ...f, entityType: e.target.value }))}
          >
            <option value="">همه موجودیت‌ها</option>
            {ENTITY_TYPES.map((e) => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
          <input
            type="date"
            className="rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
            value={filters.dateFrom}
            onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value }))}
          />
          <input
            type="date"
            className="rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
            value={filters.dateTo}
            onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value }))}
          />
        </div>
        <div className="flex justify-between items-center flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setPage(1)}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            اعمال فیلتر
          </button>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">مجموع: {total}</span>
            <select
              className="rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1 text-sm"
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
            >
              <option value={20}>۲۰ در صفحه</option>
              <option value={50}>۵۰ در صفحه</option>
            </select>
          </div>
        </div>
      </AdminCard>

      <AdminCard padding="default" className="overflow-hidden p-0">
        <div className="overflow-x-auto overflow-y-visible">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-800/95 border-b border-gray-200 dark:border-gray-700 shadow-sm">
              <tr>
                <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">زمان</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">عامل</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">نقش</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">اکشن</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">موجودیت</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300 w-24">جزئیات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500">در حال بارگذاری...</td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500">رکوردی یافت نشد</td>
                </tr>
              ) : (
                items.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50/50 dark:hover:bg-gray-700/30"
                  >
                    <td className="py-3 px-4 text-gray-700 dark:text-gray-300" title={formatExact(row.createdAt)}>
                      {formatDistanceToNow(new Date(row.createdAt), { addSuffix: true, locale: faIR })}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium">{row.users?.name ?? row.users?.email ?? row.actorId}</span>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="neutral">{getRoleLabel(row.actorRole)}</Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={ACTION_BADGE[row.action] ?? 'neutral'}>{row.action}</Badge>
                    </td>
                    <td className="py-3 px-4">
                      <EntityCell entityType={row.entityType} entityId={row.entityId} />
                    </td>
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => setSelected(row)}
                        className="p-2 rounded-lg text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 inline-flex items-center gap-1 text-xs font-medium"
                        title="مشاهده جزئیات"
                      >
                        <Eye className="h-4 w-4" />
                        جزئیات
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {total > 0 && (
          <div className="flex justify-center gap-2 py-3 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-1 text-sm disabled:opacity-50"
            >
              قبلی
            </button>
            <span className="py-1 text-sm text-gray-600 dark:text-gray-400">
              صفحه {page} از {Math.ceil(total / pageSize) || 1}
            </span>
            <button
              type="button"
              disabled={page * pageSize >= total}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-1 text-sm disabled:opacity-50"
            >
              بعدی
            </button>
          </div>
        )}
      </AdminCard>

      {selected && (
        <AuditDetailModal
          row={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}

function EntityCell({ entityType, entityId }: { entityType: string; entityId: string }) {
  const [copied, setCopied] = useState(false);
  const text = `${entityType} / ${entityId}`;
  const copy = () => {
    navigator.clipboard.writeText(entityId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <span className="inline-flex items-center gap-1 font-mono text-xs">
      {entityType} / {entityId.slice(0, 10)}…
      <button
        type="button"
        onClick={copy}
        className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
        title="کپی شناسه"
      >
        {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5 text-gray-500" />}
      </button>
    </span>
  );
}

function AuditDetailModal({ row, onClose }: { row: AuditRow; onClose: () => void }) {
  const beforeStr = row.before != null ? JSON.stringify(row.before, null, 2) : '—';
  const afterStr = row.after != null ? JSON.stringify(row.after, null, 2) : '—';
  const changedKeys = getChangedKeys(row.before, row.after);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div
        className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {row.action} — {row.entityType} / {row.entityId}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
          >
            ×
          </button>
        </div>
        <div className="p-4 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">قبل (before)</h3>
            <pre className="rounded-lg bg-gray-100 dark:bg-gray-900 p-3 text-xs overflow-x-auto whitespace-pre-wrap break-words">
              {beforeStr}
            </pre>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">بعد (after)</h3>
            <pre className="rounded-lg bg-gray-100 dark:bg-gray-900 p-3 text-xs overflow-x-auto whitespace-pre-wrap break-words">
              {afterStr}
            </pre>
          </div>
        </div>
        {changedKeys.length > 0 && (
          <div className="px-4 pb-2">
            <h3 className="text-sm font-medium text-amber-700 dark:text-amber-300 mb-1">فیلدهای تغییر کرده</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">{changedKeys.join(', ')}</p>
          </div>
        )}
        <div className="px-4 pb-4 text-xs text-gray-500 space-y-1">
          <p>زمان: {formatExact(row.createdAt)}</p>
          {row.ipAddress && <p>IP: {row.ipAddress}</p>}
          {row.userAgent && <p className="break-all">User-Agent: {row.userAgent}</p>}
        </div>
      </div>
    </div>
  );
}

function formatExact(s: string) {
  return new Date(s).toLocaleString('fa-IR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function getChangedKeys(before: unknown, after: unknown): string[] {
  if (before == null || after == null || typeof before !== 'object' || typeof after !== 'object') return [];
  const b = before as Record<string, unknown>;
  const a = after as Record<string, unknown>;
  const keys = new Set([...Object.keys(b), ...Object.keys(a)]);
  const out: string[] = [];
  keys.forEach((k) => {
    const vb = JSON.stringify(b[k]);
    const va = JSON.stringify(a[k]);
    if (vb !== va) out.push(k);
  });
  return out;
}
