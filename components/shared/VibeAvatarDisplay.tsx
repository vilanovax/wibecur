'use client';

import Image from 'next/image';
import type { VibeAvatarOption } from '@/lib/vibe-avatars';

interface VibeAvatarDisplayProps {
  avatar: VibeAvatarOption;
  size?: number;
  className?: string;
  selected?: boolean;
  locked?: boolean;
}

export default function VibeAvatarDisplay({
  avatar,
  size = 56,
  className = '',
  selected = false,
  locked = false,
}: VibeAvatarDisplayProps) {
  return (
    <div
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-wibe-surface ${
        avatar.premium ? 'ring-2 ring-amber-400/50 shadow-md shadow-amber-500/10' : 'ring-1 ring-black/[0.06]'
      } ${selected ? 'ring-2 ring-primary ring-offset-2 ring-offset-white' : ''} ${
        locked ? 'opacity-45 grayscale-[0.4]' : ''
      } ${className}`}
      style={{ width: size, height: size }}
    >
      <Image
        src={avatar.imageSrc}
        alt={avatar.label}
        width={size}
        height={size}
        className="h-full w-full object-cover"
        draggable={false}
      />
    </div>
  );
}
