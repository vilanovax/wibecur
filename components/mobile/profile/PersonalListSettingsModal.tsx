'use client';

import { useState, useEffect } from 'react';
import { Settings, Edit, Trash2, X, Eye, EyeOff } from 'lucide-react';
import BottomSheet from '@/components/mobile/shared/BottomSheet';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import EditPersonalListForm from './EditPersonalListForm';
import DeleteListConfirmModal from './DeleteListConfirmModal';
import ListCollaborationPanel from './ListCollaborationPanel';
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
      const res = await fetch('/api/settings/public');
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
              <h3 className="mb-1 text-sm font-medium text-muted-foreground">عنوان</h3>
              <p className="text-lg font-bold text-foreground">{list.title}</p>
            </div>
            {list.description && (
              <div>
                <h3 className="mb-1 text-sm font-medium text-muted-foreground">توضیحات</h3>
                <p className="text-foreground">{list.description}</p>
              </div>
            )}
            <div>
              <h3 className="mb-1 text-sm font-medium text-muted-foreground">تعداد آیتم‌ها</h3>
              <p className="text-foreground">
                {list.itemCount.toLocaleString('fa-IR')} آیتم
                {!list.isPublic && list.itemCount < settings.minItemsForPublicList && (
                  <span className="mt-1 block text-sm text-brand">
                    (حداقل {settings.minItemsForPublicList.toLocaleString('fa-IR')} آیتم برای عمومی شدن لازم است)
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Public/Private Toggle */}
          <div className="border-t border-border pt-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {list.isPublic ? (
                    <Eye className="size-5 text-success" />
                  ) : (
                    <EyeOff className="size-5 text-muted-foreground" />
                  )}
                  <h3 className="text-base font-semibold text-foreground">
                    {list.isPublic ? 'عمومی' : 'خصوصی'}
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  {list.isPublic
                    ? 'این لیست برای همه کاربران قابل مشاهده است'
                    : 'این لیست فقط برای شما قابل مشاهده است'}
                </p>
              </div>
              <Switch
                checked={list.isPublic}
                onCheckedChange={() => handleTogglePublic()}
                disabled={isToggling}
                aria-label={list.isPublic ? 'خصوصی کردن لیست' : 'عمومی کردن لیست'}
              />
            </div>

            {/* Instructions for making public */}
            {!list.isPublic && (
              <div className="mt-4 space-y-3">
                {settings.personalListPublicInstructions && (
                  <div className="rounded-surface border border-brand/20 bg-brand/5 p-4">
                    <p className="text-sm text-foreground">
                      {settings.personalListPublicInstructions}
                    </p>
                  </div>
                )}
                <div className="rounded-surface border border-warning/30 bg-warning/10 p-4">
                  <p className="mb-2 text-sm font-medium text-foreground">
                    برای عمومی شدن لیست، موارد زیر الزامی است:
                  </p>
                  <ul className="list-inside list-disc space-y-1 text-sm text-foreground">
                    <li>حداقل {settings.minItemsForPublicList.toLocaleString('fa-IR')} آیتم در لیست</li>
                    <li>توضیحات لیست ({list.description && list.description.trim() ? '✓' : '✗'})</li>
                    <li>تصویر کاور ({list.coverImage && list.coverImage.trim() ? '✓' : '✗'})</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {!list.isPublic && (
            <div className="border-t border-border pt-6">
              <ListCollaborationPanel listId={list.id} isPublic={list.isPublic} onChanged={onUpdate} />
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3 border-t border-border pt-6">
            <Button type="button" variant="outline" size="lg" className="w-full" onClick={handleEdit}>
              <Edit />
              ویرایش اطلاعات لیست
            </Button>
            <Button type="button" variant="destructive" size="lg" className="w-full" onClick={handleDelete}>
              <Trash2 />
              حذف لیست
            </Button>
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

