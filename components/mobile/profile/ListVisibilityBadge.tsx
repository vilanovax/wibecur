'use client';

import { Globe, Lock, FilePenLine } from 'lucide-react';

type Variant = 'public' | 'private' | 'draft';

const CONFIG: Record<
  Variant,
  { label: string; icon: typeof Globe; className: string }
> = {
  public: {
    label: 'عمومی',
    icon: Globe,
    className: 'bg-emerald-50 text-emerald-800 ring-emerald-200/80',
  },
  private: {
    label: 'شخصی',
    icon: Lock,
    className: 'bg-slate-100 text-slate-700 ring-slate-200/80',
  },
  draft: {
    label: 'پیش‌نویس',
    icon: FilePenLine,
    className: 'bg-amber-50 text-amber-800 ring-amber-200/80',
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
}: {
  variant: Variant;
  size?: 'sm' | 'md';
}) {
  const { label, icon: Icon, className } = CONFIG[variant];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-semibold ring-1 ${className} ${
        size === 'md' ? 'px-2.5 py-1 text-xs' : 'px-2 py-0.5 wibe-caption'
      }`}
    >
      <Icon className={size === 'md' ? 'h-3.5 w-3.5' : 'h-3 w-3'} aria-hidden />
      {label}
    </span>
  );
}
