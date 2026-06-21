'use client';

import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';

type InterestTrackingEvent = {
  type: 'list_view' | 'category_view';
  categorySlug?: string | null;
  listId?: string;
  keywords?: string[];
};

const DEDUP_MS = 30 * 60 * 1000;

function dedupKey(event: InterestTrackingEvent): string | null {
  const slug = event.categorySlug ?? '';
  const kw = (event.keywords ?? []).slice(0, 3).join(',');
  if (!slug && !kw && !event.listId) return null;
  return `wibe-interest:${event.type}:${slug}:${event.listId ?? ''}:${kw}`;
}

function shouldSkip(key: string): boolean {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return false;
    const ts = Number(raw);
    return Number.isFinite(ts) && Date.now() - ts < DEDUP_MS;
  } catch {
    return false;
  }
}

function markSent(key: string): void {
  try {
    sessionStorage.setItem(key, String(Date.now()));
  } catch {
    // ignore
  }
}

export function useInterestTracking(event: InterestTrackingEvent): void {
  const { data: session, status } = useSession();
  const sentRef = useRef<string | null>(null);

  useEffect(() => {
    if (status !== 'authenticated' || !session?.user?.id) return;
    if (!event.categorySlug && !event.listId && !(event.keywords?.length)) return;

    const key = dedupKey(event);
    if (!key || sentRef.current === key) return;
    if (shouldSkip(key)) {
      sentRef.current = key;
      return;
    }

    sentRef.current = key;
    markSent(key);

    void fetch('/api/user/interest-events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: event.type,
        categorySlug: event.categorySlug ?? undefined,
        listId: event.listId,
        keywords: event.keywords,
      }),
    }).catch(() => {});
  }, [status, session?.user?.id, event.type, event.categorySlug, event.listId, event.keywords]);
}
