'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { ExternalLink, Film } from 'lucide-react';
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

function averageRating(items: PersonPageData['items']): number | null {
  const rated = items.filter((item) => item.rating != null && Number(item.rating) > 0);
  if (rated.length === 0) return null;
  const sum = rated.reduce((acc, item) => acc + Number(item.rating), 0);
  return Math.round((sum / rated.length) * 10) / 10;
}

function PersonAvatar({
  imageUrl,
  displayName,
  roleIcon,
  size = 'mobile',
}: {
  imageUrl: string | null;
  displayName: string;
  roleIcon: string;
  size?: 'mobile' | 'desktop';
}) {
  const isDesktop = size === 'desktop';

  return (
    <div
      className={
        isDesktop
          ? 'relative mx-auto aspect-[3/4] w-full max-w-[13.5rem] overflow-hidden rounded-2xl bg-gradient-to-br from-primary/12 via-primary/5 to-transparent shadow-lg ring-1 ring-primary/15 xl:max-w-[15rem]'
          : 'h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 ring-1 ring-primary/10'
      }
    >
      {imageUrl ? (
        <ImageWithFallback
          src={imageUrl}
          alt={displayName}
          className="h-full w-full object-cover"
          fallbackIcon={roleIcon}
          fallbackClassName="flex h-full w-full items-center justify-center text-4xl lg:text-6xl"
          priority={isDesktop}
        />
      ) : (
        <div
          className={`flex h-full w-full items-center justify-center ${
            isDesktop ? 'text-6xl xl:text-7xl' : 'text-4xl'
          }`}
          aria-hidden
        >
          {roleIcon}
        </div>
      )}
    </div>
  );
}

