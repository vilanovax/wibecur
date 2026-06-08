'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Package } from 'lucide-react';
import AdminSuggestedItemCard, { type AdminSuggestedItemSuggestion } from './AdminSuggestedItemCard';
import BulkActionBar from './BulkActionBar';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import EditItemSuggestionModal from './EditItemSuggestionModal';
import DeleteSuggestionModal from './DeleteSuggestionModal';
import ApproveRejectModal from './ApproveRejectModal';
import Pagination from '@/components/admin/shared/Pagination';

interface ItemSuggestion extends AdminSuggestedItemSuggestion {
  source?: 'form' | 'menu';
  userId: string;
  adminNotes: string | null;
  metadata: any;
  updatedAt: string;
}

interface ItemSuggestionsTableProps {
  status?: string;
  source?: 'form' | 'menu';
  currentPage: number;
  onPageChange: (page: number) => void;
}

function suggestionApiBase(source?: 'form' | 'menu') {
  return source === 'menu' ? '/api/admin/suggestions/menu-items' : '/api/admin/suggestions/items';
}

type SortOrder = 'newest' | 'oldest';

function SuggestionSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="animate-pulse rounded-xl border border-gray-100 p-4">
          <div className="flex gap-3">
            <div className="h-14 w-11 rounded-lg bg-gray-200" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-2/3 rounded bg-gray-200" />
              <div className="h-3 w-1/2 rounded bg-gray-100" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ItemSuggestionsTable({
  status,
  source,
  currentPage,
  onPageChange,
}: ItemSuggestionsTableProps) {
  const router = useRouter();
  const [suggestions, setSuggestions] = useState<ItemSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const [selectedSuggestion, setSelectedSuggestion] = useState<ItemSuggestion | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isApproveRejectModalOpen, setIsApproveRejectModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState<'approve' | 'reject' | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'approve' | 'reject' | null>(null);
  const selectAllRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchSuggestions();
  }, [status, source, currentPage, sortOrder]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (!selectAllRef.current) return;
    const n = suggestions.length;
    const s = selectedIds.size;
    selectAllRef.current.checked = n > 0 && s === n;
    selectAllRef.current.indeterminate = s > 0 && s < n;
  }, [suggestions.length, selectedIds.size]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    const allSelected = selectedIds.size === suggestions.length;
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(suggestions.map((s) => s.id)));
    }
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const handleBulkApproveClick = () => {
    setConfirmAction('approve');
    setConfirmOpen(true);
  };

  const handleBulkRejectClick = () => {
    setConfirmAction('reject');
    setConfirmOpen(true);
  };

  const handleConfirmBulkAction = async () => {
    if (!confirmAction || selectedIds.size === 0) return;
    const pendingSuggestions = suggestions.filter(
      (s) => selectedIds.has(s.id) && s.status === 'pending'
    );
    if (pendingSuggestions.length === 0) {
      setToast('هیچ پیشنهاد در انتظاری انتخاب نشده');
      setConfirmOpen(false);
      setConfirmAction(null);
      return;
    }
    setBulkLoading(true);
    try {
      if (confirmAction === 'approve') {
        await Promise.all(
          pendingSuggestions.map((s) =>
            fetch(`${suggestionApiBase(s.source)}/${s.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'approve',
                adminNotes: `با تشکر از پیشنهاد شما! آیتم "${s.title}" با موفقیت به لیست اضافه شد.`,
              }),
            })
          )
        );
        setToast(`${pendingSuggestions.length} پیشنهاد تأیید شدند ✅`);
      } else {
        await Promise.all(
          pendingSuggestions.map((s) =>
            fetch(`${suggestionApiBase(s.source)}/${s.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'reject',
                adminNotes: 'رد دسته‌جمعی توسط ادمین',
              }),
            })
          )
        );
        setToast(`${pendingSuggestions.length} پیشنهاد رد شدند ❌`);
      }
      setSelectedIds(new Set());
      setConfirmOpen(false);
      setConfirmAction(null);
      await fetchSuggestions();
    } catch {
      setToast('خطا در انجام عملیات');
    } finally {
      setBulkLoading(false);
    }
  };

  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        sort: sortOrder,
      });
      if (status) params.set('status', status);
      if (source) params.set('source', source);

      const res = await fetch(`/api/admin/suggestions/items?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setSuggestions(data.data.suggestions || []);
        setTotalPages(data.data.pagination.totalPages || 1);
        setTotal(data.data.pagination.total || 0);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveDirect = async (suggestion: AdminSuggestedItemSuggestion) => {
    setProcessing(suggestion.id);
    try {
      const res = await fetch(`${suggestionApiBase(suggestion.source)}/${suggestion.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve',
          adminNotes: `با تشکر از پیشنهاد شما! آیتم "${suggestion.title}" با موفقیت به لیست اضافه شد.`,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setToast('تأیید شد ✅');
        await fetchSuggestions();
      } else {
        setToast(data.error || 'خطا در تأیید');
      }
    } catch {
      setToast('خطا در تأیید');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = (suggestion: AdminSuggestedItemSuggestion) => {
    const full = suggestions.find((s) => s.id === suggestion.id);
    if (full) setSelectedSuggestion(full);
    setModalAction('reject');
    setIsApproveRejectModalOpen(true);
  };

  const handleEdit = (suggestion: AdminSuggestedItemSuggestion) => {
    if (suggestion.source === 'menu') return;
    const full = suggestions.find((s) => s.id === suggestion.id);
    if (full) setSelectedSuggestion(full);
    setIsEditModalOpen(true);
  };

  const handleDelete = (suggestion: AdminSuggestedItemSuggestion) => {
    const full = suggestions.find((s) => s.id === suggestion.id);
    if (full) setSelectedSuggestion(full);
    setIsDeleteModalOpen(true);
  };

  const handleViewList = (suggestion: AdminSuggestedItemSuggestion) => {
    if (suggestion.lists?.slug) {
      router.push(`/lists/${suggestion.lists.slug}`);
    }
  };

  const handleModalClose = () => {
    setIsEditModalOpen(false);
    setIsDeleteModalOpen(false);
    setIsApproveRejectModalOpen(false);
    setSelectedSuggestion(null);
    setModalAction(null);
  };

  if (loading) {
    return <SuggestionSkeleton />;
  }

  const isPending = status === 'pending' || !status;
  const emptyMessage = isPending
    ? { title: 'همه پیشنهادها بررسی شد', subtitle: 'فعلاً پیشنهاد در انتظاری نیست' }
    : { title: 'پیشنهادی یافت نشد', subtitle: 'فیلتر دیگری امتحان کنید' };

  if (suggestions.length === 0) {
    return (
      <div className="py-12 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
          <Package className="h-7 w-7 text-gray-400" />
        </div>
        <h3 className="font-semibold text-gray-900">{emptyMessage.title}</h3>
        <p className="mt-1 text-sm text-gray-500">{emptyMessage.subtitle}</p>
      </div>
    );
  }

  return (
    <>
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-gray-900 text-white text-sm font-medium shadow-lg animate-in fade-in duration-200">
          {toast}
        </div>
      )}

      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-gray-500">
          <span className="font-semibold text-gray-800">{total.toLocaleString('fa-IR')}</span> پیشنهاد
        </p>
        <div className="flex items-center gap-2">
          {suggestions.length > 1 && (
            <button
              type="button"
              onClick={() => setSortOrder((s) => (s === 'newest' ? 'oldest' : 'newest'))}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
            >
              {sortOrder === 'newest' ? 'جدیدترین ↑' : 'قدیمی‌ترین ↓'}
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setBulkMode((b) => !b);
              if (bulkMode) setSelectedIds(new Set());
            }}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
              bulkMode
                ? 'border-violet-300 bg-violet-50 text-violet-700'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {bulkMode ? 'لغو انتخاب' : 'انتخاب چندتایی'}
          </button>
        </div>
      </div>

      {bulkMode && selectedIds.size > 0 && (
        <div className="mb-3 flex items-center gap-2 rounded-lg bg-violet-50 px-3 py-2 text-sm text-violet-800">
          <input
            ref={selectAllRef}
            type="checkbox"
            onChange={selectAll}
            className="rounded border-gray-300 text-violet-600"
            aria-label="انتخاب همه"
          />
          <span>{selectedIds.size.toLocaleString('fa-IR')} انتخاب شده</span>
        </div>
      )}

      <div className="space-y-3">
        {suggestions.map((suggestion) => (
          <AdminSuggestedItemCard
            key={suggestion.id}
            suggestion={suggestion}
            processing={processing === suggestion.id}
            onApprove={handleApproveDirect}
            onReject={handleReject}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onViewList={handleViewList}
            isRemoving={processing === suggestion.id}
            isBulkMode={bulkMode}
            isSelected={selectedIds.has(suggestion.id)}
            onToggleSelect={toggleSelect}
          />
        ))}
      </div>

      {bulkMode && selectedIds.size > 0 && (
        <BulkActionBar
          selectedCount={selectedIds.size}
          loading={bulkLoading}
          onApprove={handleBulkApproveClick}
          onReject={handleBulkRejectClick}
          onClear={clearSelection}
        />
      )}

      <ConfirmDialog
        isOpen={confirmOpen}
        title={confirmAction === 'approve' ? 'تأیید دسته‌جمعی' : 'رد دسته‌جمعی'}
        message={
          confirmAction === 'approve'
            ? `از تأیید ${selectedIds.size} پیشنهاد مطمئن هستی؟`
            : `از رد ${selectedIds.size} پیشنهاد مطمئن هستی؟`
        }
        confirmLabel={confirmAction === 'approve' ? 'تأیید همه' : 'رد همه'}
        variant={confirmAction === 'reject' ? 'danger' : 'primary'}
        loading={bulkLoading}
        onConfirm={handleConfirmBulkAction}
        onCancel={() => {
          setConfirmOpen(false);
          setConfirmAction(null);
        }}
      />

      {totalPages > 1 && (
        <div className="mt-6">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            basePath="/admin/suggestions"
            searchParams={{
              tab: 'items',
              ...(status && { status }),
              ...(source && { source }),
            }}
          />
        </div>
      )}

      {selectedSuggestion && (
        <>
          <EditItemSuggestionModal
            isOpen={isEditModalOpen}
            onClose={handleModalClose}
            suggestion={selectedSuggestion}
            onSuccess={() => {
              handleModalClose();
              fetchSuggestions();
            }}
          />
          <DeleteSuggestionModal
            isOpen={isDeleteModalOpen}
            onClose={handleModalClose}
            suggestionId={selectedSuggestion.id}
            suggestionTitle={selectedSuggestion.title}
            type="item"
            apiBase={suggestionApiBase(selectedSuggestion.source)}
            onSuccess={() => {
              handleModalClose();
              fetchSuggestions();
            }}
          />
          {modalAction && (
            <ApproveRejectModal
              isOpen={isApproveRejectModalOpen}
              onClose={handleModalClose}
              suggestionId={selectedSuggestion.id}
              suggestionTitle={selectedSuggestion.title}
              action={modalAction}
              type="item"
              apiBase={
                selectedSuggestion.source === 'menu'
                  ? `/api/admin/suggestions/menu-items/${selectedSuggestion.id}`
                  : undefined
              }
              onSuccess={() => {
                handleModalClose();
                setToast('رد شد ❌');
                fetchSuggestions();
              }}
            />
          )}
        </>
      )}
    </>
  );
}
