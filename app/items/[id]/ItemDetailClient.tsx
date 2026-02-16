'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import CommentSection from '@/components/mobile/comments/CommentSection';
import CommentForm from '@/components/mobile/comments/CommentForm';
import ItemReportButton from '@/components/mobile/items/ItemReportButton';
import ItemLikeButton from '@/components/mobile/items/ItemLikeButton';
import ItemSaveButton from '@/components/mobile/items/ItemSaveButton';
import type { SimilarItem, TrendingItem, AlsoLikedItem } from '@/types/items';

const DESCRIPTION_TRUNCATE = 160;

interface ItemDetailClientProps {
  item: {
    id: string;
    title: string;
    description: string | null;
    imageUrl: string | null;
    externalUrl: string | null;
    rating: number | null;
    voteCount: number | null;
    metadata: Record<string, unknown> | null;
    commentCount: number;
    listSaveCount: number;
    lists: {
      id: string;
      title: string;
      slug: string;
      saveCount: number;
      categories: {
        id: string;
        name: string;
        slug: string;
        icon: string;
        color: string;
      } | null;
    };
    users: { name: string | null } | null;
    isLiked?: boolean;
  };
}

const metaLabels: Record<string, string> = {
  year: 'سال',
  genre: 'ژانر',
  director: 'کارگردان',
  imdbRating: 'امتیاز',
  author: 'نویسنده',
  address: 'آدرس',
  priceRange: 'بازه قیمت',
  cuisine: 'نوع غذا',
  phone: 'تلفن',
};

const metaIcons: Record<string, string> = {
  year: '📅',
  genre: '🎭',
  director: '🎬',
  imdbRating: '⭐',
  author: '✍️',
  address: '📍',
  priceRange: '💰',
  cuisine: '🍽️',
  phone: '📞',
};

