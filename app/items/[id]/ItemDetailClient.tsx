'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Bookmark, Share2 } from 'lucide-react';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import { MOBILE_SHELL_MAX_WIDTH_CLASS } from '@/components/providers/MainContainer';
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
              className="inline-flex items-center gap-2 self-start mb-3 px-3 py-1.5 rounded-pill wibe-caption font-medium bg-white/15 backdrop-blur-sm hover:bg-white/25 transition-colors"
            >
              <span>{item.lists.categories?.icon || '📋'}</span>
              <span>بازگشت به: {item.lists.title}</span>
            </Link>

            <h1 className="wibe-h1 text-white leading-tight">{item.title}</h1>

            <div className="flex flex-wrap items-center gap-3 mt-2 wibe-small text-white/95">
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
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md wibe-small font-medium bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors border border-white/30"
                >
                  افزودن به لیست
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
                  className="w-10 h-10 rounded-full bg-white/15 backdrop-blur-sm hover:bg-white/25 flex items-center justify-center transition-colors"
                  aria-label="اشتراک‌گذاری"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </section>

        <div className="px-4 mt-4 relative z-10 space-y-6">
          <section className="rounded-lg bg-wibe-card p-4 shadow-sm border border-wibe">
            <div className="flex flex-col gap-2">
              {item.listSaveCount > 0 && (
                <p className="flex items-center gap-2 wibe-small font-medium text-foreground">
                  <Bookmark className="w-4 h-4 text-primary" />
                  <span>{item.listSaveCount.toLocaleString('fa-IR')} نفر این لیست را ذخیره کرده‌اند</span>
                </p>
              )}
              {categoryName && (
                <p className="wibe-caption text-wibe-secondary">جزو محبوب‌های دسته {categoryName}</p>
              )}
            </div>
          </section>

          <section className="rounded-lg bg-wibe-card p-4 shadow-sm border border-wibe">
            <h2 className="wibe-h3 mb-3">درباره این آیتم</h2>
            {item.description ? (
              <div>
                <p className="wibe-small text-foreground leading-relaxed whitespace-pre-line">{shortDescription}</p>
                {item.description.length > DESCRIPTION_TRUNCATE && !descriptionExpanded && (
                  <button
                    type="button"
                    onClick={() => setDescriptionExpanded(true)}
                    className="text-primary wibe-small font-medium mt-2 hover:underline"
                  >
                    نمایش بیشتر
                  </button>
                )}
              </div>
            ) : (
              <div className="py-4 px-4 rounded-md bg-gray-50 text-center">
                <p className="wibe-small text-wibe-secondary">هنوز توضیحی ثبت نشده</p>
                <p className="wibe-caption text-wibe-secondary mt-1">اولین نفری باش که توضیح اضافه می‌کنه</p>
              </div>
            )}
          </section>

          {item.externalUrl && (
            <a
              href={item.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-md wibe-small font-medium hover:bg-primary-dark transition-colors"
            >
              اطلاعات بیشتر
            </a>
          )}

          <section className="-mx-4 px-4">
            <h2 className="wibe-h3 mb-0.5">شاید این‌ها هم به وایبت بخوره</h2>
            <p className="wibe-small text-wibe-secondary mb-3">بر اساس ژانر و حال‌و‌هوا</p>

            {similarLoading ? (
              <div className="flex gap-4 overflow-hidden">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="min-w-[70%] w-[70%] flex-shrink-0 rounded-lg h-44 bg-gray-200 animate-pulse" />
                ))}
              </div>
            ) : similarItems.length < 2 ? (
              <div className="py-6 px-4 rounded-lg bg-wibe-card border border-wibe text-center">
                <p className="wibe-small text-wibe-secondary">هنوز آیتم مشابه زیادی نداریم</p>
              </div>
            ) : (
              <div className="flex gap-4 overflow-x-auto overflow-y-hidden pb-2 -mx-4 px-4 scrollbar-hide">
                {similarItems.map((s) => (
                  <Link
                    key={s.id}
                    href={`/items/${s.id}`}
                    className="flex-shrink-0 w-[70%] max-w-[280px] rounded-lg overflow-hidden border border-wibe shadow-card active:scale-[0.99] transition-transform"
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

          <section className="-mx-4 px-4">
            <h2 className="wibe-h3 mb-0.5">پیشنهاد بر اساس ذخیره‌ها</h2>
            <p className="wibe-small text-wibe-secondary mb-3">کاربرانی که این را ذخیره کردند</p>

            {alsoLikedLoading ? (
              <div className="flex gap-4 overflow-hidden">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="min-w-[45%] flex-shrink-0 rounded-lg h-52 bg-gray-200 animate-pulse" />
                ))}
              </div>
            ) : alsoLikedItems.length === 0 ? (
              <div className="py-6 px-4 rounded-lg bg-wibe-card border border-wibe text-center">
                <p className="wibe-small text-wibe-secondary">هنوز داده‌ای برای پیشنهاد نداریم</p>
              </div>
            ) : (
              <div className="flex gap-4 overflow-x-auto overflow-y-hidden pb-2 -mx-4 px-4 scrollbar-hide">
                {alsoLikedItems.map((a) => (
                  <Link
                    key={a.id}
                    href={`/items/${a.id}`}
                    className="flex-shrink-0 w-[45%] max-w-[200px] rounded-lg overflow-hidden border border-wibe bg-wibe-card shadow-sm active:scale-[0.99] transition-transform"
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
                    <p className="p-2.5 wibe-caption text-wibe-secondary leading-snug">
                      {a.commonUsersCount} نفر این را همراه ذخیره کردند
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* ——— 5️⃣ Trending in category (mini horizontal) ——— */}
          {categoryId && (
            <section className="-mx-4 px-4">
              <h2 className="wibe-h3 mb-2">داغ‌های {categoryName || 'این دسته'}</h2>
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
                        className="flex-shrink-0 w-[100px] rounded-lg overflow-hidden bg-wibe-card border border-wibe shadow-sm active:scale-[0.99] transition-transform"
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
                            <span className="absolute top-1 right-1 wibe-caption bg-warning text-white px-1 py-0.5 rounded-pill">
                              #{rank}
                            </span>
                          )}
                        </div>
                        <p className="p-1.5 wibe-caption font-medium text-foreground line-clamp-2 leading-tight">
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
                <h2 className="wibe-h3 mb-3 flex items-center gap-2">
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
                          className="flex items-center gap-2 py-2 border-b border-wibe last:border-0"
                        >
                          <span className="text-base">{icon}</span>
                          <div className="min-w-0">
                            <span className="wibe-caption text-wibe-secondary block">{label}</span>
                            <span className="wibe-small font-medium text-foreground truncate block">
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

          <section className="rounded-lg bg-wibe-card p-4 shadow-sm border border-wibe">
            <p className="wibe-small font-medium text-foreground mb-3 flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-primary" />
              در لیست «{item.lists.title}» حضور دارد
            </p>
            <Link
              href={`/lists/${item.lists.slug}`}
              className="inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-md bg-primary/10 text-primary wibe-small font-medium hover:bg-primary/15 transition-colors"
            >
              مشاهده لیست
            </Link>
            <div className="mt-2">
              <Link
                href={`/lists/${item.lists.slug}`}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-gray-50 wibe-small text-foreground"
              >
                <span>{item.lists.categories?.icon || '📋'}</span>
                <span>{item.lists.title}</span>
              </Link>
            </div>
          </section>

          <section id="comments" className="rounded-lg bg-wibe-card p-4 shadow-sm border border-wibe">
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
          <div className="fixed bottom-20 left-0 right-0 z-30 flex justify-center px-4">
            <div className={`w-full ${MOBILE_SHELL_MAX_WIDTH_CLASS} flex items-center gap-2 p-2 rounded-lg bg-wibe-card/95 backdrop-blur shadow-lg border border-wibe`}>
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
              className="flex-1 min-w-0 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md wibe-small font-medium bg-gray-100 text-foreground"
            >
              افزودن به لیست
            </Link>
            <button
              type="button"
              onClick={() => setCommentFormOpen(true)}
              className="flex-shrink-0 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md bg-primary text-white wibe-small font-medium"
            >
              نظر
            </button>
            </div>
          </div>
        )}

        {!heroCollapsed && !commentFormOpen && (
          <div className="fixed bottom-20 left-0 right-0 z-30 flex justify-center px-4">
            <button
              type="button"
              onClick={() => setCommentFormOpen(true)}
              className={`w-full ${MOBILE_SHELL_MAX_WIDTH_CLASS} flex items-center justify-center gap-2 py-3 px-4 rounded-md bg-primary text-white wibe-small font-semibold shadow-lg hover:bg-primary-dark transition-colors`}
            >
              نظر بده
            </button>
          </div>
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
