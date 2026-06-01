import Link from 'next/link';

interface HomeSectionTitleProps {
  title: string;
  subtitle?: string;
  icon?: string;
  id?: string;
  actionHref?: string;
  actionLabel?: string;
}

/** عنوان یکسان بخش‌های Home — Wibe Design System */
export default function HomeSectionTitle({
  title,
  subtitle,
  icon,
  id,
  actionHref,
  actionLabel = 'همه',
}: HomeSectionTitleProps) {
  return (
    <div className="mb-3 flex items-start justify-between gap-2 px-4" id={id}>
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
          className="shrink-0 pt-1 wibe-caption font-medium text-primary hover:underline"
        >
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
