'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import { Settings, Trash2, Share2, LayoutGrid, Rows3 } from 'lucide-react';
import BookmarkButton from '@/components/mobile/lists/BookmarkButton';
import Toast from '@/components/shared/Toast';
import { LIST_DETAIL_ITEMS_PAGE_SIZE } from '@/lib/list-detail-items-shared';

const PersonalListSettingsModal = dynamic(
  () => import('@/components/mobile/profile/PersonalListSettingsModal'),
  { ssr: false }
);

const ListCommentSection = dynamic(
  () => import('@/components/mobile/lists/ListCommentSection'),
  { ssr: false }
);

interface Item {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  displayImageUrl?: string | null;
  externalUrl: string | null;
  metadata?: unknown;
}

interface List {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  coverImage: string | null;
  isPublic: boolean;
  isActive: boolean;
  viewCount: number;
  likeCount: number;
  saveCount: number;
  itemCount: number;
  commentsEnabled: boolean;
  userId: string;
  categories: {
    id: string;
    name: string;
    slug: string;
    icon: string;
    color: string;
  } | null;
  items: Item[];
}

interface UserListDetailClientProps {
  list: List;
  currentUserId: string | null;
  isOwner?: boolean;
  canAddItems?: boolean;
  itemsHasMore?: boolean;
  itemsTotal?: number;
  pendingCollaboration?: { listId: string; invitedBy: string } | null;
}

function itemImageSrc(item: Item): string | null {
  const display = item.displayImageUrl?.trim();
  if (display) return display;
  return item.imageUrl?.trim() || null;
}

