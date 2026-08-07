'use client';

import {
  entryKindBadgeLabel,
  entryKindIcon,
  resolveEntryKind,
  type EntryKind,
} from '@/lib/list-entry';

const TONE: Record<EntryKind, string> = {
  tip: 'bg-amber-50 text-amber-900 ring-amber-200/80',
  fact: 'bg-violet-50 text-violet-900 ring-violet-200/80',
  link: 'bg-sky-50 text-sky-900 ring-sky-200/80',
  catalog_ref: 'bg-gray-100 text-[var(--color-text)] ring-gray-200/80',
};

type ItemLike = {
  catalogItemId?: string | null;
  metadata?: Record<string, unknown> | null;
  externalUrl?: string | null;
  imageUrl?: string | null;
};

export function resolveItemEntryKind(item: ItemLike): EntryKind {
  return resolveEntryKind(item);
}

type Props = {
  kind: EntryKind;
  compact?: boolean;
  className?: string;
};

export default function EntryKindBadge({ kind, compact = false, className = '' }: Props) {
  return (
    <span
      className={`inline-flex max-w-full items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold ring-1 ${TONE[kind]} ${className}`}
      title={entryKindBadgeLabel(kind)}
    >
      <span aria-hidden className="text-[11px] leading-none">
        {entryKindIcon(kind)}
      </span>
      {!compact && <span className="truncate">{entryKindBadgeLabel(kind)}</span>}
    </span>
  );
}
