'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { Sparkles } from 'lucide-react';
import { useSession } from 'next-auth/react';
import Toast from '@/components/shared/Toast';
import { dispatchProfilePicksUpdated } from '@/lib/profile-events';
import {
  invalidateItemViewerState,
  useItemViewerState,
} from '@/hooks/useItemViewerState';

interface ItemProfilePickButtonProps {
  itemId: string;
  catalogItemId?: string | null;
  variant?: 'default' | 'hero' | 'compact';
}

export default function ItemProfilePickButton({
  itemId,
  catalogItemId: catalogItemIdProp,
  variant = 'default',
}: ItemProfilePickButtonProps) {
  const { status } = useSession();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [loading, setLoading] = useState(false);

  const { data: viewerState, isLoading: viewerLoading } = useItemViewerState(itemId, {
    enabled: status === 'authenticated',
  });

  const loginHref = `/login?callbackUrl=${encodeURIComponent(pathname || `/items/${itemId}`)}`;
  const isHero = variant === 'hero';
  const isCompact = variant === 'compact';
  const pickState = viewerState?.profilePick;
  const isPicked = pickState?.isPicked ?? false;
  const canPick = pickState?.canPick ?? !!catalogItemIdProp;

  if (status === 'unauthenticated') {
    if (isCompact) return null;
    return (
      <Link
        href={loginHref}
        className={`inline-flex h-11 items-center gap-1.5 rounded-control px-3 text-sm font-medium ${
          isHero
            ? 'border border-background/30 bg-background/15 text-background'
            : 'border border-border bg-popover text-foreground'
        }`}
      >
        <Sparkles className="h-4 w-4" />
        منتخب پروفایل
      </Link>
    );
  }

  if (status === 'loading' || (status === 'authenticated' && viewerLoading && !viewerState)) {
    return (
      <div
        className={`animate-pulse rounded-control bg-muted ${isCompact ? 'size-11' : 'h-11 w-28'}`}
        aria-hidden
      />
    );
  }

  if (!canPick) return null;

  const handleToggle = async () => {
    if (loading) return;
    setLoading(true);
    try {
      if (isPicked && pickState?.pickId) {
        const res = await fetch(`/api/user/profile-picks/${pickState.pickId}`, {
          method: 'DELETE',
        });
        const json = await res.json();
        if (!json.success) {
          setToast({ message: json.error || 'خطا', type: 'error' });
          return;
        }
        setToast({ message: 'از لیست بهترین‌های شما حذف شد', type: 'success' });
      } else {
        const cid = pickState?.catalogItemId ?? catalogItemIdProp;
        if (!cid) return;
        const res = await fetch('/api/user/profile-picks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ catalogItemId: cid }),
        });
        const json = await res.json();
        if (!json.success) {
          setToast({ message: json.error || 'خطا', type: 'error' });
          return;
        }
        setToast({ message: 'به لیست بهترین‌های شما در پروفایل اضافه شد', type: 'success' });
      }
      dispatchProfilePicksUpdated();
      invalidateItemViewerState(queryClient, itemId);
    } catch {
      setToast({ message: 'خطا در ارتباط', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (isCompact) {
    return (
      <>
        <button
          type="button"
          onClick={handleToggle}
          disabled={loading}
          className={`relative flex size-11 items-center justify-center rounded-full disabled:opacity-50 ${
            isPicked
              ? 'bg-brand text-brand-foreground'
              : isHero
                ? 'border border-background/30 bg-background/15'
                : 'border border-border bg-popover text-muted-foreground'
          }`}
          aria-label={isPicked ? 'حذف از منتخب‌های پروفایل' : 'افزودن به منتخب‌های پروفایل'}
          title={isPicked ? 'در منتخب‌های پروفایل' : 'افزودن به منتخب‌های پروفایل'}
        >
          <Sparkles
            className={`size-5 ${isPicked ? 'fill-brand-foreground text-brand-foreground' : isHero ? 'text-background' : 'text-muted-foreground'}`}
          />
        </button>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={handleToggle}
        disabled={loading}
        className={`inline-flex h-11 items-center gap-1.5 rounded-control px-3 text-sm font-semibold disabled:opacity-50 ${
          isPicked
            ? 'bg-brand text-brand-foreground'
            : isHero
              ? 'border border-background/30 bg-background/15 text-background'
              : 'border border-brand/30 bg-brand/5 text-brand'
        }`}
      >
        <Sparkles className={`h-4 w-4 ${isPicked ? 'fill-current' : ''}`} />
        {isPicked ? 'در منتخب‌های من' : 'افزودن به منتخب‌ها'}
      </button>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}
