'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { BookOpen, Clapperboard, ExternalLink, Languages, Star, UserRound } from 'lucide-react';
import LazyItemCoverImage from '@/components/shared/LazyItemCoverImage';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import PageBreadcrumb from '@/components/shared/PageBreadcrumb';
import JsonLdBreadcrumb from '@/components/shared/JsonLdBreadcrumb';
import { uiBreadcrumbToSchema } from '@/lib/breadcrumb-schema';
import { MOBILE_SHELL_MAX_WIDTH_CLASS } from '@/lib/layout-tokens';
import { PERSON_ROLE_META, type PersonPageData, type PersonRole } from '@/lib/people';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';

type PersonPageClientProps = PersonPageData;

const ROLE_ICON = {
  director: Clapperboard,
  actor: UserRound,
  author: BookOpen,
  translator: Languages,
} as const;

function isMostlyLatin(value: string): boolean {
  const letters = value.replace(/[^\p{L}]/gu, '');
  if (!letters) return false;
  const latin = letters.replace(/[^\p{Script=Latin}]/gu, '');
  return latin.length / letters.length > 0.5;
}

function formatRating(rating: number | null): string | null {
  if (rating == null || Number(rating) <= 0) return null;
  return Number(rating).toLocaleString('fa-IR', { maximumFractionDigits: 1 });
}

function averageRating(items: PersonPageData['items']): number | null {
  const rated = items.filter((item) => item.rating != null && Number(item.rating) > 0);
  if (rated.length === 0) return null;
  const sum = rated.reduce((acc, item) => acc + Number(item.rating), 0);
  return Math.round((sum / rated.length) * 10) / 10;
}

function worksLead(role: PersonRole): string {
  switch (role) {
    case 'director':
      return 'فیلم‌هایی با کارگردانی';
    case 'actor':
      return 'آثاری با بازی';
    case 'author':
      return 'کتاب‌ها و آثاری با نویسندگی';
    case 'translator':
      return 'آثاری با ترجمهٔ';
  }
}

function PersonName({
  name,
  className = '',
}: {
  name: string;
  className?: string;
}) {
  const latin = isMostlyLatin(name);
  return (
    <bdi dir={latin ? 'ltr' : undefined} className={className}>
      {name}
    </bdi>
  );
}