export default function ItemDetailClient({ item }: ItemDetailClientProps) {
  const [heroCollapsed, setHeroCollapsed] = useState(false);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [commentFormOpen, setCommentFormOpen] = useState(false);
  const [commentCount, setCommentCount] = useState(item.commentCount);
  const [commentRefreshTrigger, setCommentRefreshTrigger] = useState(0);
  const onCommentsUpdate = () => setCommentCount((c) => c + 1);

  const categoryId = item.lists.categories?.id ?? null;

  const { data: similarItems = [], isLoading: similarLoading } = useQuery({
    queryKey: ['items', item.id, 'similar'],
    queryFn: async (): Promise<SimilarItem[]> => {
      const res = await fetch(`/api/items/${item.id}/similar`);
      const json = await res.json();
      return json.data && Array.isArray(json.data) ? json.data : [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: trendingRaw = [], isLoading: trendingLoading } = useQuery({
    queryKey: ['categories', categoryId, 'trending'],
    queryFn: async (): Promise<TrendingItem[]> => {
      const res = await fetch(`/api/categories/${categoryId}/trending`);
      const json = await res.json();
      const list = json.data && Array.isArray(json.data) ? (json.data as TrendingItem[]) : [];
      return list.filter((t) => t.id !== item.id);
    },
    enabled: !!categoryId,
    staleTime: 5 * 60 * 1000,
  });
  const trendingItems = trendingRaw;

  const { data: alsoLikedItems = [], isLoading: alsoLikedLoading } = useQuery({
    queryKey: ['items', item.id, 'also-liked'],
    queryFn: async (): Promise<AlsoLikedItem[]> => {
      const res = await fetch(`/api/items/${item.id}/also-liked`);
      const json = await res.json();
      return json.data && Array.isArray(json.data) ? json.data : [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const categoryName = item.lists.categories?.name ?? null;
  const meta = (item.metadata || {}) as Record<string, string | number>;
  const year = meta.year ?? null;
  const rating = item.rating ?? (meta.imdbRating ?? null);
  const genre = meta.genre ?? categoryName;

  const shortDescription =
    item.description && item.description.length > DESCRIPTION_TRUNCATE && !descriptionExpanded
      ? item.description.slice(0, DESCRIPTION_TRUNCATE) + '…'
      : item.description;

  useEffect(() => {
    const onScroll = () => setHeroCollapsed(window.scrollY > 80);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <main className="pb-24">
        {/* ——— 1️⃣ HERO ——— */}
        <section
          className={`relative w-full overflow-hidden transition-all duration-300 ${
            heroCollapsed ? 'h-44' : 'min-h-[320px]'
          }`}
        >
          {item.imageUrl ? (
            <ImageWithFallback
              src={item.imageUrl}
              alt={item.title}
              className="absolute inset-0 w-full h-full object-cover"
              fallbackIcon={item.lists.categories?.icon || '📋'}
              fallbackClassName="absolute inset-0 w-full h-full flex items-center justify-center bg-gray-100"
              priority
              imageFolder="items"
            />
          ) : (
            <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
              <span className="text-7xl opacity-40">
                {item.lists.categories?.icon || '📋'}
              </span>
            </div>
          )}

          {/* Gradient overlay (bottom 40%) */}
          <div
            className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent"
            style={{ backgroundSize: '100% 100%' }}
          />

          {/* Content on top of image — Vibe 2.1: title, meta, primary/secondary CTA, share */}
          <div className="absolute inset-0 flex flex-col justify-end p-4 pb-5 text-white">
            <Link
              href={`/lists/${item.lists.slug}`}
              className="inline-flex items-center gap-2 self-start mb-3 px-3 py-1.5 rounded-full text-xs font-medium bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors"
            >
              <span>{item.lists.categories?.icon || '📋'}</span>
              <span>بازگشت به: {item.lists.title}</span>
            </Link>

            <h1 className="text-2xl font-bold leading-tight drop-shadow-md">
              {item.title}
            </h1>

            {/* Meta: genre, year, rating */}
            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-white/95">
              {(genre || categoryName) && (
                <span className="flex items-center gap-1">
                  <span>🎭</span>
                  <span>{String(genre || categoryName)}</span>
                </span>
              )}
              {year != null && (
                <span className="flex items-center gap-1">
                  <span>📅</span>
                  <span>{String(year)}</span>
                </span>
              )}
              {rating != null && (
                <span className="flex items-center gap-1">
                  <span>⭐</span>
                  <span>{rating}</span>
                </span>
              )}
            </div>

            {/* CTAs: Primary Save, Secondary Add to List, small Share & Like */}
            <div className="flex items-center gap-3 mt-4">
              <div className="flex-1 flex gap-2 flex-wrap">
                <div className="flex-shrink-0">
                  <ItemSaveButton itemId={item.id} />
                </div>
                <Link
                  href={`/lists/${item.lists.slug}`}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-white/25 backdrop-blur-sm hover:bg-white/35 transition-colors border border-white/30"
                >
                  <span>📂</span>
                  <span>افزودن به لیست</span>
                </Link>
              </div>
              <div className="flex items-center gap-1.5">
                <ItemLikeButton
                  itemId={item.id}
                  initialLikeCount={item.voteCount || 0}
                  initialIsLiked={item.isLiked || false}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (typeof navigator !== 'undefined' && navigator.share) {
                      navigator.share({
                        title: item.title,
                        url: typeof window !== 'undefined' ? window.location.href : '',
                      }).catch(() => {});
                    }
                  }}
                  className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 flex items-center justify-center transition-colors"
                  aria-label="اشتراک‌گذاری"
                >
                  <span className="text-lg">↗</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        <div className="px-4 mt-4 relative z-10 space-y-8">
          {/* ——— 2️⃣ SOCIAL PROOF (کارت برجسته) ——— */}
          <section className="rounded-2xl bg-white p-4 shadow-md shadow-gray-200/60 border border-gray-100">
            <div className="flex flex-col gap-2">
              {item.listSaveCount > 0 && (
                <p className="flex items-center gap-2 text-gray-800 font-medium">
                  <span className="text-lg">👥</span>
                  <span>{item.listSaveCount} نفر این لیست را ذخیره کرده‌اند</span>
                </p>
              )}
              {categoryName && (
                <p className="flex items-center gap-2 text-sm text-gray-600">
                  <span>🔥</span>
                  <span>جزو محبوب‌های دسته {categoryName}</span>
                </p>
              )}
            </div>
          </section>

          {/* ——— 3️⃣ درباره این آیتم ——— */}
          <section className="rounded-2xl bg-white p-4 shadow-sm border border-gray-100">
            <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
              <span>📖</span>
              درباره این آیتم
            </h2>
            {item.description ? (
              <div>
                <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">
                  {shortDescription}
                </p>
                {item.description.length > DESCRIPTION_TRUNCATE && !descriptionExpanded && (
                  <button
                    type="button"
                    onClick={() => setDescriptionExpanded(true)}
                    className="text-primary text-sm font-medium mt-2 hover:underline"
                  >
                    نمایش بیشتر
                  </button>
                )}
              </div>
            ) : (
              <div className="py-4 px-4 rounded-xl bg-gray-50/80 text-center">
                <p className="text-gray-500 text-sm">هنوز توضیحی ثبت نشده</p>
                <p className="text-gray-400 text-xs mt-1">
                  اولین نفری باش که توضیح اضافه می‌کنه ✨
                </p>
              </div>
            )}
          </section>

          {/* External link */}
          {item.externalUrl && (
            <a
              href={item.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-medium hover:opacity-90 transition-opacity text-sm"
            >
              <span>🔗</span>
              <span>اطلاعات بیشتر</span>
            </a>
          )}

          {/* ——— Similar Items (below description, above metadata) ——— */}
          <section className="-mx-4 px-4">
            <h2 className="text-base font-bold text-gray-900 mb-1 flex items-center gap-2">
              <span>✨</span>
              شاید این‌ها هم به وایبت بخوره
            </h2>
            <p className="text-sm text-gray-500 mb-3">بر اساس ژانر و حال‌و‌هوا</p>

            {similarLoading ? (
              <div className="flex gap-4 overflow-hidden">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="min-w-[70%] w-[70%] flex-shrink-0 rounded-2xl h-44 bg-gray-100 animate-pulse"
                  />
                ))}
              </div>
            ) : similarItems.length < 2 ? (
              <div className="py-6 px-4 rounded-2xl bg-gray-50 border border-gray-100 text-center">
                <p className="text-gray-500 text-sm">هنوز آیتم مشابه زیادی نداریم 😉</p>
              </div>
            ) : (
              <div className="flex gap-4 overflow-x-auto overflow-y-hidden pb-2 -mx-4 px-4 scrollbar-hide">
                {similarItems.map((s) => (
                  <Link
                    key={s.id}
                    href={`/items/${s.id}`}
                    className="flex-shrink-0 w-[70%] max-w-[280px] rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-shadow active:opacity-95"
                  >
                    <div className="relative aspect-[3/4] w-full bg-gray-100">
                      {s.image ? (
                        <ImageWithFallback
                          src={s.image}
                          alt={s.title}
                          className="absolute inset-0 w-full h-full object-cover"
                          fallbackIcon={s.category?.icon ?? '📋'}
                          fallbackClassName="absolute inset-0 flex items-center justify-center bg-gray-200"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
                          <span className="text-4xl opacity-50">
                            {s.category?.icon ?? '📋'}
                          </span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                        <h3 className="font-semibold text-sm leading-snug line-clamp-2 drop-shadow">
                          {s.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-1.5 text-xs text-white/90">
                          {s.rating != null && (
                            <span className="flex items-center gap-0.5">
                              <span>⭐</span>
                              <span>{s.rating}</span>
                            </span>
                          )}
                          {s.category?.name && (
                            <span className="flex items-center gap-0.5">
                              <span>🎭</span>
                              <span>{s.category.name}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* ——— 4️⃣ People also liked (behavior-based، قبل از Trending) ——— */}
          <section className="-mx-4 px-4">
            <h2 className="text-base font-bold text-gray-900 mb-1 flex items-center gap-2">
              <span>👥</span>
              کسایی که اینو دوست داشتن، اینا رو هم دوست داشتن
            </h2>
            <p className="text-sm text-gray-500 mb-3">بر اساس رفتار کاربران</p>

            {alsoLikedLoading ? (
              <div className="flex gap-4 overflow-hidden">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="min-w-[45%] flex-shrink-0 rounded-2xl h-52 bg-gray-100 animate-pulse"
                  />
                ))}
              </div>
            ) : alsoLikedItems.length === 0 ? (
              <div className="py-6 px-4 rounded-2xl bg-gray-50/80 border border-gray-100 text-center">
                <p className="text-gray-500 text-sm">هنوز داده‌ای برای پیشنهاد نداریم 😉</p>
              </div>
            ) : (
              <div className="flex gap-4 overflow-x-auto overflow-y-hidden pb-2 -mx-4 px-4 scrollbar-hide">
                {alsoLikedItems.map((a) => (
                  <Link
                    key={a.id}
                    href={`/items/${a.id}`}
                    className="flex-shrink-0 w-[45%] max-w-[200px] rounded-2xl overflow-hidden shadow-sm bg-white border border-gray-100 hover:shadow-md active:opacity-95 transition-all"
                  >
                    <div className="relative aspect-[3/4] w-full bg-gray-100">
                      {a.image ? (
                        <ImageWithFallback
                          src={a.image}
                          alt={a.title}
                          className="w-full h-full object-cover"
                          fallbackIcon="📋"
                          fallbackClassName="w-full h-full flex items-center justify-center bg-gray-200"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-200 text-2xl opacity-50">
                          📋
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-2.5 text-white">
                        <h3 className="font-semibold text-sm leading-snug line-clamp-2 drop-shadow">
                          {a.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-1 text-xs text-white/90">
                          {a.rating != null && (
                            <span className="flex items-center gap-0.5">
                              <span>⭐</span>
                              <span>{a.rating}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <p className="p-2.5 text-xs text-gray-600 leading-snug">
                      {a.commonUsersCount} نفر اینو همراه این ذخیره کردن
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* ——— 5️⃣ Trending in category (mini horizontal) ——— */}
          {categoryId && (
            <section className="-mx-4 px-4">
              <h2 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
                <span>🔥</span>
                داغ‌های {categoryName || 'این دسته'}
              </h2>
              {trendingLoading ? (
                <div className="flex gap-3 overflow-hidden">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="min-w-[100px] flex-shrink-0 rounded-xl h-28 bg-gray-100 animate-pulse"
                    />
                  ))}
                </div>
              ) : trendingItems.length > 0 ? (
                <div className="flex gap-3 overflow-x-auto overflow-y-hidden pb-2 -mx-4 px-4 scrollbar-hide">
                  {trendingItems.slice(0, 8).map((t, index) => {
                    const rank = index + 1;
                    const isTop = rank <= 3;
                    return (
                      <Link
                        key={t.id}
                        href={`/items/${t.id}`}
                        className="flex-shrink-0 w-[100px] rounded-xl overflow-hidden bg-white border border-gray-100 shadow-sm hover:shadow-md active:opacity-95 transition-all"
                      >
                        <div className="relative aspect-[3/4] w-full bg-gray-100">
                          {t.image ? (
                            <ImageWithFallback
                              src={t.image}
                              alt={t.title}
                              className="w-full h-full object-cover"
                              fallbackIcon="📋"
                              fallbackClassName="w-full h-full flex items-center justify-center bg-gray-200"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-200 text-xl opacity-50">
                              📋
                            </div>
                          )}
                          {isTop && (
                            <span className="absolute top-1 right-1 text-[10px] bg-orange-500/90 text-white px-1 py-0.5 rounded">
                              #{rank}
                            </span>
                          )}
                        </div>
                        <p className="p-1.5 text-xs font-medium text-gray-900 line-clamp-2 leading-tight">
                          {t.title}
                        </p>
                      </Link>
                    );
                  })}
                </div>
              ) : null}
            </section>
          )}

          {/* ——— اطلاعات تکمیلی (مینیمال) ——— */}
          {item.metadata &&
            typeof item.metadata === 'object' &&
            Object.keys(item.metadata).length > 0 && (
              <section>
                <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="w-1 h-4 bg-primary rounded-full" />
                  اطلاعات تکمیلی
                </h2>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                  {(Object.entries(item.metadata) as [string, unknown][]).map(
                    ([key, value]) => {
                      if (value == null || value === '') return null;
                      const label = metaLabels[key] || key;
                      const icon = metaIcons[key] || '📋';
                      const displayValue =
                        key === 'priceRange' && typeof value === 'string'
                          ? value === '$'
                            ? 'ارزان'
                            : value === '$$'
                              ? 'متوسط'
                              : value === '$$$'
                                ? 'گران'
                                : 'لوکس'
                          : String(value);
                      return (
                        <div
                          key={key}
                          className="flex items-center gap-2 py-2 border-b border-gray-100 last:border-0"
                        >
                          <span className="text-base">{icon}</span>
                          <div className="min-w-0">
                            <span className="text-xs text-gray-500 block">
                              {label}
                            </span>
                            <span className="text-sm font-medium text-gray-900 truncate block">
                              {displayValue}
                            </span>
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              </section>
            )}

          {/* ——— 6️⃣ این آیتم در چه لیست‌هایی است (کارت برجسته) ——— */}
          <section className="rounded-2xl bg-white p-4 shadow-md shadow-gray-200/60 border border-gray-100">
            <p className="text-gray-800 font-medium mb-3 flex items-center gap-2">
              <span className="text-lg">📂</span>
              در ۱ لیست محبوب حضور دارد
            </p>
            <Link
              href={`/lists/${item.lists.slug}`}
              className="inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-primary/10 text-primary font-medium hover:bg-primary/20 transition-colors text-sm"
            >
              <span>مشاهده لیست‌ها</span>
              <span>←</span>
            </Link>
            <div className="mt-2">
              <Link
                href={`/lists/${item.lists.slug}`}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-sm text-gray-700"
              >
                <span>{item.lists.categories?.icon || '📋'}</span>
                <span>{item.lists.title}</span>
              </Link>
            </div>
          </section>

          {/* ——— 7️⃣ نظرات ——— */}
          <section id="comments" className="rounded-2xl bg-white p-4 shadow-sm border border-gray-100">
            <CommentSection
              itemId={item.id}
              onCommentAdded={onCommentsUpdate}
              onOpenCommentForm={() => setCommentFormOpen(true)}
              refreshTrigger={commentRefreshTrigger}
            />
          </section>

          {/* گزارش آیتم (مینیمال) */}
          <div className="flex justify-center pt-2 pb-4">
            <ItemReportButton itemId={item.id} />
          </div>
        </div>

        {/* ——— Quick Action Bar (وقتی اسکرول شده) ——— وقتی شیت کامنت باز است مخفی تا تداخل نداشته باشد */}
        {heroCollapsed && !commentFormOpen && (
          <div className="fixed bottom-20 left-4 right-4 z-30 flex items-center gap-2 p-2 rounded-2xl bg-white/95 backdrop-blur shadow-lg border border-gray-200">
            <div className="flex-shrink-0">
              <ItemSaveButton itemId={item.id} />
            </div>
            <div className="flex-shrink-0">
              <ItemLikeButton
                itemId={item.id}
                initialLikeCount={item.voteCount || 0}
                initialIsLiked={item.isLiked || false}
              />
            </div>
            <Link
              href={`/lists/${item.lists.slug}`}
              className="flex-1 min-w-0 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors"
            >
              <span>📂</span>
              <span>افزودن به لیست</span>
            </Link>
            <button
              type="button"
              onClick={() => setCommentFormOpen(true)}
              className="flex-shrink-0 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-white font-medium text-sm hover:opacity-95"
            >
              <span>💬</span>
              <span>نظر</span>
            </button>
          </div>
        )}

        {/* ——— Sticky CTA نظر ——— وقتی شیت کامنت باز است مخفی تا تداخل نداشته باشد */}
        {!heroCollapsed && !commentFormOpen && (
          <button
            type="button"
            onClick={() => setCommentFormOpen(true)}
            className="fixed bottom-20 left-4 right-4 z-30 flex items-center justify-center gap-2 py-3 px-4 rounded-full bg-primary text-white font-medium shadow-lg shadow-primary/30 hover:opacity-95 transition-opacity"
          >
            <span className="text-lg">+</span>
            <span>نظر بده</span>
          </button>
        )}
      </main>

      <CommentForm
        isOpen={commentFormOpen}
        onClose={() => setCommentFormOpen(false)}
        itemId={item.id}
        onSubmit={() => {
          onCommentsUpdate();
          setCommentRefreshTrigger((t) => t + 1);
          setCommentFormOpen(false);
        }}
      />
    </>
  );
}
