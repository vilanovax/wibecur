'use client';

import { memo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Sparkles, Bookmark } from 'lucide-react';
import ListCoverImage from '@/components/shared/ListCoverImage';
import { Card } from '@/components/ui/card';
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
  /** فقط کارت LCP — بقیه low تا با بنر منتخب رقابت نکنند */
  priority?: boolean;
  fetchPriority?: 'high' | 'low' | 'auto';
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
      className: 'bg-foreground/45 text-background/95 backdrop-blur-sm',
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
    <div className="mt-1 flex min-w-0 items-center gap-1.5">
      <UserAvatar
        src={list.users?.image}
        name={creatorName}
        size={20}
        className="h-5 w-5 shrink-0"
      />
      <span className="line-clamp-1 text-xs text-muted-foreground">{creatorName}</span>
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
      ? 'flex size-11 shrink-0 items-center justify-center rounded-full border border-border bg-popover/95 text-muted-foreground shadow-sm backdrop-blur-sm'
      : 'flex size-11 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-muted-foreground';

  if (!loggedIn) {
    return (
      <Link
        href={loginHref}
        onClick={(e) => e.stopPropagation()}
        className={`${btnClass} ${className}`}
        aria-label="ورود برای ذخیره لیست"
      >
        <Bookmark className="h-4 w-4 opacity-70 lg:h-3.5 lg:w-3.5" strokeWidth={1.75} />
      </Link>
    );
  }

  return (
    <div className={`shrink-0 ${className}`} onClick={(e) => e.stopPropagation()}>
      <BookmarkButton
        listId={listId}
        initialIsBookmarked={isBookmarked}
        initialBookmarkCount={saveCount}
        size="sm"
        className={btnClass}
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
  priority = false,
  fetchPriority,
}: ListCardCompactProps) {
  const router = useRouter();
  const saveCount = list.saveCount ?? 0;
  const categorySlug = list.categories?.slug ?? null;
  const badges = getListBadges(list);
  const href = `/lists/${list.slug}`;
  const prefetchList = () => {
    router.prefetch(href);
  };
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
      <Card className="group relative min-h-16 bg-popover p-2 shadow-sm transition-shadow lg:hover:border-brand/30 lg:hover:shadow-md">
        <Link
          href={href}
          prefetch={false}
          onPointerDown={prefetchList}
          onClick={handleSearchResultClick}
          className="absolute inset-0 z-0 rounded-lg"
          aria-label={displayTitle}
        />
        <div className="pointer-events-none relative z-1 flex gap-2">
          <div className="relative size-14 shrink-0 overflow-hidden rounded-md bg-muted lg:transition-transform lg:duration-300 lg:group-hover:scale-105">
            <ListCoverImage
              coverImage={list.coverImage}
              title={list.title}
              slug={list.slug}
              categorySlug={categorySlug}
              sizes="56px"
              priority={priority}
              fetchPriority={fetchPriority}
              className="h-full w-full object-cover lg:transition-transform lg:duration-300 lg:group-hover:scale-110"
              fallbackIcon={list.categories?.icon ?? '📋'}
              fallbackClassName="flex h-full w-full items-center justify-center bg-muted text-lg"
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
            className="pointer-events-auto absolute bottom-2 inset-e-2 z-2"
          />
        ) : null}
      </Card>
    );
  }

  if (variant === 'compact') {
    return (
      <Card className="group relative min-h-20 bg-popover p-2.5 shadow-sm transition-colors active:scale-95 lg:hover:border-brand/30 lg:hover:shadow-md">
        <Link
          href={href}
          prefetch={false}
          onPointerDown={prefetchList}
          onClick={handleSearchResultClick}
          className="absolute inset-0 z-0 rounded-lg"
          aria-label={displayTitle}
        />
        <div className="pointer-events-none relative z-1 flex gap-2.5">
          <div className="relative size-16 shrink-0 overflow-hidden rounded-md bg-muted lg:size-20">
            <ListCoverImage
              coverImage={list.coverImage}
              title={list.title}
              slug={list.slug}
              categorySlug={categorySlug}
              sizes="72px"
              priority={priority}
              fetchPriority={fetchPriority}
              className="h-full w-full object-cover transition-transform duration-300 lg:group-hover:scale-110"
              fallbackIcon={list.categories?.icon ?? '📋'}
              fallbackClassName="flex h-full w-full items-center justify-center bg-muted text-xl"
            />
          </div>
          <div className={`flex min-w-0 flex-1 flex-col justify-center py-0.5 ${showBookmark ? 'pe-12 lg:pe-11' : ''}`}>
            {badges.length > 0 && (
              <div className="mb-0.5 flex flex-wrap gap-1">
                {badges.map((b) => (
                  <span
                    key={b.label}
                    className={`inline-flex items-center rounded px-1.5 py-0.5 wibe-caption font-medium ${b.className}`}
                  >
                    {b.label === 'منتخب' && <Sparkles className="me-0.5 h-3 w-3" />}
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
            className="pointer-events-auto absolute bottom-2.5 inset-e-2.5 z-2 lg:transition-transform lg:group-hover:scale-110"
          />
        ) : null}
      </Card>
    );
  }

  return (
    <Card
      className={`group relative overflow-hidden bg-popover p-0 shadow-sm transition-colors active:scale-95 lg:hover:border-brand/30 lg:hover:shadow-lg ${
        fillHeight ? 'h-full' : ''
      }`}
    >
      <Link
        href={href}
        prefetch={false}
        onPointerDown={prefetchList}
        onClick={handleSearchResultClick}
        className="absolute inset-0 z-0"
        aria-label={displayTitle}
      />
      {/* موبایل: نسبت متعادل | دسکتاپ گرید: landscape مثل بنر منتخب — نه ستون‌های خیلی بلند */}
      <div
        className={
          fillHeight
            ? 'pointer-events-none relative z-1 h-full min-h-60 w-full overflow-hidden bg-muted lg:min-h-72'
            : 'pointer-events-none relative z-1 aspect-5/4 w-full overflow-hidden bg-muted max-lg:min-h-32 sm:aspect-4/3 lg:aspect-16/10 lg:max-h-52 xl:aspect-5/3 xl:max-h-56'
        }
      >
        <ListCoverImage
          coverImage={list.coverImage}
          title={list.title}
          slug={list.slug}
          categorySlug={categorySlug}
          sizes="(min-width: 1024px) 25vw, 50vw"
          priority={priority}
          fetchPriority={fetchPriority}
          className="h-full w-full object-cover transition-transform duration-500 ease-out lg:group-hover:scale-105"
          fallbackIcon={list.categories?.icon ?? '📋'}
          fallbackClassName="flex h-full w-full items-center justify-center bg-muted text-3xl lg:text-4xl"
        />
        {badges.length > 0 && (
          <div className="absolute inset-s-1.5 top-1.5 flex max-w-[70%] flex-wrap justify-start gap-1 lg:inset-s-2 lg:top-2">
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
        <div className="absolute inset-0 bg-linear-to-t from-foreground/95 via-foreground/55 to-foreground/10 transition-opacity duration-300 max-lg:via-foreground/60 lg:group-hover:from-foreground/90" />
        <div
          className="absolute inset-0 hidden items-center justify-center bg-foreground/25 opacity-0 transition-opacity duration-300 lg:flex lg:group-hover:opacity-100"
          aria-hidden
        >
          <span className="rounded-full bg-popover px-4 py-2 text-sm font-semibold text-foreground shadow-md">
            مشاهده لیست
          </span>
        </div>
        <div className={`absolute inset-x-0 bottom-0 p-2.5 text-start max-lg:pb-2 lg:p-3 ${showBookmark ? 'pe-14 lg:pe-12' : ''}`}>
          <h3 className="line-clamp-2 wibe-small font-semibold leading-snug text-background lg:text-base lg:font-bold">
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
          className="pointer-events-auto absolute bottom-2 inset-e-2 z-2 lg:bottom-2.5 lg:inset-e-2.5 lg:opacity-95 lg:transition-colors lg:group-hover:scale-110 lg:group-hover:opacity-100"
        />
      ) : null}
    </Card>
  );
}

// memo: تغییر state والد (تایپ جستجو، toggle و …) دیگر کل گرید کارت‌ها را re-render نمی‌کند.
export default memo(ListCardCompact);
