'use client';

import { useState, useEffect } from 'react';
import { Settings, Edit, Trash2, X, Eye, EyeOff } from 'lucide-react';
import BottomSheet from '@/components/mobile/shared/BottomSheet';
import EditPersonalListForm from './EditPersonalListForm';
import DeleteListConfirmModal from './DeleteListConfirmModal';
import Toast from '@/components/shared/Toast';

interface PersonalListSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  list: {
    id: string;
    title: string;
    description: string | null;
    coverImage: string | null;
    isPublic: boolean;
    itemCount: number;
    commentsEnabled: boolean;
  };
  onUpdate?: () => void;
  onDelete?: () => void;
}

export default function PersonalListSettingsModal({
  isOpen,
  onClose,
  list,
  onUpdate,
  onDelete,
}: PersonalListSettingsModalProps) {
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [settings, setSettings] = useState<{
    minItemsForPublicList: number;
    personalListPublicInstructions: string | null;
  }>({
    minItemsForPublicList: 5,
    personalListPublicInstructions: null,
  });

  useEffect(() => {
    if (isOpen) {
      fetchSettings();
    }
  }, [isOpen]);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setSettings({
            minItemsForPublicList: data.data.minItemsForPublicList || 5,
            personalListPublicInstructions: data.data.personalListPublicInstructions || null,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const handleTogglePublic = async () => {
    if (isToggling) return;

    const newIsPublic = !list.isPublic;

    // If trying to make public, check requirements
    if (newIsPublic) {
      // Check minimum items
      if (list.itemCount < settings.minItemsForPublicList) {
        setToastMessage(`برای عمومی شدن لیست، باید حداقل ${settings.minItemsForPublicList} آیتم داشته باشد.`);
        setToastType('error');
        setShowToast(true);
        return;
      }

      // Check if description and coverImage are required
      if (!list.description || !list.description.trim()) {
        setToastMessage('برای عمومی شدن لیست، ابتدا باید توضیحات را در تنظیمات لیست اضافه کنید.');
        setToastType('error');
        setShowToast(true);
        // Open edit form to add description
        handleEdit();
        return;
      }

      if (!list.coverImage || !list.coverImage.trim()) {
        setToastMessage('برای عمومی شدن لیست، ابتدا باید تصویر کاور را در تنظیمات لیست اضافه کنید.');
        setToastType('error');
        setShowToast(true);
        // Open edit form to add cover image
        handleEdit();
        return;
      }
    }

    setIsToggling(true);
    try {
      const res = await fetch(`/api/user/lists/${list.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublic: newIsPublic }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'خطا در تغییر وضعیت لیست');
      }

      setToastMessage(
        newIsPublic
          ? 'لیست با موفقیت عمومی شد'
          : 'لیست با موفقیت خصوصی شد'
      );
      setToastType('success');
      setShowToast(true);

      if (onUpdate) {
        onUpdate();
      }

      // Close modal after success
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error: any) {
      setToastMessage(error.message || 'خطا در تغییر وضعیت لیست');
      setToastType('error');
      setShowToast(true);
    } finally {
      setIsToggling(false);
    }
  };

  const handleEdit = () => {
    setShowEditForm(true);
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const handleEditSuccess = () => {
    setShowEditForm(false);
    if (onUpdate) {
      onUpdate();
    }
    setToastMessage('لیست با موفقیت ویرایش شد');
    setToastType('success');
    setShowToast(true);
  };

  const handleDeleteSuccess = () => {
    setShowDeleteConfirm(false);
    onClose();
    if (onDelete) {
      onDelete();
    }
    setToastMessage('لیست با موفقیت حذف شد');
    setToastType('success');
    setShowToast(true);
  };

  if (showEditForm) {
    return (
      <EditPersonalListForm
        isOpen={showEditForm}
        onClose={() => {
          setShowEditForm(false);
          // Re-open settings modal after closing edit form
          setTimeout(() => {
            // This will be handled by parent component
          }, 100);
        }}
        list={list}
        onSuccess={handleEditSuccess}
      />
    );
  }

  if (showDeleteConfirm) {
    return (
      <DeleteListConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        listId={list.id}
        listTitle={list.title}
        onConfirm={handleDeleteSuccess}
      />
    );
  }

  return (
    <>
      <BottomSheet isOpen={isOpen} onClose={onClose} title="تنظیمات لیست">
        <div className="p-6 space-y-6">
          {/* List Info */}
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">عنوان</h3>
              <p className="text-lg font-bold text-gray-900">{list.title}</p>
            </div>
            {list.description && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">توضیحات</h3>
                <p className="text-gray-700">{list.description}</p>
              </div>
            )}
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">تعداد آیتم‌ها</h3>
              <p className="text-gray-700">
                {list.itemCount} آیتم
                {!list.isPublic && list.itemCount < settings.minItemsForPublicList && (
                  <span className="block text-sm text-blue-600 mt-1">
                    (حداقل {settings.minItemsForPublicList} آیتم برای عمومی شدن لازم است)
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Public/Private Toggle */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {list.isPublic ? (
                    <Eye className="w-5 h-5 text-green-600" />
                  ) : (
                    <EyeOff className="w-5 h-5 text-gray-400" />
                  )}
                  <h3 className="text-base font-semibold text-gray-900">
                    {list.isPublic ? 'عمومی' : 'خصوصی'}
                  </h3>
                </div>
                <p className="text-sm text-gray-600">
                  {list.isPublic
                    ? 'این لیست برای همه کاربران قابل مشاهده است'
                    : 'این لیست فقط برای شما قابل مشاهده است'}
                </p>
              </div>
              <button
                onClick={handleTogglePublic}
                disabled={isToggling}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                  list.isPublic ? 'bg-primary' : 'bg-gray-200'
                } ${isToggling ? 'opacity-50' : ''}`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    list.isPublic ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Instructions for making public */}
            {!list.isPublic && (
              <div className="mt-4 space-y-3">
                {settings.personalListPublicInstructions && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      {settings.personalListPublicInstructions}
                    </p>
                  </div>
                )}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800 font-medium mb-2">
                    برای عمومی شدن لیست، موارد زیر الزامی است:
                  </p>
                  <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
                    <li>حداقل {settings.minItemsForPublicList} آیتم در لیست</li>
                    <li>توضیحات لیست ({list.description && list.description.trim() ? '✓' : '✗'})</li>
                    <li>تصویر کاور ({list.coverImage && list.coverImage.trim() ? '✓' : '✗'})</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="border-t border-gray-200 pt-6 space-y-3">
            <button
              onClick={handleEdit}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-primary text-primary rounded-lg hover:bg-primary/5 transition-colors font-medium"
            >
              <Edit className="w-5 h-5" />
              ویرایش اطلاعات لیست
            </button>
            <button
              onClick={handleDelete}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 border-2 border-red-200 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium"
            >
              <Trash2 className="w-5 h-5" />
              حذف لیست
            </button>
          </div>
        </div>
      </BottomSheet>

      {/* Toast Notification */}
      {showToast && (
        <Toast
          message={toastMessage}
          type={toastType}
          duration={5000}
          onClose={() => setShowToast(false)}
        />
      )}
    </>
  );
}

