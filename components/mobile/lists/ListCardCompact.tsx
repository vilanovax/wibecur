'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { Flame, Sparkles, Bookmark } from 'lucide-react';
import ListCoverImage from '@/components/shared/ListCoverImage';
import ListCardStats from '@/components/shared/ListCardStats';
import BookmarkButton from '@/components/mobile/lists/BookmarkButton';
import { getListCardSubtitle } from '@/lib/lists-card-utils';
import { getDisplayListTitle } from '@/lib/list-display-title';
import SearchHighlight from '@/components/mobile/search/SearchHighlight';

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
}

const NEW_LIST_DAYS = 14;

function getListBadges(list: ListWithCreator): { label: string; className: string }[] {
  const badges: { label: string; className: string }[] = [];
  const badgeNorm = list.badge?.toString().toUpperCase() ?? '';

  if (list.isFeatured) {
    badges.push({ label: 'منتخب', className: 'bg-primary/10 text-primary' });
  }
  if (badgeNorm === 'TRENDING' || list.badge?.toString().toLowerCase() === 'trending') {
    badges.push({ label: 'ترند', className: 'bg-warning/10 text-warning' });
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
      <div className="h-5 w-5 shrink-0 overflow-hidden rounded-full bg-gray-200">
        {list.users?.image ? (
          <Image
            src={list.users.image}
            alt=""
            width={20}
            height={20}
            className="h-full w-full object-cover"
            unoptimized
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-[9px] font-semibold text-wibe-secondary">
            {creatorName.charAt(0)}
          </span>
        )}
      </div>
      <span className="line-clamp-1 wibe-caption text-wibe-secondary/80">{creatorName}</span>
    </div>
  );
}

