'use client';

import Link from 'next/link';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import ListCardStats from '@/components/shared/ListCardStats';
import { formatNumber } from '@/lib/curated/utils';
import type { CuratedList } from '@/types/curated';

const BADGE_STYLES: Record<string, string> = {
  trending: 'bg-warning text-white',
  rising: 'bg-primary text-white',
  featured: 'bg-success text-white',
  ai: 'bg-info text-white',
};

const BADGE_LABELS: Record<string, string> = {
  trending: 'ترند',
  rising: 'در حال رشد',
  featured: 'ویژه',
  ai: 'AI',
};

interface CuratedGridCardProps {
  list: CuratedList;
}

export default function CuratedGridCard({ list }: CuratedGridCardProps) {
  const topBadge = list.badges[0];

  return (
    <Link
      href={`/lists/${list.slug}`}
      className="block bg-wibe-card rounded-lg overflow-hidden border border-wibe shadow-sm active:scale-[0.99] transition-transform"
    >
      <div className="relative aspect-[4/3] w-full bg-gray-200 overflow-hidden">
        <ImageWithFallback
          src={list.coverUrl ?? ''}
          alt={list.title}
          className="w-full h-full object-cover"
          fallbackIcon="📋"
          fallbackClassName="w-full h-full flex items-center justify-center text-3xl bg-gray-200"
        />
        {topBadge && (
          <span
            className={`absolute top-2 right-2 px-2 py-0.5 rounded-pill wibe-caption font-semibold ${BADGE_STYLES[topBadge] ?? 'bg-gray-800 text-white'}`}
          >
            {BADGE_LABELS[topBadge] ?? topBadge}
          </span>
        )}
        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/55 to-transparent">
          <ListCardStats saves={list.savesCount} itemCount={list.itemsCount} variant="overlay" />
        </div>
      </div>
      <div className="p-3">
        <p className="wibe-caption text-wibe-secondary mb-1">{list.creator.levelTitle}</p>
        <h3 className="wibe-small font-semibold text-foreground line-clamp-2">{list.title}</h3>
        {list.subtitle && (
          <p className="wibe-caption text-wibe-secondary line-clamp-1 mt-0.5">{list.subtitle}</p>
        )}
        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-wibe">
          <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
            <ImageWithFallback
              src={list.creator.avatarUrl ?? ''}
              alt={list.creator.name}
              className="w-full h-full object-cover"
              fallbackIcon="👤"
              fallbackClassName="w-full h-full flex items-center justify-center text-xs bg-gray-200"
            />
          </div>
          <span className="wibe-caption font-medium text-foreground truncate">{list.creator.name}</span>
          <span className="wibe-caption text-wibe-secondary mr-auto">{formatNumber(list.savesCount)} ذخیره</span>
        </div>
      </div>
    </Link>
  );
}
