'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Plus, Loader2, Check, Globe, Lock } from 'lucide-react';
import BottomSheet from '@/components/mobile/shared/BottomSheet';
import { track } from '@/lib/analytics';
import Toast from '@/components/shared/Toast';
import CreateListForm from '@/components/mobile/user-lists/CreateListForm';
import ImageWithFallback from '@/components/shared/ImageWithFallback';

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
  const [isAdding, setIsAdding] = useState<string | null>(null);
  const [addedListIds, setAddedListIds] = useState<Set<string>>(new Set());
  const [savedListIds, setSavedListIds] = useState<Set<string>>(new Set());
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
  }, [status]);

  useEffect(() => {
    if (isOpen) {
      void fetchLists();
      void fetchSettings();
      if (status === 'authenticated') {
        void fetchSavedStatus();
      }
    }
  }, [isOpen, itemId, status, fetchLists]);

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

  const fetchSavedStatus = async () => {
    try {
      const res = await fetch(`/api/items/${itemId}/saved-status`);
      if (res.ok) {
        const data = await res.json();
        const ids = (data.lists || []).map((l: { id: string }) => l.id);
        setSavedListIds(new Set(ids));
      }
    } catch (error) {
      console.error('Error fetching saved status:', error);
    }
  };

  const handleAddToList = async (list: PersonalList) => {
    if (savedListIds.has(list.id) || addedListIds.has(list.id)) return;
    setIsAdding(list.id);
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

      setAddedListIds((prev) => new Set(prev).add(list.id));
      setToastMessage(`به «${list.title}» اضافه شد ✨`);
      setToastType('success');
      setShowToast(true);
      track('item_save', {
        itemId,
        listId: list.id,
        ...(list.slug ? { list_slug: list.slug } : {}),
        source: 'save_modal',
      });

      // پس از افزودن موفق، کوتاه «افزوده شد» نشان داده می‌شود و سپس مودال بسته
      // می‌شود تا کاربر به صفحه/مودال قبلیِ آیتم بازگردد.
      setTimeout(() => onClose(), 700);
    } catch (error: any) {
      setToastMessage(error.message || 'خطا در افزودن آیتم');
      setToastType('error');
      setShowToast(true);
    } finally {
      setIsAdding(null);
    }
  };

  const handleCreateListSuccess = () => {
    fetchLists();
    fetchSavedStatus();
    setIsCreateListOpen(false);
  };

  const canCreateNewList = privateListsCount < maxPersonalLists;
  const isAlreadyInList = (listId: string) =>
    savedListIds.has(listId) || addedListIds.has(listId);

  return (
    <>
      <BottomSheet
        isOpen={isOpen}
        onClose={onClose}
        title="افزودن به لیست"
        subtitle="این آیتم رو کجا ذخیره کنیم؟"
      >
        <div className="flex flex-col h-full">
          {/* لیست‌های من */}
          <div className="flex-1 overflow-y-auto overscroll-contain min-h-0">
            {authRequired ? (
              <div className="text-center py-12 px-6">
                <p className="text-wibe-secondary mb-4">برای ذخیره در لیست شخصی وارد شوید</p>
                <Link
                  href={`/login?callbackUrl=${encodeURIComponent(`/items/${itemId}`)}&source=item_gate`}
                  className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-primary text-white font-semibold"
                >
                  ورود
                </Link>
              </div>
            ) : isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : lists.length === 0 ? (
              <div className="text-center py-12 px-6">
                <div className="text-5xl mb-3">📋</div>
                <p className="text-wibe-secondary mb-2">لیست شخصی وجود ندارد</p>
                {canCreateNewList && (
                  <p className="text-sm text-wibe-secondary mb-4">
                    با ساخت لیست جدید شروع کنید
                  </p>
                )}
              </div>
            ) : (
              <div className="px-4 pb-4 space-y-2">
                <p className="text-sm font-medium text-wibe-secondary px-1 pb-2">
                  لیست‌های من
                </p>
                {lists.map((list) => {
                  const already = isAlreadyInList(list.id);
                  const justAdded = addedListIds.has(list.id);
                  const adding = isAdding === list.id;

                  return (
                    <div
                      key={list.id}
                      className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-xl hover:border-gray-200 transition-colors"
                    >
                      {/* کاور کوچک */}
                      <div className="relative w-14 h-14 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                        <ImageWithFallback
                          src={list.coverImage ?? ''}
                          alt={list.title}
                          className="w-full h-full object-cover"
                          fallbackIcon="📋"
                          fallbackClassName="w-full h-full flex items-center justify-center text-xl"
                          placeholderSize="cover"
                          sizes="56px"
                        />
                      </div>

                      {/* عنوان و آمار */}
                      <div className="flex-1 min-w-0 text-right">
                        <h3 className="font-bold text-foreground truncate">
                          {list.title}
                        </h3>
                        <p className="text-xs text-wibe-secondary mt-0.5">
                          {list._count.items} آیتم
                          <span className="mx-1">•</span>
                          {list.isPublic ? (
                            <span className="inline-flex items-center gap-0.5">
                              <Globe className="w-3 h-3" />
                              عمومی
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-0.5">
                              <Lock className="w-3 h-3" />
                              خصوصی
                            </span>
                          )}
                        </p>
                      </div>

                      {/* دکمه افزودن / افزوده شد / قبلاً اضافه شده */}
                      <div className="flex-shrink-0">
                        {already ? (
                          <div
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium ${
                              justAdded
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-wibe-secondary'
                            }`}
                          >
                            {justAdded ? (
                              <>
                                <Check className="w-4 h-4" />
                                <span>افزوده شد</span>
                              </>
                            ) : (
                              <>
                                <Check className="w-4 h-4" />
                                <span>قبلاً اضافه شده</span>
                              </>
                            )}
                          </div>
                        ) : (
                          <button
                            onClick={() => handleAddToList(list)}
                            disabled={adding}
                            className="w-11 h-11 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary-dark active:scale-95 transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
                            aria-label={`افزودن به ${list.title}`}
                          >
                            {adding ? (
                              <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                              <Plus className="w-5 h-5" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* CTA ساخت لیست جدید — جدا و شفاف */}
          <div className="flex-shrink-0 px-4 py-4 border-t border-gray-100">
            {canCreateNewList ? (
              <button
                onClick={() => setIsCreateListOpen(true)}
                className="w-full flex items-center justify-center gap-2 py-3 text-primary border-2 border-primary rounded-xl font-medium hover:bg-primary/5 transition-colors"
              >
                <Plus className="w-5 h-5" />
                ساخت لیست جدید
              </button>
            ) : (
              <p className="text-center text-sm text-wibe-secondary py-2">
                به حداکثر تعداد لیست‌های خصوصی ({maxPersonalLists}) رسیده‌اید
              </p>
            )}
          </div>
        </div>
      </BottomSheet>

      <CreateListForm
        isOpen={isCreateListOpen}
        onClose={() => setIsCreateListOpen(false)}
        onSuccess={handleCreateListSuccess}
      />

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
