'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowUpDown, Package } from 'lucide-react';
import AdminSuggestedItemCard, { type AdminSuggestedItemSuggestion } from './AdminSuggestedItemCard';
import BulkActionBar from './BulkActionBar';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import EditItemSuggestionModal from './EditItemSuggestionModal';
import DeleteSuggestionModal from './DeleteSuggestionModal';
import ApproveRejectModal from './ApproveRejectModal';
import Pagination from '@/components/admin/shared/Pagination';

interface ItemSuggestion extends AdminSuggestedItemSuggestion {
  metadata: any;
  updatedAt: string;
}

interface ItemSuggestionsTableProps {
  status?: string;
  currentPage: number;
  onPageChange: (page: number) => void;
}

type SortOrder = 'newest' | 'oldest';

function SuggestionSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse">
          <div className="flex gap-3">
            <div className="w-14 h-14 bg-gray-200 rounded-xl" />
            <div className="flex-1">
              <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-3" />
              <div className="h-3 bg-gray-200 rounded w-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ItemSuggestionsTable({
  status,
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
  }, [status, currentPage, sortOrder]);

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
            fetch(`/api/admin/suggestions/items/${s.id}`, {
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
            fetch(`/api/admin/suggestions/items/${s.id}`, {
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

  const handleApproveDirect = async (suggestion: ItemSuggestion) => {
    setProcessing(suggestion.id);
    try {
      const res = await fetch(`/api/admin/suggestions/items/${suggestion.id}`, {
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

  const handleReject = (suggestion: ItemSuggestion) => {
    setSelectedSuggestion(suggestion);
    setModalAction('reject');
    setIsApproveRejectModalOpen(true);
  };

  const handleEdit = (suggestion: ItemSuggestion) => {
    setSelectedSuggestion(suggestion);
    setIsEditModalOpen(true);
  };

  const handleDelete = (suggestion: ItemSuggestion) => {
    setSelectedSuggestion(suggestion);
    setIsDeleteModalOpen(true);
  };

  const handleViewList = (suggestion: ItemSuggestion) => {
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
    ? { title: '🎉 همه پیشنهادها بررسی شدند', subtitle: 'وایب تحت کنترله!' }
    : { title: 'پیشنهادی یافت نشد', subtitle: 'هیچ پیشنهاد آیتمی با این فیلتر وجود ندارد' };

  if (suggestions.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Package className="w-10 h-10 text-gray-400" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">{emptyMessage.title}</h3>
        <p className="text-gray-500">{emptyMessage.subtitle}</p>
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

      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <p className="text-sm text-gray-500">
          <span className="font-medium text-gray-900">{total}</span> پیشنهاد یافت شد
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={bulkMode}
              onChange={(e) => {
                setBulkMode(e.target.checked);
                if (!e.target.checked) setSelectedIds(new Set());
              }}
              className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <span className="text-sm text-gray-600">انتخاب چندتایی</span>
          </label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">مرتب‌سازی:</span>
            <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setSortOrder('newest')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  sortOrder === 'newest' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
                جدیدترین
              </button>
              <button
                onClick={() => setSortOrder('oldest')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  sortOrder === 'oldest' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <ArrowUpDown className="w-3.5 h-3.5 rotate-180" />
                قدیمی‌ترین
              </button>
            </div>
          </div>
        </div>
      </div>

      {bulkMode && suggestions.length > 0 && (
        <div className="flex items-center gap-2 mb-3">
          <input
            ref={selectAllRef}
            type="checkbox"
            onChange={selectAll}
            className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
            aria-label="انتخاب همه"
          />
          <span className="text-sm text-gray-600">انتخاب همه</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            searchParams={{ tab: 'items', ...(status && { status }) }}
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
