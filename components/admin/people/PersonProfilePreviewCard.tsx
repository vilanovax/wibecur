'use client';

import ImageWithFallback from '@/components/shared/ImageWithFallback';
import { PERSON_ROLE_META, type PersonRole } from '@/lib/people';

export type PersonProfilePreviewProps = {
  role: PersonRole;
  slug: string;
  displayName: string;
  bio: string;
  imageUrl?: string | null;
  externalUrl?: string | null;
  status?: 'draft' | 'published';
  itemCount?: number;
  compact?: boolean;
};

export default function PersonProfilePreviewCard({
  role,
  displayName,
  bio,
  imageUrl,
  externalUrl,
  status = 'published',
  itemCount,
  compact = false,
}: PersonProfilePreviewProps) {
  const roleMeta = PERSON_ROLE_META[role];
  const published = status === 'published';

  return (
    <div
      className={`rounded-2xl border border-wibe bg-wibe-card shadow-sm ${
        compact ? 'p-4' : 'p-5'
      }`}
      dir="rtl"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="text-[11px] font-medium text-violet-600">پیش‌نمایش صفحه سایت</span>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
            published
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200'
              : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200'
          }`}
        >
          {published ? 'منتشر' : 'پیش‌نویس'}
        </span>
      </div>

      <div className="flex items-start gap-3">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 ring-1 ring-primary/10">
          {imageUrl ? (
            <ImageWithFallback
              src={imageUrl}
              alt={displayName}
              className="h-full w-full object-cover"
              fallbackIcon={roleMeta.icon}
              fallbackClassName="flex h-full w-full items-center justify-center text-3xl"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-3xl" aria-hidden>
              {roleMeta.icon}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1 text-right">
          <p className="text-xs font-medium text-wibe-secondary">{roleMeta.label}</p>
          <h3 className="mt-0.5 text-lg font-bold text-foreground leading-tight">{displayName}</h3>
          {itemCount != null && itemCount > 0 && (
            <p className="mt-1 text-xs text-wibe-secondary">
              {itemCount.toLocaleString('fa-IR')} آیتم در وایب
            </p>
          )}
          {externalUrl && (
            <p className="mt-1 truncate text-[11px] text-primary" dir="ltr">
              {externalUrl}
            </p>
          )}
        </div>
      </div>

      {bio && (
        <p className="mt-4 border-t border-wibe/60 pt-3 text-right text-sm leading-relaxed text-foreground/85 whitespace-pre-line">
          {bio}
        </p>
      )}

      <div className="mt-4 rounded-xl border border-dashed border-wibe/80 bg-wibe-surface/50 px-3 py-4 text-center">
        <p className="text-xs text-wibe-secondary">گرید آیتم‌های مرتبط در صفحه عمومی</p>
        <div className="mt-2 grid grid-cols-4 gap-1.5 opacity-40">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="aspect-[2/3] rounded-md bg-gray-200 dark:bg-gray-700" />
          ))}
        </div>
      </div>
    </div>
  );
}
