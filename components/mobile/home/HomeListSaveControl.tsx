'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Bookmark } from 'lucide-react';
import {
  track,
  listAnalyticsPayload,
  trackFirstBookmark,
} from '@/lib/analytics';

type HomeListSaveControlProps = {
  listId: string;
  listSlug?: string;
  categorySlug?: string | null;
  saveCount?: number;
  initialIsBookmarked?: boolean;
  /** روی تصویر تیره (هیرو / کارت) */
  surface?: 'overlay' | 'hero';
  analyticsSource?: string;
  className?: string;
};

/**
 * کنترل ذخیرهٔ فشرده برای کارت/هیرو خانه — stopPropagation تا لینک والد باز نشود.
 */
export default function HomeListSaveControl({
  listId,
  listSlug,
  categorySlug,
  saveCount = 0,
  initialIsBookmarked = false,
  surface = 'overlay',
  analyticsSource = 'home_card',
  className = '',
}: HomeListSaveControlProps) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [isBookmarked, setIsBookmarked] = useState(initialIsBookmarked);
  const [isLoading, setIsLoading] = useState(false);

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

  const shell =
    surface === 'hero'
      ? 'flex h-10 w-10 items-center justify-center rounded-full border shadow-sm backdrop-blur-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 disabled:opacity-50'
      : 'flex h-8 w-8 items-center justify-center rounded-full border shadow-sm backdrop-blur-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 disabled:opacity-50';

  const shellTone = isBookmarked
    ? 'border-primary/40 bg-primary text-white hover:bg-primary-dark'
    : 'border-white/25 bg-black/45 text-white hover:bg-black/60';

  const iconClass = surface === 'hero' ? 'h-4 w-4' : 'h-3.5 w-3.5';

  if (status === 'loading') {
    return <span className={`${shell} animate-pulse border-white/20 bg-black/30 ${className}`} aria-hidden />;
  }

  if (!session?.user) {
    return (
      <Link
        href={loginHref}
        onClick={(e) => e.stopPropagation()}
        className={`${shell} border-white/25 bg-black/45 text-white hover:bg-black/60 ${className}`}
        aria-label="ورود برای ذخیره لیست"
      >
        <Bookmark className={iconClass} strokeWidth={1.75} />
      </Link>
    );
  }

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isLoading) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/lists/${listId}/bookmark`, { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        setIsBookmarked(data.data.isBookmarked);
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
      }
    } catch {
      // silent — UI stays on previous state
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isLoading}
      className={`${shell} ${shellTone} ${className}`}
      aria-label={isBookmarked ? 'حذف از ذخیره‌ها' : 'ذخیره این لیست'}
      aria-pressed={isBookmarked}
    >
      <Bookmark
        className={`${iconClass} ${isBookmarked ? 'fill-current' : ''}`}
        strokeWidth={1.75}
        aria-hidden
      />
      <span className="sr-only">{saveCount > 0 ? `${saveCount} ذخیره` : null}</span>
    </button>
  );
}
