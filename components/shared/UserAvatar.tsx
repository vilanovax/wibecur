'use client';

import ImageWithFallback from '@/components/shared/ImageWithFallback';
import { resolveStorageImageDisplayUrl } from '@/lib/storage-image-url';

interface UserAvatarProps {
  src?: string | null;
  name?: string | null;
  email?: string | null;
  size?: number;
  className?: string;
  rounded?: 'full' | 'xl';
}

const SIZE_CLASSES: Record<number, string> = {
  32: 'w-8 h-8 text-[13px]',
  36: 'w-9 h-9 text-[14px]',
  44: 'w-11 h-11 text-[18px]',
  48: 'w-12 h-12 text-[19px]',
  64: 'w-16 h-16 text-[26px]',
};

function getSizeClass(size: number): string {
  return SIZE_CLASSES[size] ?? `w-[${size}px] h-[${size}px] text-[${Math.round(size * 0.4)}px]`;
}

/** آواتار کاربر — ParsPack proxy / legacy Liara via API / fallback حرف اول */
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
  const sizeClass = getSizeClass(size);
  const displaySrc = resolveStorageImageDisplayUrl(src);

  if (!displaySrc) {
    return (
      <div
        className={`${roundedClass} ${sizeClass} bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)] font-semibold shrink-0 ${className}`}
      >
        {initial}
      </div>
    );
  }

  return (
    <div className={`${roundedClass} ${sizeClass} overflow-hidden shrink-0 ${className}`}>
      <ImageWithFallback
        src={displaySrc}
        alt={name || email || 'Avatar'}
        className="object-cover w-full h-full"
        placeholderSize="square"
        fallbackIcon={initial}
        fallbackClassName={`w-full h-full bg-[var(--primary)]/10 text-[var(--primary)] font-semibold flex items-center justify-center ${roundedClass}`}
      />
    </div>
  );
}
