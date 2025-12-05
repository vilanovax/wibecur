'use client';

import { useState, useEffect, useRef } from 'react';
import { Loader2, Image as ImageIcon, X } from 'lucide-react';
import BottomSheet from '@/components/mobile/shared/BottomSheet';

interface EditPersonalListFormProps {
  isOpen: boolean;
  onClose: () => void;
  list: {
    id: string;
    title: string;
    description: string | null;
    coverImage: string | null;
  };
  onSuccess?: () => void;
}

export default function EditPersonalListForm({
  isOpen,
  onClose,
  list,
  onSuccess,
}: EditPersonalListFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    coverImage: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const MAX_DESCRIPTION_LENGTH = 300;

  useEffect(() => {
    if (isOpen) {
      setFormData({
        title: list.title,
        description: list.description || '',
        coverImage: list.coverImage || '',
      });
      setError('');
    }
  }, [isOpen, list]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
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
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData,
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

    setIsLoading(true);

    try {
      const res = await fetch(`/api/user/lists/${list.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          coverImage: formData.coverImage.trim() || null,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'خطا در ویرایش لیست');
      }

      if (onSuccess) {
        onSuccess();
      }

      onClose();
    } catch (err: any) {
      setError(err.message || 'خطا در ویرایش لیست');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="ویرایش لیست">
      <form onSubmit={handleSubmit} className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto p-6 min-h-0">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm mb-4">
              {error}
            </div>
          )}

          {/* Title */}
          <div className="mb-4">
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              عنوان لیست <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="عنوان لیست را وارد کنید..."
              required
              disabled={isLoading}
            />
          </div>

          {/* Description */}
          <div className="mb-4">
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              توضیحات (اختیاری)
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              maxLength={MAX_DESCRIPTION_LENGTH}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              placeholder="توضیحات لیست را وارد کنید..."
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.description.length} / {MAX_DESCRIPTION_LENGTH} کاراکتر
            </p>
          </div>

          {/* Cover Image */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              تصویر کاور (اختیاری)
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              disabled={isLoading || isUploadingImage}
            />
            {formData.coverImage ? (
              <div className="space-y-2">
                <div className="relative w-full h-48 rounded-lg overflow-hidden border border-gray-200">
                  <img
                    src={formData.coverImage}
                    alt="Cover preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, coverImage: '' }))}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors"
                    disabled={isLoading || isUploadingImage}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading || isUploadingImage}
                className="w-full px-4 py-12 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary transition-colors flex flex-col items-center justify-center gap-2 text-gray-600"
              >
                {isUploadingImage ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    <span className="text-sm">در حال آپلود...</span>
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-8 h-8" />
                    <span className="text-sm font-medium">انتخاب تصویر از گالری</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        <div className="flex-shrink-0 bg-white border-t border-gray-200 p-4">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              disabled={isLoading || isUploadingImage}
            >
              انصراف
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              disabled={isLoading || isUploadingImage || !formData.title.trim()}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  در حال ذخیره...
                </>
              ) : (
                'ذخیره تغییرات'
              )}
            </button>
          </div>
        </div>
      </form>
    </BottomSheet>
  );
}

