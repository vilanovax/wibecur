'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/card';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import ListCardStats from '@/components/shared/ListCardStats';
import { LIST_BADGE_LABELS, listBadgeSolidStyles } from '@/lib/list-badge-styles';
import { normalizeCoverDisplayMode } from '@/lib/admin/category-form-constants';

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
  /** ui | baked | photo — از تنظیمات دسته */
  coverDisplayMode?: string | null;
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
  coverDisplayMode,
}: ListCardProps) {
  const listHref = `/lists/${slug ?? id}`;
  const resolvedListSlug = listSlug ?? slug;
  const coverMode = normalizeCoverDisplayMode(coverDisplayMode);
  const showCoverScrim = coverMode === 'ui';
  const showCoverTitle = coverMode === 'ui';
  const showTitleBelow = coverMode === 'photo';

  if (variant === 'compact') {
    return (
      <Link href={listHref} className="block active:scale-[0.99] transition-transform">
        <Card className="flex overflow-hidden bg-popover p-0 shadow-sm">
          <div className="relative h-24 w-24 shrink-0 overflow-hidden bg-muted">
            <ImageWithFallback
              src={coverImage}
              alt={title}
              className="w-full h-full object-cover"
              fallbackIcon="📋"
              fallbackClassName="w-full h-full bg-wibe-surface"
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
        </Card>
      </Link>
    );
  }

  return (
    <Link href={listHref} className="block active:scale-[0.99] transition-transform">
      <Card className="overflow-hidden bg-popover p-0 shadow-sm">
        <div className="relative h-40 overflow-hidden bg-muted">
          <ImageWithFallback
            src={coverImage}
            alt={title}
            className="h-full w-full object-cover"
            fallbackIcon="📋"
            fallbackClassName="h-full w-full bg-muted"
            priority={priority}
            categorySlug={categorySlug}
            listSlug={resolvedListSlug}
            listTitle={listTitle ?? title}
            sizes="(min-width: 1024px) 50vw, 100vw"
          />
          {showCoverScrim ? (
            <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />
          ) : null}
          {badge && (
            <span
              className={`absolute inset-e-2 top-2 rounded-full px-2 py-0.5 text-sm font-semibold ${badgeStyles[badge]}`}
            >
              {badgeLabels[badge]}
            </span>
          )}
          {showCoverTitle ? (
            <div className="absolute inset-x-0 bottom-0 p-3 text-start">
              <h3 className="line-clamp-2 wibe-small font-semibold text-background">{title}</h3>
              <ListCardStats saves={saves} itemCount={itemCount} variant="overlay" className="mt-1" />
            </div>
          ) : null}
        </div>
        {showTitleBelow ? (
          <div className="space-y-1 p-3 text-start">
            <h3 className="line-clamp-2 wibe-small font-semibold text-foreground">{title}</h3>
            <ListCardStats saves={saves} itemCount={itemCount} variant="compact" />
            {description ? (
              <p className="line-clamp-2 wibe-caption text-muted-foreground">{description}</p>
            ) : null}
          </div>
        ) : description ? (
          <div className="p-3 pt-2 text-start">
            <p className="line-clamp-2 wibe-small text-muted-foreground">{description}</p>
          </div>
        ) : null}
      </Card>
    </Link>
  );
}
