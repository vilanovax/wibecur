'use client';

import { useEffect, useRef } from 'react';
import { ExternalLink } from 'lucide-react';
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
    'mx-2.5 my-2.5 rounded-2xl border border-wibe bg-wibe-card px-3.5 py-3 shadow-sm lg:mx-0 lg:my-3 lg:px-4',
  sidebar: 'rounded-xl border border-wibe bg-wibe-card p-3.5 shadow-sm',
  inline:
    'my-4 rounded-2xl border border-wibe bg-wibe-card px-4 py-3.5 shadow-sm lg:rounded-2xl lg:border lg:p-4',
};

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

  const ctaClass = isSidebar
    ? 'mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary/90 px-3 py-2 wibe-caption font-medium text-white transition-colors hover:bg-primary'
    : 'mt-2.5 inline-flex items-center gap-1 rounded-lg bg-primary/90 px-3 py-1.5 wibe-caption font-medium text-white transition-colors hover:bg-primary';

  return (
    <aside
      className={VARIANT_CLASS[variant]}
      aria-label="محتوای تبلیغاتی"
      data-sponsored-variant={variant}
    >
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

      {isPreview ? (
        <span className={`${ctaClass} cursor-default opacity-90`}>{placement.ctaLabel}</span>
      ) : (
        <a
          href={clickHref}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className={ctaClass}
        >
          {placement.ctaLabel}
          {!isSidebar ? <ExternalLink className="h-3 w-3 opacity-80" aria-hidden /> : null}
        </a>
      )}
    </aside>
  );
}