export default function UserListDetailClient({
  list,
  currentUserId,
  isOwner: isOwnerProp,
  canAddItems: canAddItemsProp,
  itemsHasMore = false,
  itemsTotal,
  pendingCollaboration = null,
}: UserListDetailClientProps) {
  const [items, setItems] = useState(list.items);
  const [hasMore, setHasMore] = useState(itemsHasMore);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const loadingRef = useRef(false);

  const [showSettings, setShowSettings] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [itemsView, setItemsView] = useState<'list' | 'grid'>('list');
  const [collabActionLoading, setCollabActionLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const isOwner = isOwnerProp ?? currentUserId === list.userId;
  const canAddItems = canAddItemsProp ?? isOwner;
  const categoryIcon = list.categories?.icon ?? '📋';
  const headerSrc =
    list.coverImage && list.coverImage.trim()
      ? list.coverImage
      : '/images/banners/default.webp';

  const totalCount = itemsTotal ?? list.itemCount ?? items.length;

  useEffect(() => {
    setItems(list.items);
    setHasMore(itemsHasMore);
  }, [list.id, list.items, itemsHasMore]);

  const fetchMoreItems = useCallback(async () => {
    if (loadingRef.current || !hasMore) return;
    loadingRef.current = true;
    setIsLoadingMore(true);
    try {
      const offset = items.length;
      const res = await fetch(
        `/api/user/lists/${list.id}/items?offset=${offset}&limit=${LIST_DETAIL_ITEMS_PAGE_SIZE}`
      );
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'خطا در دریافت آیتم‌ها');
      }
      const nextItems = (data.items ?? []) as Item[];
      setItems((prev) => {
        const seen = new Set(prev.map((i) => i.id));
        const merged = [...prev];
        for (const item of nextItems) {
          if (!seen.has(item.id)) merged.push(item);
        }
        return merged;
      });
      setHasMore(Boolean(data.pagination?.hasMore));
    } catch (error: unknown) {
      setToastMessage(
        error instanceof Error ? error.message : 'خطا در دریافت آیتم‌ها'
      );
      setToastType('error');
      setShowToast(true);
    } finally {
      loadingRef.current = false;
      setIsLoadingMore(false);
    }
  }, [hasMore, items.length, list.id]);

  useEffect(() => {
    if (!hasMore) return;
    const el = loadMoreRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          void fetchMoreItems();
        }
      },
      { rootMargin: '600px 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, fetchMoreItems, items.length]);

  const categoryMeta = useMemo(() => {
    const map = new Map<string, number>();
    for (const it of items) {
      const meta =
        it.metadata && typeof it.metadata === 'object' && !Array.isArray(it.metadata)
          ? (it.metadata as Record<string, unknown>)
          : null;
      const raw =
        (typeof meta?.sourceCategorySlug === 'string' && meta.sourceCategorySlug.trim()) ||
        (typeof meta?.categorySlug === 'string' && meta.categorySlug.trim()) ||
        null;
      if (!raw) continue;

      const norm = raw.startsWith('movie') ? 'movie' : raw;
      map.set(norm, (map.get(norm) ?? 0) + 1);
    }
    const chips = Array.from(map.entries()).map(([slug, count]) => {
      const ui =
        slug === 'movie'
          ? { label: 'فیلم و سریال', icon: '🎬' }
          : slug === 'book'
            ? { label: 'کتاب', icon: '📚' }
            : slug === 'cafe'
              ? { label: 'کافه و رستوران', icon: '🍽' }
              : slug === 'travel'
                ? { label: 'سفر', icon: '✈️' }
                : { label: slug, icon: '🏷️' };
      return { slug, count, ...ui };
    });

    chips.sort((a, b) => b.count - a.count);
    return { chips, total: items.length };
  }, [items]);

  const filteredItems = useMemo(() => {
    if (activeCategory === 'all') return items;
    return items.filter((it) => {
      const meta =
        it.metadata && typeof it.metadata === 'object' && !Array.isArray(it.metadata)
          ? (it.metadata as Record<string, unknown>)
          : null;
      const raw =
        (typeof meta?.sourceCategorySlug === 'string' && meta.sourceCategorySlug.trim()) ||
        (typeof meta?.categorySlug === 'string' && meta.categorySlug.trim()) ||
        null;
      if (!raw) return false;
      const norm = raw.startsWith('movie') ? 'movie' : raw;
      return norm === activeCategory;
    });
  }, [items, activeCategory]);

  const showCategoryFilter = categoryMeta.chips.length > 1;

  const handleDeleteItem = async (itemId: string) => {
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/user/lists/${list.id}/items/${itemId}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'خطا در حذف آیتم');
      }

      setItems((prev) => prev.filter((item) => item.id !== itemId));

      setToastMessage('آیتم با موفقیت حذف شد');
      setToastType('success');
      setShowToast(true);
    } catch (error: unknown) {
      setToastMessage(
        error instanceof Error ? error.message : 'خطا در حذف آیتم'
      );
      setToastType('error');
      setShowToast(true);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSettingsUpdate = () => {
    window.location.reload();
  };

  const handleCollaborationResponse = async (action: 'accept' | 'reject') => {
    if (!currentUserId || !pendingCollaboration) return;
    setCollabActionLoading(true);
    try {
      const res = await fetch(
        `/api/user/lists/${pendingCollaboration.listId}/collaborators/${currentUserId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action }),
        }
      );
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'خطا در پاسخ به دعوت');
      }
      setToastMessage(action === 'accept' ? 'همکاری پذیرفته شد' : 'دعوت رد شد');
      setToastType('success');
      setShowToast(true);
      setTimeout(() => window.location.reload(), 800);
    } catch (error: unknown) {
      setToastMessage(error instanceof Error ? error.message : 'خطا در پاسخ به دعوت');
      setToastType('error');
      setShowToast(true);
    } finally {
      setCollabActionLoading(false);
    }
  };

  const displayCount =
    activeCategory === 'all' ? totalCount : filteredItems.length;

  return (
    <>
      <div className="bg-wibe-surface">
        <main className="min-h-[100dvh] space-y-6 bg-wibe-surface">
          <section className="relative overflow-hidden bg-wibe-surface">
            <div className="relative h-[168px] sm:h-[190px]">
              <ImageWithFallback
                src={headerSrc}
                alt={list.title}
                className="absolute inset-0 h-full w-full object-cover"
                fallbackIcon={categoryIcon}
                fallbackClassName="absolute inset-0 h-full w-full"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />
            </div>

            {isOwner && (
              <button
                type="button"
                onClick={() => setShowSettings(true)}
                className="absolute left-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-colors hover:bg-black/55"
                aria-label="تنظیمات لیست"
              >
                <Settings className="h-5 w-5" />
              </button>
            )}
          </section>

          <div className="space-y-4 px-4">
            {pendingCollaboration && (
              <div className="space-y-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
                <p className="wibe-small text-foreground">
                  برای مشارکت در تکمیل این لیست شخصی دعوت شده‌اید.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={collabActionLoading}
                    onClick={() => handleCollaborationResponse('accept')}
                    className="flex-1 rounded-lg bg-primary px-4 py-2.5 wibe-small font-semibold text-white disabled:opacity-50"
                  >
                    پذیرش همکاری
                  </button>
                  <button
                    type="button"
                    disabled={collabActionLoading}
                    onClick={() => handleCollaborationResponse('reject')}
                    className="rounded-lg border border-wibe bg-wibe-card px-4 py-2.5 wibe-small font-semibold text-wibe-secondary disabled:opacity-50"
                  >
                    رد
                  </button>
                </div>
              </div>
            )}

            {list.categories && (
              <Link
                href={`/categories/${list.categories.slug}`}
                className="inline-flex items-center gap-2 rounded-md border border-wibe bg-wibe-card px-3 py-1.5 wibe-small font-medium"
              >
                <span>{list.categories.icon}</span>
                <span>{list.categories.name}</span>
              </Link>
            )}

            {list.description && (
              <p className="wibe-body leading-relaxed text-wibe-secondary">
                {list.description}
              </p>
            )}

            {list.isPublic && (
              <div className="flex gap-3">
                <BookmarkButton
                  listId={list.id}
                  initialBookmarkCount={list.saveCount ?? 0}
                  variant="button"
                  size="md"
                />
                <button
                  type="button"
                  className="flex items-center justify-center rounded-md border border-wibe bg-wibe-card px-4 py-3"
                  aria-label="اشتراک"
                >
                  <Share2 className="h-5 w-5 text-wibe-secondary" />
                </button>
              </div>
            )}
          </div>

          <div className="px-4">
            {showCategoryFilter && (
              <div className="mb-3 -mx-1 flex gap-2 overflow-x-auto px-1 pb-0.5 scrollbar-hide">
                <button
                  type="button"
                  onClick={() => setActiveCategory('all')}
                  className={`h-9 shrink-0 rounded-lg border px-3.5 wibe-small font-medium transition-colors ${
                    activeCategory === 'all'
                      ? 'border-primary bg-primary text-white shadow-sm'
                      : 'border-wibe bg-wibe-card text-foreground hover:border-primary/30'
                  }`}
                >
                  همه ({categoryMeta.total.toLocaleString('fa-IR')})
                </button>
                {categoryMeta.chips.map((c) => (
                  <button
                    key={c.slug}
                    type="button"
                    onClick={() => setActiveCategory(c.slug)}
                    className={`flex h-9 shrink-0 items-center gap-1.5 rounded-lg border px-3.5 wibe-small font-medium transition-colors ${
                      activeCategory === c.slug
                        ? 'border-primary bg-primary text-white shadow-sm'
                        : 'border-wibe bg-wibe-card text-foreground hover:border-primary/30'
                    }`}
                  >
                    <span aria-hidden>{c.icon}</span>
                    <span>
                      {c.label} ({c.count.toLocaleString('fa-IR')})
                    </span>
                  </button>
                ))}
              </div>
            )}

            <div className="mb-4 flex items-center justify-between">
              <h2 className="wibe-h3">
                آیتم‌های لیست ({displayCount.toLocaleString('fa-IR')})
              </h2>
              <div className="flex items-center gap-2">
                {filteredItems.length > 0 && (
                  <div className="flex items-center rounded-lg border border-wibe bg-wibe-card p-0.5">
                    <button
                      type="button"
                      onClick={() => setItemsView('list')}
                      className={`flex h-9 w-9 items-center justify-center rounded-md transition-colors ${
                        itemsView === 'list'
                          ? 'bg-primary text-white'
                          : 'text-wibe-secondary hover:bg-wibe-surface'
                      }`}
                      aria-label="نمایش لیستی"
                      title="لیستی"
                    >
                      <Rows3 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setItemsView('grid')}
                      className={`flex h-9 w-9 items-center justify-center rounded-md transition-colors ${
                        itemsView === 'grid'
                          ? 'bg-primary text-white'
                          : 'text-wibe-secondary hover:bg-wibe-surface'
                      }`}
                      aria-label="نمایش گریدی"
                      title="گریدی"
                    >
                      <LayoutGrid className="h-4 w-4" />
                    </button>
                  </div>
                )}

                {canAddItems && items.length > 0 && (
                  <Link
                    href={`/user-lists/${list.id}/add-item`}
                    className="rounded-md bg-primary px-4 py-2 wibe-small font-medium text-white transition-colors hover:bg-primary-dark"
                  >
                    افزودن آیتم
                  </Link>
                )}
              </div>
            </div>

            {filteredItems.length === 0 && !isLoadingMore ? (
              <div className="rounded-xl border border-wibe bg-wibe-card py-10 text-center shadow-sm">
                <p className="wibe-h3 text-foreground">هنوز آیتمی اضافه نشده است</p>
                <p className="mt-2 wibe-caption text-wibe-secondary">
                  اولین آیتم را اضافه کن تا این لیست جان بگیرد
                </p>
                {canAddItems && (
                  <Link
                    href={`/user-lists/${list.id}/add-item`}
                    className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-2.5 wibe-small font-semibold text-white transition-transform active:scale-[0.99]"
                  >
                    افزودن اولین آیتم
                  </Link>
                )}
              </div>
            ) : itemsView === 'grid' ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {filteredItems.map((item, index) => {
                  const img = itemImageSrc(item);
                  return (
                    <div
                      key={item.id}
                      className="relative overflow-hidden rounded-xl border border-wibe bg-wibe-card shadow-sm"
                    >
                      {isOwner && (
                        <button
                          type="button"
                          onClick={() => {
                            if (
                              confirm(
                                'آیا مطمئن هستید که می‌خواهید این آیتم را حذف کنید؟'
                              )
                            ) {
                              void handleDeleteItem(item.id);
                            }
                          }}
                          disabled={isDeleting}
                          className="absolute left-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-danger text-white shadow-sm disabled:opacity-50"
                          aria-label="حذف آیتم"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}

                      <span className="absolute right-2 top-2 z-10 inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary wibe-caption font-bold">
                        {index + 1}
                      </span>

                      <Link href={`/items/${item.id}`} className="block">
                        <div className="relative aspect-[4/3] w-full bg-wibe-surface">
                          {img ? (
                            <ImageWithFallback
                              src={img}
                              alt={item.title}
                              className="absolute inset-0 h-full w-full object-cover"
                              fallbackClassName="absolute inset-0 h-full w-full"
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-2xl text-wibe-secondary/70">
                              📌
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
                          <div className="absolute bottom-0 left-0 right-0 p-2 text-white">
                            <h3 className="line-clamp-2 wibe-small font-semibold leading-snug drop-shadow-sm">
                              {item.title}
                            </h3>
                          </div>
                        </div>

                        <div className="p-2.5">
                          {item.description ? (
                            <p className="line-clamp-2 wibe-caption leading-relaxed text-wibe-secondary">
                              {item.description}
                            </p>
                          ) : (
                            <p className="wibe-caption text-wibe-secondary/70">بدون توضیح</p>
                          )}
                        </div>
                      </Link>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredItems.map((item, index) => {
                  const img = itemImageSrc(item);
                  return (
                    <div
                      key={item.id}
                      className="relative rounded-lg border border-wibe bg-wibe-card p-3 shadow-sm"
                    >
                      {isOwner && (
                        <button
                          type="button"
                          onClick={() => {
                            if (
                              confirm(
                                'آیا مطمئن هستید که می‌خواهید این آیتم را حذف کنید؟'
                              )
                            ) {
                              void handleDeleteItem(item.id);
                            }
                          }}
                          disabled={isDeleting}
                          className="absolute left-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-danger text-white disabled:opacity-50"
                          aria-label="حذف آیتم"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                      <Link href={`/items/${item.id}`} className="block">
                        <div className="flex gap-3">
                          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary wibe-small font-bold">
                            {index + 1}
                          </div>
                          {img && (
                            <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-md bg-wibe-surface">
                              <ImageWithFallback
                                src={img}
                                alt={item.title}
                                className="h-full w-full object-cover"
                              />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <h3 className="mb-1 wibe-small font-semibold text-foreground">
                              {item.title}
                            </h3>
                            {item.description && (
                              <p className="line-clamp-2 wibe-caption text-wibe-secondary">
                                {item.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}

            {hasMore && activeCategory === 'all' && (
              <div
                ref={loadMoreRef}
                className="flex h-12 w-full items-center justify-center"
              >
                {isLoadingMore && (
                  <span className="wibe-caption text-wibe-secondary">
                    در حال بارگذاری...
                  </span>
                )}
              </div>
            )}
          </div>

          {list.isPublic && list.commentsEnabled && (
            <div className="px-4">
              <ListCommentSection listId={list.id} />
            </div>
          )}
        </main>
      </div>

      {isOwner && showSettings && (
        <PersonalListSettingsModal
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          list={{
            id: list.id,
            title: list.title,
            description: list.description,
            coverImage: list.coverImage,
            isPublic: list.isPublic,
            itemCount: items.length,
            commentsEnabled: list.commentsEnabled,
          }}
          onUpdate={handleSettingsUpdate}
          onDelete={() => {
            window.location.href = '/profile';
          }}
        />
      )}

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
