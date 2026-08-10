'use client';

import { useEffect, useRef, useState, type ComponentType } from 'react';
import { signOut } from 'next-auth/react';
import {
  Edit2,
  Camera,
  UserPlus,
  Check,
  Loader2,
  LogOut,
  MoreHorizontal,
} from 'lucide-react';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import { getLevelByScore, type CuratorLevelKey } from '@/lib/curator';
import { isUserEliteLevel, resolveVibeAvatar } from '@/lib/vibe-avatars';
import VibeAvatarDisplay from '@/components/shared/VibeAvatarDisplay';
import type { ProfileUser } from './types';
import BottomSheet from '@/components/mobile/shared/BottomSheet';

type EditProfileSheet2Props = {
  isOpen: boolean;
  onClose: () => void;
  user: ProfileUser;
  userLevel: CuratorLevelKey;
  onUpdate: () => void;
};

interface ProfileHeaderProps {
  user: ProfileUser;
  isOwner: boolean;
  onUpdate?: () => void;
  isFollowing?: boolean;
  followLoading?: boolean;
  onFollowToggle?: () => void;
  followersCount?: number;
}

function formatStat(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toLocaleString('fa-IR');
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
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [EditProfileSheet2, setEditProfileSheet2] = useState<ComponentType<
    EditProfileSheet2Props
  > | null>(null);

  useEffect(() => {
    if (!showEditSheet || EditProfileSheet2) return;
    let cancelled = false;
    void import('@/components/mobile/profile/EditProfileSheet2').then((mod) => {
      if (!cancelled) setEditProfileSheet2(() => mod.default);
    });
    return () => {
      cancelled = true;
    };
  }, [showEditSheet, EditProfileSheet2]);

  useEffect(() => {
    if (!menuOpen) return;
    const onPointer = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut({ callbackUrl: '/login' });
    } finally {
      setIsLoggingOut(false);
    }
  };

  const requestLogout = () => {
    setMenuOpen(false);
    setShowLogoutConfirm(true);
  };

  const openEdit = () => {
    setMenuOpen(false);
    setShowEditSheet(true);
  };

  const levelKey = (user.curatorLevel ?? 'EXPLORER') as CuratorLevelKey;
  const isElite = isUserEliteLevel(levelKey);
  const levelShort = getLevelByScore(user.curatorScore ?? 0).short;
  const avatarTypeNorm = String(user.avatarType ?? '').toUpperCase();
  const hasVibeId = user.avatarId && String(user.avatarId).trim();
  const vibeAvatar =
    avatarTypeNorm === 'DEFAULT' && hasVibeId
      ? resolveVibeAvatar(String(user.avatarId).trim())
      : null;
  const showUploadedAvatar =
    user.avatarType === 'UPLOADED' && user.avatarStatus === 'APPROVED' && user.image;
  const displayUsername =
    user.username && user.username !== 'null'
      ? user.username
      : user.email?.includes('@')
        ? user.email.split('@')[0]
        : 'user';

  const listsCreated = user.stats?.listsCreated ?? 0;
  const bookmarks = user.stats?.bookmarks ?? 0;
  const likesReceived =
    user.creatorStats?.totalLikesReceived ?? user.stats?.likes ?? 0;
  const savesReceived = user.creatorStats?.totalSavesReceived ?? 0;
  const showOwnerStats = isOwner;
  const showPublicFollowers = !isOwner && followersCount != null;

  return (
    <>
      <div className="relative">
        <div className="relative h-16 w-full overflow-hidden bg-gradient-to-br from-primary via-primary to-primary-dark lg:h-[5.25rem]">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_75%_0%,rgba(255,255,255,0.16),transparent_55%)]"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-black/15 to-transparent"
            aria-hidden
          />

          {isOwner ? (
            <div className="absolute start-2.5 top-2.5 z-10" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-white/15 text-white backdrop-blur-sm transition-colors hover:bg-white/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 active:scale-[0.97]"
                aria-label="منوی پروفایل"
                aria-expanded={menuOpen}
                aria-haspopup="menu"
              >
                <MoreHorizontal className="h-5 w-5" />
              </button>
              {menuOpen ? (
                <div
                  role="menu"
                  className="absolute start-0 top-11 z-30 min-w-[11.5rem] overflow-hidden rounded-xl border border-wibe bg-wibe-card py-1 shadow-lg"
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={openEdit}
                    className="flex w-full items-center gap-2 px-3.5 py-2.5 text-right wibe-small font-medium text-foreground transition-colors hover:bg-wibe-surface focus:outline-none focus-visible:bg-wibe-surface"
                  >
                    <Edit2 className="h-4 w-4 text-wibe-secondary" aria-hidden />
                    ویرایش پروفایل
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={requestLogout}
                    disabled={isLoggingOut}
                    className="flex w-full items-center gap-2 px-3.5 py-2.5 text-right wibe-small font-medium text-red-600 transition-colors hover:bg-red-50 focus:outline-none focus-visible:bg-red-50 disabled:opacity-50"
                  >
                    {isLoggingOut ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    ) : (
                      <LogOut className="h-4 w-4" aria-hidden />
                    )}
                    خروج از حساب
                  </button>
                </div>
              ) : null}
            </div>
          ) : onFollowToggle ? (
            <button
              type="button"
              onClick={onFollowToggle}
              disabled={followLoading}
              className={`absolute start-2.5 top-2.5 z-10 inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 wibe-caption font-semibold backdrop-blur-sm transition-all active:scale-[0.97] disabled:opacity-50 ${
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

        <div className="px-3 pb-3 pt-0 lg:px-5 lg:pb-4">
          <div className="-mt-10 flex items-end gap-3.5 lg:-mt-12 lg:gap-5">
            <div className="relative z-20 shrink-0">
              <div className="h-[96px] w-[96px] overflow-hidden rounded-full border-[3px] border-wibe-card bg-wibe-card shadow-md ring-1 ring-black/[0.06] lg:h-[7rem] lg:w-[7rem] lg:border-4">
                {vibeAvatar ? (
                  <VibeAvatarDisplay avatar={vibeAvatar} size={112} className="h-full w-full" />
                ) : showUploadedAvatar || user.image ? (
                  <ImageWithFallback
                    src={user.image!}
                    alt={user.name || user.email || 'Avatar'}
                    className="h-full w-full object-cover"
                    fallbackIcon={(user.name?.[0] || user.email?.[0] || '?').toUpperCase()}
                    fallbackClassName="flex h-full w-full items-center justify-center bg-wibe-surface text-xl font-semibold text-foreground"
                    priority
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-wibe-surface text-xl font-semibold text-foreground">
                    {(user.name?.[0] || user.email?.[0] || '?').toUpperCase()}
                  </div>
                )}
              </div>
              {isOwner && (
                <button
                  type="button"
                  onClick={openEdit}
                  className="absolute -bottom-0.5 left-0 flex h-7 w-7 items-center justify-center rounded-full border border-wibe bg-wibe-card shadow-sm transition-colors hover:border-primary/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                  aria-label="عکس پروفایل اضافه کن"
                  title="عکس پروفایل اضافه کن"
                >
                  <Camera className="h-3.5 w-3.5 text-wibe-secondary" />
                </button>
              )}
            </div>

            <div className="min-w-0 flex-1 pb-0.5 text-right">
              <div className="mb-1.5 flex flex-wrap items-center justify-start gap-1.5">
                <span className="inline-flex items-center rounded-lg bg-wibe-surface px-2 py-0.5 wibe-caption font-semibold text-foreground ring-1 ring-wibe">
                  سطح {levelShort}
                </span>
                {isElite && user.showBadge !== false && (
                  <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-0.5 wibe-caption font-bold text-amber-800 ring-1 ring-amber-200/80">
                    <span aria-hidden>⭐</span>
                    کیوریتور برتر
                  </span>
                )}
              </div>

              <div className="flex w-full flex-wrap items-center justify-start gap-x-2 gap-y-2">
                <h1 className="min-w-0 truncate wibe-h2 font-bold leading-snug tracking-tight text-foreground lg:text-2xl">
                  {user.name || 'کاربر بدون نام'}
                </h1>
                {isOwner && (
                  <button
                    type="button"
                    onClick={openEdit}
                    className="hidden shrink-0 items-center gap-1.5 rounded-xl border border-wibe bg-wibe-card px-3 py-2 wibe-small font-medium text-foreground transition-colors hover:border-primary/30 hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 lg:inline-flex"
                  >
                    <Edit2 className="h-4 w-4" />
                    ویرایش
                  </button>
                )}
              </div>

              <p className="mt-0.5 truncate wibe-small font-medium text-wibe-secondary" dir="ltr">
                @{displayUsername}
              </p>

              {user.bio?.trim() ? (
                <p className="mt-1.5 wibe-small leading-relaxed text-wibe-secondary line-clamp-2 whitespace-pre-wrap break-words">
                  {user.bio.trim()}
                </p>
              ) : isOwner ? (
                <button
                  type="button"
                  onClick={openEdit}
                  className="mt-1.5 wibe-small font-medium text-primary/80 transition-colors hover:text-primary"
                >
                  افزودن بیو کوتاه
                </button>
              ) : null}
            </div>
          </div>

          {showOwnerStats ? (
            <div
              className="mt-3.5 grid grid-cols-3 gap-1 border-t border-wibe/80 pt-3"
              aria-label="آمار پروفایل"
            >
              <div className="text-center">
                <p className="wibe-body font-bold tabular-nums text-foreground">
                  {formatStat(listsCreated)}
                </p>
                <p className="mt-0.5 wibe-caption text-wibe-secondary">لیست</p>
              </div>
              <div className="border-x border-wibe/60 text-center">
                <p className="wibe-body font-bold tabular-nums text-foreground">
                  {formatStat(savesReceived > 0 ? savesReceived : bookmarks)}
                </p>
                <p className="mt-0.5 wibe-caption text-wibe-secondary">ذخیره</p>
              </div>
              <div className="text-center">
                <p className="wibe-body font-bold tabular-nums text-foreground">
                  {formatStat(likesReceived)}
                </p>
                <p className="mt-0.5 wibe-caption text-wibe-secondary">لایک</p>
              </div>
            </div>
          ) : null}

          {showPublicFollowers ? (
            <p className="mt-2.5 wibe-caption text-wibe-secondary">
              {followersCount!.toLocaleString('fa-IR')} دنبال‌کننده
            </p>
          ) : null}
        </div>
      </div>

      {isOwner && onUpdate && showEditSheet && EditProfileSheet2 ? (
        <EditProfileSheet2
          isOpen={showEditSheet}
          onClose={() => setShowEditSheet(false)}
          user={user}
          userLevel={levelKey}
          onUpdate={onUpdate}
        />
      ) : null}

      {isOwner && (
        <BottomSheet
          isOpen={showLogoutConfirm}
          onClose={() => !isLoggingOut && setShowLogoutConfirm(false)}
          title="خروج از حساب"
          subtitle="برای ورود دوباره نام کاربری و رمز عبور لازم است"
          desktopMaxWidth="sm"
          maxHeight="min(420px, 85vh)"
          closeOnBackdrop={!isLoggingOut}
          escapeToClose={!isLoggingOut}
          footer={
            <div className="flex flex-col gap-2 px-4 py-3 lg:flex-row-reverse lg:justify-start lg:gap-2.5">
              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 wibe-small font-semibold text-white transition-colors hover:bg-red-700 active:scale-[0.99] disabled:opacity-50 lg:min-w-[8.5rem] lg:w-auto"
              >
                {isLoggingOut ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    در حال خروج...
                  </>
                ) : (
                  <>
                    <LogOut className="h-4 w-4" />
                    خروج
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                disabled={isLoggingOut}
                className="h-11 w-full rounded-xl border border-wibe bg-wibe-card px-4 wibe-small font-semibold text-foreground transition-colors hover:bg-wibe-surface active:scale-[0.99] disabled:opacity-50 lg:min-w-[7.5rem] lg:w-auto"
              >
                انصراف
              </button>
            </div>
          }
        >
          <div className="flex flex-col items-center px-6 pb-4 pt-5 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 ring-1 ring-red-100">
              <LogOut className="h-7 w-7 text-red-600" strokeWidth={1.75} />
            </div>
            <p className="wibe-body font-semibold text-foreground">از حساب خارج می‌شوید؟</p>
            <p className="mt-2 max-w-[18rem] wibe-small leading-relaxed text-wibe-secondary">
              لیست‌ها و ذخیره‌های شما بعد از ورود مجدد در دسترس خواهند بود.
            </p>
          </div>
        </BottomSheet>
      )}
    </>
  );
}
