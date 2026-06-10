'use client';

import { ExternalLink } from 'lucide-react';
import {
  entryKindBadgeLabel,
  entryKindIcon,
  FACT_TYPE_LABELS,
  type EntryKind,
  type FactType,
} from '@/lib/list-entry';
import { buildLightweightDisplayBody } from '@/lib/item-metadata-display';

export type LightweightEntryItem = {
  id: string;
  title: string;
  description?: string | null;
  externalUrl?: string | null;
  listNote?: string | null;
  metadata?: Record<string, unknown> | null;
};

type Props = {
  item: LightweightEntryItem;
  index: number;
  entryKind: EntryKind;
  onOpen?: () => void;
  compact?: boolean;
  /** لایف‌استایل: بدون آیکن و برچسب «نکته / داده» */
  hideEntryKindChrome?: boolean;
};

function factTypeLabel(metadata?: Record<string, unknown> | null): string | null {
  const raw = metadata?.factType;
  if (typeof raw !== 'string') return null;
  return FACT_TYPE_LABELS[raw as FactType] ?? raw;
}

export default function LightweightEntryRow({
  item,
  index,
  entryKind,
  onOpen,
  compact = false,
  hideEntryKindChrome = false,
}: Props) {
  const body = buildLightweightDisplayBody(item, {
    lifestyleMode: hideEntryKindChrome,
  });
  const headline = item.title?.trim();
  const factLabel = entryKind === 'fact' ? factTypeLabel(item.metadata) : null;
  const hasLink = Boolean(item.externalUrl?.trim());
  const Wrapper = onOpen ? 'button' : 'div';

  return (
    <Wrapper
      type={onOpen ? 'button' : undefined}
      onClick={onOpen}
      className={`flex w-full items-start gap-3 rounded-xl border border-wibe bg-wibe-card text-right shadow-sm transition-all ${
        compact ? 'p-2.5' : hideEntryKindChrome ? 'p-3.5 lg:p-4' : 'p-3 lg:p-3.5'
      } ${onOpen ? 'active:scale-[0.99] lg:hover:border-primary/15 lg:hover:shadow-sm' : ''}`}
    >
      <div
        className={`flex shrink-0 items-center justify-center rounded-full bg-gray-100 wibe-caption font-semibold text-wibe-secondary tabular-nums ${
          hideEntryKindChrome
            ? 'mt-0.5 h-6 w-6 text-[0.6875rem] lg:h-7 lg:w-7'
            : 'h-7 w-7 lg:h-8 lg:w-8'
        }`}
      >
        {(index + 1).toLocaleString('fa-IR')}
      </div>

      {!hideEntryKindChrome && (
        <div
          className={`flex shrink-0 items-center justify-center rounded-xl bg-amber-50/80 text-lg ring-1 ring-amber-200/60 ${
            compact ? 'h-10 w-10' : 'h-11 w-11 lg:h-12 lg:w-12'
          }`}
          aria-hidden
        >
          {entryKindIcon(entryKind)}
        </div>
      )}

      <div className="min-w-0 flex-1">
        {!hideEntryKindChrome && (
          <div className="mb-1 flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 wibe-caption font-medium text-wibe-secondary">
              {entryKindBadgeLabel(entryKind)}
            </span>
            {factLabel && (
              <span className="inline-flex items-center rounded-md bg-violet-50 px-2 py-0.5 wibe-caption font-medium text-violet-700">
                {factLabel}
              </span>
            )}
          </div>
        )}

        {headline && (
          <h3
            className={`line-clamp-2 font-semibold text-foreground ${
              hideEntryKindChrome
                ? 'text-[0.9375rem] leading-snug lg:text-base'
                : compact
                  ? 'wibe-small'
                  : 'wibe-small lg:text-[0.9375rem] lg:leading-snug'
            }`}
          >
            {headline}
          </h3>
        )}

        {body && (
          <p
            className={`text-wibe-secondary whitespace-pre-line ${
              headline
                ? hideEntryKindChrome
                  ? 'mt-1.5 line-clamp-4'
                  : 'mt-1 line-clamp-3'
                : hideEntryKindChrome
                  ? 'line-clamp-5'
                  : 'line-clamp-4'
            } ${compact ? 'wibe-caption' : 'wibe-small leading-relaxed'}`}
          >
            {body}
          </p>
        )}

        {hasLink && (
          <span className="mt-2 inline-flex items-center gap-1 wibe-caption font-medium text-primary">
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            {entryKind === 'link' ? 'باز کردن لینک' : 'لینک مرتبط'}
          </span>
        )}
      </div>
    </Wrapper>
  );
}
