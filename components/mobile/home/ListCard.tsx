'use client';

import Link from 'next/link';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import ListCardStats from '@/components/shared/ListCardStats';
import { LIST_BADGE_LABELS, listBadgeSolidStyles } from '@/lib/list-badge-styles';

export interface ListCardProps {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  badge?: 'trending' | 'new' | 'featured';
  likes: number;
  saves: number;
  itemCount: number;
  variant?: 'default' | 'compact';
  slug?: string;
  priority?: boolean;
  categorySlug?: string | null;
  listSlug?: string | null;
  listTitle?: string | null;
}

const badgeStyles = listBadgeSolidStyles;
const badgeLabels = LIST_BADGE_LABELS;

export default function ListCard({
  id,
  title,
  description,
  coverImage,
  badge,
  saves,
  itemCount,
  variant = 'default',
  slug,
  priority,
  categorySlug,
  listSlug,
  listTitle,
}: ListCardProps) {
  const listHref = `/lists/${slug ?? id}`;
  const resolvedListSlug = listSlug ?? slug;

  if (variant === 'compact') {
    return (
      <Link href={listHref} className="block active:scale-[0.99] transition-transform">
        <div className="bg-wibe-card rounded-lg overflow-hidden border border-wibe shadow-sm flex flex-row-reverse">
          <div className="relative w-24 h-24 flex-shrink-0 bg-gray-200 overflow-hidden">
            <ImageWithFallback
              src={coverImage}
              alt={title}
              className="w-full h-full object-cover"
              fallbackIcon="📋"
              fallbackClassName="w-full h-full bg-gray-200"
              priority={priority}
              categorySlug={categorySlug}
              listSlug={resolvedListSlug}
              listTitle={listTitle ?? title}
              sizes="96px"
            />
          </div>
          <div className="flex-1 flex flex-col justify-center p-3 min-w-0">
            <h3 className="wibe-small font-semibold text-foreground line-clamp-2">{title}</h3>
            {description && (
              <p className="wibe-caption text-wibe-secondary line-clamp-1 mt-0.5">{description}</p>
            )}
            <ListCardStats saves={saves} itemCount={itemCount} variant="compact" className="mt-1" />
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={listHref} className="block active:scale-[0.99] transition-transform">
      <article className="bg-wibe-card rounded-lg overflow-hidden border border-wibe shadow-card">
        <div className="relative h-40 bg-gray-200 overflow-hidden">
          <ImageWithFallback
            src={coverImage}
            alt={title}
            className="w-full h-full object-cover"
            fallbackIcon="📋"
            fallbackClassName="w-full h-full bg-gray-200"
            priority={priority}
            categorySlug={categorySlug}
            listSlug={resolvedListSlug}
            listTitle={listTitle ?? title}
            sizes="(min-width: 1024px) 50vw, 100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          {badge && (
            <span
              className={`absolute top-2 right-2 wibe-caption font-semibold px-2 py-0.5 rounded-pill ${badgeStyles[badge]}`}
            >
              {badgeLabels[badge]}
            </span>
          )}
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <h3 className="wibe-small font-semibold text-white line-clamp-2">{title}</h3>
            <ListCardStats saves={saves} itemCount={itemCount} variant="overlay" className="mt-1" />
          </div>
        </div>
        {description && (
          <div className="p-3 pt-2">
            <p className="wibe-small text-wibe-secondary line-clamp-2">{description}</p>
          </div>
        )}
      </article>
    </Link>
  );
}
