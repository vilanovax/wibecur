'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Edit, CheckCircle, XCircle, Trash2, Loader2, ArrowUpDown, User, Calendar, ListIcon, ExternalLink, Package } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { faIR } from 'date-fns/locale';
import EditItemSuggestionModal from './EditItemSuggestionModal';
import DeleteSuggestionModal from './DeleteSuggestionModal';
import ApproveRejectModal from './ApproveRejectModal';
import Pagination from '@/components/admin/shared/Pagination';
import Image from 'next/image';

interface ItemSuggestion {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  externalUrl: string | null;
  listId: string;
  userId: string;
  status: string;
  adminNotes: string | null;
  metadata: any;
  createdAt: string;
  updatedAt: string;
  lists: {
    id: string;
    title: string;
    slug: string;
    categories: {
      id: string;
      name: string;
      icon: string;
      slug: string;
    };
  };
  users: {
    id: string;
    name: string | null;
    email: string;
  };
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
        <div key={i} className="bg-gray-50 rounded-xl p-5 animate-pulse">
          <div className="flex gap-4">
            <div className="w-20 h-20 bg-gray-200 rounded-xl"></div>
            <div className="flex-1">
              <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
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

  useEffect(() => {
    fetchSuggestions();
  }, [status, currentPage, sortOrder]);

  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        sort: sortOrder,
      });
      if (status) {
        params.set('status', status);
      }

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

  const handleEdit = (suggestion: ItemSuggestion) => {
    setSelectedSuggestion(suggestion);
    setIsEditModalOpen(true);
  };

  const handleDelete = (suggestion: ItemSuggestion) => {
    setSelectedSuggestion(suggestion);
    setIsDeleteModalOpen(true);
  };

  const handleApprove = (suggestion: ItemSuggestion) => {
    setSelectedSuggestion(suggestion);
    setModalAction('approve');
    setIsApproveRejectModalOpen(true);
  };

  const handleReject = (suggestion: ItemSuggestion) => {
    setSelectedSuggestion(suggestion);
    setModalAction('reject');
    setIsApproveRejectModalOpen(true);
  };

  const handleModalClose = () => {
    setIsEditModalOpen(false);
    setIsDeleteModalOpen(false);
    setIsApproveRejectModalOpen(false);
    setSelectedSuggestion(null);
    setModalAction(null);
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-200">
          <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse"></span>
          در انتظار
        </span>
      ),
      approved: (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
          تایید شده
        </span>
      ),
      rejected: (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
          <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
          رد شده
        </span>
      ),
    };
    return badges[status as keyof typeof badges] || badges.pending;
  };

  if (loading) {
    return <SuggestionSkeleton />;
  }

  if (suggestions.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Package className="w-10 h-10 text-gray-400" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">پیشنهادی یافت نشد</h3>
        <p className="text-gray-500">هیچ پیشنهاد آیتمی با این فیلتر وجود ندارد</p>
      </div>
    );
  }

  return (
    <>
      {/* Header with Count and Sort */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <p className="text-sm text-gray-500">
          <span className="font-medium text-gray-900">{total}</span> پیشنهاد یافت شد
        </p>

        {/* Sort Controls */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">مرتب‌سازی:</span>
          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setSortOrder('newest')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                sortOrder === 'newest'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              جدیدترین
            </button>
            <button
              onClick={() => setSortOrder('oldest')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                sortOrder === 'oldest'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <ArrowUpDown className="w-3.5 h-3.5 rotate-180" />
              قدیمی‌ترین
            </button>
          </div>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {suggestions.map((suggestion) => (
          <div
            key={suggestion.id}
            className="group bg-gray-50 hover:bg-white rounded-xl p-5 border border-transparent hover:border-gray-200 hover:shadow-lg transition-all duration-300"
          >
            <div className="flex gap-4">
              {/* Image */}
              <div className="flex-shrink-0">
                {suggestion.imageUrl ? (
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-gray-100 shadow-sm group-hover:shadow-md transition-shadow">
                    <Image
                      src={suggestion.imageUrl}
                      alt={suggestion.title}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                    <Package className="w-8 h-8 text-gray-400" />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-bold text-gray-900 truncate group-hover:text-primary transition-colors">
                    {suggestion.title}
                  </h3>
                  {getStatusBadge(suggestion.status)}
                </div>

                {suggestion.description && (
                  <p className="text-sm text-gray-500 line-clamp-2 mb-3 leading-relaxed">
                    {suggestion.description}
                  </p>
                )}

                {/* Meta Info */}
                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
                  <div className="flex items-center gap-1">
                    <span className="text-base">{suggestion.lists.categories.icon}</span>
                    <ListIcon className="w-3.5 h-3.5" />
                    <span className="truncate max-w-[120px]">{suggestion.lists.title}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5" />
                    <span>{suggestion.users.name || suggestion.users.email}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>
                      {formatDistanceToNow(new Date(suggestion.createdAt), {
                        addSuffix: true,
                        locale: faIR,
                      })}
                    </span>
                  </div>
                </div>

                {/* External URL */}
                {suggestion.externalUrl && (
                  <a
                    href={suggestion.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-2 text-xs text-blue-500 hover:text-blue-600 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                    مشاهده لینک
                  </a>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t border-gray-100">
              <button
                onClick={() => handleEdit(suggestion)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Edit className="w-4 h-4" />
                ویرایش
              </button>
              {suggestion.status === 'pending' && (
                <>
                  <button
                    onClick={() => handleApprove(suggestion)}
                    disabled={processing === suggestion.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {processing === suggestion.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                    تایید
                  </button>
                  <button
                    onClick={() => handleReject(suggestion)}
                    disabled={processing === suggestion.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-orange-600 hover:bg-orange-50 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {processing === suggestion.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <XCircle className="w-4 h-4" />
                    )}
                    رد
                  </button>
                  <button
                    onClick={() => handleDelete(suggestion)}
                    disabled={processing === suggestion.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {processing === suggestion.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                    حذف
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

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
                fetchSuggestions();
              }}
            />
          )}
        </>
      )}
    </>
  );
}
