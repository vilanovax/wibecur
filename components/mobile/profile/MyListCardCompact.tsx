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
}

const VIRAL_LIKE_THRESHOLD = 50;

export default function MyListCardCompact({ list, onSettingsClick, hideSettings }: MyListCardCompactProps) {
  const itemCount = getListItemCount(list);
  const saveCount = list.saveCount ?? list._count?.bookmarks ?? 0;
  const likes = list.likeCount ?? list._count?.list_likes ?? 0;
  const categorySlug = list.categories?.slug ?? null;
  const isViral = likes >= VIRAL_LIKE_THRESHOLD;
  const badge = list.badge?.toString().toLowerCase() ?? null;
  const isFeatured = list.isFeatured || badge === 'featured';
  const visibility = getListVisibilityVariant(list);
  const isEmptyPublic = visibility === 'public' && itemCount === 0;

  const accentClass =
    visibility === 'public'
      ? 'border-s-[3px] border-s-emerald-500'
      : visibility === 'draft'
        ? 'border-s-[3px] border-s-amber-400'
        : 'border-s-[3px] border-s-slate-300';

  return (
    <div
      className={`flex flex-row-reverse items-stretch gap-1.5 overflow-hidden rounded-lg border border-wibe bg-wibe-card shadow-sm ${accentClass}`}
    >
      <Link
        href={`/user-lists/${list.id}`}
        className="flex min-h-[72px] min-w-0 flex-1 flex-row-reverse gap-2.5 p-2.5 transition-transform active:scale-[0.99]"
      >
        <div className="relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-md bg-wibe-surface">
          <ListCoverImage
            coverImage={list.coverImage}
            title={list.title}
            slug={list.slug}
            categorySlug={categorySlug}
            className="h-full w-full object-cover"
            fallbackIcon={list.categories?.icon ?? '📋'}
            fallbackClassName="flex h-full w-full items-center justify-center bg-wibe-surface text-xl"
          />
          <div className="absolute bottom-1 start-1">
            <ListVisibilityBadge variant={visibility} size="sm" />
          </div>
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-center py-0.5">
          <div className="mb-0.5 flex flex-wrap items-center gap-1">
            {isViral && (
              <span className="inline-flex items-center gap-0.5 rounded bg-warning/10 px-1.5 py-0.5 wibe-caption font-medium text-warning">
                <Flame className="h-3 w-3" />
                وایرال
              </span>
            )}
            {isFeatured && (
              <span className="rounded bg-primary/10 px-1.5 py-0.5 wibe-caption font-medium text-primary">
                منتخب
              </span>
            )}
            {badge === 'trending' && (
              <span className="rounded bg-success/10 px-1.5 py-0.5 wibe-caption font-medium text-success">
                ترند
              </span>
            )}
            {isEmptyPublic && (
              <span className="rounded bg-orange-50 px-1.5 py-0.5 wibe-caption font-medium text-orange-700 ring-1 ring-orange-200/80">
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
        className="mx-1.5 flex h-8 w-8 shrink-0 items-center justify-center self-center rounded-md border border-wibe bg-wibe-surface text-wibe-secondary transition-colors hover:border-primary/30 hover:text-primary"
        aria-label="تنظیمات لیست"
      >
        <Settings className="h-4 w-4" />
      </button>
      )}
    </div>
  );
}
