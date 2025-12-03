'use client';

import { useState, useEffect } from 'react';
import { X, Save, CheckCircle, XCircle, Trash2, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { faIR } from 'date-fns/locale';
import DeleteSuggestionModal from './DeleteSuggestionModal';
import ApproveRejectModal from './ApproveRejectModal';
import DynamicMetadataFields from '@/components/admin/items/DynamicMetadataFields';

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

interface EditItemSuggestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  suggestion: ItemSuggestion;
  onSuccess: () => void;
}

export default function EditItemSuggestionModal({
  isOpen,
  onClose,
  suggestion,
  onSuccess,
}: EditItemSuggestionModalProps) {
  const [formData, setFormData] = useState({
    title: suggestion.title,
    description: suggestion.description || '',
    imageUrl: suggestion.imageUrl || '',
    externalUrl: suggestion.externalUrl || '',
    metadata: suggestion.metadata || {},
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isApproveRejectModalOpen, setIsApproveRejectModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState<'approve' | 'reject' | null>(null);

  useEffect(() => {
    if (isOpen && suggestion) {
      setFormData({
        title: suggestion.title,
        description: suggestion.description || '',
        imageUrl: suggestion.imageUrl || '',
        externalUrl: suggestion.externalUrl || '',
        metadata: suggestion.metadata || {},
      });
    }
  }, [suggestion, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/admin/suggestions/items/${suggestion.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'edit',
          title: formData.title,
          description: formData.description || null,
          imageUrl: formData.imageUrl || null,
          externalUrl: formData.externalUrl || null,
          metadata: formData.metadata,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'خطا در ذخیره تغییرات');
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      setError(error.message || 'خطا در ذخیره تغییرات');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
        <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full my-8">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-bold text-gray-900">ویرایش پیشنهاد آیتم</h2>
              <p className="text-sm text-gray-500 mt-1">{suggestion.title}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* User Info */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">کاربر:</span>
                  <span className="font-medium text-gray-900 mr-2">
                    {suggestion.users.name || suggestion.users.email}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">لیست:</span>
                  <span className="font-medium text-gray-900 mr-2">
                    {suggestion.lists.title}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">تاریخ:</span>
                  <span className="font-medium text-gray-900 mr-2">
                    {formatDistanceToNow(new Date(suggestion.createdAt), {
                      addSuffix: true,
                      locale: faIR,
                    })}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">وضعیت:</span>
                  <span
                    className={`font-medium mr-2 ${
                      suggestion.status === 'pending'
                        ? 'text-yellow-600'
                        : suggestion.status === 'approved'
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {suggestion.status === 'pending'
                      ? 'در انتظار'
                      : suggestion.status === 'approved'
                      ? 'تایید شده'
                      : 'رد شده'}
                  </span>
                </div>
              </div>
            </div>

            {/* Form Fields */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                عنوان <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                توضیحات
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                تصویر
              </label>
              <input
                type="url"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                placeholder="لینک تصویر"
              />
              {formData.imageUrl && (
                <div className="mt-2 relative w-full h-48 rounded-lg overflow-hidden border border-gray-200">
                  <img
                    src={formData.imageUrl}
                    alt="Item"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                لینک خارجی
              </label>
              <input
                type="url"
                value={formData.externalUrl}
                onChange={(e) => setFormData({ ...formData, externalUrl: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                placeholder="https://..."
              />
            </div>

            {/* Metadata Fields */}
            <DynamicMetadataFields
              categorySlug={suggestion.lists.categories.slug}
              metadata={formData.metadata}
              onChange={(metadata) => setFormData({ ...formData, metadata })}
            />

            {/* Admin Notes */}
            {suggestion.adminNotes && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium text-blue-900 mb-1">یادداشت ادمین:</p>
                <p className="text-sm text-blue-700">{suggestion.adminNotes}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div className="flex gap-2">
                {suggestion.status === 'pending' && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setModalAction('approve');
                        setIsApproveRejectModalOpen(true);
                      }}
                      className="px-4 py-2 text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors flex items-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      تایید
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setModalAction('reject');
                        setIsApproveRejectModalOpen(true);
                      }}
                      className="px-4 py-2 text-orange-700 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors flex items-center gap-2"
                    >
                      <XCircle className="w-4 h-4" />
                      رد
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsDeleteModalOpen(true)}
                      className="px-4 py-2 text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      حذف
                    </button>
                  </>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-white bg-primary hover:bg-primary-dark rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      در حال ذخیره...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      ذخیره تغییرات
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <DeleteSuggestionModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        suggestionId={suggestion.id}
        suggestionTitle={suggestion.title}
        type="item"
        onSuccess={() => {
          setIsDeleteModalOpen(false);
          onSuccess();
          onClose();
        }}
      />

      {modalAction && (
        <ApproveRejectModal
          isOpen={isApproveRejectModalOpen}
          onClose={() => {
            setIsApproveRejectModalOpen(false);
            setModalAction(null);
          }}
          suggestionId={suggestion.id}
          suggestionTitle={suggestion.title}
          action={modalAction}
          type="item"
          onSuccess={() => {
            setIsApproveRejectModalOpen(false);
            setModalAction(null);
            onSuccess();
            onClose();
          }}
        />
      )}
    </>
  );
}

