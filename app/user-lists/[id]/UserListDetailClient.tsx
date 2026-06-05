'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import { Settings, Trash2, Share2, LayoutGrid, Rows3 } from 'lucide-react';
import { Bookmark } from 'lucide-react';
import BookmarkButton from '@/components/mobile/lists/BookmarkButton';
import ListCommentSection from '@/components/mobile/lists/ListCommentSection';
import PersonalListSettingsModal from '@/components/mobile/profile/PersonalListSettingsModal';
import Toast from '@/components/shared/Toast';
import ListCoverImage from '@/components/shared/ListCoverImage';

interface Item {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
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
  users: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
}

interface UserListDetailClientProps {
  list: List;
  currentUserId: string | null;
}

export default function UserListDetailClient({
  list,
  currentUserId,
}: UserListDetailClientProps) {
  const [items, setItems] = useState(list.items);
  const [showSettings, setShowSettings] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [itemsView, setItemsView] = useState<'list' | 'grid'>('list');

  const isOwner = currentUserId === list.userId;
  const categorySlug = list.categories?.slug ?? null;
  const categoryIcon = list.categories?.icon ?? '📋';
  const headerSrc = (list.coverImage && list.coverImage.trim()) ? list.coverImage : '/images/banners/default.jpg';

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

  const [activeCategory, setActiveCategory] = useState<string>('all');

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
    setShowDeleteConfirm(null);

    try {
      const res = await fetch(`/api/user/lists/${list.id}/items/${itemId}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'خطا در حذف آیتم');
      }

      // Remove item from local state
      setItems((prev) => prev.filter((item) => item.id !== itemId));

      setToastMessage('آیتم با موفقیت حذف شد');
      setToastType('success');
      setShowToast(true);
    } catch (error: any) {
      setToastMessage(error.message || 'خطا در حذف آیتم');
      setToastType('error');
      setShowToast(true);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSettingsUpdate = () => {
    // Refresh page or update list data
    window.location.reload();
  };

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
            {list.categories && (
              <Link
                href={`/categories/${list.categories.slug}`}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md wibe-small font-medium border border-wibe bg-wibe-card"
              >
                <span>{list.categories.icon}</span>
                <span>{list.categories.name}</span>
              </Link>
            )}

            {list.description && (
              <p className="wibe-body text-wibe-secondary leading-relaxed">{list.description}</p>
            )}

            {/* intentionally hide counts row (items/saves/views) for cleaner UI */}

            {list.isPublic && (
              <div className="flex gap-3">
                <BookmarkButton listId={list.id} initialBookmarkCount={list.saveCount ?? 0} variant="button" size="md" />
                <button
                  type="button"
                  className="px-4 py-3 bg-wibe-card border border-wibe rounded-md flex items-center justify-center"
                  aria-label="اشتراک"
                >
                  <Share2 className="w-5 h-5 text-wibe-secondary" />
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
                  className={`shrink-0 h-9 px-3.5 rounded-lg wibe-small font-medium transition-colors border ${
                    activeCategory === 'all'
                      ? 'bg-primary text-white border-primary shadow-sm'
                      : 'bg-wibe-card text-foreground border-wibe hover:border-primary/30'
                  }`}
                >
                  همه ({categoryMeta.total.toLocaleString('fa-IR')})
                </button>
                {categoryMeta.chips.map((c) => (
                  <button
                    key={c.slug}
                    type="button"
                    onClick={() => setActiveCategory(c.slug)}
                    className={`shrink-0 h-9 px-3.5 rounded-lg wibe-small font-medium transition-colors border flex items-center gap-1.5 ${
                      activeCategory === c.slug
                        ? 'bg-primary text-white border-primary shadow-sm'
                        : 'bg-wibe-card text-foreground border-wibe hover:border-primary/30'
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

            <div className="flex items-center justify-between mb-4">
              <h2 className="wibe-h3">آیتم‌های لیست ({filteredItems.length})</h2>
              <div className="flex items-center gap-2">
                {filteredItems.length > 0 && (
                  <div className="flex items-center rounded-lg border border-wibe bg-wibe-card p-0.5">
                    <button
                      type="button"
                      onClick={() => setItemsView('list')}
                      className={`flex h-9 w-9 items-center justify-center rounded-md transition-colors ${
                        itemsView === 'list' ? 'bg-primary text-white' : 'text-wibe-secondary hover:bg-gray-50'
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
                        itemsView === 'grid' ? 'bg-primary text-white' : 'text-wibe-secondary hover:bg-gray-50'
                      }`}
                      aria-label="نمایش گریدی"
                      title="گریدی"
                    >
                      <LayoutGrid className="h-4 w-4" />
                    </button>
                  </div>
                )}

                {isOwner && items.length > 0 && (
                  <Link
                    href={`/user-lists/${list.id}/add-item`}
                    className="px-4 py-2 bg-primary text-white rounded-md wibe-small font-medium hover:bg-primary-dark transition-colors"
                  >
                    افزودن آیتم
                  </Link>
                )}
              </div>
            </div>

            {filteredItems.length === 0 ? (
              <div className="text-center py-10 bg-wibe-card rounded-xl border border-wibe shadow-sm">
                <p className="wibe-h3 text-foreground">هنوز آیتمی اضافه نشده است</p>
                <p className="mt-2 wibe-caption text-wibe-secondary">
                  اولین آیتم را اضافه کن تا این لیست جان بگیرد
                </p>
                {isOwner && (
                  <Link
                    href={`/user-lists/${list.id}/add-item`}
                    className="mt-4 inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl wibe-small font-semibold active:scale-[0.99] transition-transform"
                  >
                    افزودن اولین آیتم
                  </Link>
                )}
              </div>
            ) : itemsView === 'grid' ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {filteredItems.map((item, index) => (
                  <div
                    key={item.id}
                    className="relative overflow-hidden rounded-xl border border-wibe bg-wibe-card shadow-sm"
                  >
                    {isOwner && (
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm('آیا مطمئن هستید که می‌خواهید این آیتم را حذف کنید؟')) {
                            handleDeleteItem(item.id);
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
                      <div className="relative aspect-[4/3] w-full bg-gray-200">
                        {item.imageUrl ? (
                          <ImageWithFallback
                            src={item.imageUrl}
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
                          <h3 className="wibe-small font-semibold leading-snug line-clamp-2 drop-shadow-sm">
                            {item.title}
                          </h3>
                        </div>
                      </div>

                      <div className="p-2.5">
                        {item.description ? (
                          <p className="wibe-caption text-wibe-secondary line-clamp-2 leading-relaxed">
                            {item.description}
                          </p>
                        ) : (
                          <p className="wibe-caption text-wibe-secondary/70">بدون توضیح</p>
                        )}
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredItems.map((item, index) => (
                  <div
                    key={item.id}
                    className="relative bg-wibe-card rounded-lg p-3 border border-wibe shadow-sm"
                  >
                    {isOwner && (
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm('آیا مطمئن هستید که می‌خواهید این آیتم را حذف کنید؟')) {
                            handleDeleteItem(item.id);
                          }
                        }}
                        disabled={isDeleting}
                        className="absolute top-2 left-2 z-10 w-8 h-8 bg-danger text-white rounded-full flex items-center justify-center disabled:opacity-50"
                        aria-label="حذف آیتم"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    <Link href={`/items/${item.id}`} className="block">
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-9 h-9 bg-primary/10 text-primary rounded-full flex items-center justify-center wibe-small font-bold">
                          {index + 1}
                        </div>
                        {item.imageUrl && (
                          <div className="relative w-14 h-14 flex-shrink-0 rounded-md overflow-hidden bg-gray-200">
                            <ImageWithFallback src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="wibe-small font-semibold text-foreground mb-1">{item.title}</h3>
                          {item.description && (
                            <p className="wibe-caption text-wibe-secondary line-clamp-2">{item.description}</p>
                          )}
                        </div>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {list.isPublic && (
            <div className="px-4 py-4 bg-wibe-card mx-4 rounded-lg border border-wibe">
              <div className="flex items-center gap-3">
                {list.users.image ? (
                  <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-200">
                    <ImageWithFallback src={list.users.image} alt={list.users.name || list.users.email} className="object-cover w-full h-full" />
                  </div>
                ) : (
                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold">
                    {(list.users.name || list.users.email).charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="wibe-caption text-wibe-secondary">ایجاد شده توسط</p>
                  <p className="wibe-small font-medium text-foreground">
                    {list.users.name || list.users.email.split('@')[0]}
                  </p>
                </div>
              </div>
            </div>
          )}

          {list.isPublic && list.commentsEnabled && (
            <div className="px-4">
              <ListCommentSection listId={list.id} />
            </div>
          )}
        </main>
      </div>

      {/* Settings Modal */}
      {isOwner && (
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

