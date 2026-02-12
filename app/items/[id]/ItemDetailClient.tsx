'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import CommentSection from '@/components/mobile/comments/CommentSection';
import CommentForm from '@/components/mobile/comments/CommentForm';
import ItemReportButton from '@/components/mobile/items/ItemReportButton';
import ItemLikeButton from '@/components/mobile/items/ItemLikeButton';
import ItemSaveButton from '@/components/mobile/items/ItemSaveButton';

interface SimilarItem {
  id: string;
  title: string;
  image: string | null;
  rating: number | null;
  category: { name: string; icon: string | null } | null;
}

interface TrendingItem {
  id: string;
  title: string;
  image: string | null;
  rating: number | null;
  saveCount: number;
  trendScore: number;
}

interface AlsoLikedItem {
  id: string;
  title: string;
  image: string | null;
  rating: number | null;
  commonUsersCount: number;
}

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
  const [similarItems, setSimilarItems] = useState<SimilarItem[]>([]);
  const [similarLoading, setSimilarLoading] = useState(false);
  const [trendingItems, setTrendingItems] = useState<TrendingItem[]>([]);
  const [trendingLoading, setTrendingLoading] = useState(false);
  const [alsoLikedItems, setAlsoLikedItems] = useState<AlsoLikedItem[]>([]);
  const [alsoLikedLoading, setAlsoLikedLoading] = useState(false);
  const onCommentsUpdate = () => setCommentCount((c) => c + 1);

  const categoryId = item.lists.categories?.id ?? null;

  useEffect(() => {
    setSimilarLoading(true);
    fetch(`/api/items/${item.id}/similar`)
      .then((res) => res.json())
      .then((json) => {
        if (json.data && Array.isArray(json.data)) setSimilarItems(json.data);
      })
      .catch(() => setSimilarItems([]))
      .finally(() => setSimilarLoading(false));
  }, [item.id]);

  useEffect(() => {
    if (!categoryId) return;
    setTrendingLoading(true);
    fetch(`/api/categories/${categoryId}/trending`)
      .then((res) => res.json())
      .then((json) => {
        if (json.data && Array.isArray(json.data)) {
          const list = json.data as TrendingItem[];
          setTrendingItems(list.filter((t) => t.id !== item.id));
        }
      })
      .catch(() => setTrendingItems([]))
      .finally(() => setTrendingLoading(false));
  }, [categoryId, item.id]);

  useEffect(() => {
    setAlsoLikedLoading(true);
    fetch(`/api/items/${item.id}/also-liked`)
      .then((res) => res.json())
      .then((json) => {
        if (json.data && Array.isArray(json.data)) setAlsoLikedItems(json.data);
      })
      .catch(() => setAlsoLikedItems([]))
      .finally(() => setAlsoLikedLoading(false));
  }, [item.id]);

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

          {/* Content on top of image */}
          <div className="absolute inset-0 flex flex-col justify-end p-4 text-white">
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
            {item.description && (
              <p className="text-sm text-white/95 mt-1 line-clamp-2 drop-shadow">
                {item.description}
              </p>
            )}

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-white/90">
              {rating != null && (
                <span className="flex items-center gap-1">
                  <span>⭐</span>
                  <span>{rating}</span>
                </span>
              )}
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
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 mt-4">
              <ItemLikeButton
                itemId={item.id}
                initialLikeCount={item.voteCount || 0}
                initialIsLiked={item.isLiked || false}
              />
              <ItemSaveButton itemId={item.id} />
              <button
                type="button"
                onClick={() => setCommentFormOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors text-sm font-medium"
              >
                <span>💬</span>
                <span>{commentCount} نظر</span>
              </button>
              <ItemReportButton itemId={item.id} />
            </div>
          </div>
        </section>

        <div className="px-4 -mt-2 relative z-10 space-y-6">
          {/* ——— 2️⃣ SOCIAL PROOF ——— */}
          <section className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
            {item.listSaveCount > 0 && (
              <span className="flex items-center gap-1.5">
                <span>👥</span>
                <span>{item.listSaveCount} نفر این لیست را ذخیره کرده‌اند</span>
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <span>📂</span>
              <span>در ۱ لیست قرار دارد</span>
            </span>
            {categoryName && (
              <span className="flex items-center gap-1.5 text-gray-500">
                <span>🔥</span>
                <span>در دسته {categoryName}</span>
              </span>
            )}
          </section>

          {/* ——— 3️⃣ درباره این آیتم ——— */}
          <section>
            <h2 className="text-base font-bold text-gray-900 mb-2 flex items-center gap-2">
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
                    className="text-primary text-sm font-medium mt-1 hover:underline"
                  >
                    بیشتر بخوان
                  </button>
                )}
              </div>
            ) : (
              <div className="py-4 px-4 rounded-xl bg-gray-50 border border-gray-100 text-center">
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

          {/* ——— Trending in this Category (below Similar) ——— */}
          {categoryId && (
            <section>
              <h2 className="text-base font-bold text-gray-900 mb-1 flex items-center gap-2">
                <span>🔥</span>
                داغ‌های این روزای {categoryName || 'این دسته'}
              </h2>
              <p className="text-sm text-gray-500 mb-3">محبوب‌ترین‌های اخیر همین ژانر</p>

              {trendingLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="flex gap-3 p-3 rounded-xl bg-gray-100 animate-pulse h-20"
                    />
                  ))}
                </div>
              ) : trendingItems.length === 0 ? null : (
                <div className="space-y-3">
                  {trendingItems.slice(0, 5).map((t, index) => {
                    const rank = index + 1;
                    const isTop = rank <= 3;
                    return (
                      <Link
                        key={t.id}
                        href={`/items/${t.id}`}
                        className={`relative flex gap-3 p-3 rounded-xl bg-white border transition-all active:opacity-95 overflow-hidden ${
                          rank === 1
                            ? 'border-orange-200 shadow-md shadow-orange-50'
                            : 'border-gray-100 hover:border-gray-200'
                        }`}
                      >
                        <span
                          className={`absolute right-2 top-1/2 -translate-y-1/2 font-black tabular-nums select-none pointer-events-none ${
                            rank === 1 ? 'text-6xl text-orange-100' : 'text-5xl text-gray-100'
                          }`}
                          style={{ lineHeight: 1 }}
                          aria-hidden
                        >
                          {rank}
                        </span>
                        <div
                          className={`relative z-10 flex-shrink-0 overflow-hidden rounded-xl bg-gray-100 ${
                            rank === 1 ? 'w-[88px] h-[88px]' : 'w-[80px] h-[80px]'
                          }`}
                        >
                          {t.image ? (
                            <ImageWithFallback
                              src={t.image}
                              alt={t.title}
                              className="w-full h-full object-cover"
                              fallbackIcon="📋"
                              fallbackClassName="w-full h-full flex items-center justify-center bg-gray-200"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-200 text-2xl opacity-50">
                              📋
                            </div>
                          )}
                          {isTop && (
                            <span className="absolute top-1 right-1 text-xs bg-orange-500/90 text-white px-1.5 py-0.5 rounded-md">
                              🔥
                            </span>
                          )}
                        </div>
                        <div className="relative z-10 flex-1 min-w-0 flex flex-col justify-center">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`text-sm font-bold tabular-nums ${
                                rank === 1 ? 'text-orange-500' : 'text-gray-400'
                              }`}
                            >
                              #{rank}
                              {isTop && ' 🔥'}
                            </span>
                          </div>
                          <h3 className="font-semibold text-gray-900 text-sm line-clamp-2">
                            {t.title}
                          </h3>
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                            {t.rating != null && (
                              <span className="flex items-center gap-0.5">
                                <span>⭐</span>
                                <span>{t.rating}</span>
                              </span>
                            )}
                            <span className="flex items-center gap-0.5">
                              <span>👥</span>
                              <span>{t.saveCount} ذخیره</span>
                            </span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {/* ——— Also Liked (below Trending) ——— */}
          <section className="-mx-4 px-4">
            <h2 className="text-base font-bold text-gray-900 mb-1 flex items-center gap-2">
              <span>👥</span>
              کسایی که اینو دوست داشتن، اینا رو هم دوست داشتن
            </h2>

            {alsoLikedLoading ? (
              <div className="flex gap-4 overflow-hidden pt-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="min-w-[45%] flex-shrink-0 rounded-2xl h-52 bg-gray-100 animate-pulse"
                  />
                ))}
              </div>
            ) : alsoLikedItems.length === 0 ? null : (
              <div className="flex gap-4 overflow-x-auto overflow-y-hidden pb-2 -mx-4 px-4 scrollbar-hide pt-2">
                {alsoLikedItems.map((a) => (
                  <Link
                    key={a.id}
                    href={`/items/${a.id}`}
                    className="flex-shrink-0 w-[45%] max-w-[200px] rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 hover:border-gray-200 active:opacity-95 transition-all"
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
                        <div className="w-full h-full flex items-center justify-center bg-gray-200 text-2xl opacity-50">
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

          {/* ——— 4️⃣ اطلاعات تکمیلی (مینیمال) ——— */}
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

          {/* ——— 5️⃣ شامل در لیست‌ها ——— */}
          <section>
            <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
              <span>📂</span>
              این آیتم در این لیست‌هاست
            </h2>
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/lists/${item.lists.slug}`}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 hover:border-primary hover:bg-gray-50 transition-all text-sm font-medium text-gray-800"
              >
                <span>{item.lists.categories?.icon || '📋'}</span>
                <span>{item.lists.title}</span>
              </Link>
            </div>
          </section>

          {/* ——— 6️⃣ نظرات ——— */}
          <section id="comments">
            <CommentSection
              itemId={item.id}
              onCommentAdded={onCommentsUpdate}
            />
          </section>
        </div>

        {/* ——— 7️⃣ Floating CTA نظر ——— */}
        <button
          type="button"
          onClick={() => setCommentFormOpen(true)}
          className="fixed bottom-20 left-4 right-4 z-30 flex items-center justify-center gap-2 py-3 px-4 rounded-full bg-primary text-white font-medium shadow-lg shadow-primary/30 hover:opacity-95 transition-opacity"
        >
          <span className="text-lg">+</span>
          <span>نظر بده</span>
        </button>
      </main>

      <CommentForm
        isOpen={commentFormOpen}
        onClose={() => setCommentFormOpen(false)}
        itemId={item.id}
        onSubmit={() => {
          onCommentsUpdate();
          setCommentFormOpen(false);
        }}
      />
    </>
  );
}
