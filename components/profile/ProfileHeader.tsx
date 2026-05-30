'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Edit2, Camera, UserPlus, Check, Loader2 } from 'lucide-react';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import type { CuratorLevelKey } from '@/lib/curator';
import { VIBE_AVATARS, isUserEliteLevel } from '@/lib/vibe-avatars';
import type { ProfileUser } from './types';
import EditProfileSheet2 from '@/components/mobile/profile/EditProfileSheet2';

interface ProfileHeaderProps {
  user: ProfileUser;
  isOwner: boolean;
  onUpdate?: () => void;
  isFollowing?: boolean;
  followLoading?: boolean;
  onFollowToggle?: () => void;
  followersCount?: number;
}

export default function ProfileHeader({
  user,
  isOwner,
  onUpdate,
  isFollowing,
  followLoading,
  onFollowToggle,
  followersCount,
}: ProfileHeaderProps) {
  const [showEditSheet, setShowEditSheet] = useState(false);

  const levelKey = (user.curatorLevel ?? 'EXPLORER') as CuratorLevelKey;
  const isElite = isUserEliteLevel(levelKey);
  const avatarTypeNorm = String(user.avatarType ?? '').toUpperCase();
  const hasVibeId = user.avatarId && String(user.avatarId).trim();
  const vibeAvatar =
    avatarTypeNorm === 'DEFAULT' && hasVibeId
      ? VIBE_AVATARS.find((a) => a.id === String(user.avatarId).trim())
      : null;
  const showUploadedAvatar =
    user.avatarType === 'UPLOADED' && user.avatarStatus === 'APPROVED' && user.image;
  const displayUsername =
    user.username && user.username !== 'null'
      ? user.username
      : user.email?.includes('@')
        ? user.email.split('@')[0]
        : 'user';

  return (
    <>
      <div className="relative -mx-4">
        <div className="h-[220px] w-full rounded-b-lg bg-primary" />
        <div className="absolute inset-x-0 top-0 z-10 px-4 pt-5 pb-6">
          <div className="flex flex-col items-center">
            <div className="relative group">
              <div className="w-20 h-20 rounded-full border-2 border-wibe-card overflow-hidden bg-wibe-card shadow-sm">
                {vibeAvatar ? (
                  <div className={`w-full h-full flex items-center justify-center text-3xl ${vibeAvatar.bgClass}`}>
                    {vibeAvatar.emoji}
                  </div>
                ) : showUploadedAvatar || user.image ? (
                  <ImageWithFallback
                    src={user.image!}
                    alt={user.name || user.email || 'Avatar'}
                    className="object-cover w-full h-full"
                    fallbackIcon={(user.name?.[0] || user.email?.[0] || '?').toUpperCase()}
                    fallbackClassName="w-full h-full bg-gray-200 text-foreground text-xl font-semibold flex items-center justify-center"
                    priority
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-200 text-foreground text-xl font-semibold">
                    {(user.name?.[0] || user.email?.[0] || '?').toUpperCase()}
                  </div>
                )}
              </div>
              {isOwner && (
                <button
                  onClick={() => setShowEditSheet(true)}
                  className="absolute bottom-0 right-0 w-6 h-6 bg-wibe-card rounded-full flex items-center justify-center shadow border border-wibe opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="تغییر آواتار"
                >
                  <Camera className="w-3 h-3 text-wibe-secondary" />
                </button>
              )}
            </div>
            {isElite && user.showBadge !== false && (
              <span className="mt-1.5 wibe-caption font-medium text-white/90">Elite Curator</span>
            )}
            <h1 className="mt-2 wibe-h3 text-white">{user.name || 'کاربر بدون نام'}</h1>
            <p className="wibe-small text-white/85">@{displayUsername}</p>

            <div className="mt-3 flex items-center gap-2">
              {isOwner ? (
                <button
                  onClick={() => setShowEditSheet(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md border border-white/40 bg-white/10 text-white wibe-small font-medium hover:bg-white/20 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  ویرایش پروفایل
                </button>
              ) : onFollowToggle ? (
                <button
                  type="button"
                  onClick={onFollowToggle}
                  disabled={followLoading}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-md wibe-small font-medium transition-all active:scale-[0.98] disabled:opacity-50 ${
                    isFollowing
                      ? 'bg-white/20 text-white border border-white/50'
                      : 'bg-wibe-card text-primary shadow-sm'
                  }`}
                >
                  {followLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isFollowing ? (
                    <>
                      <Check className="w-4 h-4" />
                      دنبال می‌کنی
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      دنبال کردن
                    </>
                  )}
                </button>
              ) : null}
              {!isOwner && followersCount != null && (
                <span className="text-white/75 wibe-caption">{followersCount} دنبال‌کننده</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {isOwner && onUpdate && (
        <EditProfileSheet2
          isOpen={showEditSheet}
          onClose={() => setShowEditSheet(false)}
          user={user}
          userLevel={levelKey}
          onUpdate={onUpdate}
        />
      )}
    </>
  );
}
