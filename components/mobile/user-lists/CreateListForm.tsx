'use client';

import { useState, useEffect } from 'react';
import { ListPlus, Loader2, Globe } from 'lucide-react';
import BottomSheet from '@/components/mobile/shared/BottomSheet';
import Toast from '@/components/shared/Toast';
import { track } from '@/lib/analytics';
import { dispatchListsUpdated } from '@/lib/profile-events';

interface CreateListFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CreateListForm({ isOpen, onClose, onSuccess }: CreateListFormProps) {
  const [title, setTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [maxPersonalLists, setMaxPersonalLists] = useState(3);
  const [currentListsCount, setCurrentListsCount] = useState(0);

  const atLimit = currentListsCount >= maxPersonalLists;
  const remaining = Math.max(0, maxPersonalLists - currentListsCount);

  useEffect(() => {
    if (isOpen) {
      fetchSettings();
      fetchUserListsCount();
      setTitle('');
      setError('');
    }
  }, [isOpen]);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings/public');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setMaxPersonalLists(data.data.maxPersonalLists || 3);
        }
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    }
  };

  const fetchUserListsCount = async () => {
    try {
      const res = await fetch('/api/user/my-lists?page=1&limit=100&filter=private');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setCurrentListsCount(data.data.pagination?.total ?? data.data.lists?.length ?? 0);
        }
      }
    } catch (err) {
      console.error('Error fetching user lists count:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmed = title.trim();
    if (!trimmed) {
      setError('عنوان الزامی است');
      return;
    }

    if (atLimit) {
      setError(
        `حداکثر ${maxPersonalLists} لیست خصوصی مجاز است. یکی را حذف یا عمومی کنید.`
      );
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/user/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: trimmed }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'خطا در ایجاد لیست');
      }

      setToastMessage(data.message || 'لیست با موفقیت ایجاد شد');
      setShowToast(true);
      track('list_create');
      setTitle('');
      fetchUserListsCount();
      dispatchListsUpdated({
        listId: data.data?.id,
        title: trimmed,
      });

      setTimeout(() => {
        onClose();
        onSuccess?.();
      }, 900);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'خطا در ایجاد لیست');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <BottomSheet
        isOpen={isOpen}
        onClose={onClose}
        title="لیست جدید"
        subtitle={`${currentListsCount.toLocaleString('fa-IR')} از ${maxPersonalLists.toLocaleString('fa-IR')} لیست خصوصی`}
        maxHeight="auto"
      >
        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="px-4 py-3 space-y-3">
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-100 px-3 py-2.5 wibe-caption text-red-600">
                {error}
              </div>
            )}

            {atLimit ? (
              <div className="rounded-lg bg-amber-50 border border-amber-100 px-3 py-2.5 wibe-caption text-amber-800 leading-relaxed">
                به سقف لیست‌های خصوصی رسیدید. یکی را حذف یا از تنظیمات عمومی کنید.
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2 rounded-lg bg-wibe-surface px-3 py-2.5">
                <span className="wibe-caption text-wibe-secondary">
                  {remaining.toLocaleString('fa-IR')} جای خالی
                </span>
                <div className="flex gap-1">
                  {Array.from({ length: maxPersonalLists }).map((_, i) => (
                    <span
                      key={i}
                      className={`h-1.5 w-6 rounded-full transition-colors ${
                        i < currentListsCount ? 'bg-primary' : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}

            <div>
              <label htmlFor="list-title" className="block wibe-small font-medium text-foreground mb-1.5">
                عنوان لیست <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="list-title"
                name="title"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setError('');
                }}
                className="w-full h-11 px-3 rounded-lg border border-wibe bg-white wibe-small text-foreground placeholder:text-wibe-secondary/70 focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary"
                placeholder="مثلاً: فیلم‌های آخر هفته"
                required
                disabled={isLoading || atLimit}
                autoFocus
              />
            </div>

            <p className="flex items-start gap-1.5 wibe-caption text-wibe-secondary leading-relaxed">
              <Globe className="w-3.5 h-3.5 shrink-0 mt-0.5 text-primary/70" />
              <span>
                لیست خصوصی ساخته می‌شود. برای عمومی کردن، بعداً توضیحات و کاور اضافه کنید.
              </span>
            </p>
          </div>

          <div className="flex-shrink-0 border-t border-wibe px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 h-11 rounded-lg border border-wibe bg-wibe-surface wibe-small font-medium text-foreground active:scale-[0.98] transition-transform"
                disabled={isLoading}
              >
                انصراف
              </button>
              <button
                type="submit"
                className="flex-1 h-11 rounded-lg bg-primary text-white wibe-small font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 active:scale-[0.98] transition-transform"
                disabled={isLoading || !title.trim() || atLimit}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    در حال ایجاد...
                  </>
                ) : (
                  <>
                    <ListPlus className="w-4 h-4" />
                    ایجاد
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
          duration={3000}
          onClose={() => setShowToast(false)}
        />
      )}
    </>
  );
}
