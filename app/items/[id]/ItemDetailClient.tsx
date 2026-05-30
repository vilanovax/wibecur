'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Share2, Heart, Bookmark } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import { MOBILE_SHELL_MAX_WIDTH_CLASS } from '@/components/providers/MainContainer';
import CommentSection from '@/components/mobile/comments/CommentSection';
import ItemReportButton from '@/components/mobile/items/ItemReportButton';
import ItemLikeButton from '@/components/mobile/items/ItemLikeButton';
import ItemSaveButton from '@/components/mobile/items/ItemSaveButton';
import ItemDiscoverySection from '@/components/mobile/items/ItemDiscoverySection';
import Toast from '@/components/shared/Toast';
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
  const { status: authStatus } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const loginHref = `/login?callbackUrl=${encodeURIComponent(pathname || `/items/${item.id}`)}`;
  const [heroCollapsed, setHeroCollapsed] = useState(false);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [expandCommentFormTrigger, setExpandCommentFormTrigger] = useState(0);
  const [commentCount, setCommentCount] = useState(item.commentCount);
  const [commentRefreshTrigger, setCommentRefreshTrigger] = useState(0);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
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
    const onScroll = () => setHeroCollapsed(window.scrollY > HERO_COLLAPSE_SCROLL_Y);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

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
      <main className="pb-24">
        <section
          className={`relative w-full overflow-hidden transition-[height] duration-500 ease-out ${
            heroCollapsed ? 'h-[7.5rem]' : 'h-[20rem]'
          }`}
        >
          <ImageWithFallback
            src={item.displayImageUrl}
            alt={item.title}
            className={`absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-out ${
              heroCollapsed ? 'scale-100' : 'scale-105'
            }`}
            fallbackIcon={item.lists.categories?.icon || '📋'}
            fallbackClassName="absolute inset-0 w-full h-full flex items-center justify-center bg-gray-100"
            categorySlug={item.lists.categories?.slug ?? null}
            priority
          />

          <div
            className={`absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent transition-opacity duration-500 ${
              heroCollapsed ? 'opacity-95' : 'opacity-100'
            }`}
          />

          <div className="absolute inset-0 flex flex-col justify-end p-4 pb-4 text-white">
            <div
              className={`transition-all duration-500 ease-out overflow-hidden ${
                heroCollapsed ? 'max-h-0 opacity-0 pointer-events-none mb-0' : 'max-h-40 opacity-100 mb-3'
              }`}
            >
              <Link
                href={`/lists/${item.lists.slug}`}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-pill wibe-caption font-medium bg-white/15 backdrop-blur-sm hover:bg-white/25 transition-colors max-w-full"
              >
                <span>{item.lists.categories?.icon || '📋'}</span>
                <span className="truncate">از لیست: {item.lists.title}</span>
              </Link>
            </div>

            <h1
              className={`text-white leading-tight transition-all duration-500 ease-out ${
                heroCollapsed ? 'wibe-h3 line-clamp-1' : 'wibe-h1'
              }`}
            >
              {item.title}
            </h1>

            <div
              className={`flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 wibe-small text-white/95 transition-all duration-500 ease-out overflow-hidden ${
                heroCollapsed ? 'max-h-0 opacity-0 mt-0' : 'max-h-16 opacity-100'
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
              {item.listRank != null && item.listItemCount > 0 && (
                <>
                  <span className="text-white/50">·</span>
                  <span>#{item.listRank.toLocaleString('fa-IR')} در لیست</span>
                </>
              )}
            </div>

            <div
              className={`flex items-center gap-2 transition-all duration-500 ease-out overflow-hidden ${
                heroCollapsed ? 'max-h-0 opacity-0 mt-0 pointer-events-none' : 'max-h-16 opacity-100 mt-4'
              }`}
            >
              <div className="flex-shrink-0">
                <ItemSaveButton itemId={item.id} variant="hero" />
              </div>
              <Link
                href={`/lists/${item.lists.slug}`}
                className="inline-flex flex-1 min-w-0 items-center justify-center gap-2 px-4 py-2.5 rounded-md wibe-small font-medium bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors border border-white/30"
              >
                مشاهده لیست
              </Link>
              <ItemLikeButton
                itemId={item.id}
                initialLikeCount={likeCount}
                initialIsLiked={item.isLiked || false}
                variant="hero"
              />
              <button
                type="button"
                onClick={handleShare}
                className="w-10 h-10 flex-shrink-0 rounded-full bg-white/15 backdrop-blur-sm hover:bg-white/25 flex items-center justify-center transition-colors"
                aria-label="اشتراک‌گذاری"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>

        <div className="px-4 mt-4 relative z-10 space-y-6">
          {authStatus === 'unauthenticated' && (
            <Link
              href={loginHref}
              className="flex items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 wibe-small text-foreground hover:bg-primary/10 transition-colors"
            >
              <span>برای ذخیره، پسند و نظر وارد شو</span>
              <span className="font-semibold text-primary shrink-0">ورود</span>
            </Link>
          )}

          <section className="rounded-lg bg-wibe-card p-4 shadow-sm border border-wibe">
            {hasSocialProof && (
              <div className="flex flex-wrap gap-2 mb-3">
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

          <CommentSection
            itemId={item.id}
            onCommentAdded={onCommentsUpdate}
            refreshTrigger={commentRefreshTrigger}
            expandFormTrigger={expandCommentFormTrigger}
          />

          <div className="flex justify-center pb-2">
            <ItemReportButton itemId={item.id} />
          </div>
        </div>

        <div className="fixed bottom-20 left-0 right-0 z-30 flex justify-center px-4">
          <div
            className={`w-full ${MOBILE_SHELL_MAX_WIDTH_CLASS} flex items-center gap-2 p-2 rounded-xl bg-wibe-card/95 backdrop-blur shadow-lg border border-wibe`}
          >
            <div className="flex-shrink-0">
              <ItemSaveButton itemId={item.id} />
            </div>
            <div className="flex-shrink-0">
              <ItemLikeButton
                itemId={item.id}
                initialLikeCount={likeCount}
                initialIsLiked={item.isLiked || false}
              />
            </div>
            <button
              type="button"
              onClick={() => {
                if (authStatus === 'unauthenticated') {
                  router.push(loginHref);
                  return;
                }
                document.getElementById('comments')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                setExpandCommentFormTrigger((t) => t + 1);
              }}
              className="flex-1 min-w-0 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-primary text-white wibe-small font-medium"
            >
              نظر
              {commentCount > 0 && (
                <span className="opacity-90">({commentCount.toLocaleString('fa-IR')})</span>
              )}
            </button>
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
