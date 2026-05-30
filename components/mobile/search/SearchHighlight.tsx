'use client';

import { normalizeSearchQuery } from '@/lib/list-search';

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function splitTextByQuery(text: string, query: string): { text: string; match: boolean }[] {
  const q = normalizeSearchQuery(query);
  if (!q) return [{ text, match: false }];

  const regex = new RegExp(`(${escapeRegExp(q)})`, 'gi');
  const parts = text.split(regex).filter(Boolean);

  if (parts.length <= 1) return [{ text, match: false }];

  return parts.map((part) => ({
    text: part,
    match: part.toLowerCase() === q.toLowerCase(),
  }));
}

export default function SearchHighlight({
  text,
  query,
  className = '',
  highlightClassName = 'rounded-sm bg-primary/15 font-semibold text-primary',
}: {
  text: string;
  query: string;
  className?: string;
  highlightClassName?: string;
}) {
  const parts = splitTextByQuery(text, query);

  return (
    <span className={className}>
      {parts.map((part, index) =>
        part.match ? (
          <mark key={`${part.text}-${index}`} className={highlightClassName}>
            {part.text}
          </mark>
        ) : (
          <span key={`${part.text}-${index}`}>{part.text}</span>
        )
      )}
    </span>
  );
}
