'use client';

import Link from 'next/link';
import { Settings, Eye, EyeOff, Flame } from 'lucide-react';
import ListCoverImage from '@/components/shared/ListCoverImage';
import ListCardStats from '@/components/shared/ListCardStats';

export interface MyListCardData {
  id: string;
  title: string;
  slug: string;
  coverImage: string | null;
  saveCount?: number;
  itemCount?: number;
  likeCount?: number;
  isPublic?: boolean;
  isFeatured?: boolean;
  badge?: string | null;
  categories?: { name: string; icon: string | null; slug?: string | null } | null;
  _count?: { items: number; bookmarks: number; list_likes: number };
}

interface MyListCardCompactProps {
  list: MyListCardData;
  onSettingsClick: (e: React.MouseEvent) => void;
}

const VIRAL_LIKE_THRESHOLD = 50;

export default function MyListCardCompact({ list, onSettingsClick }: MyListCardCompactProps) {
  const itemCount = list.itemCount ?? list._count?.items ?? 0;
  const saveCount = list.saveCount ?? list._count?.bookmarks ?? 0;
  const likes = list.likeCount ?? list._count?.list_likes ?? 0;
  const categorySlug = list.categories?.slug ?? null;
  const isViral = likes >= VIRAL_LIKE_THRESHOLD;
  const badge = list.badge?.toString().toLowerCase() ?? null;
  const isFeatured = list.isFeatured || badge === 'featured';

  return (
    <div className="flex flex-row-reverse items-stretch gap-1.5 bg-wibe-card rounded-lg border border-wibe shadow-sm overflow-hidden">
      <Link
        href={`/user-lists/${list.id}`}
        className="flex flex-1 flex-row-reverse gap-2.5 p-2.5 min-w-0 active:scale-[0.99] transition-transform min-h-[72px]"
      >
        <div className="relative w-[72px] h-[72px] flex-shrink-0 rounded-md overflow-hidden bg-gray-200">
          <ListCoverImage
            coverImage={list.coverImage}
            title={list.title}
            slug={list.slug}
            categorySlug={categorySlug}
            className="w-full h-full object-cover"
            fallbackIcon={list.categories?.icon ?? '📋'}
            fallbackClassName="w-full h-full flex items-center justify-center text-xl bg-gray-200"
          />
        </div>
        <div className="flex-1 min-w-0 flex flex-col justify-center py-0.5">
          <div className="flex flex-wrap items-center gap-1 mb-0.5">
            {list.isPublic ? (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded wibe-caption font-medium bg-success/10 text-success">
                <Eye className="w-3 h-3" />
                عمومی
              </span>
            ) : (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded wibe-caption font-medium bg-gray-100 text-wibe-secondary">
                <EyeOff className="w-3 h-3" />
                خصوصی
              </span>
            )}
            {isViral && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded wibe-caption font-medium bg-warning/10 text-warning">
                <Flame className="w-3 h-3" />
                وایرال
              </span>
            )}
            {isFeatured && (
              <span className="px-1.5 py-0.5 rounded wibe-caption font-medium bg-primary/10 text-primary">
                منتخب
              </span>
            )}
            {badge === 'trending' && (
              <span className="px-1.5 py-0.5 rounded wibe-caption font-medium bg-success/10 text-success">
                ترند
              </span>
            )}
          </div>
          <h3 className="wibe-small font-semibold text-foreground line-clamp-2 leading-snug">
            {list.title}
          </h3>
          {list.categories?.name && (
            <p className="wibe-caption text-wibe-secondary line-clamp-1 mt-0.5">
              {list.categories.icon ? `${list.categories.icon} ` : ''}
              {list.categories.name}
            </p>
          )}
          <ListCardStats saves={saveCount} itemCount={itemCount} variant="compact" className="mt-1" />
        </div>
      </Link>
      <button
        type="button"
        onClick={onSettingsClick}
        className="shrink-0 self-center mx-1.5 w-8 h-8 rounded-md border border-wibe bg-wibe-surface flex items-center justify-center text-wibe-secondary hover:text-primary hover:border-primary/30 transition-colors"
        aria-label="تنظیمات لیست"
      >
        <Settings className="w-4 h-4" />
      </button>
    </div>
  );
}
