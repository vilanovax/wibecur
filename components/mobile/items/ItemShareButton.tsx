'use client';

import { useState } from 'react';
import { Share2 } from 'lucide-react';
import Toast from '@/components/shared/Toast';

type ItemShareButtonProps = {
  title: string;
  className?: string;
  iconClassName?: string;
};

export default function ItemShareButton({
  title,
  className,
  iconClassName = 'h-3.5 w-3.5 lg:h-4 lg:w-4',
}: ItemShareButtonProps) {
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(
    null
  );

  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    if (!url) return;

    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({ title, url });
        return;
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
      }
    }

    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        setToast({ message: 'لینک کپی شد ✨', type: 'success' });
        return;
      }
    } catch {
      /* fall through */
    }

    setToast({ message: 'اشتراک‌گذاری ممکن نشد', type: 'error' });
  };

  return (
    <>
      <button
        type="button"
        onClick={handleShare}
        className={className}
        aria-label="اشتراک‌گذاری"
      >
        <Share2 className={iconClassName} />
      </button>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          duration={2500}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}
