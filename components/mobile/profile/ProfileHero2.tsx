'use client';

import { useState } from 'react';
import { Edit2, Camera, LogOut } from 'lucide-react';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import CuratorBadge from '@/components/shared/CuratorBadge';
import CuratorScoreBar from '@/components/shared/CuratorScoreBar';
import { getLevelConfig, type CuratorLevelKey } from '@/lib/curator';
import { VIBE_AVATARS, isUserEliteLevel } from '@/lib/vibe-avatars';
import EliteAvatarFrame from '@/components/shared/EliteAvatarFrame';
import EditProfileSheet2 from './EditProfileSheet2';

export interface CreatorStats {
  viralListsCount: number;
  popularListsCount: number;
  totalLikesReceived: number;
  profileViews: number;
  totalItemsCurated: number;
}

export interface ProfileUser {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  username?: string | null;
  bio?: string | null;
  avatarType?: 'DEFAULT' | 'UPLOADED';
  avatarId?: string | null;
  avatarStatus?: 'APPROVED' | 'PENDING' | 'REJECTED' | null;
  showBadge?: boolean;
  allowCommentNotifications?: boolean;
  stats: { listsCreated: number; bookmarks: number; likes: number; itemLikes: number };
  creatorStats?: CreatorStats;
  expertise?: { name: string; slug: string; icon: string; count: number }[];
  curatorLevel?: string;
  curatorScore?: number;
  curatorNextLevelLabel?: string | null;
  curatorPointsToNext?: number | null;
}

interface ProfileHero2Props {
  user: ProfileUser;
  onUpdate: () => void;
}

