'use client';

import { useState, useEffect } from 'react';
import { ListPlus, Loader2, Globe } from 'lucide-react';
import BottomSheet from '@/components/mobile/shared/BottomSheet';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Toast from '@/components/shared/Toast';
import { track } from '@/lib/analytics';
import { dispatchListsUpdated } from '@/lib/profile-events';
import { usePreferDesktopAutofocus } from '@/lib/hooks/usePreferDesktopAutofocus';

const TITLE_PLACEHOLDERS: Record<string, string> = {
  movie: 'مثلاً: فیلم‌های آخر هفته',
  book: 'مثلاً: کتاب‌های تابستان',
  cafe: 'مثلاً: کافه‌های کار ریموت',
  travel: 'مثلاً: سفرهای کوتاه اطراف تهران',
  mixed: 'مثلاً: وایب جمعه شب',
};

interface CreateListFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  /** Soft vibe hint from CreateSheet category chips (personal lists stay uncategorized in API). */
  categoryHint?: string | null;
}

export default function CreateListForm({
  isOpen,
  onClose,
  onSuccess,
  categoryHint = null,
}: CreateListFormProps) {
  const [title, setTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [maxPersonalLists, setMaxPersonalLists] = useState(3);
  const [currentListsCount, setCurrentListsCount] = useState(0);
  const preferDesktopAutofocus = usePreferDesktopAutofocus();

  const atLimit = currentListsCount >= maxPersonalLists;
  const remaining = Math.max(0, maxPersonalLists - currentListsCount);
  const titlePlaceholder =
    (categoryHint && TITLE_PLACEHOLDERS[categoryHint]) || 'مثلاً: فیلم‌های آخر هفته';

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
      track('list_create', {
        list_id: data.data?.id ?? '',
        type: 'personal',
      });
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
              <Alert variant="destructive" title="لیست ساخته نشد">
                {error}
              </Alert>
            )}

            {atLimit ? (
              <Alert variant="warning">
                به سقف لیست‌های خصوصی رسیدید. یکی را حذف یا از تنظیمات عمومی کنید.
              </Alert>
            ) : (
              <div className="flex items-center justify-between gap-2 rounded-xl bg-muted px-3 py-2.5">
                <span className="text-xs text-muted-foreground">
                  {remaining.toLocaleString('fa-IR')} جای خالی
                </span>
                <div className="flex gap-1">
                  {Array.from({ length: maxPersonalLists }).map((_, i) => (
                    <span
                      key={i}
                      className={`h-1.5 w-6 rounded-full transition-colors ${
                        i < currentListsCount ? 'bg-brand' : 'bg-border'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}

            <div>
              <label htmlFor="list-title" className="block wibe-small font-medium text-foreground mb-1.5">
                عنوان لیست <span className="text-destructive">*</span>
              </label>
              <Input
                type="text"
                id="list-title"
                name="title"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setError('');
                }}
                className="h-12"
                placeholder={titlePlaceholder}
                required
                disabled={isLoading || atLimit}
                autoFocus={preferDesktopAutofocus}
              />
            </div>

            <p className="flex items-start gap-1.5 text-xs leading-relaxed text-muted-foreground">
              <Globe className="mt-0.5 size-4 shrink-0 text-brand" />
              <span>
                لیست خصوصی ساخته می‌شود. برای عمومی کردن، بعداً توضیحات و کاور اضافه کنید.
              </span>
            </p>
          </div>

          <div className="shrink-0 border-t border-border px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <div className="flex gap-2">
              <Button type="button" variant="secondary" size="lg" className="flex-1" onClick={onClose} disabled={isLoading}>
                انصراف
              </Button>
              <Button
                type="submit"
                variant="brand"
                size="lg"
                className="flex-1"
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
              </Button>
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
