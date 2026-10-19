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
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted ${
        avatar.premium ? 'ring-2 ring-warning/40' : 'ring-1 ring-border'
      } ${selected ? 'ring-2 ring-brand ring-offset-2 ring-offset-background' : ''} ${
        locked ? 'opacity-45' : ''
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
