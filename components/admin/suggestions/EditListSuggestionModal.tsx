'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Save, CheckCircle, XCircle, Trash2, Loader2, Image as ImageIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { faIR } from 'date-fns/locale';
import DeleteSuggestionModal from './DeleteSuggestionModal';
import ApproveRejectModal from './ApproveRejectModal';

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

interface EditListSuggestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  suggestion: ListSuggestion;
  onSuccess: () => void;
}

export default function EditListSuggestionModal({
  isOpen,
  onClose,
  suggestion,
  onSuccess,
}: EditListSuggestionModalProps) {
  const [formData, setFormData] = useState({
    title: suggestion.title,
    description: suggestion.description || '',
    coverImage: suggestion.coverImage || '',
    categoryId: suggestion.categoryId,
  });
  const [categories, setCategories] = useState<Array<{ id: string; name: string; icon: string }>>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loading, setLoading] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [error, setError] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isApproveRejectModalOpen, setIsApproveRejectModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState<'approve' | 'reject' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && suggestion) {
      setFormData({
        title: suggestion.title,
        description: suggestion.description || '',
        coverImage: suggestion.coverImage || '',
        categoryId: suggestion.categoryId,
      });
    }
  }, [suggestion, isOpen]);

  const fetchCategories = async () => {
    setLoadingCategories(true);
    try {
      const res = await fetch('/api/admin/categories');
      const data = await res.json();
      // API returns array directly, not wrapped in success/data
      if (Array.isArray(data)) {
        setCategories(data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoadingCategories(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('لطفاً یک فایل تصویری انتخاب کنید');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('حجم فایل نباید بیشتر از 5 مگابایت باشد');
      return;
    }

    setIsUploadingImage(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'خطا در آپلود تصویر');
      }

      const data = await res.json();
      
      if (!data.url) {
        throw new Error('خطا در دریافت آدرس تصویر');
      }

      setFormData((prev) => ({
        ...prev,
        coverImage: data.url,
      }));
    } catch (error: any) {
      setError(error.message || 'خطا در آپلود تصویر');
    } finally {
      setIsUploadingImage(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/admin/suggestions/lists/${suggestion.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'edit',
          title: formData.title,
          description: formData.description?.trim() || null,
          coverImage: formData.coverImage?.trim() || null,
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
              <h2 className="text-xl font-bold text-gray-900">ویرایش پیشنهاد لیست</h2>
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
                دسته‌بندی
              </label>
              {loadingCategories ? (
                <div className="px-4 py-3 border border-gray-300 rounded-lg bg-gray-50">
                  در حال بارگذاری...
                </div>
              ) : (
                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                تصویر کاور
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              {!formData.coverImage ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingImage}
                  className="w-full px-4 py-12 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors flex flex-col items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploadingImage ? (
                    <>
                      <Loader2 className="w-8 h-8 text-gray-600 animate-spin" />
                      <span className="text-sm text-gray-700">در حال آپلود...</span>
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-8 h-8 text-gray-400" />
                      <span className="text-sm font-medium text-gray-700">انتخاب تصویر از گالری</span>
                      <span className="text-xs text-gray-500">فرمت‌های مجاز: JPG, PNG, GIF (حداکثر 5 مگابایت)</span>
                    </>
                  )}
                </button>
              ) : (
                <div className="space-y-2">
                  <div className="relative w-full h-48 rounded-lg overflow-hidden border border-gray-200 group">
                    <img
                      src={formData.coverImage}
                      alt="Cover"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, coverImage: '' }))}
                      className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                      aria-label="حذف تصویر"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingImage}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUploadingImage ? (
                      <>
                        <Loader2 className="w-4 h-4 text-gray-600 animate-spin" />
                        <span className="text-sm text-gray-700">در حال آپلود...</span>
                      </>
                    ) : (
                      <>
                        <ImageIcon className="w-4 h-4 text-gray-600" />
                        <span className="text-sm text-gray-700">تغییر تصویر</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

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
        type="list"
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
          type="list"
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

