'use client';

import { useState } from 'react';
import { Avatar } from '@/components/ui/avatar';
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
  const displayName = name || (email && email.split('@')[0]) || 'کاربر';
  const kitSize = size >= 48 ? 'lg' : size >= 36 ? 'md' : 'sm';

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

  return (
    <Avatar
      name={displayName}
      src={!displaySrc || failed ? undefined : displaySrc}
      size={kitSize}
      onError={() => setFailed(true)}
      style={{ width: size, height: size }}
      className={
        !displaySrc || failed
          ? `bg-brand/10 text-brand ring-brand/30 ${className}`
          : `bg-muted ring-0 ${className}`
      }
    />
  );
}