function InlineBookmark({
  listId,
  saveCount,
  isBookmarked,
  onToggle,
  size = 'sm',
  className = '',
}: {
  listId: string;
  saveCount: number;
  isBookmarked?: boolean;
  onToggle?: (listId: string, isBookmarked: boolean) => void;
  size?: 'sm' | 'xs';
  className?: string;
}) {
  const { data: session } = useSession();
  const btnClass =
    size === 'xs'
      ? 'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-wibe/80 bg-wibe-surface/95 text-wibe-secondary shadow-sm backdrop-blur-sm transition-transform active:scale-95'
      : 'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-wibe/80 bg-wibe-surface text-wibe-secondary transition-transform active:scale-95';

  if (!session?.user) {
    return (
      <Link
        href="/login"
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
        onToggle={(bookmarked) => onToggle?.(listId, bookmarked)}
      />
    </div>
  );
}

export default function ListCardCompact({
  list,
  variant = 'compact',
  showCreator = false,
  isBookmarked,
  onBookmarkToggle,
  highlightQuery,
}: ListCardCompactProps) {
  const itemCount = list.itemCount ?? list._count?.items ?? 0;
  const saveCount = list.saveCount ?? 0;
  const categorySlug = list.categories?.slug ?? null;
  const badges = getListBadges(list);
  const subtitle = getListCardSubtitle(list);
  const href = `/lists/${list.slug}`;
  const displayTitle = getDisplayListTitle({
    title: list.title,
    slug: list.slug,
    categorySlug,
  });

  const renderTitle = (className: string) =>
    highlightQuery ? (
      <SearchHighlight text={displayTitle} query={highlightQuery} className={className} />
    ) : (
      displayTitle
    );

  if (variant === 'mini') {
    return (
      <div className="group relative min-h-[68px] rounded-lg border border-wibe bg-wibe-card p-2 shadow-sm transition-shadow lg:hover:border-primary/25 lg:hover:shadow-md">
        <Link href={href} className="absolute inset-0 z-0 rounded-lg" aria-label={displayTitle} />
        <div className="pointer-events-none relative z-[1] flex flex-row-reverse gap-2">
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-gray-200 lg:transition-transform lg:duration-300 lg:group-hover:scale-105">
            <ListCoverImage
              coverImage={list.coverImage}
              title={list.title}
              slug={list.slug}
              categorySlug={categorySlug}
              className="h-full w-full object-cover lg:transition-transform lg:duration-300 lg:group-hover:scale-110"
              fallbackIcon={list.categories?.icon ?? '📋'}
              fallbackClassName="flex h-full w-full items-center justify-center bg-gray-200 text-lg"
            />
          </div>
          <div className="flex min-w-0 flex-1 flex-col justify-center py-0.5">
            <h3 className="line-clamp-2 wibe-caption font-semibold leading-snug text-foreground">
              {renderTitle('')}
            </h3>
            <div className="mt-0.5 flex items-center justify-between gap-1.5 pe-8">
              <ListCardStats saves={saveCount} itemCount={itemCount} variant="minimal" className="min-w-0 truncate" />
            </div>
          </div>
        </div>
        <InlineBookmark
          listId={list.id}
          saveCount={saveCount}
          isBookmarked={isBookmarked}
          onToggle={onBookmarkToggle}
          size="xs"
          className="pointer-events-auto absolute bottom-2 left-2 z-[2]"
        />
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className="group relative min-h-[76px] rounded-lg border border-wibe bg-wibe-card p-2.5 shadow-sm transition-all active:scale-[0.99] lg:hover:border-primary/30 lg:hover:shadow-md">
        <Link href={href} className="absolute inset-0 z-0 rounded-lg" aria-label={displayTitle} />
        <div className="pointer-events-none relative z-[1] flex flex-row-reverse gap-2.5">
          <div className="relative h-[68px] w-[68px] shrink-0 overflow-hidden rounded-md bg-gray-200 lg:h-[72px] lg:w-[72px]">
            <ListCoverImage
              coverImage={list.coverImage}
              title={list.title}
              slug={list.slug}
              categorySlug={categorySlug}
              className="h-full w-full object-cover transition-transform duration-300 lg:group-hover:scale-110"
              fallbackIcon={list.categories?.icon ?? '📋'}
              fallbackClassName="flex h-full w-full items-center justify-center bg-gray-200 text-xl"
            />
          </div>
          <div className="flex min-w-0 flex-1 flex-col justify-center py-0.5 pe-9 lg:pe-10">
            {badges.length > 0 && (
              <div className="mb-0.5 flex flex-wrap gap-1">
                {badges.map((b) => (
                  <span
                    key={b.label}
                    className={`inline-flex items-center rounded px-1.5 py-0.5 wibe-caption font-medium ${b.className}`}
                  >
                    {b.label === 'ترند' && <Flame className="ml-0.5 h-3 w-3" />}
                    {b.label === 'منتخب' && <Sparkles className="ml-0.5 h-3 w-3" />}
                    {b.label}
                  </span>
                ))}
              </div>
            )}
            <h3 className="line-clamp-2 wibe-small font-semibold leading-snug text-foreground lg:text-base">
              {renderTitle('')}
            </h3>
            {subtitle && (
              <p className="mt-0.5 line-clamp-1 wibe-caption text-wibe-secondary lg:text-sm">
                {highlightQuery ? (
                  <SearchHighlight text={subtitle} query={highlightQuery} />
                ) : (
                  subtitle
                )}
              </p>
            )}
            <ListCardStats saves={saveCount} itemCount={itemCount} variant="minimal" className="mt-1" />
            {showCreator && <CreatorRow list={list} />}
          </div>
        </div>
        <InlineBookmark
          listId={list.id}
          saveCount={saveCount}
          isBookmarked={isBookmarked}
          onToggle={onBookmarkToggle}
          className="pointer-events-auto absolute bottom-2.5 left-2.5 z-[2] lg:transition-transform lg:group-hover:scale-110"
        />
      </div>
    );
  }

  return (
    <div className="group relative overflow-hidden rounded-lg border border-wibe bg-wibe-card shadow-sm transition-all active:scale-[0.99] lg:rounded-xl lg:hover:border-primary/25 lg:hover:shadow-lg">
      <Link href={href} className="absolute inset-0 z-0" aria-label={displayTitle} />
      {/* موبایل: نسبت متعادل | دسکتاپ گرید: landscape مثل بنر منتخب — نه ستون‌های خیلی بلند */}
      <div className="pointer-events-none relative z-[1] aspect-[4/5] w-full overflow-hidden bg-gray-200 max-lg:min-h-[148px] sm:aspect-[5/4] lg:aspect-[16/10] lg:max-h-[200px] xl:aspect-[5/3] xl:max-h-[220px]">
        <ListCoverImage
          coverImage={list.coverImage}
          title={list.title}
          slug={list.slug}
          categorySlug={categorySlug}
          className="h-full w-full object-cover transition-transform duration-500 ease-out lg:group-hover:scale-105"
          fallbackIcon={list.categories?.icon ?? '📋'}
          fallbackClassName="flex h-full w-full items-center justify-center bg-gray-200 text-3xl lg:text-4xl"
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
        <div className="absolute inset-x-0 bottom-0 p-2.5 pe-11 text-right max-lg:pb-2 lg:p-3 lg:pe-12">
          <h3 className="line-clamp-2 wibe-small font-semibold leading-snug text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)] max-lg:text-[0.8125rem] lg:text-base lg:font-bold">
            {renderTitle('')}
          </h3>
          <ListCardStats
            saves={saveCount}
            itemCount={itemCount}
            variant="overlay"
            className="mt-1 max-lg:text-[0.6875rem] lg:mt-1.5 lg:text-sm"
          />
        </div>
      </div>
      <InlineBookmark
        listId={list.id}
        saveCount={saveCount}
        isBookmarked={isBookmarked}
        onToggle={onBookmarkToggle}
        size="xs"
        className="pointer-events-auto absolute bottom-2 left-2 z-[2] lg:bottom-2.5 lg:left-2.5 lg:opacity-95 lg:transition-all lg:group-hover:scale-110 lg:group-hover:opacity-100"
      />
    </div>
  );
}
