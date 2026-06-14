'use client';

import { Instagram, MapPin, Phone } from 'lucide-react';
import type { ListItemQuickAction, ListItemQuickActionKey } from '@/lib/list-item-quick-actions';

const ICONS: Record<ListItemQuickActionKey, typeof Phone> = {
  phone: Phone,
  maps: MapPin,
  instagram: Instagram,
};

interface ListItemQuickActionsProps {
  actions: ListItemQuickAction[];
  layout?: 'horizontal' | 'vertical';
  size?: 'sm' | 'md';
  className?: string;
}

export default function ListItemQuickActions({
  actions,
  layout = 'horizontal',
  size = 'sm',
  className = '',
}: ListItemQuickActionsProps) {
  if (actions.length === 0) return null;

  const btnClass =
    size === 'sm'
      ? 'flex h-8 w-8 items-center justify-center rounded-lg border border-wibe bg-wibe-surface text-wibe-secondary transition-colors hover:border-primary/30 hover:bg-primary/5 hover:text-primary active:scale-95'
      : 'flex h-9 w-9 items-center justify-center rounded-xl border border-wibe bg-wibe-surface text-wibe-secondary transition-colors hover:border-primary/30 hover:bg-primary/5 hover:text-primary active:scale-95';

  const containerClass =
    layout === 'vertical'
      ? `flex flex-col gap-1.5 ${className}`
      : `flex flex-wrap items-center gap-1.5 ${className}`;

  return (
    <div className={containerClass} role="group" aria-label="عملیات سریع">
      {actions.map((action) => {
        const Icon = ICONS[action.key];
        const external = !action.href.startsWith('tel:');

        return (
          <a
            key={action.key}
            href={action.href}
            target={external ? '_blank' : undefined}
            rel={external ? 'noopener noreferrer' : undefined}
            aria-label={action.ariaLabel}
            title={action.label}
            onClick={(e) => e.stopPropagation()}
            className={btnClass}
          >
            <Icon className={size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'} aria-hidden />
          </a>
        );
      })}
    </div>
  );
}
