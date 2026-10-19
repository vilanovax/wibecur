import Link from 'next/link';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';

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
  if (tone === 'primary' && action.href) {
    return (
      <Link
        href={action.href}
        onClick={action.onClick}
        className="inline-flex h-12 items-center justify-center rounded-xl bg-brand px-6 text-base font-semibold text-brand-foreground"
      >
        {action.label}
      </Link>
    );
  }

  if (tone === 'primary') {
    return (
      <Button variant="brand" size="lg" className="rounded-xl" onClick={action.onClick}>
        {action.label}
      </Button>
    );
  }

  const className =
    tone === 'link'
      ? 'text-sm font-medium text-primary transition-colors hover:underline'
      : 'text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:underline';

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
  const Glyph = () => (
    <span className={iconToneClassName}>
      {typeof icon === 'string' ? (
        <span className="text-2xl leading-none" aria-hidden>
          {icon}
        </span>
      ) : (
        icon
      )}
    </span>
  );

  const actions =
    primaryAction || secondaryAction || tertiaryAction ? (
      <div className="flex flex-col items-center gap-2.5">
        {primaryAction ? <ActionControl action={primaryAction} tone="primary" /> : null}
        {secondaryAction ? <ActionControl action={secondaryAction} tone="link" /> : null}
        {tertiaryAction ? <ActionControl action={tertiaryAction} tone="muted" /> : null}
      </div>
    ) : undefined;

  return (
    <EmptyState
      className={cn(variant === 'plain' && 'border-0 bg-transparent shadow-none', className)}
      icon={icon != null ? Glyph : undefined}
      title={title}
      description={description}
      action={actions}
    />
  );
}
