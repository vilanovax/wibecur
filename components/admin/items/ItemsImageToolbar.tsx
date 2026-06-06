'use client';

import { Link2, Loader2, Film } from 'lucide-react';

type ItemsImageToolbarProps = {
  showTools: boolean;
  showOmdb?: boolean;
  wrappingProxy: boolean;
  refreshingOmdb?: boolean;
  onOpenS3: () => void;
  onWrapProxy: () => void;
  onOmdbRefresh?: () => void;
};

export default function ItemsImageToolbar({
  showTools,
  showOmdb = false,
  wrappingProxy,
  refreshingOmdb = false,
  onOpenS3,
  onWrapProxy,
  onOmdbRefresh,
}: ItemsImageToolbarProps) {
  if (!showTools && !showOmdb) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {showTools && (
        <div
          className="inline-flex overflow-hidden rounded-xl border border-gray-200 bg-gray-50/80 p-0.5"
          role="group"
          aria-label="ابزار تصویر"
        >
          <button
            type="button"
            onClick={onOpenS3}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-amber-900 transition-colors hover:bg-amber-100"
            title="آپلود تصاویر خارجی به ParsPack (S3)"
          >
            <Link2 className="h-3.5 w-3.5" />
            S3
          </button>
          <span className="my-1.5 w-px self-stretch bg-gray-200" aria-hidden />
          <button
            type="button"
            onClick={onWrapProxy}
            disabled={wrappingProxy}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-sky-900 transition-colors hover:bg-sky-100 disabled:opacity-50"
            title="wrap با castando proxy"
          >
            {wrappingProxy ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <span aria-hidden>🔗</span>
            )}
            پراکسی
          </button>
        </div>
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
