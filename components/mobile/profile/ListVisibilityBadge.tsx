'use client';

import { Globe, Lock, FilePenLine } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

type Variant = 'public' | 'private' | 'draft';

const CONFIG: Record<
  Variant,
  { label: string; icon: typeof Globe; className: string }
> = {
  public: {
    label: 'عمومی',
    icon: Globe,
    className: 'bg-success/10 text-success ring-success/25',
  },
  private: {
    label: 'شخصی',
    icon: Lock,
    className: 'bg-muted text-muted-foreground ring-border',
  },
  draft: {
    label: 'پیش‌نویس',
    icon: FilePenLine,
    className: 'bg-warning/15 text-foreground ring-warning/30',
  },
};

export function getListVisibilityVariant(list: {
  isPublic?: boolean;
  isActive?: boolean;
}): Variant {
  if (list.isActive === false) return 'draft';
  return list.isPublic ? 'public' : 'private';
}

export default function ListVisibilityBadge({
  variant,
  size = 'sm',
  /** وقتی فیلتر/زمینه «عمومی» است، بج عمومی را مخفی کن تا تکرار نشود */
  hideWhenPublic = false,
}: {
  variant: Variant;
  size?: 'sm' | 'md';
  hideWhenPublic?: boolean;
}) {
  if (hideWhenPublic && variant === 'public') return null;
  const { label, icon: Icon, className } = CONFIG[variant];
  const tone = variant === 'public' ? 'success' : variant === 'draft' ? 'warning' : 'secondary';
  return (
    <Badge
      variant={tone}
      className={`gap-1 rounded-full font-semibold ring-1 ${className} ${
        size === 'md' ? 'min-h-11 px-3 text-sm' : 'px-2 py-0.5 wibe-caption'
      }`}
    >
      <Icon className={size === 'md' ? 'h-3.5 w-3.5' : 'h-3 w-3'} aria-hidden />
      {label}
    </Badge>
  );
}
