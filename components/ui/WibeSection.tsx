import { type ReactNode } from 'react';
import Link from 'next/link';
import SectionIcon, { type SectionIconVariant } from '@/components/shared/SectionIcon';

export type WibeSectionProps = {
  title: string;
  subtitle?: string;
  /** @deprecated use iconVariant */
  icon?: string;
  iconVariant?: SectionIconVariant;
  id?: string;
  actionHref?: string;
  actionLabel?: string;
  onActionClick?: () => void;
  children?: ReactNode;
  className?: string;
  headerClassName?: string;
};

/** Section header + optional body — Wibe Design System primitive */
export default function WibeSection({
  title,
  subtitle,
  icon,
  iconVariant,
  id,
  actionHref,
  actionLabel = 'همه',
  onActionClick,
  children,
  className = '',
  headerClassName = '',
}: WibeSectionProps) {
  return (
    <section id={id} className={className}>
      <div
        className={`mb-3 flex items-start justify-between gap-3 px-4 lg:mb-4 lg:items-center lg:px-0 ${headerClassName}`}
      >
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 wibe-h3">
            {iconVariant ? <SectionIcon variant={iconVariant} /> : null}
            {!iconVariant && icon ? <span aria-hidden>{icon}</span> : null}
            {title}
          </h2>
          {subtitle ? <p className="mt-0.5 wibe-small text-wibe-secondary">{subtitle}</p> : null}
        </div>
        {actionHref ? (
          <Link
            href={actionHref}
            onClick={onActionClick}
            className="shrink-0 wibe-caption font-semibold text-primary hover:underline lg:text-sm"
          >
            {actionLabel}
          </Link>
        ) : null}
      </div>
      {children}
    </section>
  );
}
