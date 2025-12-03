'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, Loader2, Image as ImageIcon, X } from 'lucide-react';
import BottomSheet from '@/components/mobile/shared/BottomSheet';
import Toast from '@/components/shared/Toast';

interface SuggestListFormProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export default function SuggestListForm({ isOpen, onClose }: SuggestListFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    coverImage: '',
    categoryId: '',
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [error, setError] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const MAX_DESCRIPTION_LENGTH = 300;

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

  const fetchCategories = async () => {
    setIsLoadingCategories(true);
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      if (data.success && data.data) {
        const activeCategories = data.data.filter((cat: Category) => cat);
        setCategories(activeCategories);
        if (activeCategories.length > 0) {
          setFormData((prev) => ({ ...prev, categoryId: activeCategories[0].id }));
        }
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setIsLoadingCategories(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    
    // Limit description length
    if (name === 'description' && value.length > MAX_DESCRIPTION_LENGTH) {
      return;
    }
    
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('لطفاً یک فایل تصویری انتخاب کنید');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('حجم فایل باید کمتر از 5 مگابایت باشد');
      return;
    }

    setError('');
    setIsUploadingImage(true);

    try {
      // Upload file to server
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
      setFormData((prev) => ({ ...prev, coverImage: data.url }));
    } catch (err: any) {
      setError(err.message || 'خطا در آپلود تصویر');
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.title.trim()) {
      setError('عنوان الزامی است');
      return;
    }

    if (!formData.categoryId) {
      setError('لطفاً یک دسته‌بندی انتخاب کنید');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/suggestions/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'خطا در ثبت پیشنهاد');
      }

      setToastMessage(data.message || 'پیشنهاد شما با موفقیت ثبت شد');
      setShowToast(true);

      // Reset form
      setFormData({
        title: '',
        description: '',
        coverImage: '',
        categoryId: categories.length > 0 ? categories[0].id : '',
      });

      // Close modal after 2 seconds
      setTimeout(() => {
        onClose();
        setShowToast(false);
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'خطا در ثبت پیشنهاد');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <BottomSheet isOpen={isOpen} onClose={onClose} title="پیشنهاد لیست">
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                عنوان <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                placeholder="عنوان لیست را وارد کنید"
              />
            </div>

            {/* Description */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  توضیحات
                </label>
                <span className={`text-xs ${
                  formData.description.length > MAX_DESCRIPTION_LENGTH
                    ? 'text-red-500'
                    : 'text-gray-500'
                }`}>
                  {formData.description.length} / {MAX_DESCRIPTION_LENGTH}
                </span>
              </div>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                maxLength={MAX_DESCRIPTION_LENGTH}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none resize-none"
                placeholder="توضیحات لیست (حداکثر 300 کاراکتر)"
              />
            </div>

            {/* Category Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                انتخاب دسته‌بندی <span className="text-red-500">*</span>
              </label>
              {isLoadingCategories ? (
                <div className="px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-center text-gray-500">
                  در حال بارگذاری دسته‌بندی‌ها...
                </div>
              ) : (
                <select
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none bg-white"
                >
                  <option value="">یک دسته‌بندی انتخاب کنید</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Cover Image */}
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
                  <div className="relative w-full h-48 rounded-lg overflow-hidden border border-gray-200">
                    <img
                      src={formData.coverImage}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, coverImage: '' }))}
                      className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
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
          </div>

          {/* Footer with Submit Button */}
          <div className="border-t border-gray-200 p-6">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                انصراف
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    در حال ثبت...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    ثبت پیشنهاد
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </BottomSheet>

      {showToast && (
        <Toast
          message={toastMessage}
          type="success"
          onClose={() => setShowToast(false)}
        />
      )}
    </>
  );
}

