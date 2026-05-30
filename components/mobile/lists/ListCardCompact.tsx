'use client';

import Link from 'next/link';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import ListCardStats from '@/components/shared/ListCardStats';

type ListWithCreator = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  coverImage: string | null;
  saveCount: number;
  likeCount: number;
  itemCount: number;
  categories?: { name: string; icon: string | null } | null;
  users?: { name: string | null; username: string | null; image: string | null } | null;
  _count?: { items: number; list_likes: number };
};

interface ListCardCompactProps {
  list: ListWithCreator;
  variant?: 'grid' | 'compact';
}

export default function ListCardCompact({ list, variant = 'grid' }: ListCardCompactProps) {
  const itemCount = list.itemCount ?? list._count?.items ?? 0;
  const saveCount = list.saveCount ?? 0;
  const creatorName = list.users?.name || list.users?.username;

  if (variant === 'compact') {
    return (
      <Link
        href={`/lists/${list.slug}`}
        className="flex flex-row-reverse gap-3 p-3 bg-wibe-card rounded-lg border border-wibe shadow-sm active:scale-[0.99] transition-transform"
      >
        <div className="relative w-24 flex-shrink-0 rounded-md overflow-hidden bg-gray-200 aspect-[4/3]">
          <ImageWithFallback
            src={list.coverImage ?? ''}
            alt={list.title}
            className="w-full h-full object-cover"
            fallbackIcon={list.categories?.icon ?? '📋'}
            fallbackClassName="w-full h-full flex items-center justify-center text-2xl bg-gray-200"
          />
        </div>
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <h3 className="wibe-small font-semibold text-foreground line-clamp-1">{list.title}</h3>
          {list.description && (
            <p className="wibe-caption text-wibe-secondary line-clamp-1 mt-0.5">{list.description}</p>
          )}
          {creatorName && (
            <p className="wibe-caption text-wibe-secondary/80 mt-0.5 line-clamp-1">{creatorName}</p>
          )}
          <ListCardStats saves={saveCount} itemCount={itemCount} variant="compact" className="mt-1.5" />
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/lists/${list.slug}`}
      className="block bg-wibe-card rounded-lg overflow-hidden border border-wibe shadow-card active:scale-[0.99] transition-transform"
    >
      <div className="relative aspect-[4/3] w-full bg-gray-200 overflow-hidden">
        <ImageWithFallback
          src={list.coverImage ?? ''}
          alt={list.title}
          className="w-full h-full object-cover"
          fallbackIcon={list.categories?.icon ?? '📋'}
          fallbackClassName="w-full h-full flex items-center justify-center text-4xl bg-gray-200"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-2.5">
          <ListCardStats saves={saveCount} itemCount={itemCount} variant="overlay" />
        </div>
      </div>
      <div className="p-3">
        <h3 className="wibe-small font-semibold text-foreground line-clamp-2">{list.title}</h3>
        {creatorName && (
          <p className="wibe-caption text-wibe-secondary mt-1 line-clamp-1">{creatorName}</p>
        )}
      </div>
    </Link>
  );
}
