'use client';

import { memo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Sparkles, Bookmark } from 'lucide-react';
import ListCoverImage from '@/components/shared/ListCoverImage';
import UserAvatar from '@/components/shared/UserAvatar';
import BookmarkButton from '@/components/mobile/lists/BookmarkButton';
import { getDisplayListTitle } from '@/lib/list-display-title';
import SearchHighlight from '@/components/mobile/search/SearchHighlight';
import { trackSearchResultClick } from '@/lib/analytics';

type ListWithCreator = {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  coverImage: string | null;
  saveCount: number;
  likeCount?: number;
  itemCount: number;
  badge?: string | null;
  isFeatured?: boolean;
  createdAt?: string | Date;
  categories?: { name: string; icon: string | null; slug?: string | null } | null;
  users?: { name: string | null; username: string | null; image: string | null } | null;
  _count?: { items: number; list_likes: number };
};

interface ListCardCompactProps {
  list: ListWithCreator;
  variant?: 'grid' | 'compact' | 'mini';
  showCreator?: boolean;
  isBookmarked?: boolean;
  onBookmarkToggle?: (listId: string, isBookmarked: boolean) => void;
  highlightQuery?: string;
  /** موقعیت در نتایج جستجو (برای آنالیتیکس) */
  searchResultIndex?: number;
  /**
   * وضعیت لاگین کاربر. اگر والد (مثلاً گرید) این را یک‌بار پاس بدهد،
   * هیچ useSession در سطح کارت صدا زده نمی‌شود → حذف N اشتراک context در گریدها.
   * اگر undefined باشد، کارت خودش از useSession می‌خواند (سازگاری با کد قبلی).
   */
  isLoggedIn?: boolean;
  /** نمایش دکمهٔ ذخیره روی کارت — پیش‌فرض خاموش برای UI خلوت‌تر */
  showBookmark?: boolean;
  /** پر کردن ارتفاع والد (چیدمان trio / row-span) */
  fillHeight?: boolean;
}

const NEW_LIST_DAYS = 14;

function getListBadges(list: ListWithCreator): { label: string; className: string }[] {
  const badges: { label: string; className: string }[] = [];
  const badgeNorm = list.badge?.toString().toUpperCase() ?? '';

  if (list.isFeatured) {
    badges.push({ label: 'منتخب', className: 'bg-primary/10 text-primary' });
  }
  if (badgeNorm === 'TRENDING' || list.badge?.toString().toLowerCase() === 'trending') {
    // آروم — با mode «ترند» برخورد معنایی نداشته باشد
    badges.push({
      label: 'داغ',
      className: 'bg-black/45 text-white/95 backdrop-blur-sm',
    });
  }
  if (list.createdAt) {
    const days = (Date.now() - new Date(list.createdAt).getTime()) / (24 * 60 * 60 * 1000);
    if (days <= NEW_LIST_DAYS && badges.length < 2) {
      badges.push({ label: 'جدید', className: 'bg-success/10 text-success' });
    }
  }
  return badges.slice(0, 2);
}

function CreatorRow({ list }: { list: ListWithCreator }) {
  const creatorName = list.users?.name || list.users?.username;
  if (!creatorName) return null;

  return (
    <div className="mt-1 flex min-w-0 flex-row-reverse items-center gap-1.5">
      <UserAvatar
        src={list.users?.image}
        name={creatorName}
        size={20}
        className="h-5 w-5 shrink-0"
      />
      <span className="line-clamp-1 wibe-caption text-wibe-secondary/80">{creatorName}</span>
    </div>
  );
}

type InlineBookmarkProps = {
  listId: string;
  listSlug?: string;
  categorySlug?: string | null;
  saveCount: number;
  isBookmarked?: boolean;
  onToggle?: (listId: string, isBookmarked: boolean) => void;
  size?: 'sm' | 'xs';
  className?: string;
  isLoggedIn?: boolean;
  analyticsSource?: string;
};

/** هستهٔ خالص — بدون خواندن context؛ قابل memo. */
function InlineBookmarkView({
  listId,
  listSlug,
  categorySlug,
  saveCount,
  isBookmarked,
  onToggle,
  size = 'sm',
  className = '',
  loggedIn,
  analyticsSource = 'list_card',
}: Omit<InlineBookmarkProps, 'isLoggedIn'> & { loggedIn: boolean }) {
  const pathname = usePathname();
  const loginHref = `/login?callbackUrl=${encodeURIComponent(pathname || '/')}&source=bookmark_gate`;
  const btnClass =
    size === 'xs'
      ? 'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-wibe/80 bg-wibe-surface/95 text-wibe-secondary shadow-sm backdrop-blur-sm transition-transform active:scale-95'
      : 'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-wibe/80 bg-wibe-surface text-wibe-secondary transition-transform active:scale-95';

  if (!loggedIn) {
    return (
      <Link
        href={loginHref}
        onClick={(e) => e.stopPropagation()}
        className={`${btnClass} ${className}`}
        aria-label="ورود برای ذخیره لیست"
      >
        <Bookmark className="h-3.5 w-3.5 opacity-70" strokeWidth={1.75} />
      </Link>
    );
  }

  return (
    <div className={`${btnClass} ${className}`} onClick={(e) => e.stopPropagation()}>
      <BookmarkButton
        listId={listId}
        initialIsBookmarked={isBookmarked}
        initialBookmarkCount={saveCount}
        size="sm"
        analytics={{
          listSlug,
          categorySlug,
          source: analyticsSource,
        }}
        onToggle={(bookmarked) => onToggle?.(listId, bookmarked)}
      />
    </div>
  );
}

