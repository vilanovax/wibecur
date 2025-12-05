'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, Loader2 } from 'lucide-react';
import BottomSheet from '@/components/mobile/shared/BottomSheet';
import Toast from '@/components/shared/Toast';

interface CreateListFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}


export default function CreateListForm({ isOpen, onClose, onSuccess }: CreateListFormProps) {
  const [formData, setFormData] = useState({
    title: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [maxPersonalLists, setMaxPersonalLists] = useState(3);
  const [currentListsCount, setCurrentListsCount] = useState(0);

  useEffect(() => {
    if (isOpen) {
      fetchSettings();
      fetchUserListsCount();
      // Reset form when opening
      setFormData({
        title: '',
      });
      setError('');
    }
  }, [isOpen]);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setMaxPersonalLists(data.data.maxPersonalLists || 3);
        }
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const fetchUserListsCount = async () => {
    try {
      const res = await fetch('/api/user/my-lists?page=1&limit=1000');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          const privateLists = data.data.lists.filter((list: any) => !list.isPublic);
          setCurrentListsCount(privateLists.length);
        }
      }
    } catch (error) {
      console.error('Error fetching user lists count:', error);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
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

    // Check max personal lists limit
    if (currentListsCount >= maxPersonalLists) {
      setError(`شما نمی‌توانید بیشتر از ${maxPersonalLists} لیست خصوصی ایجاد کنید. لطفاً یکی از لیست‌های قبلی را حذف کنید یا آن را عمومی کنید.`);
      return;
    }

    setIsLoading(true);

    try {
      console.log('Submitting form data:', formData);
      const res = await fetch('/api/user/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          // description and coverImage are not required for private lists
        }),
      });

      const data = await res.json();
      console.log('API response:', { status: res.status, data });

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'خطا در ایجاد لیست');
      }

      // Show success message
      setToastMessage(data.message || 'لیست با موفقیت ایجاد شد');
      setShowToast(true);

      // Reset form
      setFormData({
        title: '',
      });
      
      // Refresh lists count
      fetchUserListsCount();

      // Close after delay
      setTimeout(() => {
        onClose();
        if (onSuccess) {
          onSuccess();
        }
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'خطا در ایجاد لیست');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <BottomSheet isOpen={isOpen} onClose={onClose} title="ایجاد لیست شخصی">
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto p-6 min-h-0">
            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm mb-4">
                {error}
              </div>
            )}

            {/* Info Messages */}
            <div className="space-y-3 mb-6">
              {currentListsCount >= maxPersonalLists && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    شما به حداکثر تعداد لیست‌های خصوصی ({maxPersonalLists}) رسیده‌اید. لطفاً یکی از لیست‌های قبلی را حذف کنید یا آن را عمومی کنید.
                  </p>
                </div>
              )}
              {currentListsCount < maxPersonalLists && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-sm text-gray-700">
                    شما {currentListsCount} از {maxPersonalLists} لیست خصوصی خود را ایجاد کرده‌اید.
                  </p>
                </div>
              )}
            </div>

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

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-600">
                <span className="font-medium">نکته:</span> برای تبدیل این لیست به عمومی، می‌توانید از تنظیمات لیست، توضیحات و تصویر کاور را اضافه کنید.
              </p>
            </div>
          </div>

          <div className="flex-shrink-0 bg-white border-t border-gray-200 p-4">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                disabled={isLoading}
              >
                انصراف
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                disabled={isLoading || !formData.title.trim() || currentListsCount >= maxPersonalLists}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    در حال ایجاد...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    ایجاد لیست
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </BottomSheet>

      {/* Toast Notification */}
      {showToast && (
        <Toast
          message={toastMessage}
          type="success"
          duration={5000}
          onClose={() => setShowToast(false)}
        />
      )}
    </>
  );
}

