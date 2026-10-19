'use client';

import Link from 'next/link';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import LazyItemCoverImage from '@/components/shared/LazyItemCoverImage';
import { PERSON_ROLE_META, type PersonPageData } from '@/lib/people';

const PREVIEW_ITEM_LIMIT = 12;

function displayRating(rating: number | null): string | null {
  if (rating == null || Number(rating) === 0) return null;
  return String(rating);
}

export default function PersonPagePreview({ data }: { data: PersonPageData }) {
  const roleMeta = PERSON_ROLE_META[data.role];
  const visibleItems = data.items.slice(0, PREVIEW_ITEM_LIMIT);
  const hiddenCount = Math.max(0, data.items.length - visibleItems.length);
  const isDraft = data.profileStatus === 'draft';

  return (
    <div className="bg-[#f4f5f7] dark:bg-gray-950" dir="rtl">
      <div className="mx-auto max-w-lg px-4 py-5 sm:max-w-none sm:px-6 sm:py-6">
        {/* پروفایل */}
        <section className="rounded-2xl border border-gray-200/80 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900 sm:p-5">
          <div className="flex items-start gap-4">
            <div className="h-[4.5rem] w-[4.5rem] shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-violet-100 to-violet-50 ring-1 ring-violet-100 dark:from-violet-950/40 dark:to-violet-900/20 dark:ring-violet-900/40">
              {data.imageUrl ? (
                <ImageWithFallback
                  src={data.imageUrl}
                  alt={data.displayName}
                  className="h-full w-full object-cover"
                  fallbackIcon={roleMeta.icon}
                  fallbackClassName="flex h-full w-full items-center justify-center text-3xl"
                />
              ) : (
                <div
                  className="flex h-full w-full items-center justify-center text-3xl"
                  aria-hidden
                >
                  {roleMeta.icon}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1 text-right">
              <div className="flex flex-wrap items-center justify-end gap-1.5">
                <span className="rounded-md bg-violet-100 px-2 py-0.5 text-[11px] font-medium text-violet-800 dark:bg-violet-900/40 dark:text-violet-200">
                  {roleMeta.label}
                </span>
                {isDraft && (
                  <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
                    پیش‌نویس
                  </span>
                )}
                {data.bioIsStub && (
                  <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-[var(--color-text-muted)] dark:bg-gray-800 dark:text-[var(--color-text-subtle)]">
                    bio پیش‌فرض
                  </span>
                )}
              </div>
              <h1 className="mt-1.5 text-xl font-bold leading-tight text-[var(--color-text)] dark:text-white sm:text-2xl">
                {data.displayName}
              </h1>
              <p className="mt-1 text-xs text-[var(--color-text-muted)] dark:text-[var(--color-text-subtle)]">
                {data.items.length.toLocaleString('fa-IR')} آیتم در وایب
              </p>
              {data.externalUrl && (
                <a
                  href={data.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1.5 inline-block max-w-full truncate text-xs font-medium text-violet-600 hover:underline dark:text-violet-400"
                  dir="ltr"
                >
                  {data.externalUrl.replace(/^https?:\/\//, '')}
                </a>
              )}
            </div>
          </div>

          {data.bio && (
            <p
              className={`mt-4 border-t border-gray-100 pt-4 text-right text-sm leading-[1.85] whitespace-pre-line dark:border-gray-800 ${
                data.bioIsStub ? 'text-[var(--color-text-muted)] dark:text-[var(--color-text-subtle)]' : 'text-[var(--color-text)] dark:text-gray-200'
              }`}
            >
              {data.bio}
            </p>
          )}
        </section>

        {/* آیتم‌ها */}
        <section className="mt-5">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-[var(--color-text)] dark:text-white">آیتم‌ها در وایب</h2>
            {hiddenCount > 0 && (
              <span className="text-[11px] text-[var(--color-text-muted)] dark:text-[var(--color-text-subtle)]">
                +{hiddenCount.toLocaleString('fa-IR')} آیتم دیگر
              </span>
            )}
          </div>

          {visibleItems.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-10 text-center dark:border-gray-700 dark:bg-gray-900">
              <p className="text-sm text-[var(--color-text-muted)]">آیتمی برای این نام پیدا نشد</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 sm:gap-3 lg:grid-cols-5">
              {visibleItems.map((item) => {
                const ratingLabel = displayRating(item.rating);
                return (
                  <Link
                    key={item.id}
                    href={`/items/${item.id}`}
                    target="_blank"
                    className="group overflow-hidden rounded-lg border border-gray-200/80 bg-white shadow-sm transition hover:border-violet-200 hover:shadow-md dark:border-gray-700 dark:bg-gray-900 dark:hover:border-violet-800"
                  >
                    <div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
                      <LazyItemCoverImage
                        itemId={item.id}
                        title={item.title}
                        imageUrl={item.displayImageUrl || item.imageUrl}
                        categorySlug={item.categorySlug}
                        fallbackIcon={item.categoryIcon ?? '📋'}
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                        fallbackClassName="absolute inset-0 h-full w-full"
                        coverLayout="default"
                      />
                      <div
                        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent"
                        aria-hidden
                      />
                      <div className="absolute inset-x-0 bottom-0 p-2">
                        <p className="line-clamp-2 text-[11px] font-semibold leading-snug text-white drop-shadow">
                          {item.title}
                        </p>
                        {ratingLabel && (
                          <p className="mt-0.5 text-[10px] text-white/80">⭐ {ratingLabel}</p>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
