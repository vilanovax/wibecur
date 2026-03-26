'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { UserPlus, Check, Share2, MoreVertical, Pencil, Flame } from 'lucide-react';
import BookmarkButton from '@/components/mobile/lists/BookmarkButton';
import VibeCommentSection from '@/components/mobile/lists/VibeCommentSection';
import SuggestItemSearch from '@/components/mobile/lists/SuggestItemSearch';
import BottomSheet from '@/components/mobile/shared/BottomSheet';
import Toast from '@/components/shared/Toast';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import CuratorBadge from '@/components/shared/CuratorBadge';
import type { CuratorLevelKey } from '@/lib/curator';

type Item = {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  rating: number;
  metadata?: Record<string, unknown> | null;
};

type Category = {
  id: string;
  name: string;
  slug: string;
  icon: string;
} | null;

type User = {
  id: string;
  name: string | null;
  image: string | null;
  username: string | null;
  curatorLevel?: string | null;
  viralListsCount?: number;
  totalLikesReceived?: number;
} | null;

type ListDetail = {
  id: string;
  userId: string;
  title: string;
  slug: string;
  description: string | null;
  coverImage: string | null;
  saveCount: number;
  itemCount: number;
  viewCount: number;
  badge?: 'TRENDING' | 'NEW' | 'FEATURED' | null;
  tags?: string[];
  categories: Category;
  items: Item[];
  users: User;
  creatorFollowersCount?: number;
  _count: { items: number; list_comments?: number };
};

function formatCompact(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  return n.toLocaleString('fa-IR');
}

type RelatedList = {
  id: string;
  title: string;
  slug: string;
  coverImage: string | null;
  saveCount: number;
  itemCount: number;
  categories: Category;
};

interface ListDetailClientProps {
  list: ListDetail;
  relatedLists: RelatedList[];
  openSuggestFromQuery?: boolean;
}

const DESCRIPTION_PLACEHOLDER = 'توضیحی برای این لیست نوشته نشده';

const LIST_VIEW_PREFERENCE_KEY = 'wibe:listViewPreference';

const GRID_DEFAULT_CATEGORY_SLUGS = [
  'movie',
  'movies',
  'series',
  'travel',
  'restaurant',
  'cafe',
  'book',
  'books',
];

function getDefaultView(
  categorySlug: string | undefined,
  items?: { imageUrl: string | null }[]
): 'grid' | 'list' {
  if (categorySlug) {
    const slug = categorySlug.toLowerCase();
    if (GRID_DEFAULT_CATEGORY_SLUGS.some((s) => slug === s || slug.includes(s))) return 'grid';
  }
  if (items?.length) {
    const withImage = items.filter((i) => i.imageUrl?.trim()).length;
    if (withImage / items.length >= 0.8) return 'grid';
  }
  return 'list';
}

function SimilarListCard({ rel }: { rel: RelatedList }) {
  return (
    <Link
      href={`/lists/${rel.slug}`}
      className="flex-shrink-0 w-[calc(55vw)] max-w-[220px] bg-white/90 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all border border-gray-100/80 active:bg-gray-50"
    >
      <div className="relative aspect-[4/3] bg-gray-100">
        <ImageWithFallback
          src={rel.coverImage ?? ''}
          alt={rel.title}
          className="w-full h-full object-cover"
          fallbackIcon={rel.categories?.icon ?? '📋'}
          fallbackClassName="w-full h-full flex items-center justify-center text-2xl"
        />
      </div>
      <div className="p-2.5 min-w-0">
        <h3 className="font-semibold text-gray-800 text-sm line-clamp-1">{rel.title}</h3>
        <p className="text-[11px] text-gray-400 mt-0.5">
          ⭐ {rel.saveCount} &nbsp; • &nbsp; {rel.itemCount} آیتم
        </p>
      </div>
    </Link>
  );
}

