'use client';

import { useState, useEffect } from 'react';
import { useIsDesktop } from '@/lib/hooks/useIsDesktop';
import Link from 'next/link';
import { Share2, Heart, Bookmark } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import ItemCoverImage from '@/components/shared/ItemCoverImage';
import CommentSection from '@/components/mobile/comments/CommentSection';
import ItemDiscoverySection from '@/components/mobile/items/ItemDiscoverySection';
import ItemDetailTopActions from '@/components/mobile/items/ItemDetailTopActions';
import Toast from '@/components/shared/Toast';
import { isMovieLikeCategory } from '@/lib/resolve-item-image';
import type { SimilarItem, TrendingItem, AlsoLikedItem } from '@/types/items';

const HERO_COLLAPSE_SCROLL_Y = 100;

const HERO_META_KEYS = new Set(['year', 'genre', 'imdbRating']);
const DESCRIPTION_TRUNCATE = 160;

function displayRating(rating: number | null | undefined): string | null {
  if (rating == null || Number(rating) === 0) return null;
  return String(rating);
}

function formatMetaValue(key: string, value: unknown): string {
  if (key === 'priceRange' && typeof value === 'string') {
    if (value === '$') return 'ارزان';
    if (value === '$$') return 'متوسط';
    if (value === '$$$') return 'گران';
    return 'لوکس';
  }
  return String(value);
}

