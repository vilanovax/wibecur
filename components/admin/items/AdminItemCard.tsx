'use client';

import Link from 'next/link';
import { Pencil, Trash2, ExternalLink } from 'lucide-react';
import AdminItemCardImage from '@/components/admin/items/AdminItemCardImage';
import {
  ADMIN_IMAGE_SOURCE_LABEL,
  ADMIN_IMAGE_SOURCE_STYLE,
  classifyAdminImageSource,
} from '@/lib/resolve-admin-display-image';

type ItemMetadata = Record<string, unknown>;

function asItemMetadata(value: unknown): ItemMetadata | null {
  if (value == null) return null;
  if (typeof value === 'object' && !Array.isArray(value)) {
    return value as ItemMetadata;
  }
  return null;
}

type AdminItemCardProps = {
  item: {
    id: string;
    title: string;
    description?: string | null;
    order: number;
    externalUrl?: string | null;
    metadata?: unknown;
    displayImageUrl?: string;
    item_moderation?: { status: string } | null;
    lists: {
      title: string;
      categories?: {
        slug?: string;
        icon?: string | null;
        color?: string | null;
      } | null;
    };
  };
  showListContext?: boolean;
  selectionMode?: boolean;
  isSelected?: boolean;
  isDeleting?: boolean;
  onToggleSelect?: () => void;
  onDelete?: () => void;
};

function MovieMetaChips({ metadata }: { metadata: ItemMetadata }) {
  const rating = metadata.imdbRating;
  const year = metadata.year;
  const genre = metadata.genre;

  if (!rating && !year && !genre) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {rating != null && rating !== '' && (
        <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800 ring-1 ring-amber-100">
          ⭐ {String(rating)}
        </span>
      )}
      {year != null && year !== '' && (
        <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-700">
          {String(year)}
        </span>
      )}
      {genre != null && genre !== '' && (
        <span className="inline-flex max-w-full truncate rounded-md bg-violet-50 px-2 py-0.5 text-[11px] font-medium text-violet-800 ring-1 ring-violet-100">
          {String(genre)}
        </span>
      )}
    </div>
  );
}

export default function AdminItemCard({
  item,
  showListContext = true,
  selectionMode = false,
  isSelected = false,
  isDeleting = false,
  onToggleSelect,
  onDelete,
}: AdminItemCardProps) {
  const isHidden = item.item_moderation?.status === 'HIDDEN';
  const categorySlug = item.lists.categories?.slug;
  const fallbackIcon = item.lists.categories?.icon || '📋';
  const rawImageUrl = item.displayImageUrl || '';
  const imageSource = classifyAdminImageSource(rawImageUrl);
  const metadata = asItemMetadata(item.metadata);

  return (
    <article
      className={`group relative flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${
        isSelected
          ? 'border-violet-400 ring-2 ring-violet-200'
          : 'border-gray-100 hover:border-gray-200'
      } ${isHidden ? 'opacity-80' : ''}`}
    >
      <Link
        href={`/admin/items/${item.id}/edit`}
        className="relative block aspect-[2/3] w-full overflow-hidden bg-gray-100"
      >
        {selectionMode && (
          <label
            className="absolute top-2.5 left-2.5 z-20 cursor-pointer"
            onClick={(e) => e.preventDefault()}
          >
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => {
                e.stopPropagation();
                onToggleSelect?.();
              }}
              className="h-5 w-5 rounded border-white/80 bg-white/90 text-violet-600 shadow-md focus:ring-violet-500"
            />
          </label>
        )}

        <span className="absolute top-2.5 right-2.5 z-20 rounded-lg bg-black/55 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
          #{item.order}
        </span>

        {isHidden && (
          <span className="absolute top-10 right-2.5 z-20 rounded-lg bg-gray-900/75 px-2 py-0.5 text-[10px] font-bold text-white">
            غیرفعال
          </span>
        )}

        {rawImageUrl && imageSource !== 'none' && (
          <span
            className={`absolute top-10 left-2.5 z-20 rounded-md px-1.5 py-0.5 text-[10px] font-bold backdrop-blur-sm ${ADMIN_IMAGE_SOURCE_STYLE[imageSource]}`}
          >
            {ADMIN_IMAGE_SOURCE_LABEL[imageSource]}
          </span>
        )}

        <AdminItemCardImage
          itemId={item.id}
          displaySrc={rawImageUrl}
          title={item.title}
          categorySlug={categorySlug}
          fallbackIcon={fallbackIcon}
          className="absolute inset-0 h-full w-full"
        />

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/80 via-black/35 to-transparent px-3 pb-3 pt-12">
          <h3 className="line-clamp-2 text-sm font-bold leading-snug text-white">
            {item.title}
          </h3>
        </div>

        <div className="absolute inset-0 z-10 flex items-center justify-center gap-2 bg-black/0 opacity-0 transition-all group-hover:bg-black/25 group-hover:opacity-100">
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-white/95 px-3 py-2 text-xs font-bold text-gray-900 shadow-lg">
            <Pencil className="h-3.5 w-3.5" />
            ویرایش
          </span>
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-2.5 p-3">
        {showListContext && (
          <div className="flex min-w-0 items-center gap-1.5 text-xs text-gray-500">
            <span>{fallbackIcon}</span>
            <span className="truncate font-medium">{item.lists.title}</span>
          </div>
        )}

        {metadata && (categorySlug === 'movie' || categorySlug === 'film' || categorySlug === 'movies') && (
          <MovieMetaChips metadata={metadata} />
        )}

        {item.description && (
          <p className="line-clamp-2 text-xs leading-relaxed text-gray-500">
            {item.description}
          </p>
        )}

        <div className="mt-auto flex items-center gap-2 pt-1">
          <Link
            href={`/admin/items/${item.id}/edit`}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gray-900 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-gray-800"
          >
            <Pencil className="h-3.5 w-3.5" />
            ویرایش
          </Link>

          {item.externalUrl && (
            <a
              href={item.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-gray-200 text-gray-600 transition-colors hover:bg-gray-50"
              title="اطلاعات بیشتر"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          )}

          {!selectionMode && onDelete && (
            <button
              type="button"
              onClick={onDelete}
              disabled={isDeleting}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-red-100 bg-red-50 text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
              title="حذف"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
