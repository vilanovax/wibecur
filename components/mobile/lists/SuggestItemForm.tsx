'use client';

import { useState, useEffect } from 'react';
import { X, Send, Loader2 } from 'lucide-react';
import BottomSheet from '@/components/mobile/shared/BottomSheet';
import Toast from '@/components/shared/Toast';

interface SuggestItemFormProps {
  isOpen: boolean;
  onClose: () => void;
}

interface List {
  id: string;
  title: string;
  categories: {
    name: string;
    icon: string;
  };
}

export default function SuggestItemForm({ isOpen, onClose }: SuggestItemFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    imageUrl: '',
    externalUrl: '',
    listId: '',
  });
  const [lists, setLists] = useState<List[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingLists, setIsLoadingLists] = useState(true);
  const [error, setError] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchLists();
    }
  }, [isOpen]);

  const fetchLists = async () => {
    setIsLoadingLists(true);
    try {
      const res = await fetch('/api/lists/public');
      const data = await res.json();
      if (data.success) {
        setLists(data.data || []);
        if (data.data && data.data.length > 0) {
          setFormData((prev) => ({ ...prev, listId: data.data[0].id }));
        }
      }
    } catch (error) {
      console.error('Error fetching lists:', error);
    } finally {
      setIsLoadingLists(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.title.trim()) {
      setError('عنوان الزامی است');
      return;
    }

    if (!formData.listId) {
      setError('لطفاً یک لیست انتخاب کنید');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/suggestions/items', {
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
        imageUrl: '',
        externalUrl: '',
        listId: lists.length > 0 ? lists[0].id : '',
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
      <BottomSheet isOpen={isOpen} onClose={onClose} title="پیشنهاد آیتم">
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
                placeholder="عنوان آیتم را وارد کنید"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                توضیحات
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none resize-none"
                placeholder="توضیحات آیتم (اختیاری)"
              />
            </div>

            {/* List Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                انتخاب لیست <span className="text-red-500">*</span>
              </label>
              {isLoadingLists ? (
                <div className="px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-center text-gray-500">
                  در حال بارگذاری لیست‌ها...
                </div>
              ) : (
                <select
                  name="listId"
                  value={formData.listId}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none bg-white"
                >
                  <option value="">یک لیست انتخاب کنید</option>
                  {lists.map((list) => (
                    <option key={list.id} value={list.id}>
                      {list.categories.icon} {list.title}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Image URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                لینک تصویر
              </label>
              <input
                type="url"
                name="imageUrl"
                value={formData.imageUrl}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                placeholder="https://example.com/image.jpg (اختیاری)"
              />
            </div>

            {/* External URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                لینک خارجی
              </label>
              <input
                type="url"
                name="externalUrl"
                value={formData.externalUrl}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                placeholder="https://example.com (اختیاری)"
              />
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