export default function ProfileHero2({ user, onUpdate }: ProfileHero2Props) {
  const [showEditSheet, setShowEditSheet] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    const { signOut } = await import('next-auth/react');
    await signOut({ callbackUrl: '/login' });
  };

  const levelKey = (user.curatorLevel ?? 'EXPLORER') as CuratorLevelKey;
  const levelConfig = getLevelConfig(levelKey);
  const creatorStats = user.creatorStats ?? {
    viralListsCount: 0,
    popularListsCount: 0,
    totalLikesReceived: 0,
    profileViews: 0,
    totalItemsCurated: 0,
  };
  const curatorScore = user.curatorScore ?? 0;
  const expertise = user.expertise ?? [];
  const avatarTypeNorm = String(user.avatarType ?? '').toUpperCase();
  const hasVibeId = user.avatarId && String(user.avatarId).trim();
  const vibeAvatar =
    avatarTypeNorm === 'DEFAULT' && hasVibeId
      ? VIBE_AVATARS.find((a) => a.id === String(user.avatarId).trim())
      : null;
  const showVibeAvatar = Boolean(vibeAvatar);
  const showUploadedAvatar =
    user.avatarType === 'UPLOADED' && user.avatarStatus === 'APPROVED' && user.image;
  const isElite = isUserEliteLevel(levelKey);

  return (
    <>
      <div className="relative rounded-[20px] overflow-hidden bg-gradient-to-b from-[#7C3AED] via-[#8B5CF6] to-[#9333EA] pb-8 -mx-4">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(255,255,255,0.15),transparent)]" />
        <div className="relative z-10 px-4 pt-8">
          {/* Avatar 110px + glow (+ Elite frame if level 5+) */}
          <div className="flex flex-col items-center justify-center mb-4">
            {isElite ? (
              <EliteAvatarFrame size={110} className="mb-1">
                <div className="relative group">
                  <div
                    className={`absolute -inset-1.5 rounded-full bg-white/30 blur-md ${levelConfig.glowClass} transition-shadow`}
                  />
                  <div className="relative w-[110px] h-[110px] rounded-full border-4 border-white/90 overflow-hidden bg-white shadow-xl">
                    {showVibeAvatar ? (
                      <div
                        className={`w-full h-full flex items-center justify-center text-5xl ${vibeAvatar!.bgClass}`}
                      >
                        {vibeAvatar!.emoji}
                      </div>
                    ) : showUploadedAvatar ? (
                      <ImageWithFallback
                        src={user.image!}
                        alt={user.name || user.email || 'Avatar'}
                        className="object-cover w-full h-full min-w-[110px] min-h-[110px]"
                        fallbackIcon={(user.name?.[0] || user.email?.[0] || '?').toUpperCase()}
                        fallbackClassName="w-full h-full bg-gradient-to-br from-[#7C3AED] to-[#9333EA] text-white text-3xl font-bold flex items-center justify-center"
                      />
                    ) : user.image ? (
                      <ImageWithFallback
                        src={user.image}
                        alt={user.name || user.email || 'Avatar'}
                        className="object-cover w-full h-full min-w-[110px] min-h-[110px]"
                        fallbackIcon={(user.name?.[0] || user.email?.[0] || '?').toUpperCase()}
                        fallbackClassName="w-full h-full bg-gradient-to-br from-[#7C3AED] to-[#9333EA] text-white text-3xl font-bold flex items-center justify-center"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#7C3AED] to-[#9333EA] text-white text-3xl font-bold">
                        {(user.name?.[0] || user.email?.[0] || '?').toUpperCase()}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setShowEditSheet(true)}
                    className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity border-2 border-[#7C3AED]"
                    aria-label="تغییر آواتار"
                  >
                    <Camera className="w-4 h-4 text-[#7C3AED]" />
                  </button>
                </div>
              </EliteAvatarFrame>
            ) : (
            <div className="relative group">
              <div
                className={`absolute -inset-1.5 rounded-full bg-white/30 blur-md ${levelConfig.glowClass} transition-shadow`}
              />
              <div className="relative w-[110px] h-[110px] rounded-full border-4 border-white/90 overflow-hidden bg-white shadow-xl">
                {showVibeAvatar ? (
                  <div
                    className={`w-full h-full flex items-center justify-center text-5xl ${vibeAvatar!.bgClass}`}
                  >
                    {vibeAvatar!.emoji}
                  </div>
                ) : showUploadedAvatar ? (
                  <ImageWithFallback
                    src={user.image!}
                    alt={user.name || user.email || 'Avatar'}
                    className="object-cover w-full h-full min-w-[110px] min-h-[110px]"
                    fallbackIcon={(user.name?.[0] || user.email?.[0] || '?').toUpperCase()}
                    fallbackClassName="w-full h-full bg-gradient-to-br from-[#7C3AED] to-[#9333EA] text-white text-3xl font-bold flex items-center justify-center"
                  />
                ) : user.image ? (
                  <ImageWithFallback
                    src={user.image}
                    alt={user.name || user.email || 'Avatar'}
                    className="object-cover w-full h-full min-w-[110px] min-h-[110px]"
                    fallbackIcon={(user.name?.[0] || user.email?.[0] || '?').toUpperCase()}
                    fallbackClassName="w-full h-full bg-gradient-to-br from-[#7C3AED] to-[#9333EA] text-white text-3xl font-bold flex items-center justify-center"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#7C3AED] to-[#9333EA] text-white text-3xl font-bold">
                    {(user.name?.[0] || user.email?.[0] || '?').toUpperCase()}
                  </div>
                )}
              </div>
              <button
                onClick={() => setShowEditSheet(true)}
                className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity border-2 border-[#7C3AED]"
                aria-label="تغییر آواتار"
              >
                <Camera className="w-4 h-4 text-[#7C3AED]" />
              </button>
            </div>
            )}
            {isElite && user.showBadge !== false && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-200 text-xs font-medium border border-amber-400/40">
                Elite Curator
              </span>
            )}
          </div>

          <h1 className="text-xl font-bold text-white text-center mb-0.5">
            {user.name || 'کاربر بدون نام'}
          </h1>
          <p className="text-white/80 text-sm text-center mb-1">@{user.username || 'user'}</p>
          {user.bio && (
            <p className="text-white/90 text-sm text-center max-w-md mx-auto mb-3 line-clamp-2">
              {user.bio}
            </p>
          )}

          {/* Curator Badge */}
          <div className="flex justify-center mb-3">
            <CuratorBadge
              level={levelKey}
              size="large"
              showIcon
              showLabel
              glow
              className="bg-white/20 backdrop-blur-sm text-white border border-white/30"
            />
          </div>

          {/* Expertise chips */}
          {expertise.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 mb-4">
              {expertise.slice(0, 4).map((e) => (
                <span
                  key={e.slug}
                  className="px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm text-white/95 text-xs"
                >
                  {e.icon} {e.name}
                </span>
              ))}
            </div>
          )}

          {/* Creator Stats - horizontal scroll */}
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-1">
            <div className="flex-shrink-0 w-[100px] rounded-2xl bg-white/15 backdrop-blur-sm p-3 text-center">
              <p className="text-white text-lg font-bold">{creatorStats.viralListsCount}</p>
              <p className="text-white/80 text-xs">لیست وایرال</p>
            </div>
            <div className="flex-shrink-0 w-[100px] rounded-2xl bg-white/15 backdrop-blur-sm p-3 text-center">
              <p className="text-white text-lg font-bold">
                {creatorStats.totalLikesReceived >= 1000
                  ? (creatorStats.totalLikesReceived / 1000).toFixed(1) + 'k'
                  : creatorStats.totalLikesReceived}
              </p>
              <p className="text-white/80 text-xs">لایک دریافت‌شده</p>
            </div>
            <div className="flex-shrink-0 w-[100px] rounded-2xl bg-white/15 backdrop-blur-sm p-3 text-center">
              <p className="text-white text-lg font-bold">
                {creatorStats.profileViews >= 1000
                  ? (creatorStats.profileViews / 1000).toFixed(1) + 'k'
                  : creatorStats.profileViews}
              </p>
              <p className="text-white/80 text-xs">بازدید</p>
            </div>
            <div className="flex-shrink-0 w-[100px] rounded-2xl bg-white/15 backdrop-blur-sm p-3 text-center">
              <p className="text-white text-lg font-bold">{creatorStats.popularListsCount}</p>
              <p className="text-white/80 text-xs">لیست محبوب</p>
            </div>
          </div>

          {/* Curator Score bar */}
          <div className="mb-4">
            <CuratorScoreBar
              score={curatorScore}
              level={levelKey}
              nextLevelLabel={user.curatorNextLevelLabel}
              pointsToNext={user.curatorPointsToNext}
              animated
              className="!bg-white/15 !rounded-2xl"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-center gap-3">
            <button
              onClick={() => setShowEditSheet(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-white rounded-[20px] shadow-md hover:shadow-lg transition-all text-[#7C3AED] font-medium text-sm"
            >
              <Edit2 className="w-4 h-4" />
              ویرایش پروفایل
            </button>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="p-2.5 text-red-400 bg-white/20 rounded-[20px] hover:bg-white/30 transition-all disabled:opacity-50"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <EditProfileSheet2
        isOpen={showEditSheet}
        onClose={() => setShowEditSheet(false)}
        user={user}
        userLevel={levelKey}
        onUpdate={onUpdate}
      />
    </>
  );
}
