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
      <div className="relative min-h-[68px] rounded-lg border border-wibe bg-wibe-card p-2 shadow-sm">
        <Link href={href} className="absolute inset-0 z-0 rounded-lg" aria-label={displayTitle} />
        <div className="pointer-events-none relative z-[1] flex flex-row-reverse gap-2">
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-gray-200">
            <ListCoverImage
              coverImage={list.coverImage}
              title={list.title}
              slug={list.slug}
              categorySlug={categorySlug}
              className="h-full w-full object-cover"
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
      <div className="relative min-h-[76px] rounded-lg border border-wibe bg-wibe-card p-2.5 shadow-sm transition-transform active:scale-[0.99]">
        <Link href={href} className="absolute inset-0 z-0 rounded-lg" aria-label={displayTitle} />
        <div className="pointer-events-none relative z-[1] flex flex-row-reverse gap-2.5">
          <div className="relative h-[68px] w-[68px] shrink-0 overflow-hidden rounded-md bg-gray-200">
            <ListCoverImage
              coverImage={list.coverImage}
              title={list.title}
              slug={list.slug}
              categorySlug={categorySlug}
              className="h-full w-full object-cover"
              fallbackIcon={list.categories?.icon ?? '📋'}
              fallbackClassName="flex h-full w-full items-center justify-center bg-gray-200 text-xl"
            />
          </div>
          <div className="flex min-w-0 flex-1 flex-col justify-center py-0.5 pe-9">
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
            <h3 className="line-clamp-2 wibe-small font-semibold leading-snug text-foreground">
              {renderTitle('')}
            </h3>
            {subtitle && (
              <p className="mt-0.5 line-clamp-1 wibe-caption text-wibe-secondary">
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
          className="pointer-events-auto absolute bottom-2.5 left-2.5 z-[2]"
        />
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-lg border border-wibe bg-wibe-card shadow-sm transition-transform active:scale-[0.99]">
      <Link href={href} className="absolute inset-0 z-0" aria-label={displayTitle} />
      <div className="pointer-events-none relative z-[1] h-28 w-full overflow-hidden bg-gray-200">
        <ListCoverImage
          coverImage={list.coverImage}
          title={list.title}
          slug={list.slug}
          categorySlug={categorySlug}
          className="h-full w-full object-cover"
          fallbackIcon={list.categories?.icon ?? '📋'}
          fallbackClassName="flex h-full w-full items-center justify-center bg-gray-200 text-3xl"
        />
        {badges.length > 0 && (
          <div className="absolute right-1.5 top-1.5 flex max-w-[70%] flex-wrap justify-end gap-1">
            {badges.map((b) => (
              <span
                key={b.label}
                className={`rounded px-1.5 py-0.5 wibe-caption font-medium backdrop-blur-sm ${b.className}`}
              >
                {b.label}
              </span>
            ))}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-2 pe-10">
          <h3 className="line-clamp-2 wibe-caption font-semibold leading-snug text-white">
            {renderTitle('')}
          </h3>
          <ListCardStats saves={saveCount} itemCount={itemCount} variant="overlay" className="mt-0.5" />
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
