'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Edit, CheckCircle, XCircle, Trash2, Loader2, User, Calendar, FolderOpen, FileText } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { faIR } from 'date-fns/locale';
import EditListSuggestionModal from './EditListSuggestionModal';
import DeleteSuggestionModal from './DeleteSuggestionModal';
import ApproveRejectModal from './ApproveRejectModal';
import Pagination from '@/components/admin/shared/Pagination';

interface ListSuggestion {
  id: string;
  title: string;
  description: string | null;
  coverImage: string | null;
  categoryId: string;
  userId: string;
  status: string;
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
  categories: {
    id: string;
    name: string;
    icon: string;
  };
  users: {
    id: string;
    name: string | null;
    email: string;
  };
}

interface ListSuggestionsTableProps {
  status?: string;
  currentPage: number;
  onPageChange: (page: number) => void;
}

function SuggestionSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-gray-50 rounded-xl p-5 animate-pulse">
          <div className="flex gap-4">
            <div className="w-16 h-16 bg-gray-200 rounded-xl"></div>
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

export default function ListSuggestionsTable({
  status,
  currentPage,
  onPageChange,
}: ListSuggestionsTableProps) {
  const router = useRouter();
  const [suggestions, setSuggestions] = useState<ListSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedSuggestion, setSelectedSuggestion] = useState<ListSuggestion | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isApproveRejectModalOpen, setIsApproveRejectModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState<'approve' | 'reject' | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    fetchSuggestions();
  }, [status, currentPage]);

  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
      });
      if (status) {
        params.set('status', status);
      }

      const res = await fetch(`/api/admin/suggestions/lists?${params.toString()}`);
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

  const handleEdit = (suggestion: ListSuggestion) => {
    setSelectedSuggestion(suggestion);
    setIsEditModalOpen(true);
  };

  const handleDelete = (suggestion: ListSuggestion) => {
    setSelectedSuggestion(suggestion);
    setIsDeleteModalOpen(true);
  };

  const handleApprove = (suggestion: ListSuggestion) => {
    setSelectedSuggestion(suggestion);
    setModalAction('approve');
    setIsApproveRejectModalOpen(true);
  };

  const handleReject = (suggestion: ListSuggestion) => {
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
          <FileText className="w-10 h-10 text-gray-400" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">پیشنهادی یافت نشد</h3>
        <p className="text-gray-500">هیچ پیشنهاد لیستی با این فیلتر وجود ندارد</p>
      </div>
    );
  }

  return (
    <>
      {/* Results Count */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">
          <span className="font-medium text-gray-900">{total}</span> پیشنهاد یافت شد
        </p>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {suggestions.map((suggestion) => (
          <div
            key={suggestion.id}
            className="group bg-gray-50 hover:bg-white rounded-xl p-5 border border-transparent hover:border-gray-200 hover:shadow-lg transition-all duration-300"
          >
            <div className="flex gap-4">
              {/* Category Icon */}
              <div className="flex-shrink-0">
                <div className="w-14 h-14 rounded-xl bg-white shadow-sm flex items-center justify-center text-2xl group-hover:shadow-md transition-shadow">
                  {suggestion.categories.icon}
                </div>
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
                    <FolderOpen className="w-3.5 h-3.5" />
                    <span>{suggestion.categories.name}</span>
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
