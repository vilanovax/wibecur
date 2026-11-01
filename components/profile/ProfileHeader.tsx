'use client';

import { useEffect, useRef, useState, type ComponentType } from 'react';
import { signOut } from 'next-auth/react';
import {
  Edit2,
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
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

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
  const likesReceived =
    user.creatorStats?.totalLikesReceived ?? user.stats?.likes ?? 0;
  const savesReceived = user.creatorStats?.totalSavesReceived ?? 0;
  const showOwnerStats = isOwner;
  const showPublicFollowers = !isOwner && followersCount != null;

  const statClass = (n: number) =>
    n > 0
      ? 'wibe-body font-bold tabular-nums text-foreground'
      : 'wibe-body font-semibold tabular-nums text-muted-foreground/70';

  return (
    <>
      <div className="px-4 pb-3 pt-3 lg:px-5 lg:pb-4 lg:pt-4">
        <div className="flex items-start gap-3">
          <div className="size-16 shrink-0 overflow-hidden rounded-full border border-border bg-muted shadow-vibe-sm lg:size-20">
            {vibeAvatar ? (
              <VibeAvatarDisplay avatar={vibeAvatar} size={80} className="h-full w-full" />
            ) : showUploadedAvatar || user.image ? (
              <ImageWithFallback
                src={user.image!}
                alt={user.name || user.email || 'Avatar'}
                className="h-full w-full object-cover"
                fallbackIcon={(user.name?.[0] || user.email?.[0] || '?').toUpperCase()}
                fallbackClassName="flex h-full w-full items-center justify-center bg-muted text-xl font-semibold text-foreground"
                priority
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-muted text-xl font-semibold text-foreground">
                {(user.name?.[0] || user.email?.[0] || '?').toUpperCase()}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1 pt-0.5 text-start">
            <h1 className="truncate wibe-h3 font-bold text-foreground">
              {user.name || 'کاربر بدون نام'}
            </h1>
            <p className="mt-0.5 truncate text-start wibe-caption font-medium text-muted-foreground">
              <span dir="ltr">@{displayUsername}</span>
            </p>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center rounded-full bg-brand/10 px-2 py-0.5 wibe-caption font-medium text-brand">
                سطح {levelShort}
              </span>
              {isElite && user.showBadge !== false && (
                <span className="inline-flex items-center rounded-full bg-warning/10 px-2 py-0.5 wibe-caption font-medium text-warning">
                  کیوریتور برتر
                </span>
              )}
            </div>
          </div>

          {isOwner ? (
            <div className="flex shrink-0 items-start gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={openEdit}
                className="hidden h-11 lg:inline-flex"
              >
                <Edit2 />
                ویرایش
              </Button>
              <div className="relative" ref={menuRef}>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setMenuOpen((o) => !o)}
                className="size-11 rounded-full text-muted-foreground"
                aria-label="منوی پروفایل"
                aria-expanded={menuOpen}
                aria-haspopup="menu"
              >
                <MoreHorizontal />
              </Button>
              {menuOpen ? (
                <Card
                  role="menu"
                  className="absolute inset-e-0 top-12 z-30 min-w-44 overflow-hidden bg-popover py-1 shadow-vibe-floating"
                >
                  <Button
                    type="button"
                    role="menuitem"
                    variant="ghost"
                    size="lg"
                    onClick={openEdit}
                    className="w-full justify-start rounded-none"
                  >
                    <Edit2 aria-hidden />
                    ویرایش پروفایل
                  </Button>
                  <Button
                    type="button"
                    role="menuitem"
                    variant="ghost"
                    size="lg"
                    onClick={requestLogout}
                    disabled={isLoggingOut}
                    className="w-full justify-start rounded-none text-destructive"
                  >
                    {isLoggingOut ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    ) : (
                      <LogOut className="h-4 w-4" aria-hidden />
                    )}
                    خروج از حساب
                  </Button>
                </Card>
              ) : null}
              </div>
            </div>
          ) : onFollowToggle ? (
            <Button
              type="button"
              onClick={onFollowToggle}
              disabled={followLoading}
              variant={isFollowing ? 'outline' : 'brand'}
              size="lg"
              className="shrink-0 rounded-full"
            >
              {followLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isFollowing ? (
                <>
                  <Check className="h-4 w-4" />
                  دنبال می‌کنی
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  دنبال کردن
                </>
              )}
            </Button>
          ) : null}
        </div>

        {user.bio?.trim() && user.bio.trim() !== 'null' && user.bio.trim() !== 'undefined' ? (
          <p className="mt-3 text-start wibe-small leading-relaxed text-muted-foreground line-clamp-2 whitespace-pre-wrap wrap-break-word">
            {user.bio.trim()}
          </p>
        ) : isOwner ? (
          <button
            type="button"
            onClick={openEdit}
            className="mt-3 flex h-11 w-full items-center justify-center rounded-xl border border-dashed border-border bg-muted/40 px-3 text-start transition-colors hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
          >
            <span className="wibe-caption text-muted-foreground">افزودن بیو کوتاه…</span>
          </button>
        ) : null}

          {showOwnerStats ? (
            <div
              className="mt-3 grid grid-cols-3 gap-1 rounded-xl bg-muted/50 px-1 py-2.5"
              aria-label="آمار پروفایل"
            >
              <div className="text-center">
                <p className={statClass(listsCreated)}>{formatStat(listsCreated)}</p>
                <p className="mt-0.5 wibe-caption text-muted-foreground">لیست</p>
              </div>
              <div className="border-s border-e border-border/70 text-center">
                <p className={statClass(savesReceived)}>{formatStat(savesReceived)}</p>
                <p className="mt-0.5 wibe-caption text-muted-foreground">ذخیره</p>
              </div>
              <div className="text-center">
                <p className={statClass(likesReceived)}>{formatStat(likesReceived)}</p>
                <p className="mt-0.5 wibe-caption text-muted-foreground">لایک</p>
              </div>
            </div>
          ) : null}

          {showPublicFollowers ? (
            <p className="mt-2.5 wibe-caption text-muted-foreground">
              {followersCount!.toLocaleString('fa-IR')} دنبال‌کننده
            </p>
          ) : null}
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
            <div className="flex flex-col gap-2 px-4 py-3 lg:flex-row lg:justify-start">
              <Button
                type="button"
                variant="destructive"
                size="lg"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="w-full lg:w-auto"
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
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => setShowLogoutConfirm(false)}
                disabled={isLoggingOut}
                className="w-full lg:w-auto"
              >
                انصراف
              </Button>
            </div>
          }
        >
          <div className="flex flex-col items-center px-6 pb-4 pt-5 text-center">
            <div className="mb-4 flex size-14 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
              <LogOut className="size-7" strokeWidth={1.75} />
            </div>
            <p className="wibe-body font-semibold text-foreground">از حساب خارج می‌شوید؟</p>
            <p className="mt-2 max-w-72 wibe-small leading-relaxed text-muted-foreground">
              لیست‌ها و ذخیره‌های شما بعد از ورود مجدد در دسترس خواهند بود.
            </p>
          </div>
        </BottomSheet>
      )}
    </>
  );
}
