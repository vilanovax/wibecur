'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { faIR } from 'date-fns/locale';
import { RefreshCw, Search } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import Toast from '@/components/shared/Toast';
import type { ModerationCaseRow, ModerationCaseDetail, ModerationSummary, EntityPreview, ModerationFiltersState } from './types';
import ModerationSummaryBar from './ModerationSummaryBar';
import ModerationFilters from './ModerationFilters';
import ModerationTable from './ModerationTable';
import ModerationDrawer from './ModerationDrawer';

const defaultFilters: ModerationFiltersState = {
  type: '',
  entityType: '',
  status: '',
  severity: '',
  assigneeFilter: '',
  dateFrom: '',
  dateTo: '',
  search: '',
  page: '1',
};

function parseFiltersFromSearchParams(params: URLSearchParams): ModerationFiltersState {
  return {
    type: params.get('type') ?? '',
    entityType: params.get('entityType') ?? '',
    status: params.get('status') ?? '',
    severity: params.get('severity') ?? '',
    assigneeFilter: params.get('assigneeFilter') ?? '',
    dateFrom: params.get('from') ?? '',
    dateTo: params.get('to') ?? '',
    search: params.get('search') ?? '',
    page: params.get('page') ?? '1',
  };
}

function filtersToParams(f: ModerationFiltersState): URLSearchParams {
  const p = new URLSearchParams();
  if (f.type) p.set('type', f.type);
  if (f.entityType) p.set('entityType', f.entityType);
  if (f.status) p.set('status', f.status);
  if (f.severity) p.set('severity', f.severity);
  if (f.assigneeFilter) p.set('assigneeFilter', f.assigneeFilter);
  if (f.dateFrom) p.set('from', f.dateFrom);
  if (f.dateTo) p.set('to', f.dateTo);
  if (f.search) p.set('search', f.search);
  if (f.page !== '1') p.set('page', f.page);
  return p;
}

export type { ModerationCaseRow, ModerationCaseDetail, ModerationSummary, EntityPreview };

