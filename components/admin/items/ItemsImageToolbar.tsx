'use client';

import Link from 'next/link';
import { Link2, Loader2, Film, ImageIcon } from 'lucide-react';

type ItemsImageToolbarProps = {
  showTools: boolean;
  showOmdb?: boolean;
  showStorageImages?: boolean;
  storageImagesHref?: string;
  refreshingOmdb?: boolean;
  onOpenS3: () => void;
  onOmdbRefresh?: () => void;
};

export default function ItemsImageToolbar({
  showTools,
  showOmdb = false,
  showStorageImages = false,
  storageImagesHref = '/admin/catalog/storage-images',
  refreshingOmdb = false,
  onOpenS3,
  onOmdbRefresh,
}: ItemsImageToolbarProps) {
  if (!showTools && !showOmdb && !showStorageImages) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {showStorageImages && (
        <Link
          href={storageImagesHref}
          className="inline-flex items-center gap-1.5 rounded-xl border border-orange-300 bg-orange-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-orange-700"
          title="جستجوی Google و آپلود تصویر روی ParsPack"
        >
          <ImageIcon className="h-3.5 w-3.5" />
          تصاویر
        </Link>
      )}

      {showTools && (
        <button
          type="button"
          onClick={onOpenS3}
          className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900 transition-colors hover:bg-amber-100"
          title="آپلود تصاویر خارجی به ParsPack (S3)"
        >
          <Link2 className="h-3.5 w-3.5" />
          S3
        </button>
      )}

      {showOmdb && onOmdbRefresh && (
        <button
          type="button"
          onClick={onOmdbRefresh}
          disabled={refreshingOmdb}
          className="inline-flex items-center gap-1.5 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-900 transition-colors hover:bg-violet-100 disabled:opacity-50"
          title="جایگزینی تصاویر پراکسی با پوستر OMDb و ذخیره در ParsPack"
        >
          {refreshingOmdb ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Film className="h-3.5 w-3.5" />
          )}
          OMDb
        </button>
      )}
    </div>
  );
}
