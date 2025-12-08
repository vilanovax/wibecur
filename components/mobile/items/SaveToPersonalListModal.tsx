'use client';

import { useState, useEffect } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import BottomSheet from '@/components/mobile/shared/BottomSheet';
import Toast from '@/components/shared/Toast';
import CreateListForm from '@/components/mobile/user-lists/CreateListForm';

interface PersonalList {
  id: string;
  title: string;
  description: string | null;
  coverImage: string | null;
  isPublic: boolean;
  _count: {
    items: number;
  };
}

interface SaveToPersonalListModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemId: string;
}

export default function SaveToPersonalListModal({
  isOpen,
  onClose,
  itemId,
}: SaveToPersonalListModalProps) {
  const [lists, setLists] = useState<PersonalList[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showPublic, setShowPublic] = useState(true);
  const [maxPersonalLists, setMaxPersonalLists] = useState(3);
  const [privateListsCount, setPrivateListsCount] = useState(0);
  const [isAdding, setIsAdding] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [isCreateListOpen, setIsCreateListOpen] = useState(false);

  // Load showPublic state from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('saveToList_showPublic');
      if (saved !== null) {
        setShowPublic(saved === 'true');
      }
    }
  }, []);

  // Save showPublic state to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('saveToList_showPublic', String(showPublic));
    }
  }, [showPublic]);

  // Fetch lists and settings when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchLists();
      fetchSettings();
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

  const fetchLists = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/user/lists');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setLists(data.data || []);
          // Count private lists
          const privateCount = (data.data || []).filter(
            (list: PersonalList) => !list.isPublic
          ).length;
          setPrivateListsCount(privateCount);
        }
      } else {
        throw new Error('خطا در دریافت لیست‌ها');
      }
    } catch (error: any) {
      console.error('Error fetching lists:', error);
      setToastMessage(error.message || 'خطا در دریافت لیست‌ها');
      setToastType('error');
      setShowToast(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToList = async (listId: string) => {
    setIsAdding(listId);
    try {
      const res = await fetch(`/api/user/lists/${listId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId,
          order: 0,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'خطا در افزودن آیتم');
      }

      setToastMessage('آیتم با موفقیت به لیست اضافه شد');
      setToastType('success');
      setShowToast(true);

      // Refresh lists to update item counts
      fetchLists();

      // Close modal after a short delay
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error: any) {
      setToastMessage(error.message || 'خطا در افزودن آیتم');
      setToastType('error');
      setShowToast(true);
    } finally {
      setIsAdding(null);
    }
  };

  const handleToggleShowPublic = () => {
    setShowPublic(!showPublic);
  };

  const handleCreateListSuccess = () => {
    // Refresh lists after creating new list
    fetchLists();
    setIsCreateListOpen(false);
  };

  // Filter lists based on showPublic toggle
  const filteredLists = showPublic
    ? lists
    : lists.filter((list) => !list.isPublic);

  const canCreateNewList = privateListsCount < maxPersonalLists;

  return (
    <>
      <BottomSheet isOpen={isOpen} onClose={onClose} title="ذخیره در لیست شخصی">
        <div className="flex flex-col h-full">
          {/* Toggle and Create Button */}
          <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 space-y-3">
            {/* Toggle for showing public lists */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showPublic}
                  onChange={handleToggleShowPublic}
                  className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary focus:ring-2"
                />
                <span>نمایش لیست‌های عمومی</span>
              </label>
            </div>

            {/* Create New List Button */}
            {canCreateNewList && (
              <button
                onClick={() => setIsCreateListOpen(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium"
              >
                <Plus className="w-5 h-5" />
                ایجاد لیست جدید
              </button>
            )}

            {!canCreateNewList && (
              <div className="text-sm text-gray-500 text-center py-2">
                شما به حداکثر تعداد لیست‌های خصوصی ({maxPersonalLists}) رسیده‌اید
              </div>
            )}
          </div>

          {/* Lists List */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filteredLists.length === 0 ? (
              <div className="text-center py-12 px-6">
                <div className="text-5xl mb-3">📋</div>
                <p className="text-gray-600 mb-2">
                  {showPublic
                    ? 'لیست شخصی وجود ندارد'
                    : 'لیست خصوصی وجود ندارد'}
                </p>
                {canCreateNewList && (
                  <p className="text-sm text-gray-500">
                    روی دکمه &quot;ایجاد لیست جدید&quot; کلیک کنید
                  </p>
                )}
              </div>
            ) : (
              <div className="p-4 space-y-2">
                {filteredLists.map((list) => (
                  <button
                    key={list.id}
                    onClick={() => handleAddToList(list.id)}
                    disabled={isAdding === list.id}
                    className="w-full p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-primary hover:bg-primary/5 transition-all text-right disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-gray-900 truncate">
                            {list.title}
                          </h3>
                          {list.isPublic && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                              عمومی
                            </span>
                          )}
                          {!list.isPublic && (
                            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                              خصوصی
                            </span>
                          )}
                        </div>
                        {list.description && (
                          <p className="text-sm text-gray-600 line-clamp-1 mb-1">
                            {list.description}
                          </p>
                        )}
                        <p className="text-xs text-gray-500">
                          {list._count.items} آیتم
                        </p>
                      </div>
                      <div className="mr-3">
                        {isAdding === list.id ? (
                          <Loader2 className="w-5 h-5 animate-spin text-primary" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Plus className="w-5 h-5 text-primary" />
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </BottomSheet>

      {/* Create List Form Modal */}
      <CreateListForm
        isOpen={isCreateListOpen}
        onClose={() => setIsCreateListOpen(false)}
        onSuccess={handleCreateListSuccess}
      />

      {/* Toast Notification */}
      {showToast && (
        <Toast
          message={toastMessage}
          type={toastType}
          duration={3000}
          onClose={() => setShowToast(false)}
        />
      )}
    </>
  );
}

