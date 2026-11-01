'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Plus, Loader2, Check, Globe, Lock, Minus } from 'lucide-react';
import BottomSheet from '@/components/mobile/shared/BottomSheet';
import { track } from '@/lib/analytics';
import Toast from '@/components/shared/Toast';
import CreateListForm from '@/components/mobile/user-lists/CreateListForm';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PersonalList {
  id: string;
  title: string;
  description: string | null;
  coverImage: string | null;
  isPublic: boolean;
  slug?: string;
  _count: {
    items: number;
  };
}

type SavedListRef = {
  id: string;
  title: string;
  isPublic: boolean;
  placementItemId: string;
};

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
  const { data: session, status } = useSession();
  const [lists, setLists] = useState<PersonalList[]>([]);
  const [authRequired, setAuthRequired] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [maxPersonalLists, setMaxPersonalLists] = useState(3);
  const [privateListsCount, setPrivateListsCount] = useState(0);
  /** listId → placementItemId داخل آن لیست */
  const [savedByListId, setSavedByListId] = useState<Map<string, string>>(new Map());
  const [busyListId, setBusyListId] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [isCreateListOpen, setIsCreateListOpen] = useState(false);

  const fetchLists = useCallback(async () => {
    if (status !== 'authenticated' || !session?.user?.id) {
      setAuthRequired(true);
      setLists([]);
      setIsLoading(false);
      return;
    }

    setAuthRequired(false);
    setIsLoading(true);
    try {
      const res = await fetch('/api/user/lists');
      if (res.status === 401) {
        setAuthRequired(true);
        setLists([]);
        return;
      }
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setLists(data.data || []);
          const privateCount = (data.data || []).filter(
            (list: PersonalList) => !list.isPublic
          ).length;
          setPrivateListsCount(privateCount);
          return;
        }
      }
      setToastMessage('خطا در دریافت لیست‌ها');
      setToastType('error');
      setShowToast(true);
    } catch {
      setToastMessage('خطا در دریافت لیست‌ها');
      setToastType('error');
      setShowToast(true);
    } finally {
      setIsLoading(false);
    }
  }, [status, session?.user?.id]);

  const fetchSavedStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/items/${itemId}/saved-status`);
      if (!res.ok) return;
      const data = await res.json();
      const next = new Map<string, string>();
      for (const list of (data.lists || []) as SavedListRef[]) {
        if (list.id && list.placementItemId) {
          next.set(list.id, list.placementItemId);
        }
      }
      setSavedByListId(next);
    } catch (error) {
      console.error('Error fetching saved status:', error);
    }
  }, [itemId]);

  useEffect(() => {
    if (!isOpen) return;
    void fetchLists();
    void fetchSettings();
    if (status === 'authenticated') {
      void fetchSavedStatus();
    }
  }, [isOpen, itemId, status, fetchLists, fetchSavedStatus]);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings/public');
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

  const handleAddToList = async (list: PersonalList) => {
    if (savedByListId.has(list.id) || busyListId) return;
    setBusyListId(list.id);
    try {
      const res = await fetch(`/api/user/lists/${list.id}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, order: 0 }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'خطا در افزودن آیتم');
      }

      const placementItemId = typeof data.data?.id === 'string' ? data.data.id : null;
      if (placementItemId) {
        setSavedByListId((prev) => {
          const next = new Map(prev);
          next.set(list.id, placementItemId);
          return next;
        });
        setLists((prev) =>
          prev.map((row) =>
            row.id === list.id
              ? { ...row, _count: { items: row._count.items + 1 } }
              : row
          )
        );
      } else {
        await fetchSavedStatus();
      }

      setToastMessage(`به «${list.title}» اضافه شد`);
      setToastType('success');
      setShowToast(true);
      track('item_save', {
        itemId,
        listId: list.id,
        ...(list.slug ? { list_slug: list.slug } : {}),
        source: 'save_modal',
      });
    } catch (error: unknown) {
      setToastMessage(error instanceof Error ? error.message : 'خطا در افزودن آیتم');
      setToastType('error');
      setShowToast(true);
    } finally {
      setBusyListId(null);
    }
  };

  const handleRemoveFromList = async (list: PersonalList) => {
    const placementItemId = savedByListId.get(list.id);
    if ((!placementItemId && !itemId) || busyListId) return;
    setBusyListId(list.id);

    const previous = new Map(savedByListId);
    setSavedByListId((prev) => {
      const next = new Map(prev);
      next.delete(list.id);
      return next;
    });
    setLists((prev) =>
      prev.map((row) =>
        row.id === list.id
          ? { ...row, _count: { items: Math.max(0, row._count.items - 1) } }
          : row
      )
    );

    try {
      // placement اول؛ وگرنه API با catalog/title از روی item مبدأ پیدا می‌کند
      const targetId = placementItemId || itemId;
      const res = await fetch(`/api/user/lists/${list.id}/items/${targetId}`, {
        method: 'DELETE',
      });
      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        throw new Error(data?.error || 'حذف از لیست انجام نشد');
      }

      setToastMessage(`از «${list.title}» حذف شد`);
      setToastType('success');
      setShowToast(true);
      track('item_unsave', {
        itemId,
        listId: list.id,
        ...(list.slug ? { list_slug: list.slug } : {}),
        source: 'save_modal',
      });
    } catch (error: unknown) {
      setSavedByListId(previous);
      setLists((prev) =>
        prev.map((row) =>
          row.id === list.id
            ? { ...row, _count: { items: row._count.items + 1 } }
            : row
        )
      );
      setToastMessage(error instanceof Error ? error.message : 'حذف از لیست انجام نشد');
      setToastType('error');
      setShowToast(true);
    } finally {
      setBusyListId(null);
    }
  };

  const handleToggleList = (list: PersonalList) => {
    if (savedByListId.has(list.id)) {
      void handleRemoveFromList(list);
    } else {
      void handleAddToList(list);
    }
  };

  const handleCreateListSuccess = () => {
    void fetchLists();
    void fetchSavedStatus();
    setIsCreateListOpen(false);
  };

  const canCreateNewList = privateListsCount < maxPersonalLists;
  const savedCount = savedByListId.size;

  return (
    <>
      <BottomSheet
        isOpen={isOpen}
        onClose={onClose}
        title="ذخیره در لیست"
        subtitle={
          savedCount > 0
            ? `در ${savedCount.toLocaleString('fa-IR')} لیست — برای حذف دوباره بزن`
            : 'این آیتم را کجا ذخیره کنیم؟'
        }
      >
        <div className="flex h-full flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            {authRequired ? (
              <div className="px-6 py-12 text-center">
                <p className="mb-4 text-muted-foreground">برای ذخیره در لیست شخصی وارد شو</p>
                <Link
                  href={`/login?callbackUrl=${encodeURIComponent(`/items/${itemId}`)}&source=item_gate`}
                  className="inline-flex h-12 items-center justify-center rounded-xl bg-brand px-6 text-sm font-semibold text-brand-foreground"
                >
                  ورود
                </Link>
              </div>
            ) : isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="size-8 animate-spin text-brand" />
              </div>
            ) : lists.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <p className="mb-2 text-muted-foreground">لیست شخصی وجود ندارد</p>
                {canCreateNewList ? (
                  <p className="mb-4 wibe-small text-muted-foreground">
                    با ساخت لیست جدید شروع کن
                  </p>
                ) : null}
              </div>
            ) : (
              <div className="space-y-2 px-4 pb-4">
                <p className="px-1 pb-2 wibe-small font-medium text-muted-foreground">
                  لیست‌های من
                </p>
                {lists.map((list) => {
                  const saved = savedByListId.has(list.id);
                  const busy = busyListId === list.id;

                  return (
                    <div
                      key={list.id}
                      className={cn(
                        'flex items-center gap-3 rounded-surface border bg-popover p-3',
                        saved ? 'border-brand/40' : 'border-border'
                      )}
                    >
                      <div className="size-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                        <ImageWithFallback
                          src={list.coverImage ?? ''}
                          alt=""
                          className="h-full w-full object-cover"
                          fallbackIcon="📋"
                          fallbackClassName="flex h-full w-full items-center justify-center text-xl"
                          placeholderSize="cover"
                        />
                      </div>

                      <div className="min-w-0 flex-1 text-start">
                        <h3 className="truncate font-bold text-foreground">{list.title}</h3>
                        <p className="mt-0.5 wibe-caption text-muted-foreground">
                          {list._count.items.toLocaleString('fa-IR')} آیتم
                          <span className="mx-1">·</span>
                          {list.isPublic ? (
                            <span className="inline-flex items-center gap-0.5">
                              <Globe className="size-3" aria-hidden />
                              عمومی
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-0.5">
                              <Lock className="size-3" aria-hidden />
                              خصوصی
                            </span>
                          )}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleList(list)}
                        disabled={busy}
                        className={cn(
                          'flex size-11 shrink-0 items-center justify-center rounded-full disabled:opacity-60',
                          saved
                            ? 'border border-brand bg-brand/10 text-brand'
                            : 'bg-brand text-brand-foreground'
                        )}
                        aria-label={
                          saved ? `حذف از ${list.title}` : `افزودن به ${list.title}`
                        }
                        aria-pressed={saved}
                      >
                        {busy ? (
                          <Loader2 className="size-5 animate-spin" />
                        ) : saved ? (
                          <Check className="size-5" strokeWidth={2} />
                        ) : (
                          <Plus className="size-5" strokeWidth={2} />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="shrink-0 border-t border-border px-4 py-4">
            {canCreateNewList ? (
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="w-full border-brand/30 text-brand"
                onClick={() => setIsCreateListOpen(true)}
              >
                <Plus className="size-4" />
                ساخت لیست جدید
              </Button>
            ) : (
              <p className="py-2 text-center wibe-small text-muted-foreground">
                به حداکثر تعداد لیست‌های خصوصی (
                {maxPersonalLists.toLocaleString('fa-IR')}) رسیده‌ای
              </p>
            )}
            {savedCount > 0 ? (
              <p className="mt-3 flex items-center justify-center gap-1 wibe-caption text-muted-foreground">
                <Minus className="size-3.5" aria-hidden />
                برای برداشتن از لیست، روی تیک بزن
              </p>
            ) : null}
          </div>
        </div>
      </BottomSheet>

      <CreateListForm
        isOpen={isCreateListOpen}
        onClose={() => setIsCreateListOpen(false)}
        onSuccess={handleCreateListSuccess}
      />

      {showToast ? (
        <Toast
          message={toastMessage}
          type={toastType}
          duration={2800}
          onClose={() => setShowToast(false)}
        />
      ) : null}
    </>
  );
}
