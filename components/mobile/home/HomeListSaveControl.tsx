'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useQueryClient } from '@tanstack/react-query';
import { Bookmark } from 'lucide-react';
import Toast from '@/components/shared/Toast';
import {
  track,
  listAnalyticsPayload,
  trackFirstBookmark,
} from '@/lib/analytics';
import { homeBookmarksQueryKey } from '@/hooks/useHomeBookmarks';

type HomeListSaveControlProps = {
  listId: string;
  listSlug?: string;
  categorySlug?: string | null;
  saveCount?: number;
  initialIsBookmarked?: boolean;
  /** روی تصویر تیره (هیرو / کارت) */
  surface?: 'overlay' | 'hero';
  /** compact = thumbnails / dense rows */
  size?: 'default' | 'compact';
  analyticsSource?: string;
  className?: string;
};

/**
 * کنترل ذخیرهٔ فشرده برای کارت/هیرو خانه — stopPropagation تا لینک والد باز نشود.
 * Optimistic toggle + toast روی خطا (کاربر با زدن دوباره retry می‌کند).
 */
export default function HomeListSaveControl({
  listId,
  listSlug,
  categorySlug,
  saveCount = 0,
  initialIsBookmarked = false,
  surface = 'overlay',
  size = 'default',
  analyticsSource = 'home_card',
  className = '',
}: HomeListSaveControlProps) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const [isBookmarked, setIsBookmarked] = useState(initialIsBookmarked);
  const [isLoading, setIsLoading] = useState(false);
  const [errorToast, setErrorToast] = useState<string | null>(null);

  const loginHref = `/login?callbackUrl=${encodeURIComponent(pathname || '/')}&source=bookmark_gate`;

  useEffect(() => {
    setIsBookmarked(initialIsBookmarked);
  }, [initialIsBookmarked, listId]);

  useEffect(() => {
    if (!session?.user || initialIsBookmarked) return;
    let cancelled = false;
    void fetch(`/api/lists/${listId}/bookmark-status`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && data.success) {
          setIsBookmarked(Boolean(data.data?.isBookmarked));
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [session?.user, listId, initialIsBookmarked]);

  const isCompact = size === 'compact';
  const shellSize = isCompact
    ? 'h-9 w-9'
    : surface === 'hero'
      ? 'h-11 w-11'
      : 'h-11 w-11 lg:h-9 lg:w-9';
  const shell = `relative z-20 flex ${shellSize} items-center justify-center rounded-full border shadow-md transition-[colors,transform] duration-150 ease-out active:scale-95 motion-reduce:transition-colors motion-reduce:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:opacity-50 ${
    surface === 'hero' ? 'backdrop-blur-md' : 'backdrop-blur-sm'
  }`;

  const shellTone = isBookmarked
    ? 'border-primary bg-primary text-white hover:bg-primary-dark'
    : 'border-white/80 bg-white/95 text-foreground hover:bg-white';

  const iconClass = isCompact || surface !== 'hero' ? 'h-3.5 w-3.5' : 'h-4 w-4';

  if (status === 'loading') {
    return (
      <span
        className={`${shell} animate-pulse border-white/50 bg-white/70 ${className}`}
        aria-hidden
      />
    );
  }

  if (!session?.user) {
    return (
      <Link
        href={loginHref}
        onClick={(e) => e.stopPropagation()}
        className={`${shell} border-white/80 bg-white/95 text-foreground hover:bg-white ${className}`}
        aria-label="ورود برای ذخیره لیست"
      >
        <Bookmark className={iconClass} strokeWidth={2} />
      </Link>
    );
  }

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isLoading) return;

    const previous = isBookmarked;
    const next = !previous;
    setIsBookmarked(next);
    setIsLoading(true);
    setErrorToast(null);

    try {
      const response = await fetch(`/api/lists/${listId}/bookmark`, { method: 'POST' });
      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        setIsBookmarked(previous);
        setErrorToast(
          next
            ? 'ذخیره نشد. برای تلاش دوباره روی نشانک بزن.'
            : 'حذف از ذخیره‌ها انجام نشد. دوباره تلاش کن.'
        );
        return;
      }

      setIsBookmarked(Boolean(data.data.isBookmarked));
      const payload = listAnalyticsPayload({
        listId,
        listSlug,
        categorySlug,
        source: analyticsSource,
      });
      track(data.data.isBookmarked ? 'list_bookmark' : 'list_unbookmark', payload);
      if (data.data.isBookmarked && data.data.isFirstBookmark) {
        trackFirstBookmark({
          list_slug: listSlug,
          category_slug: categorySlug ?? undefined,
          source: analyticsSource,
        });
      }
      void queryClient.invalidateQueries({
        queryKey: homeBookmarksQueryKey(session.user.id),
      });
    } catch {
      setIsBookmarked(previous);
      setErrorToast(
        next
          ? 'ذخیره نشد. برای تلاش دوباره روی نشانک بزن.'
          : 'حذف از ذخیره‌ها انجام نشد. دوباره تلاش کن.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleToggle}
        disabled={isLoading}
        className={`${shell} ${shellTone} ${className}`}
        aria-label={isBookmarked ? 'حذف از ذخیره‌ها' : 'ذخیره این لیست'}
        aria-pressed={isBookmarked}
        aria-busy={isLoading}
      >
        <Bookmark
          className={`${iconClass} ${isBookmarked ? 'fill-current' : ''}`}
          strokeWidth={1.75}
          aria-hidden
        />
        <span className="sr-only">{saveCount > 0 ? `${saveCount} ذخیره` : null}</span>
      </button>
      {errorToast ? (
        <Toast
          message={errorToast}
          type="error"
          duration={4500}
          onClose={() => setErrorToast(null)}
          className="bottom-24 lg:bottom-6"
        />
      ) : null}
    </>
  );
}