/** نسخه‌ای که خودش session را می‌خواند — فقط وقتی والد isLoggedIn نداده باشد. */
function InlineBookmarkAuto(props: Omit<InlineBookmarkProps, 'isLoggedIn'>) {
  const { data: session } = useSession();
  return <InlineBookmarkView {...props} loggedIn={!!session?.user} />;
}

function InlineBookmark({ isLoggedIn, ...rest }: InlineBookmarkProps) {
  // اگر والد وضعیت لاگین را داده باشد، هیچ subscription به session ساخته نمی‌شود.
  if (typeof isLoggedIn === 'boolean') {
    return <InlineBookmarkView {...rest} loggedIn={isLoggedIn} />;
  }
  return <InlineBookmarkAuto {...rest} />;
}

function ListCardCompact({
  list,
  variant = 'compact',
  showCreator = false,
  isBookmarked,
  onBookmarkToggle,
  highlightQuery,
  searchResultIndex,
  isLoggedIn,
  showBookmark = false,
  fillHeight = false,
}: ListCardCompactProps) {
  const saveCount = list.saveCount ?? 0;
  const categorySlug = list.categories?.slug ?? null;
  const badges = getListBadges(list);
  const href = `/lists/${list.slug}`;
  const displayTitle = getDisplayListTitle({
    title: list.title,
    slug: list.slug,
    categorySlug,
  });

  const handleSearchResultClick = () => {
    const q = highlightQuery?.trim();
    if (!q) return;
    trackSearchResultClick({
      query: q,
      source: 'lists_page',
      result_type: 'list',
      result_slug: list.slug,
      category_slug: categorySlug ?? undefined,
      position: searchResultIndex,
    });
  };

  const renderTitle = (className: string) =>
    highlightQuery ? (
      <SearchHighlight text={displayTitle} query={highlightQuery} className={className} />
    ) : (
      displayTitle
    );

  if (variant === 'mini') {
    return (
      <div className="group relative min-h-[68px] rounded-lg border border-wibe bg-wibe-card p-2 shadow-sm transition-shadow lg:hover:border-primary/25 lg:hover:shadow-md">
        <Link
          href={href}
          onClick={handleSearchResultClick}
          className="absolute inset-0 z-0 rounded-lg"
          aria-label={displayTitle}
        />
        <div className="pointer-events-none relative z-[1] flex flex-row-reverse gap-2">
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-wibe-surface lg:transition-transform lg:duration-300 lg:group-hover:scale-105">
            <ListCoverImage
              coverImage={list.coverImage}
              title={list.title}
              slug={list.slug}
              categorySlug={categorySlug}
              sizes="56px"
              className="h-full w-full object-cover lg:transition-transform lg:duration-300 lg:group-hover:scale-110"
              fallbackIcon={list.categories?.icon ?? '📋'}
              fallbackClassName="flex h-full w-full items-center justify-center bg-wibe-surface text-lg"
            />
          </div>
          <div className="flex min-w-0 flex-1 flex-col justify-center py-0.5">
            <h3 className="line-clamp-2 wibe-caption font-semibold leading-snug text-foreground">
              {renderTitle('')}
            </h3>
          </div>
        </div>
        {showBookmark ? (
          <InlineBookmark
            listId={list.id}
            listSlug={list.slug}
            categorySlug={categorySlug}
            saveCount={saveCount}
            isBookmarked={isBookmarked}
            onToggle={onBookmarkToggle}
            isLoggedIn={isLoggedIn}
            size="xs"
            className="pointer-events-auto absolute bottom-2 left-2 z-[2]"
          />
        ) : null}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className="group relative min-h-[76px] rounded-lg border border-wibe bg-wibe-card p-2.5 shadow-sm transition-colors active:scale-[0.99] lg:hover:border-primary/30 lg:hover:shadow-md">
        <Link
          href={href}
          onClick={handleSearchResultClick}
          className="absolute inset-0 z-0 rounded-lg"
          aria-label={displayTitle}
        />
        <div className="pointer-events-none relative z-[1] flex flex-row-reverse gap-2.5">
          <div className="relative h-[68px] w-[68px] shrink-0 overflow-hidden rounded-md bg-wibe-surface lg:h-[72px] lg:w-[72px]">
            <ListCoverImage
              coverImage={list.coverImage}
              title={list.title}
              slug={list.slug}
              categorySlug={categorySlug}
              sizes="72px"
              className="h-full w-full object-cover transition-transform duration-300 lg:group-hover:scale-110"
              fallbackIcon={list.categories?.icon ?? '📋'}
              fallbackClassName="flex h-full w-full items-center justify-center bg-wibe-surface text-xl"
            />
          </div>
          <div className={`flex min-w-0 flex-1 flex-col justify-center py-0.5 ${showBookmark ? 'pe-9 lg:pe-10' : ''}`}>
            {badges.length > 0 && (
              <div className="mb-0.5 flex flex-wrap gap-1">
                {badges.map((b) => (
                  <span
                    key={b.label}
                    className={`inline-flex items-center rounded px-1.5 py-0.5 wibe-caption font-medium ${b.className}`}
                  >
                    {b.label === 'منتخب' && <Sparkles className="ml-0.5 h-3 w-3" />}
                    {b.label}
                  </span>
                ))}
              </div>
            )}
            <h3 className="line-clamp-2 wibe-small font-semibold leading-snug text-foreground lg:text-base">
              {renderTitle('')}
            </h3>
            {showCreator && <CreatorRow list={list} />}
          </div>
        </div>
        {showBookmark ? (
          <InlineBookmark
            listId={list.id}
            listSlug={list.slug}
            categorySlug={categorySlug}
            saveCount={saveCount}
            isBookmarked={isBookmarked}
            onToggle={onBookmarkToggle}
            isLoggedIn={isLoggedIn}
            className="pointer-events-auto absolute bottom-2.5 left-2.5 z-[2] lg:transition-transform lg:group-hover:scale-110"
          />
        ) : null}
      </div>
    );
  }

  return (
    <div
      className={`group relative overflow-hidden rounded-lg border border-wibe bg-wibe-card shadow-sm transition-colors active:scale-[0.99] lg:rounded-xl lg:hover:border-primary/25 lg:hover:shadow-lg ${
        fillHeight ? 'h-full' : ''
      }`}
    >
      <Link
        href={href}
        onClick={handleSearchResultClick}
        className="absolute inset-0 z-0"
        aria-label={displayTitle}
      />
      {/* موبایل: نسبت متعادل | دسکتاپ گرید: landscape مثل بنر منتخب — نه ستون‌های خیلی بلند */}
      <div
        className={
          fillHeight
            ? 'pointer-events-none relative z-[1] h-full min-h-[240px] w-full overflow-hidden bg-wibe-surface lg:min-h-[280px]'
            : 'pointer-events-none relative z-[1] aspect-[5/4] w-full overflow-hidden bg-wibe-surface max-lg:min-h-[118px] sm:aspect-[4/3] lg:aspect-[16/10] lg:max-h-[200px] xl:aspect-[5/3] xl:max-h-[220px]'
        }
      >
        <ListCoverImage
          coverImage={list.coverImage}
          title={list.title}
          slug={list.slug}
          categorySlug={categorySlug}
          sizes="(min-width: 1024px) 25vw, 50vw"
          className="h-full w-full object-cover transition-transform duration-500 ease-out lg:group-hover:scale-105"
          fallbackIcon={list.categories?.icon ?? '📋'}
          fallbackClassName="flex h-full w-full items-center justify-center bg-wibe-surface text-3xl lg:text-4xl"
        />
        {badges.length > 0 && (
          <div className="absolute right-1.5 top-1.5 flex max-w-[70%] flex-wrap justify-end gap-1 lg:right-2 lg:top-2">
            {badges.map((b) => (
              <span
                key={b.label}
                className={`rounded px-1.5 py-0.5 wibe-caption font-medium backdrop-blur-sm lg:px-2 lg:py-1 lg:text-xs ${b.className}`}
              >
                {b.label}
              </span>
            ))}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/55 to-black/10 transition-opacity duration-300 max-lg:via-black/60 lg:group-hover:from-black/90" />
        <div
          className="absolute inset-0 hidden items-center justify-center bg-black/25 opacity-0 transition-opacity duration-300 lg:flex lg:group-hover:opacity-100"
          aria-hidden
        >
          <span className="rounded-full bg-white/95 px-4 py-2 wibe-small font-semibold text-foreground shadow-md">
            مشاهده لیست
          </span>
        </div>
        <div className={`absolute inset-x-0 bottom-0 p-2.5 text-right max-lg:pb-2 lg:p-3 ${showBookmark ? 'pe-11 lg:pe-12' : ''}`}>
          <h3 className="line-clamp-2 wibe-small font-semibold leading-snug text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)] lg:text-base lg:font-bold">
            {renderTitle('')}
          </h3>
        </div>
      </div>
      {showBookmark ? (
        <InlineBookmark
          listId={list.id}
          listSlug={list.slug}
          categorySlug={categorySlug}
          saveCount={saveCount}
          isBookmarked={isBookmarked}
          onToggle={onBookmarkToggle}
          isLoggedIn={isLoggedIn}
          size="xs"
          className="pointer-events-auto absolute bottom-2 left-2 z-[2] lg:bottom-2.5 lg:left-2.5 lg:opacity-95 lg:transition-colors lg:group-hover:scale-110 lg:group-hover:opacity-100"
        />
      ) : null}
    </div>
  );
}

// memo: تغییر state والد (تایپ جستجو، toggle و …) دیگر کل گرید کارت‌ها را re-render نمی‌کند.
export default memo(ListCardCompact);
