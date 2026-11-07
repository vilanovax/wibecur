'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ListPlus, Loader2, Globe, ArrowLeft, Trash2 } from 'lucide-react';
import BottomSheet from '@/components/mobile/shared/BottomSheet';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Toast from '@/components/shared/Toast';
import { track } from '@/lib/analytics';
import { dispatchListsUpdated } from '@/lib/profile-events';
import { usePreferDesktopAutofocus } from '@/lib/hooks/usePreferDesktopAutofocus';
import { fa } from '@/lib/utils';

const TITLE_PLACEHOLDERS: Record<string, string> = {
  movie: 'مثلاً: فیلم‌های آخر هفته',
  book: 'مثلاً: کتاب‌های تابستان',
  cafe: 'مثلاً: کافه‌های کار ریموت',
  travel: 'مثلاً: سفرهای کوتاه اطراف تهران',
  mixed: 'مثلاً: وایب جمعه شب',
};

type CeilingList = {
  id: string;
  title: string;
  isActive: boolean;
  itemCount: number;
  description: string | null;
  coverImage: string | null;
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
  const [minItemsForPublic, setMinItemsForPublic] = useState(5);
  const [currentListsCount, setCurrentListsCount] = useState(0);
  const [ceilingLists, setCeilingLists] = useState<CeilingList[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const preferDesktopAutofocus = usePreferDesktopAutofocus();

  const atLimit = currentListsCount >= maxPersonalLists;
  const remaining = Math.max(0, maxPersonalLists - currentListsCount);
  const titlePlaceholder =
    (categoryHint && TITLE_PLACEHOLDERS[categoryHint]) || 'مثلاً: فیلم‌های آخر هفته';

  useEffect(() => {
    if (isOpen) {
      void fetchSettings();
      void fetchUserListsCount();
      setTitle('');
      setError('');
      setDeletingId(null);
    }
  }, [isOpen]);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings/public');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setMaxPersonalLists(data.data.maxPersonalLists || 3);
          setMinItemsForPublic(data.data.minItemsForPublicList || 5);
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
          const lists = (data.data.lists ?? []) as CeilingList[];
          setCeilingLists(lists);
          setCurrentListsCount(data.data.pagination?.total ?? lists.length);
        }
      }
    } catch (err) {
      console.error('Error fetching user lists:', err);
    }
  };

  const handleDeleteList = async (listId: string) => {
    if (deletingId) return;
    setDeletingId(listId);
    setError('');
    try {
      const res = await fetch(`/api/user/lists/${listId}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) {
        throw new Error(data.error || 'حذف لیست ناموفق بود');
      }
      setToastMessage('لیست حذف شد — حالا می‌توانی لیست جدید بسازی');
      setShowToast(true);
      dispatchListsUpdated({ listId });
      await fetchUserListsCount();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'حذف لیست ناموفق بود');
    } finally {
      setDeletingId(null);
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
        `حداکثر ${fa(maxPersonalLists)} لیست خصوصی مجاز است. یکی را حذف کن یا پس از تکمیل، عمومی‌اش کن.`
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

      if (res.status === 401) {
        throw new Error('برای ساخت لیست اول وارد حساب شو.');
      }
      if (res.status === 403) {
        throw new Error(
          typeof data.error === 'string' && data.error.includes('مبدأ')
            ? 'نشست منقضی شده؛ صفحه را تازه کن و دوباره وارد شو.'
            : data.error || 'دسترسی مجاز نیست.'
        );
      }
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
      void fetchUserListsCount();
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
        title={atLimit ? 'سقف لیست خصوصی' : 'لیست جدید'}
        subtitle={`${fa(currentListsCount)} از ${fa(maxPersonalLists)} لیست خصوصی`}
        maxHeight={atLimit ? '70vh' : 'auto'}
      >
        {atLimit ? (
          <div className="flex flex-col">
            <div className="space-y-3 px-4 py-3">
              {error ? (
                <Alert variant="destructive" title="انجام نشد">
                  {error}
                </Alert>
              ) : null}

              <Alert variant="warning" title="جا برای لیست جدید نیست">
                برای آزاد کردن یک جا، یکی از لیست‌های زیر را حذف کن یا پس از تکمیل
                (توضیحات، کاور، حداقل {fa(minItemsForPublic)} آیتم) عمومی‌اش کن.
              </Alert>

              <ul className="flex flex-col gap-2">
                {ceilingLists.map((list) => {
                  const isDraft = list.isActive === false;
                  return (
                    <li
                      key={list.id}
                      className="flex flex-col gap-2 rounded-surface border border-border bg-muted/40 p-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">{list.title}</p>
                        <p className="mt-0.5 wibe-caption text-muted-foreground">
                          {isDraft ? 'پیش‌نویس' : 'خصوصی'}
                          {' · '}
                          {fa(list.itemCount)} آیتم
                          {!list.description?.trim() ? ' · بدون توضیحات' : ''}
                          {!list.coverImage?.trim() ? ' · بدون کاور' : ''}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/user-lists/${list.id}`}
                          onClick={onClose}
                          className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-control bg-brand px-3 text-sm font-semibold text-brand-foreground shadow-control transition-colors hover:bg-brand/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30"
                        >
                          {isDraft ? 'ادامهٔ پیش‌نویس' : 'باز کردن'}
                          <ArrowLeft className="size-4" strokeWidth={2} aria-hidden />
                        </Link>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          className="min-h-11"
                          disabled={deletingId === list.id}
                          onClick={() => {
                            void handleDeleteList(list.id);
                          }}
                          aria-label={`حذف ${list.title}`}
                        >
                          {deletingId === list.id ? (
                            <Loader2 className="size-4 animate-spin" aria-hidden />
                          ) : (
                            <Trash2 className="size-4" strokeWidth={1.5} aria-hidden />
                          )}
                          حذف
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="shrink-0 border-t border-border px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              <Button type="button" variant="secondary" size="lg" className="w-full" onClick={onClose}>
                بستن
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col">
            <div className="space-y-3 px-4 py-3">
              {error ? (
                <Alert variant="destructive" title="لیست ساخته نشد">
                  {error}
                </Alert>
              ) : null}

              <div className="flex items-center justify-between gap-2 rounded-xl bg-muted px-3 py-2.5">
                <span className="text-xs text-muted-foreground">{fa(remaining)} جای خالی</span>
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

              <div>
                <label
                  htmlFor="list-title"
                  className="mb-1.5 block wibe-small font-medium text-foreground"
                >
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
                  disabled={isLoading}
                  autoFocus={preferDesktopAutofocus}
                />
              </div>

              <p className="flex items-start gap-1.5 text-xs leading-relaxed text-muted-foreground">
                <Globe className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
                <span>
                  لیست خصوصی ساخته می‌شود. برای عمومی شدن بعداً توضیحات، کاور و حداقل{' '}
                  {fa(minItemsForPublic)} آیتم لازم است.
                </span>
              </p>
            </div>

            <div className="shrink-0 border-t border-border px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="lg"
                  className="flex-1"
                  onClick={onClose}
                  disabled={isLoading}
                >
                  انصراف
                </Button>
                <Button
                  type="submit"
                  variant="brand"
                  size="lg"
                  className="flex-1"
                  disabled={isLoading || !title.trim()}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" aria-hidden />
                      در حال ایجاد…
                    </>
                  ) : (
                    <>
                      <ListPlus className="size-4" aria-hidden />
                      ایجاد
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        )}
      </BottomSheet>

      {showToast ? (
        <Toast
          message={toastMessage}
          type="success"
          duration={3000}
          onClose={() => setShowToast(false)}
        />
      ) : null}
    </>
  );
}
