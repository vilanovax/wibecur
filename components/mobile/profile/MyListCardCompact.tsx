'use client';

import Link from 'next/link';
import { Settings, Flame } from 'lucide-react';
import ListCoverImage from '@/components/shared/ListCoverImage';
import ListCardStats from '@/components/shared/ListCardStats';
import ListVisibilityBadge, { getListVisibilityVariant } from './ListVisibilityBadge';

export function getListItemCount(list: {
  itemCount?: number;
  _count?: { items?: number };
}): number {
  return list.itemCount ?? list._count?.items ?? 0;
}

export interface MyListCardData {
  id: string;
  title: string;
  slug: string;
  coverImage: string | null;
  saveCount?: number;
  itemCount?: number;
  likeCount?: number;
  isPublic?: boolean;
  isActive?: boolean;
  isFeatured?: boolean;
  badge?: string | null;
  categories?: { name: string; icon: string | null; slug?: string | null } | null;
  _count?: { items: number; bookmarks: number; list_likes: number };
}

interface MyListCardCompactProps {
  list: MyListCardData;
  onSettingsClick: (e: React.MouseEvent) => void;
  hideSettings?: boolean;
  /** بج «عمومی» را نشان نده (وقتی فیلتر/سکشن عمومی است) */
  hidePublicBadge?: boolean;
}

const VIRAL_LIKE_THRESHOLD = 50;

export default function MyListCardCompact({
  list,
  onSettingsClick,
  hideSettings,
  hidePublicBadge = true,
}: MyListCardCompactProps) {
  const itemCount = getListItemCount(list);
  const saveCount = list.saveCount ?? list._count?.bookmarks ?? 0;
  const likes = list.likeCount ?? list._count?.list_likes ?? 0;
  const categorySlug = list.categories?.slug ?? null;
  const isViral = likes >= VIRAL_LIKE_THRESHOLD;
  const badge = list.badge?.toString().toLowerCase() ?? null;
  const isFeatured = list.isFeatured || badge === 'featured';
  const visibility = getListVisibilityVariant(list);
  const isEmptyPublic = visibility === 'public' && itemCount === 0;
  const showVisibilityOnCover =
    visibility !== 'public' || (!hidePublicBadge && visibility === 'public');

  return (
    <div className="flex flex-row-reverse items-stretch gap-1 overflow-hidden rounded-xl border border-wibe bg-wibe-card shadow-sm">
      <Link
        href={`/user-lists/${list.id}`}
        className="flex min-h-[76px] min-w-0 flex-1 flex-row-reverse gap-2.5 p-2.5 transition-colors hover:bg-wibe-surface/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/30 active:scale-[0.99]"
      >
        <div className="relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-lg bg-wibe-surface">
          <ListCoverImage
            coverImage={list.coverImage}
            title={list.title}
            slug={list.slug}
            categorySlug={categorySlug}
            className="h-full w-full object-cover"
            fallbackIcon={list.categories?.icon ?? '📋'}
            fallbackClassName="flex h-full w-full items-center justify-center bg-wibe-surface text-xl"
          />
          {showVisibilityOnCover ? (
            <div className="absolute bottom-1 start-1">
              <ListVisibilityBadge
                variant={visibility}
                size="sm"
                hideWhenPublic={hidePublicBadge}
              />
            </div>
          ) : null}
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-center py-0.5">
          <div className="mb-0.5 flex flex-wrap items-center gap-1">
            {isViral && (
              <span className="inline-flex items-center gap-0.5 rounded-md bg-warning/10 px-1.5 py-0.5 wibe-caption font-medium text-warning">
                <Flame className="h-3 w-3" aria-hidden />
                وایرال
              </span>
            )}
            {isFeatured && (
              <span className="rounded-md bg-primary/10 px-1.5 py-0.5 wibe-caption font-medium text-primary">
                منتخب
              </span>
            )}
            {badge === 'trending' && (
              <span className="rounded-md bg-success/10 px-1.5 py-0.5 wibe-caption font-medium text-success">
                ترند
              </span>
            )}
            {isEmptyPublic && (
              <span className="rounded-md bg-orange-50 px-1.5 py-0.5 wibe-caption font-medium text-orange-700 ring-1 ring-orange-200/80">
                خالی
              </span>
            )}
          </div>
          <h3 className="line-clamp-2 wibe-small font-semibold leading-snug text-foreground">
            {list.title}
          </h3>
          {list.categories?.name && (
            <p className="mt-0.5 line-clamp-1 wibe-caption text-wibe-secondary">
              {list.categories.icon ? `${list.categories.icon} ` : ''}
              {list.categories.name}
            </p>
          )}
          <ListCardStats saves={saveCount} itemCount={itemCount} variant="compact" className="mt-1" />
        </div>
      </Link>
      {!hideSettings && (
        <button
          type="button"
          onClick={onSettingsClick}
          className="my-2 me-2 flex shrink-0 flex-col items-center justify-center gap-0.5 self-stretch rounded-lg px-2.5 text-wibe-secondary transition-colors hover:bg-wibe-surface hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          aria-label="مدیریت لیست"
          title="مدیریت"
        >
          <Settings className="h-4 w-4" aria-hidden />
          <span className="wibe-caption font-semibold leading-none">مدیریت</span>
        </button>
      )}
    </div>
  );
}
