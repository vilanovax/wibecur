'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import BookmarkButton from '@/components/mobile/lists/BookmarkButton';
import VibeCommentSection from '@/components/mobile/lists/VibeCommentSection';
import SuggestItemSearch from '@/components/mobile/lists/SuggestItemSearch';
import BottomSheet from '@/components/mobile/shared/BottomSheet';
import Toast from '@/components/shared/Toast';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import CuratorBadge from '@/components/shared/CuratorBadge';

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
  name: string | null;
  curatorLevel?: string | null;
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
  categories: Category;
  items: Item[];
  users: User;
  _count: { items: number };
};

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
  const saveCount = list.saveCount ?? 0;
  const creatorName = list.users?.name || 'کاربر';
  const isOwner = !!session?.user && list.userId === (session.user as { id?: string }).id;

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

  return (
    <div className="min-h-screen bg-gray-50 pb-24" dir="rtl">
      {/* Hero: cover + back + star — reduced height, subtle bottom gradient */}
      <div className="relative h-44 bg-gradient-to-br from-gray-200 to-gray-300 rounded-b-3xl overflow-hidden">
        <ImageWithFallback
          src={list.coverImage ?? ''}
          alt={list.title}
          className="w-full h-full object-cover"
          fallbackIcon={list.categories?.icon ?? '📋'}
          fallbackClassName="w-full h-full flex items-center justify-center text-6xl"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4">
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
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white/90 backdrop-blur">
            <BookmarkButton
              listId={list.id}
              initialBookmarkCount={saveCount}
              variant="icon"
              size="md"
            />
          </div>
        </div>
      </div>

      <main className="px-4 -mt-2 relative z-10">
        {/* Title block — strong hierarchy, clear vertical rhythm */}
        <div ref={titleRef} className="pt-3">
          <h1 className="text-[1.625rem] font-extrabold text-gray-900 mb-3 leading-tight">
            {list.title}
          </h1>
          <p className="text-gray-500 text-sm leading-relaxed line-clamp-2 mb-1">
            {list.description?.trim() || DESCRIPTION_PLACEHOLDER}
          </p>
        </div>

        {/* Meta — single line, informational, low visual weight */}
        <div className="text-xs text-gray-500 mb-4">
          <span>⭐ {saveCount} &nbsp; • &nbsp; {itemCount} آیتم</span>
          <span className="text-gray-400 mr-2">•</span>
          <span className="text-gray-400">ساخته‌شده توسط {creatorName}</span>
          {list.users?.curatorLevel && (
            <span className="mr-2 inline-flex align-middle">
              <CuratorBadge level={list.users.curatorLevel} size="small" glow={false} />
            </span>
          )}
          {list.categories && (
            <>
              <span className="text-gray-400 mx-1">•</span>
              <Link
                href={`/categories/${list.categories.slug}`}
                className="text-gray-500 hover:text-primary transition-colors"
              >
                {list.categories.icon} {list.categories.name}
              </Link>
            </>
          )}
        </div>

        {/* Primary actions — save-first, more space above, tighter below */}
        <div className="flex gap-3 mt-6 mb-1">
          {showLoginCTA ? (
            <>
              <p className="text-sm text-gray-500 flex-1 py-2">برای ذخیره یا استفاده از لیست وارد شو</p>
              <Link
                href="/login"
                className="px-5 py-3 rounded-xl bg-primary text-white font-medium text-sm hover:bg-primary-dark transition-colors"
              >
                ورود / ثبت‌نام
              </Link>
            </>
          ) : (
            <>
              <div className="flex-1">
                <BookmarkButton
                  listId={list.id}
                  initialBookmarkCount={saveCount}
                  variant="button"
                  size="lg"
                  labelSave="ذخیره کن"
                  labelSaved="ذخیره شده"
                />
              </div>
              <button
                type="button"
                onClick={handleShare}
                className="px-5 py-3 rounded-xl border-2 border-gray-200 font-medium text-sm hover:border-primary hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                🔗 اشتراک‌گذاری
              </button>
            </>
          )}
        </div>

        {/* Items section — medium spacing from actions, scannable rows */}
        <section className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-800">آیتم‌های لیست</h2>
            {isOwner && (
              <Link
                href={`/user-lists/${list.id}/add-item`}
                className="text-sm text-primary font-medium"
              >
                ➕ افزودن آیتم
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

        {/* Visual separation + Bottom section — large spacing, lighter weight */}
        <div className="mt-16 pt-8">
          {/* Reuse CTA card — soft, does not compete with items */}
          <section className="rounded-2xl bg-gray-100/70 p-5 shadow-sm border border-gray-100/80">
            {isOwner ? (
              <>
                <h2 className="text-base font-semibold text-gray-800 mb-2">این لیست مال توئه</h2>
                <Link
                  href={`/admin/lists/${list.id}/edit`}
                  className="inline-flex items-center gap-2 py-2.5 px-4 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-dark transition-colors"
                >
                  ✏️ ویرایش لیست
                </Link>
              </>
            ) : (
              <>
                <h2 className="text-base font-semibold text-gray-800 mb-1">✨ این لیست رو مال خودت کن</h2>
                <p className="text-sm text-gray-500 mb-4 leading-relaxed">
                  می‌تونی ویرایشش کنی، آیتم اضافه کنی یا نسخه شخصی خودت رو بسازی
                </p>
                <Link
                  href="/user-lists"
                  className="block w-full py-3 px-4 rounded-xl bg-primary text-white font-medium text-center hover:bg-primary-dark transition-colors mb-3"
                >
                  🧩 ساخت نسخه خودم
                </Link>
                <Link
                  href="/user-lists"
                  className="text-sm text-gray-500 hover:text-primary transition-colors inline-block"
                >
                  + اضافه به لیست‌هام
                </Link>
              </>
            )}
          </section>

          {/* Similar lists — lightest section, compact */}
          {relatedLists.length > 0 && (
            <section className="mt-10">
              <h2 className="text-base font-semibold text-gray-800 mb-0.5">لیست‌های مشابه</h2>
              <p className="text-xs text-gray-400 mb-3">ممکنه این‌ها هم به کارت بیان</p>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
                {relatedLists.map((rel) => (
                  <SimilarListCard key={rel.id} rel={rel} />
                ))}
              </div>
            </section>
          )}

          {/* پیشنهاد آیتم — دکمه جدا از کامنت */}
          {session?.user && (
            <div className="mb-4">
              <button
                type="button"
                onClick={() => setSuggestOpen(true)}
                className="w-full py-3 px-4 rounded-xl bg-amber-50 text-amber-700 border border-amber-200/60 font-medium hover:bg-amber-100 transition-colors flex items-center justify-center gap-2"
              >
                + پیشنهاد آیتم به این لیست
              </button>
            </div>
          )}

          {/* نظرات و پیشنهادها — Vibe Comment System */}
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

      {/* Sticky save bar */}
      {showStickyBar && session?.user && (
        <div className="fixed bottom-20 left-4 right-4 z-30 flex justify-center">
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
