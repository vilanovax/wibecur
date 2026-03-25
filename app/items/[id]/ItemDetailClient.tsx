'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import CommentSection from '@/components/mobile/comments/CommentSection';
import CommentForm from '@/components/mobile/comments/CommentForm';
import ItemReportButton from '@/components/mobile/items/ItemReportButton';
import ItemLikeButton from '@/components/mobile/items/ItemLikeButton';
import ItemSaveButton from '@/components/mobile/items/ItemSaveButton';

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

          {/* ——— اطلاعات تکمیلی (بلافاصله بعد از درباره) ——— */}
          {item.metadata &&
            typeof item.metadata === 'object' &&
            Object.keys(item.metadata).length > 0 && (
              <section className="rounded-2xl bg-white p-4 shadow-sm border border-gray-100">
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

          {/* ——— این آیتم در چه لیست‌هایی است (کارت برجسته) ——— */}
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
