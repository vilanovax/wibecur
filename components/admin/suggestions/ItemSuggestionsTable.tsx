'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, Edit, CheckCircle, XCircle, Trash2, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { faIR } from 'date-fns/locale';
import EditItemSuggestionModal from './EditItemSuggestionModal';
import DeleteSuggestionModal from './DeleteSuggestionModal';
import ApproveRejectModal from './ApproveRejectModal';
import Pagination from '@/components/admin/shared/Pagination';

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
  const [selectedSuggestion, setSelectedSuggestion] = useState<ItemSuggestion | null>(null);
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
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          در انتظار
        </span>
      ),
      approved: (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          تایید شده
        </span>
      ),
      rejected: (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          رد شده
        </span>
      ),
    };
    return badges[status as keyof typeof badges] || badges.pending;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">هیچ پیشنهادی یافت نشد</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">عنوان</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">لیست</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">کاربر</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">تاریخ</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">وضعیت</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">عملیات</th>
            </tr>
          </thead>
          <tbody>
            {suggestions.map((suggestion) => (
              <tr
                key={suggestion.id}
                className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <td className="py-4 px-4">
                  <div className="font-medium text-gray-900">{suggestion.title}</div>
                  {suggestion.description && (
                    <div className="text-sm text-gray-500 mt-1 line-clamp-1">
                      {suggestion.description}
                    </div>
                  )}
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{suggestion.lists.categories.icon}</span>
                    <span className="text-sm text-gray-700">{suggestion.lists.title}</span>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div className="text-sm">
                    <div className="font-medium text-gray-900">
                      {suggestion.users.name || suggestion.users.email}
                    </div>
                    {suggestion.users.name && (
                      <div className="text-gray-500 text-xs">{suggestion.users.email}</div>
                    )}
                  </div>
                </td>
                <td className="py-4 px-4 text-sm text-gray-500">
                  {formatDistanceToNow(new Date(suggestion.createdAt), {
                    addSuffix: true,
                    locale: faIR,
                  })}
                </td>
                <td className="py-4 px-4">{getStatusBadge(suggestion.status)}</td>
                <td className="py-4 px-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(suggestion)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="ویرایش"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    {suggestion.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleApprove(suggestion)}
                          disabled={processing === suggestion.id}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                          title="تایید"
                        >
                          {processing === suggestion.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <CheckCircle className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleReject(suggestion)}
                          disabled={processing === suggestion.id}
                          className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors disabled:opacity-50"
                          title="رد"
                        >
                          {processing === suggestion.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <XCircle className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(suggestion)}
                          disabled={processing === suggestion.id}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="حذف"
                        >
                          {processing === suggestion.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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

