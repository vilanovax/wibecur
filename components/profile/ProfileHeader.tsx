'use client';

import { useState } from 'react';
import { signOut } from 'next-auth/react';
import { Edit2, Camera, UserPlus, Check, Loader2, LogOut } from 'lucide-react';
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
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut({ callbackUrl: '/login' });
    } finally {
      setIsLoggingOut(false);
    }
  };

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

  const openEdit = () => setShowEditSheet(true);

  return (
    <>
      <div className="relative">
        {/* کاور — inset 10px از لبه باکس */}
        <div className="relative h-[60px] w-full overflow-hidden bg-gradient-to-br from-primary via-primary to-primary-dark lg:h-[4.5rem]">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_80%_0%,rgba(255,255,255,0.14),transparent_55%)]"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-black/10 to-transparent"
            aria-hidden
          />

          {isOwner ? (
            <>
              <button
                type="button"
                onClick={openEdit}
                className="absolute start-2.5 top-2.5 z-10 inline-flex h-8 items-center gap-1.5 rounded-full border border-white/25 bg-white/15 px-3 text-[11px] font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/25 active:scale-[0.97]"
                aria-label="ویرایش پروفایل"
              >
                <Edit2 className="h-3.5 w-3.5" />
                ویرایش
              </button>
              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="absolute end-2.5 top-2.5 z-10 inline-flex h-8 items-center gap-1.5 rounded-full border border-white/25 bg-white/15 px-3 text-[11px] font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/25 active:scale-[0.97] disabled:opacity-50 lg:hidden"
                aria-label="خروج از حساب"
              >
                {isLoggingOut ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <LogOut className="h-3.5 w-3.5" />
                )}
                خروج
              </button>
            </>
          ) : onFollowToggle ? (
            <button
              type="button"
              onClick={onFollowToggle}
              disabled={followLoading}
              className={`absolute start-2.5 top-2.5 z-10 inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[11px] font-semibold backdrop-blur-sm transition-all active:scale-[0.97] disabled:opacity-50 ${
                isFollowing
                  ? 'border border-white/30 bg-white/20 text-white'
                  : 'border border-white/20 bg-white text-primary shadow-sm'
              }`}
            >
              {followLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : isFollowing ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  دنبال می‌کنی
                </>
              ) : (
                <>
                  <UserPlus className="h-3.5 w-3.5" />
                  دنبال کردن
                </>
              )}
            </button>
          ) : null}
        </div>

        <div className="px-2.5 pb-2.5 pt-0 lg:px-4 lg:pb-4">
          <div className="-mt-8 flex items-start gap-3 lg:-mt-10 lg:items-end lg:gap-5">
            <div className="min-w-0 flex-1 pt-1.5 text-right lg:pt-0 lg:pb-1">
              {isElite && user.showBadge !== false && (
                <span className="mb-1.5 inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-800 ring-1 ring-amber-200/80">
                  <span aria-hidden>⭐</span>
                  کیوریتور برتر
                </span>
              )}

              <div className="lg:flex lg:flex-wrap lg:items-center lg:justify-between lg:gap-3">
              <h1 className="truncate text-[17px] font-bold leading-snug tracking-tight text-foreground lg:text-xl">
                {user.name || 'کاربر بدون نام'}
              </h1>
              {isOwner && (
                <div className="mt-2 hidden shrink-0 items-center gap-2 lg:mt-0 lg:flex">
                  <button
                    type="button"
                    onClick={openEdit}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-wibe bg-wibe-card px-3 text-xs font-semibold text-foreground transition-colors hover:border-primary/30"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    ویرایش پروفایل
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
                  >
                    {isLoggingOut ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <LogOut className="h-3.5 w-3.5" />
                    )}
                    خروج
                  </button>
                </div>
              )}
              </div>

              <p
                className="mt-1 truncate font-mono text-[12px] font-medium text-wibe-secondary"
                dir="ltr"
              >
                @{displayUsername}
              </p>

              {user.bio?.trim() ? (
                <p className="mt-2 text-[13px] leading-relaxed text-wibe-secondary line-clamp-3 whitespace-pre-wrap break-words">
                  {user.bio.trim()}
                </p>
              ) : isOwner ? (
                <button
                  type="button"
                  onClick={openEdit}
                  className="mt-2 text-[12px] font-medium text-primary/80 transition-colors hover:text-primary"
                >
                  افزودن بیو کوتاه
                </button>
              ) : null}
            </div>

            <div className="relative shrink-0">
              <div className="h-[68px] w-[68px] overflow-hidden rounded-full border-[3px] border-wibe-card bg-wibe-card shadow-md ring-1 ring-black/[0.06] lg:h-20 lg:w-20 lg:border-4">
                {vibeAvatar ? (
                  <div
                    className={`flex h-full w-full items-center justify-center text-2xl ${vibeAvatar.bgClass}`}
                  >
                    {vibeAvatar.emoji}
                  </div>
                ) : showUploadedAvatar || user.image ? (
                  <ImageWithFallback
                    src={user.image!}
                    alt={user.name || user.email || 'Avatar'}
                    className="h-full w-full object-cover"
                    fallbackIcon={(user.name?.[0] || user.email?.[0] || '?').toUpperCase()}
                    fallbackClassName="flex h-full w-full items-center justify-center bg-gray-100 text-lg font-semibold text-foreground"
                    priority
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gray-100 text-lg font-semibold text-foreground">
                    {(user.name?.[0] || user.email?.[0] || '?').toUpperCase()}
                  </div>
                )}
              </div>
              {isOwner && (
                <button
                  type="button"
                  onClick={openEdit}
                  className="absolute -bottom-0.5 left-0 flex h-6 w-6 items-center justify-center rounded-full border border-wibe bg-wibe-card shadow-sm"
                  aria-label="تغییر آواتار"
                >
                  <Camera className="h-3 w-3 text-wibe-secondary" />
                </button>
              )}
            </div>
          </div>

          {!isOwner && followersCount != null && (
            <p className="mt-2.5 px-0 text-[11px] text-wibe-secondary">
              {followersCount.toLocaleString('fa-IR')} دنبال‌کننده
            </p>
          )}
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
