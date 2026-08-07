'use client';

import { useEffect, useRef } from 'react';
import type { SponsoredPlacementPublic } from '@/lib/sponsored-placements';

export type SponsoredBannerVariant = 'banner' | 'sidebar' | 'inline';

type SponsoredTextBannerProps = {
  placement: SponsoredPlacementPublic;
  listId?: string;
  categoryId?: string;
  variant?: SponsoredBannerVariant;
};

const VARIANT_CLASS: Record<SponsoredBannerVariant, string> = {
  banner:
    'rounded-2xl border border-wibe bg-wibe-card px-3.5 py-3 shadow-sm lg:px-4',
  sidebar: 'rounded-xl border border-wibe bg-wibe-card p-3.5 shadow-sm',
  inline: 'rounded-2xl border border-wibe bg-wibe-card px-4 py-3.5 shadow-sm lg:rounded-2xl lg:border lg:p-4',
};

const STACK_CLASS: Record<SponsoredBannerVariant, string> = {
  banner: 'mx-2.5 my-2.5 space-y-3 lg:mx-0 lg:my-3',
  sidebar: 'space-y-3',
  inline: 'my-4 space-y-3',
};

type SponsoredPlacementStackProps = {
  placements: SponsoredPlacementPublic[];
  listId?: string;
  categoryId?: string;
  variant?: SponsoredBannerVariant;
  className?: string;
};

export function SponsoredPlacementStack({
  placements,
  listId,
  categoryId,
  variant = 'banner',
  className = '',
}: SponsoredPlacementStackProps) {
  if (placements.length === 0) return null;

  return (
    <div className={`${STACK_CLASS[variant]} ${className}`.trim()}>
      {placements.map((placement) => (
        <SponsoredTextBanner
          key={placement.id}
          placement={placement}
          listId={listId}
          categoryId={categoryId}
          variant={variant}
        />
      ))}
    </div>
  );
}

export default function SponsoredTextBanner({
  placement,
  listId,
  categoryId,
  variant = 'banner',
}: SponsoredTextBannerProps) {
  const sentRef = useRef(false);

  useEffect(() => {
    if (placement.id === 'preview') return;
    if (sentRef.current) return;
    const key = `wibe-sp-imp-${placement.id}`;
    try {
      if (sessionStorage.getItem(key)) {
        sentRef.current = true;
        return;
      }
      sessionStorage.setItem(key, '1');
    } catch {
      // ignore
    }
    sentRef.current = true;

    void fetch('/api/sponsored/impression', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ placementId: placement.id, listId, categoryId }),
    }).catch(() => {});
  }, [placement.id, listId, categoryId]);

  const clickHref =
    listId || categoryId
      ? `${placement.clickUrl}?${new URLSearchParams({
          ...(listId ? { listId } : {}),
          ...(categoryId ? { categoryId } : {}),
        }).toString()}`
      : placement.clickUrl;

  const isPreview = placement.id === 'preview';
  const isSidebar = variant === 'sidebar';

  const cardClass = `${VARIANT_CLASS[variant]} ${
    isPreview ? '' : 'block transition-colors hover:border-primary/30 hover:bg-primary/[0.02]'
  }`;

  const content = (
    <>
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="inline-flex items-center rounded-md bg-amber-100/90 px-2 py-0.5 text-[10px] font-semibold text-amber-900">
          {placement.disclosureLabel}
        </span>
        {placement.sponsorName ? (
          <span className="truncate text-[10px] text-wibe-secondary">{placement.sponsorName}</span>
        ) : null}
      </div>

      <h3
        className={`font-bold text-foreground ${isSidebar ? 'wibe-small leading-snug' : 'wibe-body'}`}
      >
        {placement.headline}
      </h3>

      {placement.bodyText ? (
        <p
          className={`mt-1 text-wibe-secondary ${isSidebar ? 'wibe-caption line-clamp-3' : 'wibe-small line-clamp-2'}`}
        >
          {placement.bodyText}
        </p>
      ) : null}
    </>
  );

  if (isPreview) {
    return (
      <aside
        className={cardClass}
        aria-label="محتوای تبلیغاتی"
        data-sponsored-variant={variant}
      >
        {content}
      </aside>
    );
  }

  return (
    <a
      href={clickHref}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className={cardClass}
      aria-label={`${placement.headline} — ${placement.disclosureLabel}`}
      data-sponsored-variant={variant}
    >
      {content}
    </a>
  );
}
