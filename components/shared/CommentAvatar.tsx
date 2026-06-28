'use client';

import { useState } from 'react';
import { resolveVibeAvatar } from '@/lib/vibe-avatars';
import VibeAvatarDisplay from '@/components/shared/VibeAvatarDisplay';
import { resolveStorageImageDisplayUrl } from '@/lib/storage-image-url';

/** آواتار کامنت — ParsPack proxy / legacy Liara via API / vibe pack */
export default function CommentAvatar({
  src,
  name,
  email,
  size = 40,
  className = '',
  avatarType,
  avatarId,
  avatarStatus: _avatarStatus,
}: {
  src?: string | null;
  name?: string | null;
  email?: string | null;
  size?: number;
  className?: string;
  avatarType?: string;
  avatarId?: string | null;
  avatarStatus?: string | null;
}) {
  const [failed, setFailed] = useState(false);
  const initial = (name || (email && email.split('@')[0]) || '?').charAt(0).toUpperCase();

  const showVibeAvatar =
    String(avatarType ?? '').toUpperCase() === 'DEFAULT' &&
    avatarId &&
    String(avatarId).trim();
  const vibeAvatar = showVibeAvatar ? resolveVibeAvatar(String(avatarId).trim()) : null;

  const displaySrc = resolveStorageImageDisplayUrl(src);

  if (vibeAvatar) {
    return (
      <VibeAvatarDisplay avatar={vibeAvatar} size={size} className={className} />
    );
  }

  if (!displaySrc || failed) {
    return (
      <div
        className={`flex-shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold ${className}`}
        style={{ width: size, height: size }}
      >
        <span style={{ fontSize: Math.round(size * 0.45) }}>{initial}</span>
      </div>
    );
  }

  return (
    <div
      className={`flex-shrink-0 rounded-full overflow-hidden bg-gray-100 ${className}`}
      style={{ width: size, height: size }}
    >
      <img
        src={displaySrc}
        alt={name || ''}
        className="w-full h-full object-cover"
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
      />
    </div>
  );
}
