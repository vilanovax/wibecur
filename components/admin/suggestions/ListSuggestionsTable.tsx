'use client';

import { useState, useEffect } from 'react';
import { ListIcon } from 'lucide-react';
import AdminSuggestedListCard, {
  type AdminSuggestedListSuggestion,
} from './AdminSuggestedListCard';
import EditListSuggestionModal from './EditListSuggestionModal';
import DeleteSuggestionModal from './DeleteSuggestionModal';
import ApproveRejectModal from './ApproveRejectModal';
import Pagination from '@/components/admin/shared/Pagination';

interface ListSuggestionsTableProps {
  status?: string;
  currentPage: number;
  onPageChange: (page: number) => void;
  onSwitchToItems?: () => void;
  itemPendingCount?: number;
}

function SuggestionSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="animate-pulse rounded-xl border border-gray-100 dark:border-gray-700 p-4">
          <div className="flex gap-3">
            <div className="h-14 w-11 rounded-lg bg-gray-200 dark:bg-gray-700" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-2/3 rounded bg-gray-200 dark:bg-gray-700" />
              <div className="h-3 w-1/2 rounded bg-gray-100 dark:bg-gray-700/50" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ListSuggestionsTable({
  status,
  currentPage,
  onPageChange,
  onSwitchToItems,
  itemPendingCount = 0,
}: ListSuggestionsTableProps) {
  const [suggestions, setSuggestions] = useState<AdminSuggestedListSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedSuggestion, setSelectedSuggestion] = useState<AdminSuggestedListSuggestion | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isApproveRejectModalOpen, setIsApproveRejectModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState<'approve' | 'reject' | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    void fetchSuggestions(ctrl.signal);
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, currentPage]);

  const fetchSuggestions = async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
      });
      if (status) params.set('status', status);

      const res = await fetch(`/api/admin/suggestions/lists?${params.toString()}`, { signal });
      const data = await res.json();

      if (data.success) {
        setSuggestions(data.data.suggestions || []);
        setTotalPages(data.data.pagination.totalPages || 1);
        setTotal(data.data.pagination.total || 0);
      }
    } catch (error) {
      if ((error as Error)?.name === 'AbortError') return; // پاسخ قدیمی لغو شد
      console.error('Error fetching suggestions:', error);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  };

  const handleModalClose = () => {
    setIsEditModalOpen(false);
    setIsDeleteModalOpen(false);
    setIsApproveRejectModalOpen(false);
    setSelectedSuggestion(null);
    setModalAction(null);
  };

  if (loading) return <SuggestionSkeleton />;

  if (suggestions.length === 0) {
    const isPendingFilter = status === 'pending';
    const isAllFilter = !status;

    return (
      <div className="py-12 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-700/50">
          <ListIcon className="h-7 w-7 text-[var(--color-text-subtle)] dark:text-[var(--color-text-muted)]" />
        </div>
        <h3 className="font-semibold text-[var(--color-text)] dark:text-white">
          {isPendingFilter
            ? 'پیشنهاد لیستی در انتظار نیست'
            : isAllFilter
              ? 'هنوز پیشنهاد لیستی ثبت نشده'
              : 'پیشنهادی یافت نشد'}
        </h3>
        <p className="mt-1 text-sm text-[var(--color-text-muted)] dark:text-[var(--color-text-subtle)]">
          {itemPendingCount > 0
            ? `${itemPendingCount.toLocaleString('fa-IR')} پیشنهاد آیتم (فرم و منو) در انتظار بررسی است`
            : 'فیلتر دیگری امتحان کنید یا تب آیتم را ببینید'}
        </p>
        {onSwitchToItems && itemPendingCount > 0 && (
          <button
            type="button"
            onClick={onSwitchToItems}
            className="mt-4 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700"
          >
            رفتن به پیشنهادات آیتم ({itemPendingCount.toLocaleString('fa-IR')})
          </button>
        )}
      </div>
    );
  }

  return (
    <>
      <p className="mb-3 text-sm text-[var(--color-text-muted)] dark:text-[var(--color-text-subtle)]">
        <span className="font-semibold text-[var(--color-text)] dark:text-gray-100">{total.toLocaleString('fa-IR')}</span> پیشنهاد
        لیست
      </p>

      <div className="space-y-3">
        {suggestions.map((suggestion) => (
          <AdminSuggestedListCard
            key={suggestion.id}
            suggestion={suggestion}
            processing={processing === suggestion.id}
            onApprove={(s) => {
              setSelectedSuggestion(s);
              setModalAction('approve');
              setIsApproveRejectModalOpen(true);
            }}
            onReject={(s) => {
              setSelectedSuggestion(s);
              setModalAction('reject');
              setIsApproveRejectModalOpen(true);
            }}
            onEdit={(s) => {
              setSelectedSuggestion(s);
              setIsEditModalOpen(true);
            }}
            onDelete={(s) => {
              setSelectedSuggestion(s);
              setIsDeleteModalOpen(true);
            }}
          />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="mt-6">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            basePath="/admin/suggestions"
            searchParams={{ tab: 'lists', ...(status && { status }) }}
          />
        </div>
      )}

      {selectedSuggestion && (
        <>
          <EditListSuggestionModal
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
            type="list"
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
              type="list"
              onSuccess={() => {
                handleModalClose();
                fetchSuggestions();
              }}
            />
          )}
        </>
      )}
    </>
  );
}
