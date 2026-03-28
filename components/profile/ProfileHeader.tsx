'use client';

import { useState } from 'react';
import { Edit2, Camera, UserPlus, Check, Loader2, LogOut, List, Heart, Bookmark } from 'lucide-react';
import { signOut } from 'next-auth/react';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import { getLevelConfig, type CuratorLevelKey } from '@/lib/curator';
import { VIBE_AVATARS, isUserEliteLevel } from '@/lib/vibe-avatars';
import type { ProfileUser } from './types';
import EditProfileSheet2 from '@/components/mobile/profile/EditProfileSheet2';

interface ProfileHeaderProps {
  user: ProfileUser;
  isOwner: boolean;
  onUpdate?: () => void;
  /** Public view: follow state */
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
  const levelConfig = getLevelConfig(levelKey);
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

  const stats = user.stats;

  return (
    <>
      <div className="relative -mx-4">
        {/* بنر کوتاه‌تر */}
        <div
          className="h-[140px] w-full rounded-b-3xl"
          style={{
            background: 'linear-gradient(135deg, #7C5CFF 0%, #8B5CF6 50%, #9333EA 100%)',
          }}
        />

        <div className="absolute inset-x-0 top-0 z-10 px-4 pt-4">
          {/* ردیف اصلی: آواتار + اطلاعات در یک خط */}
          <div className="flex items-start gap-3">
            {/* آواتار */}
            <div className="relative group flex-shrink-0">
              <div className="w-16 h-16 rounded-full border-2 border-white/90 overflow-hidden bg-white shadow-lg">
                {vibeAvatar ? (
                  <div
                    className={`w-full h-full flex items-center justify-center text-2xl ${vibeAvatar.bgClass}`}
                  >
                    {vibeAvatar.emoji}
                  </div>
                ) : showUploadedAvatar || user.image ? (
                  <ImageWithFallback
                    src={user.image!}
                    alt={user.name || user.email || 'Avatar'}
                    className="object-cover w-full h-full"
                    fallbackIcon={(user.name?.[0] || user.email?.[0] || '?').toUpperCase()}
                    fallbackClassName="w-full h-full bg-gray-100 text-gray-500 text-xl font-semibold flex items-center justify-center"
                    priority
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-500 text-xl font-semibold">
                    {(user.name?.[0] || user.email?.[0] || '?').toUpperCase()}
                  </div>
                )}
              </div>
              {isOwner && (
                <button
                  onClick={() => setShowEditSheet(true)}
                  className="absolute -bottom-0.5 -right-0.5 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow border border-gray-200"
                  aria-label="تغییر آواتار"
                >
                  <Camera className="w-3 h-3 text-gray-600" />
                </button>
              )}
            </div>

            {/* نام + یوزرنیم + bio */}
            <div className="flex-1 min-w-0 pt-1">
              <div className="flex items-center gap-2">
                <h1 className="text-[17px] font-bold text-white truncate">
                  {user.name || 'کاربر بدون نام'}
                </h1>
                {isElite && user.showBadge !== false && (
                  <span className="text-[10px] font-medium text-white/80 bg-white/15 px-1.5 py-0.5 rounded-full">
                    Elite
                  </span>
                )}
              </div>
              <p className="text-white/70 text-[13px]">@{displayUsername}</p>
              {user.bio && user.bio !== 'null' && (
                <p className="text-white/80 text-[13px] mt-1 line-clamp-2 leading-snug">
                  {user.bio}
                </p>
              )}
              {isOwner && (!user.bio || user.bio === 'null') && (
                <button
                  onClick={() => setShowEditSheet(true)}
                  className="text-white/50 text-[12px] mt-1 hover:text-white/70 transition-colors"
                >
                  + معرفی خودت رو بنویس...
                </button>
              )}
            </div>

            {/* دکمه‌ها */}
            <div className="flex-shrink-0 flex items-center gap-1.5 pt-1">
              {isOwner ? (
                <>
                  <button
                    onClick={() => setShowEditSheet(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/40 bg-white/10 text-white text-[13px] font-medium hover:bg-white/20 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    ویرایش
                  </button>
                  <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="w-8 h-8 rounded-xl border border-white/20 bg-white/10 text-white/70 flex items-center justify-center hover:bg-red-500/30 hover:text-white transition-colors"
                    aria-label="خروج از حساب"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </>
              ) : onFollowToggle ? (
                <button
                  type="button"
                  onClick={onFollowToggle}
                  disabled={followLoading}
                  className={`
                    inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium
                    transition-all active:scale-[0.98]
                    ${isFollowing
                      ? 'bg-white/20 text-white border border-white/50'
                      : 'bg-white text-[#7C3AED] shadow-md hover:shadow-lg'
                    }
                  `}
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
            </div>
          </div>
        </div>
      </div>

      {/* ردیف آمار */}
      <div className="px-4 -mt-6 relative z-20">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3">
          <div className="flex items-center justify-around text-center">
            <div className="flex-1">
              <p className="text-[17px] font-bold text-gray-900">
                {(stats?.listsCreated ?? 0).toLocaleString('fa-IR')}
              </p>
              <p className="text-[11px] text-gray-500 mt-0.5 flex items-center justify-center gap-1">
                <List className="w-3 h-3" />
                لیست
              </p>
            </div>
            <div className="w-px h-8 bg-gray-200" />
            <div className="flex-1">
              <p className="text-[17px] font-bold text-gray-900">
                {(stats?.bookmarks ?? 0).toLocaleString('fa-IR')}
              </p>
              <p className="text-[11px] text-gray-500 mt-0.5 flex items-center justify-center gap-1">
                <Bookmark className="w-3 h-3" />
                ذخیره
              </p>
            </div>
            <div className="w-px h-8 bg-gray-200" />
            <div className="flex-1">
              <p className="text-[17px] font-bold text-gray-900">
                {(stats?.likes ?? 0).toLocaleString('fa-IR')}
              </p>
              <p className="text-[11px] text-gray-500 mt-0.5 flex items-center justify-center gap-1">
                <Heart className="w-3 h-3" />
                لایک
              </p>
            </div>
            {!isOwner && followersCount != null && (
              <>
                <div className="w-px h-8 bg-gray-200" />
                <div className="flex-1">
                  <p className="text-[17px] font-bold text-gray-900">
                    {followersCount.toLocaleString('fa-IR')}
                  </p>
                  <p className="text-[11px] text-gray-500 mt-0.5">دنبال‌کننده</p>
                </div>
              </>
            )}
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