function GridItemCard({
  item,
  index,
}: {
  item: Item;
  index: number;
}) {
  return (
    <Link
      href={`/items/${item.id}`}
      className="block bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md active:bg-gray-50 transition-all border border-gray-100"
    >
      <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
        <ImageWithFallback
          src={item.imageUrl ?? ''}
          alt={item.title}
          className="w-full h-full object-cover"
          fallbackIcon="📋"
          fallbackClassName="w-full h-full flex items-center justify-center text-3xl"
          placeholderSize="square"
          imageFolder="items"
        />
        <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black/30 text-white text-[10px] flex items-center justify-center font-medium">
          {index + 1}
        </span>
      </div>
      <div className="p-2.5 min-h-0">
        <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 leading-tight">
          {item.title}
        </h3>
        <p className="text-[11px] text-gray-400 line-clamp-1 mt-0.5">
          {item.description
            ? item.description
            : item.rating > 0
              ? `⭐ ${item.rating}`
              : ''}
        </p>
      </div>
    </Link>
  );
}

export default function ListDetailClient({ list, relatedLists, openSuggestFromQuery }: ListDetailClientProps) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [stickyVisible, setStickyVisible] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [stickySaving, setStickySaving] = useState(false);
  const titleRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>(() => {
    if (typeof window === 'undefined')
      return getDefaultView(list.categories?.slug, list.items);
    try {
      const stored = localStorage.getItem(LIST_VIEW_PREFERENCE_KEY);
      if (stored === 'grid' || stored === 'list') return stored;
    } catch {}
    return getDefaultView(list.categories?.slug, list.items);
  });
  const [showGridHint, setShowGridHint] = useState(false);
  const [gridHintVisible, setGridHintVisible] = useState(false);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const handleScrollToComment = useCallback((commentId: string) => {
    setSuggestOpen(false);
    setTimeout(() => {
      document.getElementById(`comment-${commentId}`)?.scrollIntoView({ behavior: 'smooth' });
    }, 300);
  }, []);

  useEffect(() => {
    if (openSuggestFromQuery) {
      setSuggestOpen(true);
      router.replace(`/lists/${list.slug}`, { scroll: false });
    }
  }, [openSuggestFromQuery, list.slug, router]);

  const fetchBookmarkStatus = () => {
    if (!session?.user) return;
    fetch(`/api/lists/${list.id}/bookmark-status`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.success && data.data?.isBookmarked) setIsBookmarked(true);
      })
      .catch(() => {});
  };

  useEffect(() => {
    if (session?.user) fetchBookmarkStatus();
  }, [session?.user, list.id]);

  useEffect(() => {
    if (stickyVisible && session?.user) fetchBookmarkStatus();
  }, [stickyVisible]);

  const setViewModeAndPersist = (mode: 'list' | 'grid') => {
    setViewMode(mode);
    try {
      localStorage.setItem(LIST_VIEW_PREFERENCE_KEY, mode);
    } catch {}
  };

  const handleSetGrid = () => {
    if (viewMode !== 'grid') {
      setViewModeAndPersist('grid');
      setShowGridHint(true);
      setGridHintVisible(true);
    }
  };

  const handleSetList = () => {
    if (viewMode !== 'list') setViewModeAndPersist('list');
  };

  useEffect(() => {
    if (!showGridHint) return;
    const t = setTimeout(() => setGridHintVisible(false), 2500);
    return () => clearTimeout(t);
  }, [showGridHint]);

  const itemCount = list.itemCount ?? list._count?.items ?? list.items?.length ?? 0;
  const commentCount = list._count?.list_comments ?? 0;
  const saveCount = list.saveCount ?? 0;
  const viewCount = list.viewCount ?? 0;
  const viralListsCount = list.users?.viralListsCount ?? 0;
  const totalLikesReceived = list.users?.totalLikesReceived ?? 0;
  const isViral = list.badge === 'TRENDING' || saveCount >= 100;
  const creatorName = list.users?.name || 'کاربر';
  const creatorId = list.users?.id;
  const creatorUsername = list.users?.username;
  const creatorImage = list.users?.image;
  const creatorLevel = (list.users?.curatorLevel ?? 'EXPLORER') as CuratorLevelKey;
  const followersCount = list.creatorFollowersCount ?? 0;
  const isOwner = !!session?.user && list.userId === (session.user as { id?: string }).id;
  const avgRating =
    list.items?.length > 0
      ? list.items.reduce((s, i) => s + (i.rating || 0), 0) / list.items.length
      : 0;

  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    if (!creatorId || !session?.user?.id || creatorId === (session.user as { id?: string }).id) return;
    fetch(`/api/follow/${creatorId}`)
      .then((r) => r.json())
      .then((d) => d?.data?.isFollowing && setIsFollowing(true))
      .catch(() => {});
  }, [creatorId, session?.user?.id]);

  const handleFollowToggle = async () => {
    if (!creatorId || !session?.user?.id) return;
    setFollowLoading(true);
    try {
      if (isFollowing) {
        const res = await fetch(`/api/follow/${creatorId}`, { method: 'DELETE' });
        const json = await res.json();
        if (json.success) setIsFollowing(false);
      } else {
        const res = await fetch(`/api/follow/${creatorId}`, { method: 'POST' });
        const json = await res.json();
        if (json.success) setIsFollowing(true);
      }
    } finally {
      setFollowLoading(false);
    }
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setStickyVisible(!entry.isIntersecting),
      { threshold: 0, rootMargin: '-80px 0px 0px 0px' }
    );
    const el = titleRef.current;
    if (el) observer.observe(el);
    return () => (el ? observer.unobserve(el) : undefined);
  }, []);

  const handleShare = () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator
        .share({
          title: list.title,
          text: list.description || list.title,
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      navigator.clipboard?.writeText(window.location.href);
    }
  };

  const showLoginCTA = status === 'unauthenticated';
  const showStickyBar = stickyVisible && !isBookmarked;

  const BADGE_LABELS: Record<string, string> = {
    TRENDING: '🔥 ترند',
    NEW: '✨ تازه',
    FEATURED: '🏆 برگزیده',
  };

  const viralProgress = Math.min(100, (saveCount / 100) * 100);

  return (
    <div className="min-h-screen bg-gray-50 pb-24" dir="rtl">
      {/* Hero 3.0 — ارتفاع 220–240px */}
      <div className="relative h-[230px] sm:h-[240px] bg-gradient-to-br from-gray-200 to-gray-300 rounded-b-3xl overflow-hidden">
        <ImageWithFallback
          src={list.coverImage ?? ''}
          alt={list.title}
          className="w-full h-full object-cover"
          fallbackIcon={list.categories?.icon ?? '📋'}
          fallbackClassName="w-full h-full flex items-center justify-center text-6xl"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
        {/* بالا راست: Back, Share, More */}
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-white/90 backdrop-blur flex items-center justify-center text-gray-700"
            aria-label="بازگشت"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="w-10 h-10 rounded-full bg-white/90 backdrop-blur flex items-center justify-center text-gray-700"
            aria-label="اشتراک‌گذاری"
          >
            <Share2 className="w-5 h-5" />
          </button>
          <button
            type="button"
            className="w-10 h-10 rounded-full bg-white/90 backdrop-blur flex items-center justify-center text-gray-700"
            aria-label="بیشتر"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
        {/* بالا چپ: Save */}
        <div className="absolute top-4 left-4 flex items-center gap-2">
          {session?.user && (
            <div className="w-10 h-10 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-lg">
              <BookmarkButton listId={list.id} initialBookmarkCount={saveCount} variant="icon" size="md" />
            </div>
          )}
        </div>
        {/* Title Block */}
        <div className="absolute bottom-0 left-0 right-0 p-4 pb-6">
          <h1 ref={titleRef} className="text-[30px] font-bold text-white leading-tight drop-shadow-lg">
            {list.title}
          </h1>
          <p className="text-white/80 mt-1.5 text-[14px] leading-relaxed line-clamp-2">
            {list.description?.trim() || DESCRIPTION_PLACEHOLDER}
          </p>
          {list.badge && BADGE_LABELS[list.badge] && (
            <span className="inline-flex mt-2 px-2.5 py-0.5 rounded-md text-xs font-medium bg-white/20 backdrop-blur text-white">
              {BADGE_LABELS[list.badge]}
            </span>
          )}
          {list.categories && (
            <Link
              href={`/categories/${list.categories.slug}`}
              className="inline-flex items-center gap-1 mt-2 mr-2 px-2.5 py-1 rounded-md text-xs font-medium bg-white/20 backdrop-blur text-white/95"
            >
              {list.categories.icon} {list.categories.name}
            </Link>
          )}
        </div>
      </div>

      <main className="px-4 -mt-4 relative z-10">
        {/* Creator Authority Block — کارت نیمه‌شفاف */}
        <div className="flex items-center justify-between gap-4 p-4 -mt-2 rounded-2xl bg-white/80 backdrop-blur-sm border border-gray-100 shadow-sm">
          <Link
            href={creatorUsername ? `/u/${creatorUsername}` : '#'}
            className="flex items-center gap-4 min-w-0 flex-1"
          >
            <div className="flex-shrink-0 w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-md bg-gray-100">
              {creatorImage ? (
                <ImageWithFallback
                  src={creatorImage}
                  alt={creatorName}
                  className="w-full h-full object-cover"
                  fallbackIcon={(creatorName?.[0] || '?').toUpperCase()}
                  fallbackClassName="w-full h-full bg-gradient-to-br from-[#7C3AED] to-[#9333EA] text-white font-bold flex items-center justify-center"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#7C3AED] to-[#9333EA] text-white font-bold flex items-center justify-center text-xl">
                  {(creatorName?.[0] || '?').toUpperCase()}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-gray-900 truncate text-base">{creatorName}</p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <CuratorBadge
                  level={creatorLevel}
                  size="small"
                  glow={creatorLevel === 'ELITE_CURATOR' || creatorLevel === 'VIBE_LEGEND'}
                />
              </div>
              <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                {followersCount > 0 && (
                  <span className="tabular-nums">{formatCompact(followersCount)} فالوئر</span>
                )}
                {followersCount === 0 && (
                  <span className="text-amber-600">تازه شروع کرده ✨</span>
                )}
                {totalLikesReceived >= 1000 && (
                  <span>❤️ {formatCompact(totalLikesReceived)} لایک</span>
                )}
              </div>
            </div>
          </Link>
          {session?.user && creatorId && (
            isOwner ? (
              <Link
                href={`/user-lists/${list.id}/add-item`}
                className="flex-shrink-0 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-gray-200 font-medium text-sm text-gray-700 hover:bg-gray-50"
              >
                <Pencil className="w-4 h-4" />
                ویرایش
              </Link>
            ) : (
              <button
                type="button"
                onClick={handleFollowToggle}
                disabled={followLoading}
                className={`flex-shrink-0 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 ${
                  isFollowing
                    ? 'bg-gray-100 text-gray-500'
                    : 'bg-[#7C3AED] text-white shadow-md active:opacity-90'
                }`}
              >
                {isFollowing ? (
                  <>
                    <Check className="w-4 h-4" />
                    دنبال می‌کنی
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    Follow
                  </>
                )}
              </button>
            )
          )}
        </div>

        {/* Social Momentum — 4 ستون، عدد 18px Bold */}
        <div className="grid grid-cols-4 gap-2 py-6 border-b border-gray-100">
          <div className="text-center">
            <p className="text-[18px] font-bold text-gray-900 tabular-nums">{formatCompact(saveCount)}</p>
            <p className="text-[12px] text-gray-500 mt-0.5">ذخیره</p>
          </div>
          <div className="text-center">
            <p className="text-[18px] font-bold text-gray-900 tabular-nums">{formatCompact(viewCount)}</p>
            <p className="text-[12px] text-gray-500 mt-0.5">بازدید</p>
          </div>
          <div className="text-center">
            <p className="text-[18px] font-bold text-gray-900 tabular-nums">{commentCount}</p>
            <p className="text-[12px] text-gray-500 mt-0.5">نظر</p>
          </div>
          <div className="text-center">
            <p className="text-[18px] font-bold text-gray-900 tabular-nums">{itemCount}</p>
            <p className="text-[12px] text-gray-500 mt-0.5">آیتم</p>
          </div>
        </div>


        {/* CTA Zone — فقط برای کاربران لاگین نشده */}
        {showLoginCTA && (
          <div className="flex flex-col gap-3 pt-4 pb-4">
            <Link
              href="/login"
              className="w-full py-3 rounded-xl bg-[#7C3AED] text-white font-semibold text-center text-sm hover:opacity-90 transition-opacity"
            >
              ورود / ثبت‌نام
            </Link>
          </div>
        )}

        {/* Tag Chips — فقط تگ‌ها (دسته در هیرو است) */}
        {list.tags && list.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-6 pb-4">
            {list.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="inline-flex px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-600"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Items section */}
        <section className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-800">آیتم‌های لیست</h2>
            {isOwner && (
              <Link
                href={`/user-lists/${list.id}/add-item`}
                className="text-sm text-primary font-medium"
              >
                ➕ پیشنهاد آیتم
              </Link>
            )}
          </div>
          {isOwner && list.items?.length > 0 && (
            <p className="text-sm text-gray-500 mb-3 -mt-1">می‌تونی آیتم‌های جدید به این لیست اضافه کنی</p>
          )}

          {/* View toggle */}
          {list.items?.length > 0 && (
            <div className="flex items-center justify-end gap-2 mb-4">
              <span className="text-sm text-gray-500">نمایش:</span>
              <div className="flex rounded-lg border border-gray-200 p-0.5 bg-gray-50">
                <button
                  type="button"
                  onClick={handleSetList}
                  title="نمایش لیستی"
                  aria-label="نمایش لیستی"
                  className={`p-2 rounded-md text-lg leading-none transition-colors ${
                    viewMode === 'list' ? 'bg-white shadow-sm text-primary' : 'text-gray-500'
                  }`}
                >
                  ≡
                </button>
                <button
                  type="button"
                  onClick={handleSetGrid}
                  title="نمایش گریدی"
                  aria-label="نمایش گریدی"
                  className={`p-2 rounded-md text-lg leading-none transition-colors ${
                    viewMode === 'grid' ? 'bg-white shadow-sm text-primary' : 'text-gray-500'
                  }`}
                >
                  <span className="inline-flex gap-0.5 text-base" style={{ letterSpacing: '-0.2em' }}>⬛⬛</span>
                </button>
              </div>
            </div>
          )}

          {/* First-time grid hint */}
          {viewMode === 'grid' && gridHintVisible && (
            <p className="text-xs text-gray-500 mb-3 text-center transition-opacity duration-500">
              حالت گریدی برای مرور سریع‌تر آیتم‌ها
            </p>
          )}

          {!list.items?.length ? (
            <div className="text-center py-12 bg-white rounded-2xl">
              <p className="text-gray-600">
                {viewMode === 'grid' ? 'این لیست هنوز آیتمی ندارد' : 'این لیست هنوز کامل نیست 🙂'}
              </p>
              {viewMode === 'grid' && (
                <p className="text-sm text-gray-500 mt-1">با اضافه کردن آیتم‌ها، این لیست شکل می‌گیرد</p>
              )}
              {isOwner && (
                <Link
                  href={`/user-lists/${list.id}/add-item`}
                  className="inline-block mt-4 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-dark transition-colors"
                >
                  {viewMode === 'grid' ? '➕ افزودن اولین آیتم' : '➕ افزودن آیتم'}
                </Link>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 gap-3">
              {list.items.map((item, index) => (
                <GridItemCard key={item.id} item={item} index={index} />
              ))}
            </div>
          ) : (
            <div className="space-y-5">
              {list.items.map((item, index) => {
                const prevTitle = index > 0 ? list.items[index - 1].title : '';
                const isSimilar = prevTitle && item.title.slice(0, 12) === prevTitle.slice(0, 12);
                return (
                  <Link
                    key={item.id}
                    href={`/items/${item.id}`}
                    className={`flex gap-4 items-center bg-white rounded-xl p-4 shadow-sm hover:shadow-md active:bg-gray-50 transition-all border border-gray-100 min-h-[72px] ${
                      isSimilar ? 'opacity-85' : ''
                    }`}
                  >
                    <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center text-xs font-medium">
                      {index + 1}
                    </div>
                    <div className="relative w-14 h-14 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                      <ImageWithFallback
                        src={item.imageUrl ?? ''}
                        alt={item.title}
                        className="w-full h-full object-cover"
                        fallbackIcon="📋"
                        fallbackClassName="w-full h-full flex items-center justify-center text-xl"
                        placeholderSize="square"
                        imageFolder="items"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-[0.9375rem] line-clamp-1">
                        {item.title}
                        {isSimilar && (
                          <span className="text-xs font-normal text-gray-400 mr-1">(مشابه)</span>
                        )}
                      </h3>
                      <p className="text-sm text-gray-400 line-clamp-1 mt-0.5">
                        {item.description
                          ? item.description
                          : item.rating > 0
                            ? `⭐ ${item.rating}`
                            : ''}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* Bottom section */}
        <div className="mt-8">
          {/* Similar lists */}
          {relatedLists.length > 0 && (
            <section>
              <h2 className="text-base font-semibold text-gray-800 mb-0.5">لیست‌های مشابه</h2>
              <p className="text-xs text-gray-400 mb-3">ممکنه این‌ها هم به کارت بیان</p>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
                {relatedLists.map((rel) => (
                  <SimilarListCard key={rel.id} rel={rel} />
                ))}
              </div>
            </section>
          )}

          {/* نظرات و پیشنهادها — Engagement Block */}
          <VibeCommentSection
            listId={list.id}
            isOwner={isOwner}
            listUserId={list.userId}
            categorySlug={list.categories?.slug}
            onOpenSuggestItem={() => setSuggestOpen(true)}
          />

          {/* End spacing before bottom nav */}
          <div className="h-10" />
        </div>
      </main>

      {/* مودال پیشنهاد آیتم */}
      <BottomSheet
        isOpen={suggestOpen}
        onClose={() => setSuggestOpen(false)}
        title="پیشنهاد آیتم"
        maxHeight="85vh"
      >
        <SuggestItemSearch
          listId={list.id}
          categorySlug={list.categories?.slug}
          onSuccess={() => setSuggestOpen(false)}
          onScrollToComment={handleScrollToComment}
          showToast={(message, type) => setToast({ message, type })}
        />
      </BottomSheet>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          duration={3000}
          onClose={() => setToast(null)}
        />
      )}

      {/* Sticky save bar — فاصله 24px از bottom nav */}
      {showStickyBar && session?.user && (
        <div className="fixed bottom-24 left-4 right-4 z-30 flex justify-center">
          <button
            type="button"
            disabled={stickySaving}
            onClick={async () => {
              setStickySaving(true);
              try {
                const res = await fetch(`/api/lists/${list.id}/bookmark`, { method: 'POST' });
                const data = await res.json();
                if (data?.success && data.data?.isBookmarked) setIsBookmarked(true);
              } finally {
                setStickySaving(false);
              }
            }}
            className="w-full max-w-sm py-3 px-6 rounded-xl bg-primary text-white font-medium shadow-lg hover:bg-primary-dark transition-colors disabled:opacity-70"
          >
            ⭐ ذخیره این لیست
          </button>
        </div>
      )}

      {/* Bottom nav placeholder - actual BottomNav is in page */}
    </div>
  );
}