function PersonAvatar({
  imageUrl,
  displayName,
  roleIcon,
}: {
  imageUrl: string | null;
  displayName: string;
  roleIcon: string;
}) {
  return (
    <div className="relative size-20 shrink-0 overflow-hidden rounded-2xl bg-muted ring-1 ring-border lg:aspect-[3/4] lg:h-auto lg:w-52 xl:w-56">
      {imageUrl ? (
        <ImageWithFallback
          src={imageUrl}
          alt={displayName}
          className="h-full w-full object-cover"
          fallbackIcon={roleIcon}
          fallbackClassName="flex h-full w-full items-center justify-center text-4xl"
          priority
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-4xl" aria-hidden>
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
  const WorksIcon = ROLE_ICON[role];
  const [bioExpanded, setBioExpanded] = useState(false);
  const avgRating = averageRating(items);
  const canTruncateBio = !bioIsStub && (bio?.length ?? 0) > 220;

  const breadcrumbItems = [
    { label: 'خانه', href: '/' },
    { label: roleMeta.label },
    { label: displayName },
  ];

  const identity = (
    <div className="min-w-0 text-start">
      <span className="inline-flex h-8 items-center rounded-full bg-brand/10 px-3 wibe-caption font-semibold text-brand">
        {roleMeta.label}
      </span>
      <h1 className="mt-2 wibe-h2">
        <PersonName name={displayName} />
      </h1>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <StatChip icon={WorksIcon}>
          {items.length.toLocaleString('fa-IR')} آیتم در وایب
        </StatChip>
        {avgRating != null ? (
          <StatChip icon={Star}>
            میانگین {avgRating.toLocaleString('fa-IR')}
          </StatChip>
        ) : null}
        {externalUrl ? (
          <a
            href={externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 items-center gap-1.5 rounded-full border border-border bg-popover px-3 text-sm font-medium text-foreground"
          >
            <ExternalLink className="size-4 shrink-0" strokeWidth={1.75} aria-hidden />
            منبع خارجی
          </a>
        ) : null}
      </div>
    </div>
  );

  const bioBlock = bio ? (
    <BioBlock
      bio={bio}
      bioIsStub={bioIsStub}
      canTruncate={canTruncateBio}
      expanded={bioExpanded}
      onToggle={() => setBioExpanded((value) => !value)}
    />
  ) : null;

  return (
    <main
      className={`${MOBILE_SHELL_MAX_WIDTH_CLASS} mx-auto w-full px-4 pb-8 pt-2 lg:max-w-5xl lg:px-0 lg:pb-10 lg:pt-4`}
    >
      <JsonLdBreadcrumb items={uiBreadcrumbToSchema(breadcrumbItems)} />
      <PageBreadcrumb className="mb-3 lg:mb-4" items={breadcrumbItems} />

      <Card className="mb-6 overflow-hidden bg-popover p-4 lg:mb-8 lg:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-8">
          <PersonAvatar
            imageUrl={imageUrl}
            displayName={displayName}
            roleIcon={roleMeta.icon}
          />
          <div className="min-w-0 flex-1">
            {identity}
            {bioBlock ? <div className="mt-4 border-t border-border pt-4">{bioBlock}</div> : null}
          </div>
        </div>
      </Card>

      {items.length === 0 ? (
        <EmptyState
          title="آیتمی برای این نام پیدا نشد"
          description="هنوز اثری با این نام در لیست‌های وایب نیست."
        />
      ) : (
        <section aria-label={`آیتم‌های ${displayName}`}>
          <div className="mb-3">
            <h2 className="wibe-h3">آیتم‌ها در وایب</h2>
            <p className="mt-1 wibe-small">
              {worksLead(role)} <PersonName name={displayName} /> در لیست‌های وایب
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-4">
            {items.map((item) => {
              const ratingLabel = formatRating(item.rating);
              return (
                <Link key={item.id} href={`/items/${item.id}`} className="block min-w-0">
                  <Card className="h-full overflow-hidden bg-popover p-0">
                    <div className="relative aspect-[2/3] w-full bg-muted">
                      <LazyItemCoverImage
                        itemId={item.id}
                        title={item.title}
                        imageUrl={item.displayImageUrl || item.imageUrl}
                        categorySlug={item.categorySlug}
                        fallbackIcon={item.categoryIcon ?? '📋'}
                        className="absolute inset-0 h-full w-full object-cover"
                        fallbackClassName="absolute inset-0 h-full w-full"
                        coverLayout="grid"
                      />
                    </div>
                    <div className="space-y-1 p-3">
                      <h3 className="line-clamp-2 text-small font-semibold text-foreground">
                        <PersonName name={item.title} />
                      </h3>
                      {ratingLabel ? (
                        <p className="flex items-center gap-1 wibe-caption text-muted-foreground">
                          <Star className="size-4 shrink-0 fill-warning text-warning" strokeWidth={1.5} aria-hidden />
                          <span className="tabular-nums">{ratingLabel}</span>
                        </p>
                      ) : null}
                    </div>
                  </Card>
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
  icon?: typeof Clapperboard;
}) {
  return (
    <span className="inline-flex h-11 items-center gap-1.5 rounded-full border border-border bg-muted px-3 text-sm font-medium text-foreground">
      {Icon ? <Icon className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.75} aria-hidden /> : null}
      {children}
    </span>
  );
}

function BioBlock({
  bio,
  bioIsStub,
  canTruncate,
  expanded,
  onToggle,
}: {
  bio: string;
  bioIsStub: boolean;
  canTruncate: boolean;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div>
      <h2 className="mb-1 wibe-caption font-medium text-muted-foreground">درباره</h2>
      <p
        className={`whitespace-pre-line text-start text-body ${
          bioIsStub ? 'text-muted-foreground' : 'text-foreground'
        } ${canTruncate && !expanded ? 'line-clamp-4' : ''}`}
      >
        {bio}
      </p>
      {canTruncate ? (
        <Button type="button" variant="ghost" className="mt-1 h-11 px-0 text-brand" onClick={onToggle}>
          {expanded ? 'نمایش کمتر' : 'ادامهٔ بیوگرافی'}
        </Button>
      ) : null}
    </div>
  );
}
