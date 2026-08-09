'use client';

import { useEffect, useState, type ComponentType } from 'react';
import { Edit2, Camera, LogOut } from 'lucide-react';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import {
  getLevelByScore,
  getNextLevelByScore,
  pointsToNextLevel,
  type CuratorLevelKey,
} from '@/lib/curator';
import { isUserEliteLevel, resolveVibeAvatar } from '@/lib/vibe-avatars';
import VibeAvatarDisplay from '@/components/shared/VibeAvatarDisplay';

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
  allowBookmarkListNotifications?: boolean;
  stats: { listsCreated: number; bookmarks: number; likes: number; itemLikes: number };
  creatorStats?: CreatorStats;
  expertise?: { name: string; slug: string; icon: string; count: number }[];
  curatorLevel?: string;
  curatorScore?: number;
  curatorNextLevelLabel?: string | null;
  curatorPointsToNext?: number | null;
}

type EditProfileSheet2Props = {
  isOpen: boolean;
  onClose: () => void;
  user: ProfileUser;
  userLevel: CuratorLevelKey;
  onUpdate: () => void;
};

interface ProfileHero2Props {
  user: ProfileUser;
  onUpdate: () => void;
}

function formatStat(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return String(n);
}

export default function ProfileHero2({ user, onUpdate }: ProfileHero2Props) {
  const [showEditSheet, setShowEditSheet] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [EditProfileSheet2, setEditProfileSheet2] = useState<ComponentType<
    EditProfileSheet2Props
  > | null>(null);

  useEffect(() => {
    if (!showEditSheet || EditProfileSheet2) return;
    let cancelled = false;
    void import('./EditProfileSheet2').then((mod) => {
      if (!cancelled) setEditProfileSheet2(() => mod.default);
    });
    return () => {
      cancelled = true;
    };
  }, [showEditSheet, EditProfileSheet2]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    const { signOut } = await import('next-auth/react');
    await signOut({ callbackUrl: '/login' });
  };

  const levelKey = (user.curatorLevel ?? 'EXPLORER') as CuratorLevelKey;
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
      ? resolveVibeAvatar(String(user.avatarId).trim())
      : null;
  const showVibeAvatar = Boolean(vibeAvatar);
  const showUploadedAvatar =
    user.avatarType === 'UPLOADED' && user.avatarStatus === 'APPROVED' && user.image;
  const isElite = isUserEliteLevel(levelKey);

  const displayUsername = (user.username && user.username !== 'null') ? user.username : (user.email?.includes('@') ? user.email.split('@')[0] : 'user');

  const currentTier = getLevelByScore(curatorScore);
  const nextTier = getNextLevelByScore(curatorScore);
  const toNext = user.curatorPointsToNext ?? pointsToNextLevel(curatorScore);
  const nextLabel = user.curatorNextLevelLabel ?? nextTier?.short ?? null;
  const rangeMin = currentTier.min;
  const rangeMax = nextTier?.min ?? rangeMin + 100;
  const progressPercent = nextTier
    ? Math.min(100, ((curatorScore - rangeMin) / (rangeMax - rangeMin)) * 100)
    : 100;

  return (
    <>
      {/* Hero: gradient only top 260px, then white — indigo tokens from DESIGN.md */}
      <div className="relative -mx-4">
        <div
          className="h-[260px] w-full rounded-b-2xl"
          style={{
            background:
              'linear-gradient(135deg, var(--primary-light) 0%, var(--primary) 50%, var(--primary-dark) 100%)',
          }}
        />
        <div className="absolute inset-x-0 top-0 z-10 px-4 pt-6 pb-8">
          {/* Avatar: 96px, simple ring */}
          <div className="flex flex-col items-center">
            <div className="relative group">
              <div className="w-[96px] h-[96px] rounded-full border-2 border-white/90 overflow-hidden bg-white shadow-sm">
                {showVibeAvatar && vibeAvatar ? (
                  <VibeAvatarDisplay avatar={vibeAvatar} size={96} className="h-full w-full" />
                ) : showUploadedAvatar ? (
                  <ImageWithFallback
                    src={user.image!}
                    alt={user.name || user.email || 'Avatar'}
                    className="object-cover w-full h-full"
                    fallbackIcon={(user.name?.[0] || user.email?.[0] || '?').toUpperCase()}
                    fallbackClassName="w-full h-full bg-wibe-surface text-wibe-secondary text-2xl font-semibold flex items-center justify-center"
                    priority
                  />
                ) : user.image ? (
                  <ImageWithFallback
                    src={user.image}
                    alt={user.name || user.email || 'Avatar'}
                    className="object-cover w-full h-full"
                    fallbackIcon={(user.name?.[0] || user.email?.[0] || '?').toUpperCase()}
                    fallbackClassName="w-full h-full bg-wibe-surface text-wibe-secondary text-2xl font-semibold flex items-center justify-center"
                    priority
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-wibe-surface text-wibe-secondary text-2xl font-semibold">
                    {(user.name?.[0] || user.email?.[0] || '?').toUpperCase()}
                  </div>
                )}
              </div>
              <button
                onClick={() => setShowEditSheet(true)}
                className="absolute bottom-0 right-0 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow opacity-0 group-hover:opacity-100 transition-opacity border border-wibe"
                aria-label="تغییر آواتار"
              >
                <Camera className="w-3.5 h-3.5 text-wibe-secondary" />
              </button>
            </div>
            {isElite && user.showBadge !== false && (
              <span className="mt-1.5 wibe-caption font-medium text-white/90">Elite Curator</span>
            )}
            <h1 className="mt-2 text-lg font-bold text-white">
              {user.name || 'کاربر بدون نام'}
            </h1>
            <p className="text-white/80 text-sm">@{displayUsername}</p>
          </div>
        </div>
      </div>

      {/* Content on white: spacing 8/16/24 */}
      <div className="px-4 -mt-2 relative z-20">
        <div className="bg-white rounded-t-2xl shadow-sm border border-wibe/80 border-b-0 pt-6 pb-4 px-4">
          {/* Actions */}
          <div className="flex justify-center gap-2 mb-6">
            <button
              onClick={() => setShowEditSheet(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white font-medium text-sm hover:opacity-90 transition-opacity"
            >
              <Edit2 className="w-4 h-4" />
              ویرایش پروفایل
            </button>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="p-2 rounded-xl border border-wibe text-wibe-secondary hover:bg-wibe-surface disabled:opacity-50 transition-colors"
              aria-label="خروج"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>

          {/* Expertise chips: minimal */}
          {expertise.length > 0 && (
            <div className="flex flex-wrap justify-center gap-1.5 mb-4">
              {expertise.slice(0, 4).map((e) => (
                <span
                  key={e.slug}
                  className="px-2.5 py-1 rounded-lg bg-wibe-surface text-wibe-secondary text-xs"
                >
                  {e.icon} {e.name}
                </span>
              ))}
            </div>
          )}

          {/* Stats: single horizontal row, no cards */}
          <div className="grid grid-cols-4 gap-2 mb-5">
            <div className="text-center py-2">
              <p className="text-base font-bold text-foreground">{creatorStats.popularListsCount}</p>
              <p className="text-xs text-wibe-secondary">لیست محبوب</p>
            </div>
            <div className="text-center py-2">
              <p className="text-base font-bold text-foreground">{formatStat(creatorStats.profileViews)}</p>
              <p className="text-xs text-wibe-secondary">بازدید</p>
            </div>
            <div className="text-center py-2">
              <p className="text-base font-bold text-foreground">{formatStat(creatorStats.totalLikesReceived)}</p>
              <p className="text-xs text-wibe-secondary">لایک</p>
            </div>
            <div className="text-center py-2">
              <p className="text-base font-bold text-foreground">{creatorStats.viralListsCount}</p>
              <p className="text-xs text-wibe-secondary">وایرال</p>
            </div>
          </div>

          {/* Level: compact progress */}
          <div className="rounded-xl bg-wibe-surface border border-wibe p-3">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs font-medium text-wibe-secondary">
                سطح {currentTier.short}
              </span>
              <span className="text-xs font-bold text-foreground">{curatorScore}</span>
            </div>
            <div className="h-1.5 rounded-full bg-wibe-surface overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-colors duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            {nextLabel != null && toNext != null && toNext > 0 && (
              <p className="wibe-caption text-wibe-secondary mt-1.5">
                {toNext} امتیاز تا {nextLabel}
              </p>
            )}
            {nextTier === null && (
              <p className="wibe-caption text-wibe-secondary mt-1.5">بالاترین سطح</p>
            )}
          </div>
        </div>
      </div>

      {showEditSheet && EditProfileSheet2 ? (
        <EditProfileSheet2
          isOpen={showEditSheet}
          onClose={() => setShowEditSheet(false)}
          user={user}
          userLevel={levelKey}
          onUpdate={onUpdate}
        />
      ) : null}
    </>
  );
}
