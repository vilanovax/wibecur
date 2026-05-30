'use client';

import ImageWithFallback from '@/components/shared/ImageWithFallback';
import { isOurStorageUrl } from '@/lib/object-storage-config';

interface UserAvatarProps {
  src?: string | null;
  name?: string | null;
  email?: string | null;
  size?: number;
  className?: string;
  rounded?: 'full' | 'xl';
}

/** آواتار کاربر — Liara مستقیم، fallback به حرف اول */
export default function UserAvatar({
  src,
  name,
  email,
  size = 44,
  className = '',
  rounded = 'full',
}: UserAvatarProps) {
  const initial = (name || email || '?').charAt(0).toUpperCase();
  const roundedClass = rounded === 'xl' ? 'rounded-xl' : 'rounded-full';

  if (!src || !isOurStorageUrl(src)) {
    return (
      <div
        className={`${roundedClass} bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)] font-semibold shrink-0 ${className}`}
        style={{ width: size, height: size, fontSize: Math.round(size * 0.4) }}
      >
        {initial}
      </div>
    );
  }

  return (
    <div
      className={`${roundedClass} overflow-hidden shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <ImageWithFallback
        src={src}
        alt={name || email || 'Avatar'}
        className="object-cover w-full h-full"
        placeholderSize="square"
        fallbackIcon={initial}
        fallbackClassName={`w-full h-full bg-[var(--primary)]/10 text-[var(--primary)] font-semibold flex items-center justify-center ${roundedClass}`}
      />
    </div>
  );
}
