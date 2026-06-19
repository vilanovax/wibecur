'use client';

import Link from 'next/link';
import { trackHomeSectionClick, type HomeSectionId } from '@/lib/analytics';

interface HomeSectionTitleProps {
  title: string;
  subtitle?: string;
  icon?: string;
  id?: string;
  actionHref?: string;
  actionLabel?: string;
  /** برای analytics — کلیک «همه» */
  analyticsSection?: HomeSectionId;
}

/** عنوان یکسان بخش‌های Home — Wibe Design System */
export default function HomeSectionTitle({
  title,
  subtitle,
  icon,
  id,
  actionHref,
  actionLabel = 'همه',
  analyticsSection,
}: HomeSectionTitleProps) {
  return (
    <div className="mb-3 flex items-start justify-between gap-3 px-4 lg:mb-4 lg:items-center lg:px-0" id={id}>
      <div className="min-w-0">
        <h2 className="flex items-center gap-2 wibe-h3">
          {icon ? <span aria-hidden>{icon}</span> : null}
          {title}
        </h2>
        {subtitle ? <p className="mt-0.5 wibe-small text-wibe-secondary">{subtitle}</p> : null}
      </div>
      {actionHref ? (
        <Link
          href={actionHref}
          onClick={() => {
            if (analyticsSection) {
              trackHomeSectionClick(analyticsSection, { target: 'see_all' });
            }
          }}
          className="shrink-0 wibe-caption font-semibold text-primary hover:underline lg:text-sm"
        >
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
