import Link from 'next/link';
import type { ReactNode } from 'react';

export type WibeEmptyAction = {
  label: string;
  href?: string;
  onClick?: () => void;
};

type WibeEmptyStateProps = {
  icon?: ReactNode;
  title: string;
  description?: string;
  primaryAction?: WibeEmptyAction;
  secondaryAction?: WibeEmptyAction;
  tertiaryAction?: WibeEmptyAction;
  className?: string;
  /** dashed card (default) | plain centered */
  variant?: 'card' | 'plain';
  /** کلاس حلقه آیکن — پیش‌فرض primary */
  iconToneClassName?: string;
};

function ActionControl({
  action,
  tone,
}: {
  action: WibeEmptyAction;
  tone: 'primary' | 'link' | 'muted';
}) {
  const className =
    tone === 'primary'
      ? 'inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 wibe-small font-semibold text-white shadow-sm transition-colors hover:bg-primary-dark active:scale-[0.98]'
      : tone === 'link'
        ? 'wibe-caption font-medium text-primary transition-colors hover:underline'
        : 'wibe-caption font-medium text-wibe-secondary transition-colors hover:text-foreground hover:underline';

  if (action.href) {
    return (
      <Link href={action.href} onClick={action.onClick} className={className}>
        {action.label}
      </Link>
    );
  }

  return (
    <button type="button" onClick={action.onClick} className={className}>
      {action.label}
    </button>
  );
}

/**
 * Empty state استاندارد Consumer — توکن‌های wibe، بدون gray خام / pill قدیمی.
 */
export default function WibeEmptyState({
  icon,
  title,
  description,
  primaryAction,
  secondaryAction,
  tertiaryAction,
  className = '',
  variant = 'card',
  iconToneClassName = 'bg-primary/10 text-primary',
}: WibeEmptyStateProps) {
  const shell =
    variant === 'card'
      ? 'rounded-2xl border border-dashed border-wibe bg-wibe-card/60 px-4 py-12 text-center lg:py-14'
      : 'px-4 py-12 text-center lg:py-14';

  return (
    <div className={`${shell} ${className}`}>
      {icon != null ? (
        <div
          className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full [&_svg]:h-7 [&_svg]:w-7 ${iconToneClassName}`}
        >
          {typeof icon === 'string' ? (
            <span className="text-2xl leading-none" aria-hidden>
              {icon}
            </span>
          ) : (
            icon
          )}
        </div>
      ) : null}

      <h3 className="text-balance wibe-h3 text-foreground">{title}</h3>

      {description ? (
        <p className="mx-auto mt-2 max-w-xs text-pretty wibe-small leading-relaxed text-wibe-secondary">
          {description}
        </p>
      ) : null}

      {(primaryAction || secondaryAction || tertiaryAction) && (
        <div className="mt-5 flex flex-col items-center gap-2.5">
          {primaryAction ? <ActionControl action={primaryAction} tone="primary" /> : null}
          {secondaryAction ? <ActionControl action={secondaryAction} tone="link" /> : null}
          {tertiaryAction ? <ActionControl action={tertiaryAction} tone="muted" /> : null}
        </div>
      )}
    </div>
  );
}
