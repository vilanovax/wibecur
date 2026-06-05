'use client';

import { useEffect, useState } from 'react';
import { isValidCategorySlug } from '@/lib/admin/category-intelligence';

export type SlugCheckState =
  | { status: 'idle' }
  | { status: 'checking' }
  | { status: 'available'; slug: string }
  | { status: 'taken'; slug: string; existingName?: string; suggestion?: string | null }
  | { status: 'invalid'; slug: string };

const DEBOUNCE_MS = 400;

export function useCategorySlugCheck(
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

    if (!isValidCategorySlug(normalized)) {
      setState({ status: 'invalid', slug: normalized });
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      setState({ status: 'checking' });
      try {
        const qs = new URLSearchParams({ slug: normalized });
        if (excludeId) qs.set('excludeId', excludeId);
        const res = await fetch(`/api/admin/categories/check-slug?${qs}`);
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
            existingName: data.existingName,
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

  const isSlugOk =
    state.status === 'available' ||
    state.status === 'idle' ||
    state.status === 'checking';

  const isSlugBlocked = state.status === 'taken' || state.status === 'invalid';

  return { state, isSlugOk, isSlugBlocked };
}