interface ItemDetailClientProps {
  item: {
    id: string;
    title: string;
    description: string | null;
    imageUrl: string | null;
    displayImageUrl: string;
    externalUrl: string | null;
    rating: number | null;
    voteCount: number | null;
    metadata: Record<string, unknown> | null;
    commentCount: number;
    listRank: number | null;
    listItemCount: number;
    personalSaveCount: number;
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
  const isDesktop = useIsDesktop();
  const { status: authStatus } = useSession();
  const pathname = usePathname();
  const loginHref = `/login?callbackUrl=${encodeURIComponent(pathname || `/items/${item.id}`)}`;
  const [heroCollapsed, setHeroCollapsed] = useState(false);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [commentRefreshTrigger, setCommentRefreshTrigger] = useState(0);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const onCommentsUpdate = () => setCommentRefreshTrigger((t) => t + 1);

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
  const categorySlug = item.lists.categories?.slug ?? null;
  const meta = (item.metadata || {}) as Record<string, string | number>;
  const year = meta.year ?? null;
  const ratingLabel = displayRating(item.rating ?? (meta.imdbRating as number | undefined) ?? null);
  const genre = meta.genre ?? categoryName;
  const likeCount = item.voteCount ?? 0;

  const extraMetaEntries = item.metadata
    ? (Object.entries(item.metadata) as [string, unknown][]).filter(
        ([key, value]) => !HERO_META_KEYS.has(key) && value != null && value !== ''
      )
    : [];

  const shortDescription =
    item.description && item.description.length > DESCRIPTION_TRUNCATE && !descriptionExpanded
      ? item.description.slice(0, DESCRIPTION_TRUNCATE) + '…'
      : item.description;

  const hasSocialProof =
    (item.listRank != null && item.listItemCount > 0) ||
    likeCount > 0 ||
    item.personalSaveCount > 0;

  useEffect(() => {
    if (isDesktop) {
      setHeroCollapsed(false);
      return;
    }
    const onScroll = () => setHeroCollapsed(window.scrollY > HERO_COLLAPSE_SCROLL_Y);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [isDesktop]);

  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    if (!url) return;

    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: item.title, url });
        return;
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
      }
    }

    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        setToast({ message: 'لینک کپی شد ✨', type: 'success' });
        return;
      }
    } catch {
      /* fall through */
    }

    setToast({ message: 'اشتراک‌گذاری ممکن نشد', type: 'error' });
  };

  return (
    <>
      <main>
        <section
          className={`relative w-full overflow-hidden transition-[height] duration-500 ease-out lg:!h-[min(280px,34vh)] lg:rounded-2xl lg:transition-none ${
            heroCollapsed ? 'h-[7.5rem]' : 'h-[18rem] sm:h-[20rem]'
          }`}
        >
          <div className="absolute inset-0">
            <ItemCoverImage
              itemId={item.id}
              imageUrl={item.imageUrl}
              title={item.title}
              metadata={item.metadata}
              categorySlug={categorySlug}
              enrichPoster={isMovieLikeCategory(categorySlug)}
              priority
              fallbackIcon={item.lists.categories?.icon || '📋'}
              className={`h-full w-full transition-transform duration-500 ease-out ${
                heroCollapsed ? 'scale-100' : 'scale-105'
              }`}
            />
          </div>

          <div
            className={`absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent transition-opacity duration-500 lg:hidden ${
              heroCollapsed ? 'opacity-95' : 'opacity-100'
            }`}
          />
          <div
            className="absolute inset-0 hidden bg-gradient-to-l from-black/90 via-black/50 to-black/10 lg:block"
            aria-hidden
          />

          <div className="absolute inset-0 flex flex-col justify-end p-4 pb-4 text-white lg:p-6 lg:pb-6">
            <div
              className={`lg:flex lg:flex-row lg:items-end lg:justify-between lg:gap-8 ${
                heroCollapsed ? '' : ''
              }`}
            >
              <div className="min-w-0 flex-1 text-right">
                <div
                  className={`transition-all duration-500 ease-out overflow-hidden lg:mb-2 ${
                    heroCollapsed
                      ? 'max-h-0 opacity-0 pointer-events-none mb-0'
                      : 'mb-3 max-h-40 opacity-100'
                  }`}
                >
                  <Link
                    href={`/lists/${item.lists.slug}`}
                    className="inline-flex max-w-full items-center gap-2 rounded-pill bg-white/15 px-3 py-1.5 wibe-caption font-medium backdrop-blur-sm transition-colors hover:bg-white/25"
                  >
                    <span>{item.lists.categories?.icon || '📋'}</span>
                    <span className="truncate">از لیست: {item.lists.title}</span>
                  </Link>
                </div>

                <h1
                  className={`leading-tight text-white transition-all duration-500 ease-out ${
                    heroCollapsed ? 'line-clamp-1 wibe-h3' : 'wibe-h1 lg:text-3xl lg:leading-snug'
                  }`}
                >
                  {item.title}
                </h1>

                <div
                  className={`mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 overflow-hidden wibe-small text-white/95 transition-all duration-500 ease-out ${
                    heroCollapsed ? 'mt-0 max-h-0 opacity-0' : 'max-h-16 opacity-100 lg:mt-2.5'
                  }`}
                >
                  {(genre || categoryName) && <span>{String(genre || categoryName)}</span>}
                  {year != null && (
                    <>
                      {(genre || categoryName) && <span className="text-white/50">·</span>}
                      <span>{String(year)}</span>
                    </>
                  )}
                  {ratingLabel && (
                    <>
                      <span className="text-white/50">·</span>
                      <span className="flex items-center gap-1">
                        <span>⭐</span>
                        <span>{ratingLabel}</span>
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div
                className={`flex items-center gap-2 overflow-hidden transition-all duration-500 ease-out ${
                  heroCollapsed
                    ? 'pointer-events-none mt-0 max-h-0 opacity-0'
                    : 'mt-4 max-h-16 opacity-100 lg:mt-0 lg:max-h-none lg:shrink-0'
                }`}
              >
                <Link
                  href={`/lists/${item.lists.slug}`}
                  className="inline-flex min-w-0 flex-1 items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/20 px-4 py-2.5 wibe-small font-medium backdrop-blur-sm transition-colors hover:bg-white/30 lg:flex-none lg:px-5"
                >
                  مشاهده لیست
                </Link>
                <button
                  type="button"
                  onClick={handleShare}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm transition-colors hover:bg-white/25"
                  aria-label="اشتراک‌گذاری"
                >
                  <Share2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </section>

        <ItemDetailTopActions
          itemId={item.id}
          likeCount={likeCount}
        />

        <div className="relative z-10 flex flex-col gap-4 px-4 pb-1 lg:gap-8 lg:px-0 lg:pb-0">
          <div className="min-w-0 space-y-4 lg:space-y-6">
          {authStatus === 'unauthenticated' && (
            <Link
              href={loginHref}
              className="flex items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 wibe-small text-foreground hover:bg-primary/10 transition-colors"
            >
              <span>برای ذخیره، پسند و نظر وارد شو</span>
              <span className="font-semibold text-primary shrink-0">ورود</span>
            </Link>
          )}

          <section className="rounded-xl border border-wibe bg-wibe-card p-4 shadow-sm lg:p-5">
            <div className="mb-3 hidden items-center justify-between gap-4 border-b border-wibe/80 pb-3 lg:flex">
              <h2 className="wibe-h3 text-foreground">جزئیات</h2>
              <ItemDetailTopActions itemId={item.id} likeCount={likeCount} variant="inline" />
            </div>
            {hasSocialProof && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {item.listRank != null && item.listItemCount > 0 && (
                  <span className="inline-flex items-center gap-1.5 rounded-pill bg-primary/10 px-2.5 py-1 wibe-caption font-medium text-primary">
                    #{item.listRank.toLocaleString('fa-IR')} از {item.listItemCount.toLocaleString('fa-IR')} در «{item.lists.title}»
                  </span>
                )}
                {likeCount > 0 && (
                  <span className="inline-flex items-center gap-1.5 rounded-pill bg-gray-100 px-2.5 py-1 wibe-caption text-foreground">
                    <Heart className="w-3.5 h-3.5 text-red-500" />
                    {likeCount.toLocaleString('fa-IR')} پسند
                  </span>
                )}
                {item.personalSaveCount > 0 && (
                  <span className="inline-flex items-center gap-1.5 rounded-pill bg-gray-100 px-2.5 py-1 wibe-caption text-foreground">
                    <Bookmark className="w-3.5 h-3.5 text-primary" />
                    {item.personalSaveCount.toLocaleString('fa-IR')} ذخیره در لیست شخصی
                  </span>
                )}
              </div>
            )}

            {extraMetaEntries.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {extraMetaEntries.map(([key, value]) => (
                  <span
                    key={key}
                    className="inline-flex items-center gap-1 rounded-pill bg-gray-100 px-2.5 py-1 wibe-caption text-foreground"
                  >
                    <span>{metaIcons[key] || '📋'}</span>
                    <span className="text-wibe-secondary">{metaLabels[key] || key}:</span>
                    <span className="font-medium">{formatMetaValue(key, value)}</span>
                  </span>
                ))}
              </div>
            )}

            {item.description ? (
              <div>
                <p className="wibe-small text-foreground leading-relaxed whitespace-pre-line">{shortDescription}</p>
                {item.description.length > DESCRIPTION_TRUNCATE && !descriptionExpanded && (
                  <button
                    type="button"
                    onClick={() => setDescriptionExpanded(true)}
                    className="text-primary wibe-small font-medium mt-2 hover:underline"
                  >
                    بیشتر بخوان
                  </button>
                )}
              </div>
            ) : (
              <div className="py-4 px-4 rounded-md bg-gray-50 text-center">
                <p className="wibe-small text-wibe-secondary">هنوز توضیحی ثبت نشده</p>
                <p className="wibe-caption text-wibe-secondary mt-1">اولین نفری باش که توضیح اضافه می‌کنه</p>
              </div>
            )}

            {item.externalUrl && (
              <a
                href={item.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-md bg-primary/10 text-primary wibe-small font-medium hover:bg-primary/15 transition-colors"
              >
                اطلاعات بیشتر
              </a>
            )}
          </section>

          <ItemDiscoverySection
            categorySlug={categorySlug}
            similarItems={similarItems}
            similarLoading={similarLoading}
            alsoLikedItems={alsoLikedItems}
            alsoLikedLoading={alsoLikedLoading}
            trendingItems={trendingItems}
            trendingLoading={trendingLoading}
          />
          </div>

          <div className="scroll-mt-16 border-t border-wibe pt-4 lg:rounded-2xl lg:border lg:bg-wibe-card lg:p-5 lg:pt-5 lg:shadow-sm">
            <CommentSection
              itemId={item.id}
              onCommentAdded={onCommentsUpdate}
              refreshTrigger={commentRefreshTrigger}
              embeddedInPanel
            />
          </div>
        </div>
      </main>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          duration={2500}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}
