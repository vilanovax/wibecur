'use client';

import { useEffect, useState } from 'react';
import { isValidListSlug } from '@/lib/admin/list-slug';

export type SlugCheckState =
  | { status: 'idle' }
  | { status: 'checking' }
  | { status: 'available'; slug: string }
  | { status: 'taken'; slug: string; existingTitle?: string; suggestion?: string | null }
  | { status: 'invalid'; slug: string };

const DEBOUNCE_MS = 400;

export function useListSlugCheck(
  slug: string,
  options?: { excludeId?: string; enabled?: boolean }
) {
  const enabled = options?.enabled !== false;
  const excludeId = options?.excludeId;
  const [state, setState] = useState<SlugCheckState>({ status: 'idle' });

  useEffect(() => {
    if (!enabled) {
      setState({ status: 'idle' });
      return;
    }

    const normalized = slug.trim().toLowerCase();
    if (!normalized) {
      setState({ status: 'idle' });
      return;
    }

    if (!isValidListSlug(normalized)) {
      setState({ status: 'invalid', slug: normalized });
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      setState({ status: 'checking' });
      try {
        const qs = new URLSearchParams({ slug: normalized });
        if (excludeId) qs.set('excludeId', excludeId);
        const res = await fetch(`/api/admin/lists/check-slug?${qs}`);
        const data = await res.json();
        if (cancelled) return;

        if (!res.ok) {
          setState({ status: 'idle' });
          return;
        }

        if (data.available) {
          setState({ status: 'available', slug: normalized });
        } else {
          setState({
            status: 'taken',
            slug: normalized,
            existingTitle: data.existingTitle,
            suggestion: data.suggestion ?? null,
          });
        }
      } catch {
        if (!cancelled) setState({ status: 'idle' });
      }
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [slug, excludeId, enabled]);

  const isSlugBlocked = state.status === 'taken' || state.status === 'invalid';

  return { state, isSlugBlocked };
}
