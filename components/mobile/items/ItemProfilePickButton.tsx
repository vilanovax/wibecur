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
        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 wibe-caption font-medium transition-colors ${
          isHero
            ? 'bg-white/15 text-white border border-white/30'
            : 'border border-wibe bg-wibe-card text-foreground hover:border-primary/30'
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
        className={`animate-pulse rounded-full bg-wibe-surface ${isCompact ? 'h-10 w-10' : 'h-9 w-28 rounded-lg'}`}
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
          className={`flex h-10 w-10 items-center justify-center rounded-full border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-50 ${
            isPicked
              ? 'border-primary bg-primary shadow-sm hover:bg-primary-dark'
              : isHero
                ? 'border-white/30 bg-white/15 backdrop-blur-sm hover:bg-white/25'
                : 'border-wibe bg-wibe-card hover:border-primary/40 hover:bg-primary/5'
          }`}
          aria-label={isPicked ? 'حذف از منتخب‌های پروفایل' : 'افزودن به منتخب‌های پروفایل'}
          title={isPicked ? 'در منتخب‌های پروفایل' : 'افزودن به منتخب‌های پروفایل'}
        >
          <Sparkles
            className={`h-4 w-4 ${isPicked ? 'fill-white text-white' : isHero ? 'text-white' : 'text-wibe-secondary'}`}
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
        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 wibe-caption font-semibold transition-colors disabled:opacity-50 active:scale-[0.98] ${
          isPicked
            ? 'bg-violet-600 text-white shadow-sm hover:bg-violet-700'
            : isHero
              ? 'bg-white/15 text-white border border-white/30 hover:bg-white/25'
              : 'border border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100'
        }`}
      >
        <Sparkles className={`h-4 w-4 ${isPicked ? 'fill-current' : ''}`} />
        {isPicked ? 'در منتخب‌های من' : 'افزودن به منتخب‌ها'}
      </button>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}