export default function ModerationQueueClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { can } = usePermissions();
  const isReadOnly = !can('assign_moderation');

  const filtersFromUrl = useMemo(() => parseFiltersFromSearchParams(searchParams), [searchParams]);
  const [filters, setFilters] = useState<ModerationFiltersState>(filtersFromUrl);

  const [summary, setSummary] = useState<ModerationSummary | null>(null);
  const [items, setItems] = useState<ModerationCaseRow[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ModerationCaseDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [entityPreview, setEntityPreview] = useState<EntityPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const page = Math.max(1, parseInt(filters.page, 10) || 1);

  const syncUrl = useCallback((f: ModerationFiltersState) => {
    const p = filtersToParams(f);
    const q = p.toString();
    const path = q ? `/admin/moderation?${q}` : '/admin/moderation';
    router.replace(path, { scroll: false });
  }, [router]);

  useEffect(() => {
    setFilters(parseFiltersFromSearchParams(searchParams));
  }, [searchParams]);

  const setFiltersAndSync = useCallback((next: ModerationFiltersState | ((prev: ModerationFiltersState) => ModerationFiltersState)) => {
    setFilters((prev) => {
      const nextState = typeof next === 'function' ? next(prev) : next;
      syncUrl(nextState);
      return nextState;
    });
  }, [syncUrl]);

  const fetchSummary = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/moderation/summary');
      const json = await res.json();
      if (res.ok) setSummary(json);
    } catch {
      // ignore
    }
  }, []);

  const fetchList = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.type) params.set('type', filters.type);
    if (filters.entityType) params.set('entityType', filters.entityType);
    if (filters.status) params.set('status', filters.status);
    if (filters.severity) params.set('severity', filters.severity);
    if (filters.assigneeFilter) params.set('assigneeFilter', filters.assigneeFilter);
    if (filters.dateFrom) params.set('from', filters.dateFrom);
    if (filters.dateTo) params.set('to', filters.dateTo);
    if (filters.search) params.set('search', filters.search);
    params.set('page', String(page));
    try {
      const res = await fetch(`/api/admin/moderation?${params}`);
      const json = await res.json();
      if (res.ok) {
        setItems(json.items ?? []);
        setTotal(json.total ?? 0);
        setTotalPages(json.totalPages ?? 0);
        setLastUpdatedAt(new Date());
      }
    } finally {
      setLoading(false);
    }
  }, [filters.type, filters.entityType, filters.status, filters.severity, filters.assigneeFilter, filters.dateFrom, filters.dateTo, filters.search, page]);

  const fetchDetail = useCallback(async (id: string) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/admin/moderation/${id}`);
      const json = await res.json();
      if (res.ok) setDetail(json);
      else setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const fetchPreview = useCallback(async (entityType: string, entityId: string) => {
    setPreviewLoading(true);
    try {
      const res = await fetch(`/api/admin/moderation/preview?entityType=${encodeURIComponent(entityType)}&entityId=${encodeURIComponent(entityId)}`);
      const json = await res.json();
      if (res.ok && json.kind) setEntityPreview(json as EntityPreview);
      else setEntityPreview(null);
    } catch {
      setEntityPreview(null);
    } finally {
      setPreviewLoading(false);
    }
  }, []);

  useEffect(() => { fetchSummary(); }, [fetchSummary]);
  useEffect(() => { fetchList(); }, [fetchList]);
  useEffect(() => {
    if (selectedId) fetchDetail(selectedId);
    else setDetail(null);
  }, [selectedId, fetchDetail]);
  useEffect(() => {
    if (detail?.entityType && detail?.entityId) fetchPreview(detail.entityType, detail.entityId);
    else setEntityPreview(null);
  }, [detail?.entityType, detail?.entityId, fetchPreview]);

  const handleRefresh = useCallback(() => {
    fetchSummary();
    fetchList();
    if (selectedId) fetchDetail(selectedId);
  }, [fetchSummary, fetchList, selectedId, fetchDetail]);

  const runAction = useCallback(async (caseId: string, action: 'assign' | 'status' | 'note', body: Record<string, unknown>) => {
    const key = `${action}-${caseId}`;
    setActionLoading(key);
    try {
      const url = action === 'assign' ? `/api/admin/moderation/${caseId}/assign` : action === 'status' ? `/api/admin/moderation/${caseId}/status` : `/api/admin/moderation/${caseId}/note`;
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'خطا');
      await fetchList();
      await fetchSummary();
      if (selectedId === caseId) await fetchDetail(caseId);
      if (action === 'note') setNoteText('');
      setToast({ message: action === 'assign' ? 'تخصیص انجام شد' : action === 'status' ? 'وضعیت به‌روز شد' : 'یادداشت ذخیره شد', type: 'success' });
    } catch (e) {
      setToast({ message: e instanceof Error ? e.message : 'خطا', type: 'error' });
    } finally {
      setActionLoading(null);
    }
  }, [selectedId, fetchList, fetchSummary, fetchDetail]);

  const runEntityAction = useCallback(async (action: 'trash-list' | 'suspend-user' | 'restore-list' | 'unsuspend-user' | 'comment-approve' | 'comment-delete', entityId?: string, commentId?: string) => {
    if (!detail) return;
    const key = `entity-${action}-${detail.id}`;
    setActionLoading(key);
    try {
      if (action === 'trash-list') {
        const res = await fetch('/api/admin/moderation/actions/trash-list', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ caseId: detail.id, entityId: detail.entityId }) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'خطا');
        await fetchList();
        await fetchSummary();
        await fetchDetail(detail.id);
        setEntityPreview((p) => (p?.kind === 'LIST' ? { ...p, deletedAt: new Date().toISOString(), isActive: false } : p));
        setToast({ message: 'لیست به زباله‌دان منتقل شد', type: 'success' });
      } else if (action === 'suspend-user') {
        const res = await fetch('/api/admin/moderation/actions/suspend-user', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ caseId: detail.id, entityId: detail.entityId }) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'خطا');
        await fetchList();
        await fetchSummary();
        await fetchDetail(detail.id);
        setEntityPreview((p) => (p?.kind === 'USER' ? { ...p, isActive: false } : p));
        setToast({ message: 'کاربر تعلیق شد', type: 'success' });
      } else if (action === 'unsuspend-user' && entityId) {
        const res = await fetch(`/api/admin/users/${entityId}/toggle-active`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: true }) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'خطا');
        await fetchDetail(detail.id);
        setEntityPreview((p) => (p?.kind === 'USER' ? { ...p, isActive: true } : p));
        setToast({ message: data.message || 'کاربر فعال شد', type: 'success' });
      } else if (action === 'restore-list' && entityId) {
        const res = await fetch(`/api/admin/lists/${entityId}/restore`, { method: 'POST' });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'خطا');
        await fetchDetail(detail.id);
        setEntityPreview((p) => (p?.kind === 'LIST' ? { ...p, deletedAt: null, isActive: true } : p));
        setToast({ message: 'لیست بازگردانی شد', type: 'success' });
      } else if (action === 'comment-approve' && commentId) {
        const res = await fetch(`/api/admin/comments/${commentId}/approve`, { method: 'POST' });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'خطا');
        await fetchDetail(detail.id);
        setEntityPreview((p) => (p?.kind === 'COMMENT' ? { ...p, isApproved: true } : p));
        setToast({ message: data.message || 'کامنت تایید شد', type: 'success' });
      } else if (action === 'comment-delete' && commentId) {
        const res = await fetch(`/api/admin/comments/${commentId}`, { method: 'DELETE' });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'خطا');
        await fetchList();
        await fetchSummary();
        await fetchDetail(detail.id);
        setEntityPreview((p) => (p?.kind === 'COMMENT' ? { ...p, deletedAt: new Date().toISOString() } : p));
        setToast({ message: data.message || 'کامنت حذف شد', type: 'success' });
      }
    } catch (e) {
      setToast({ message: e instanceof Error ? e.message : 'خطا', type: 'error' });
    } finally {
      setActionLoading(null);
    }
  }, [detail, fetchList, fetchSummary, fetchDetail]);

  return (
    <div className="space-y-8" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Moderation Queue</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            آخرین بروزرسانی: {lastUpdatedAt ? formatDistanceToNow(lastUpdatedAt, { addSuffix: true, locale: faIR }) : '—'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={handleRefresh} disabled={loading} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-2xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 shadow-sm">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            بروزرسانی
          </button>
          <div className="relative">
            <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="جستجو (entityId / عنوان / کاربر)" className="rounded-2xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm pl-3 pr-9 py-2 w-56 shadow-sm" value={filters.search} onChange={(e) => setFiltersAndSync((prev) => ({ ...prev, search: e.target.value, page: '1' }))} onKeyDown={(e) => e.key === 'Enter' && setFiltersAndSync((prev) => ({ ...prev, page: '1' }))} />
          </div>
        </div>
      </div>

      {summary && (
        <ModerationSummaryBar
          openCount={summary.open}
          inReviewCount={summary.inReview}
          highSeverityCount={summary.highSeverity}
          resolvedTodayCount={summary.resolvedToday}
          onFilterOpen={() => setFiltersAndSync((prev) => ({ ...prev, status: 'OPEN', page: '1' }))}
          onFilterInReview={() => setFiltersAndSync((prev) => ({ ...prev, status: 'IN_REVIEW', page: '1' }))}
          onFilterHighSeverity={() => setFiltersAndSync((prev) => ({ ...prev, severity: '3', page: '1' }))}
          onFilterResolvedToday={() => {
            const today = new Date().toISOString().slice(0, 10);
            setFiltersAndSync((prev) => ({ ...prev, status: 'RESOLVED', dateFrom: today, dateTo: today, page: '1' }));
          }}
        />
      )}

      <div className="flex gap-6 flex-row-reverse">
        <div className="flex-1 min-w-0">
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden shadow-sm">
            <ModerationFilters filters={filters} onChange={setFiltersAndSync} totalCount={total} />
            {loading ? (
              <div className="p-12 flex justify-center">
                <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
              </div>
            ) : items.length === 0 ? (
              <div className="p-16 text-center">
                <p className="text-lg text-gray-600 dark:text-gray-400">🎉 هیچ مورد باز برای بررسی وجود ندارد</p>
              </div>
            ) : (
              <ModerationTable
                cases={items}
                selectedId={selectedId}
                onRowClick={setSelectedId}
                onAssignToMe={(id) => runAction(id, 'assign', { assignToMe: true })}
                onOpenDrawer={setSelectedId}
                isReadOnly={isReadOnly}
                actionLoading={actionLoading}
              />
            )}
            {totalPages > 1 && (
              <div className="p-3 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
                <button type="button" className="px-3 py-1.5 rounded-2xl border text-sm disabled:opacity-50 shadow-sm" disabled={page <= 1} onClick={() => setFiltersAndSync((prev) => ({ ...prev, page: String(page - 1) }))}>قبلی</button>
                <span className="px-3 py-1.5 text-sm">{page} از {totalPages}</span>
                <button type="button" className="px-3 py-1.5 rounded-2xl border text-sm disabled:opacity-50 shadow-sm" disabled={page >= totalPages} onClick={() => setFiltersAndSync((prev) => ({ ...prev, page: String(page + 1) }))}>بعدی</button>
              </div>
            )}
          </div>
        </div>

        <div className="transition-all duration-200 ease-in-out" style={{ opacity: selectedId ? 1 : 0, transform: selectedId ? 'translateX(0)' : 'translateX(12px)' }}>
          <ModerationDrawer
            open={!!selectedId}
            caseId={selectedId}
            detail={detail}
            detailLoading={detailLoading}
            entityPreview={entityPreview}
            previewLoading={previewLoading}
            noteText={noteText}
            onNoteTextChange={setNoteText}
            onClose={() => setSelectedId(null)}
            isReadOnly={isReadOnly}
            actionLoading={actionLoading}
            onAssign={(id) => runAction(id, 'assign', { assignToMe: true })}
            onStatus={(id, status) => runAction(id, 'status', { status })}
            onNoteSubmit={(id, body) => runAction(id, 'note', { body })}
            onTrashList={(caseId, entityId) => runEntityAction('trash-list')}
            onRestoreList={(entityId) => runEntityAction('restore-list', entityId)}
            onSuspendUser={(caseId, entityId) => runEntityAction('suspend-user')}
            onUnsuspendUser={(caseId, entityId) => runEntityAction('unsuspend-user', entityId)}
            onCommentApprove={(caseId, commentId) => runEntityAction('comment-approve', undefined, commentId)}
            onCommentDelete={(caseId, commentId) => runEntityAction('comment-delete', undefined, commentId)}
          />
        </div>
      </div>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