export default function PersonPageClient({
  role,
  displayName,
  bio,
  bioIsStub,
  imageUrl,
  externalUrl,
  items,
}: PersonPageClientProps) {
  const roleMeta = PERSON_ROLE_META[role];
  const [bioExpanded, setBioExpanded] = useState(false);
  const avgRating = averageRating(items);
  const canTruncateBio = !bioIsStub && (bio?.length ?? 0) > 320;
  const shownBio =
    canTruncateBio && !bioExpanded ? `${bio!.slice(0, 320).trim()}…` : bio;

  const breadcrumbItems = [
    { label: 'خانه', href: '/' },
    { label: roleMeta.pluralLabel, href: '/search' },
    { label: displayName },
  ];

  return (
    <main
      className={`${MOBILE_SHELL_MAX_WIDTH_CLASS} mx-auto w-full px-4 pb-10 pt-3 lg:max-w-[920px] lg:px-6 lg:pb-12 lg:pt-5 xl:max-w-[980px]`}
    >
      <JsonLdBreadcrumb items={uiBreadcrumbToSchema(breadcrumbItems)} />
      <PageBreadcrumb className="mb-4 lg:mb-5" items={breadcrumbItems} />

      <section className="mb-8 overflow-hidden rounded-2xl border border-wibe bg-wibe-card shadow-sm lg:rounded-3xl lg:shadow-md">
        {/* موبایل */}
        <div className="p-5 lg:hidden">
          <div className="flex items-start gap-4">
            <PersonAvatar
              imageUrl={imageUrl}
              displayName={displayName}
              roleIcon={roleMeta.icon}
              size="mobile"
            />
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
              <BioBlock
                bio={shownBio}
                bioIsStub={bioIsStub}
                canTruncateBio={canTruncateBio}
                bioExpanded={bioExpanded}
                onToggle={() => setBioExpanded((v) => !v)}
              />
            </div>
          )}
        </div>

        {/* دسکتاپ */}
        <div className="hidden lg:block">
          <div className="bg-gradient-to-bl from-primary/[0.07] via-primary/[0.02] to-transparent px-8 pb-6 pt-8">
            <div className="grid grid-cols-[minmax(0,13.5rem)_minmax(0,1fr)] items-start gap-8 xl:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] xl:gap-10">
              <PersonAvatar
                imageUrl={imageUrl}
                displayName={displayName}
                roleIcon={roleMeta.icon}
                size="desktop"
              />

              <div className="min-w-0 pt-1 text-right">
                <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  {roleMeta.label}
                </span>
                <h1 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-foreground xl:text-[2.125rem]">
                  {displayName}
                </h1>

                <div className="mt-4 flex flex-wrap items-center justify-start gap-2">
                  <StatChip icon={Film}>
                    {items.length.toLocaleString('fa-IR')} آیتم در وایب
                  </StatChip>
                  {avgRating != null && (
                    <StatChip>میانگین امتیاز ⭐ {avgRating.toLocaleString('fa-IR')}</StatChip>
                  )}
                  {externalUrl && (
                    <a
                      href={externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full border border-wibe bg-wibe-surface px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:border-primary/30 hover:bg-primary/5"
                    >
                      <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      <span>منبع خارجی</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          {bio && (
            <div className="border-t border-wibe/60 px-8 py-7">
              <h2 className="mb-3 text-sm font-semibold text-wibe-secondary">درباره</h2>
              <BioBlock
                bio={shownBio}
                bioIsStub={bioIsStub}
                canTruncateBio={canTruncateBio}
                bioExpanded={bioExpanded}
                onToggle={() => setBioExpanded((v) => !v)}
                desktop
              />
            </div>
          )}
        </div>
      </section>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-wibe px-6 py-14 text-center lg:py-20">
          <p className="wibe-body text-wibe-secondary">آیتمی برای این نام پیدا نشد</p>
        </div>
      ) : (
        <section aria-label={`آیتم‌های ${displayName}`}>
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <h2 className="wibe-body font-semibold text-foreground lg:text-lg">آیتم‌ها در وایب</h2>
              <p className="mt-0.5 hidden text-sm text-wibe-secondary lg:block">
                فیلم‌ها و آثاری که {displayName} در لیست‌های وایب حضور دارد
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-wibe-surface px-2.5 py-1 text-xs font-medium text-wibe-secondary ring-1 ring-wibe/80">
              {items.length.toLocaleString('fa-IR')} مورد
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-4 xl:grid-cols-5">
            {items.map((item) => {
              const ratingLabel = displayRating(item.rating);
              return (
                <Link
                  key={item.id}
                  href={`/items/${item.id}`}
                  className="group overflow-hidden rounded-xl border border-wibe bg-wibe-card shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md lg:rounded-2xl"
                >
                  <div className="relative aspect-[2/3] w-full bg-gray-100">
                    <LazyItemCoverImage
                      itemId={item.id}
                      title={item.title}
                      imageUrl={item.displayImageUrl || item.imageUrl}
                      categorySlug={item.categorySlug}
                      fallbackIcon={item.categoryIcon ?? '📋'}
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                      fallbackClassName="absolute inset-0 h-full w-full"
                      coverLayout="grid"
                    />
                    <div
                      className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent"
                      aria-hidden
                    />
                    <div className="absolute inset-x-0 bottom-0 p-2.5 text-white lg:p-3">
                      <h3 className="line-clamp-2 wibe-small font-semibold leading-snug drop-shadow-sm lg:text-sm">
                        {item.title}
                      </h3>
                      {ratingLabel ? (
                        <p className="mt-1 wibe-caption text-white/90 lg:text-xs">⭐ {ratingLabel}</p>
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

function StatChip({
  children,
  icon: Icon,
}: {
  children: ReactNode;
  icon?: typeof Film;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-wibe bg-wibe-surface/90 px-3 py-1.5 text-xs font-medium text-foreground/85 backdrop-blur-sm">
      {Icon ? <Icon className="h-3.5 w-3.5 shrink-0 text-wibe-secondary" aria-hidden /> : null}
      {children}
    </span>
  );
}

function BioBlock({
  bio,
  bioIsStub,
  canTruncateBio,
  bioExpanded,
  onToggle,
  desktop = false,
}: {
  bio: string | null | undefined;
  bioIsStub: boolean;
  canTruncateBio: boolean;
  bioExpanded: boolean;
  onToggle: () => void;
  desktop?: boolean;
}) {
  if (!bio) return null;

  return (
    <>
      <p
        className={`text-right whitespace-pre-line ${
          desktop
            ? 'max-w-3xl text-base leading-[1.95] xl:max-w-none xl:text-[1.0625rem] xl:leading-[2]'
            : 'text-[0.9375rem] leading-[1.75]'
        } ${bioIsStub ? 'text-wibe-secondary' : 'text-foreground/88'}`}
      >
        {bio}
      </p>
      {canTruncateBio && (
        <button
          type="button"
          onClick={onToggle}
          className="mt-3 text-sm font-medium text-primary transition-colors hover:text-primary/80"
        >
          {bioExpanded ? 'نمایش کمتر' : 'ادامهٔ بیوگرافی'}
        </button>
      )}
    </>
  );
}
