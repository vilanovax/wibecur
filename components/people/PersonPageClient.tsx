'use client';

import { useState } from 'react';
import Link from 'next/link';
import LazyItemCoverImage from '@/components/shared/LazyItemCoverImage';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import PageBreadcrumb from '@/components/shared/PageBreadcrumb';
import JsonLdBreadcrumb from '@/components/shared/JsonLdBreadcrumb';
import { uiBreadcrumbToSchema } from '@/lib/breadcrumb-schema';
import { MOBILE_SHELL_MAX_WIDTH_CLASS } from '@/lib/layout-tokens';
import { PERSON_ROLE_META, type PersonPageData } from '@/lib/people';

type PersonPageClientProps = PersonPageData;

function displayRating(rating: number | null): string | null {
  if (rating == null || Number(rating) === 0) return null;
  return String(rating);
}

export default function PersonPageClient({
  role,
  slug,
  displayName,
  bio,
  bioIsStub,
  imageUrl,
  externalUrl,
  items,
}: PersonPageClientProps) {
  const roleMeta = PERSON_ROLE_META[role];
  const [bioExpanded, setBioExpanded] = useState(false);
  const canTruncateBio = !bioIsStub && (bio?.length ?? 0) > 220;
  const shownBio =
    canTruncateBio && !bioExpanded ? `${bio!.slice(0, 220).trim()}…` : bio;

  const breadcrumbItems = [
    { label: 'خانه', href: '/' },
    { label: roleMeta.pluralLabel, href: '/search' },
    { label: displayName },
  ];

  return (
    <main className={`${MOBILE_SHELL_MAX_WIDTH_CLASS} mx-auto px-4 pb-10 pt-3 lg:px-0 lg:pt-4`}>
      <JsonLdBreadcrumb items={uiBreadcrumbToSchema(breadcrumbItems)} />
      <PageBreadcrumb className="mb-4" items={breadcrumbItems} />

      <section className="mb-6 rounded-2xl border border-wibe bg-wibe-card p-5 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 ring-1 ring-primary/10">
            {imageUrl ? (
              <ImageWithFallback
                src={imageUrl}
                alt={displayName}
                className="h-full w-full object-cover"
                fallbackIcon={roleMeta.icon}
                fallbackClassName="flex h-full w-full items-center justify-center text-4xl"
              />
            ) : (
              <div
                className="flex h-full w-full items-center justify-center text-4xl"
                aria-hidden
              >
                {roleMeta.icon}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1 text-right">
            <p className="wibe-caption font-medium text-wibe-secondary">{roleMeta.label}</p>
            <h1 className="mt-1 wibe-h2 font-bold text-foreground">{displayName}</h1>
            <p className="mt-1 wibe-caption text-wibe-secondary">
              {items.length.toLocaleString('fa-IR')} آیتم در وایب
            </p>
            {externalUrl && (
              <a
                href={externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex wibe-caption font-medium text-primary hover:underline"
              >
                منبع خارجی
              </a>
            )}
          </div>
        </div>

        {bio && (
          <div className="mt-4 border-t border-wibe/60 pt-4">
            <p
              className={`text-right text-[0.9375rem] leading-[1.75] whitespace-pre-line ${
                bioIsStub ? 'text-wibe-secondary' : 'text-foreground/85'
              }`}
            >
              {shownBio}
            </p>
            {canTruncateBio && (
              <button
                type="button"
                onClick={() => setBioExpanded((v) => !v)}
                className="mt-2 text-sm font-medium text-primary"
              >
                {bioExpanded ? 'کمتر' : 'بیشتر'}
              </button>
            )}
          </div>
        )}
      </section>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-wibe px-6 py-14 text-center">
          <p className="wibe-body text-wibe-secondary">آیتمی برای این نام پیدا نشد</p>
        </div>
      ) : (
        <section aria-label={`آیتم‌های ${displayName}`}>
          <h2 className="mb-3 wibe-body font-semibold text-foreground">آیتم‌ها در وایب</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {items.map((item) => {
              const ratingLabel = displayRating(item.rating);
              return (
                <Link
                  key={item.id}
                  href={`/items/${item.id}`}
                  className="group overflow-hidden rounded-xl border border-wibe bg-wibe-card shadow-sm transition-all hover:border-primary/20 hover:shadow-md"
                >
                  <div className="relative aspect-[2/3] w-full bg-gray-100">
                    <LazyItemCoverImage
                      itemId={item.id}
                      title={item.title}
                      imageUrl={item.displayImageUrl || item.imageUrl}
                      categorySlug={item.categorySlug}
                      fallbackIcon={item.categoryIcon ?? '📋'}
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                      fallbackClassName="absolute inset-0 h-full w-full"
                      coverLayout="grid"
                    />
                    <div
                      className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent"
                      aria-hidden
                    />
                    <div className="absolute inset-x-0 bottom-0 p-2.5 text-white">
                      <h3 className="line-clamp-2 wibe-small font-semibold leading-snug drop-shadow-sm">
                        {item.title}
                      </h3>
                      {ratingLabel ? (
                        <p className="mt-1 wibe-caption text-white/85">⭐ {ratingLabel}</p>
                      ) : null}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}
