'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { List, Users, UserPlus, Bookmark, Check, Loader2 } from 'lucide-react';
import ListCoverImage from '@/components/shared/ListCoverImage';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import ListCardStats from '@/components/shared/ListCardStats';
import CuratorBadge from '@/components/shared/CuratorBadge';
import { resolveVibeAvatar } from '@/lib/vibe-avatars';
import VibeAvatarDisplay from '@/components/shared/VibeAvatarDisplay';
import { type CuratorLevelKey } from '@/lib/curator';
import Toast from '@/components/shared/Toast';
import PublicProfileBreadcrumb from '@/components/profile/PublicProfileBreadcrumb';
import ProfilePicksSection from '@/components/mobile/profile/ProfilePicksSection';
import type { ProfilePickShelfDto } from '@/lib/profile-picks-types';

interface PublicProfilePageClientProps {
  username: string;
  currentUserId: string | null;
  initialData?: ProfileData | null;
}

interface ProfileData {
  user: {
    id: string;
    name: string | null;
    image: string | null;
    username: string;
    bio: string | null;
    avatarType?: string;
    avatarId?: string | null;
    curatorLevel: string;
    curatorScore: number;
    showBadge?: boolean;
    globalRank?: number | null;
    monthlyRank?: number | null;
    spotlightActive?: boolean;
    spotlightEndDate?: string | null;
  };
  stats: {
    listsCount: number;
    followersCount: number;
    followingCount: number;
    savedCount: number;
    reputationScore: number;
  };
  isFollowing: boolean;
  topTags: { name: string; slug: string; icon: string; count: number; percent: number }[];
  featuredLists: unknown[];
  publicLists: {
    id: string;
    title: string;
    slug: string;
    coverImage: string | null;
    saves: number;
    likes: number;
    items: number;
    updatedAt: string | Date;
    isFeatured?: boolean;
    categories?: { name: string; icon: string; slug?: string } | null;
  }[];
  likedLists: unknown[];
  recentActivity: unknown[];
  profilePicks?: ProfilePickShelfDto[];
}

export default function PublicProfilePageClient({
  username,
  currentUserId,
  initialData = null,
}: PublicProfilePageClientProps) {
  const [data, setData] = useState<ProfileData | null>(initialData);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState('');
  const [isFollowing, setIsFollowing] = useState(initialData?.isFollowing ?? false);
  const [followLoading, setFollowLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fetchProfile = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/public-profile/${encodeURIComponent(username)}`);
      const json = await res.json();
      if (!json.success) {
        setError(json.error || 'پروفایل یافت نشد');
        setData(null);
        return;
      }
      setData(json.data);
      setIsFollowing(json.data.isFollowing ?? false);
    } catch {
      setError('خطا در بارگذاری');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialData) return;
    fetchProfile();
  }, [username, initialData]);

  const handleFollowToggle = async () => {
    if (!data?.user?.id || !currentUserId) return;
    setFollowLoading(true);
    try {
      if (isFollowing) {
        const res = await fetch(`/api/follow/${data.user.id}`, { method: 'DELETE' });
        const json = await res.json();
        if (json.success) {
          setIsFollowing(false);
          if (data.stats) {
            setData((d) =>
              d ? { ...d, stats: { ...d.stats, followersCount: json.data.followersCount } } : d
            );
          }
        }
      } else {
        const res = await fetch(`/api/follow/${data.user.id}`, { method: 'POST' });
        const json = await res.json();
        if (json.success) {
          setIsFollowing(true);
          setToast({ message: 'از این به بعد لیست‌های جدیدش رو می‌بینی', type: 'success' });
          if (data.stats) {
            setData((d) =>
              d ? { ...d, stats: { ...d.stats, followersCount: json.data.followersCount } } : d
            );
          }
        } else {
          setToast({ message: json.error || 'خطا', type: 'error' });
        }
      }
    } catch {
      setToast({ message: 'خطا در ارتباط', type: 'error' });
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
        <p className="wibe-small text-wibe-secondary">در حال بارگذاری...</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <p className="wibe-body text-wibe-secondary text-center mb-4">{error}</p>
        <button
          onClick={fetchProfile}
          className="px-5 py-2.5 rounded-md bg-primary text-white wibe-small font-medium hover:bg-primary-dark transition-colors"
        >
          تلاش مجدد
        </button>
      </div>
    );
  }

  if (!data) return null;

  const isOwnProfile = currentUserId === data.user.id;
  const levelKey = (data.user.curatorLevel ?? 'EXPLORER') as CuratorLevelKey;
  const vibeAvatar =
    data.user.avatarType === 'DEFAULT' && data.user.avatarId
      ? resolveVibeAvatar(data.user.avatarId)
      : null;

  const statItems = [
    {
      icon: Bookmark,
      value: data.stats.savedCount,
      label: 'ذخیره',
      highlight: true,
    },
    {
      icon: List,
      value: data.stats.listsCount,
      label: 'لیست',
      highlight: false,
    },
    {
      icon: Users,
      value: data.stats.followersCount,
      label: 'دنبال‌کننده',
      highlight: false,
    },
    {
      icon: UserPlus,
      value: data.stats.followingCount,
      label: 'دنبال‌شونده',
      highlight: false,
    },
  ];

  return (
    <>
      <PublicProfileBreadcrumb username={username} displayName={data.user.name} />
      <div className="min-h-screen bg-wibe-surface pb-4">
        <div className="px-4 pt-2 lg:px-0 lg:pt-3">
          <section className="relative overflow-hidden rounded-2xl bg-primary px-4 pb-8 pt-6 shadow-vibe-hero ring-1 ring-black/5 sm:px-6 sm:pb-9 sm:pt-7 lg:px-8 lg:pb-10 lg:pt-8">
            <div
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_70%_0%,rgba(255,255,255,0.16),transparent_55%)]"
              aria-hidden
            />
            <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center lg:max-w-none lg:flex-row lg:items-end lg:gap-7">
              <div className="relative shrink-0">
                <div className="h-[5.5rem] w-[5.5rem] overflow-hidden rounded-full bg-wibe-card shadow-md ring-4 ring-white/90 sm:h-24 sm:w-24">
                  {vibeAvatar ? (
                    <VibeAvatarDisplay avatar={vibeAvatar} size={96} className="h-full w-full" />
                  ) : data.user.image ? (
                    <ImageWithFallback
                      src={data.user.image}
                      alt={data.user.name || ''}
                      className="h-full w-full object-cover"
                      fallbackIcon={(data.user.name?.[0] || '?').toUpperCase()}
                      fallbackClassName="flex h-full w-full items-center justify-center bg-primary-dark text-2xl font-bold text-white"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-primary-dark text-2xl font-bold text-white">
                      {(data.user.name?.[0] || '?').toUpperCase()}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-3.5 flex w-full flex-col items-center text-center lg:mt-0 lg:flex-1 lg:items-start lg:text-start">
                <h1 className="wibe-h1 text-white drop-shadow-sm">{data.user.name || 'کاربر'}</h1>
                <p className="mt-1 wibe-caption font-medium text-white/80" dir="ltr">
                  @{data.user.username}
                </p>
                {data.user.bio ? (
                  <p className="mt-2.5 line-clamp-2 max-w-md wibe-small leading-relaxed text-white/90 lg:max-w-xl lg:line-clamp-3">
                    {data.user.bio}
                  </p>
                ) : null}

                <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5 lg:justify-start">
                  {data.user.showBadge !== false && (
                    <CuratorBadge
                      level={levelKey}
                      size="small"
                      showIcon
                      showLabel
                      className="border border-white/25 bg-white/15 text-white"
                    />
                  )}
                  {data.user.globalRank != null && data.user.globalRank <= 50 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-warning px-2.5 py-1 wibe-caption font-semibold text-white">
                      Top {data.user.globalRank <= 10 ? 10 : 50}
                    </span>
                  )}
                  {data.user.monthlyRank != null && data.user.monthlyRank <= 10 && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-white/30 bg-white/15 px-2.5 py-1 wibe-caption font-semibold text-white">
                      برتر ماه
                    </span>
                  )}
                  {data.user.spotlightActive && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-warning px-2.5 py-1 wibe-caption font-semibold text-white">
                      Spotlight
                      {data.user.spotlightEndDate &&
                        ` · ${new Date(data.user.spotlightEndDate).toLocaleDateString('fa-IR', { month: 'long', year: 'numeric' })}`}
                    </span>
                  )}
                </div>

                <div className="mt-4 flex w-full max-w-xs flex-col gap-2 sm:max-w-none sm:flex-row sm:justify-center lg:justify-start">
                  {isOwnProfile ? (
                    <Link
                      href="/profile"
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-wibe-card px-6 py-2.5 wibe-small font-semibold text-primary shadow-sm transition-colors hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                    >
                      ویرایش پروفایل
                    </Link>
                  ) : currentUserId ? (
                    <button
                      type="button"
                      onClick={handleFollowToggle}
                      disabled={followLoading}
                      className={`inline-flex items-center justify-center gap-2 rounded-full px-6 py-2.5 wibe-small font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 active:scale-[0.98] disabled:opacity-50 ${
                        isFollowing
                          ? 'border border-white/40 bg-white/15 text-white'
                          : 'bg-wibe-card text-primary shadow-sm hover:bg-white'
                      }`}
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
                    </button>
                  ) : (
                    <Link
                      href={`/login?callbackUrl=${encodeURIComponent(`/u/${username}`)}`}
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-wibe-card px-6 py-2.5 wibe-small font-semibold text-primary shadow-sm transition-colors hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                    >
                      <UserPlus className="h-4 w-4" />
                      ورود برای دنبال کردن
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="relative z-20 -mt-4 px-4 lg:px-0">
          <div className="grid grid-cols-4 divide-x divide-x-reverse divide-wibe/80 overflow-hidden rounded-2xl bg-wibe-card shadow-sm ring-1 ring-wibe/90">
            {statItems.map(({ icon: Icon, value, label, highlight }) => (
              <div key={label} className="flex flex-col items-center px-1 py-3.5 text-center">
                <Icon
                  className={`mb-1.5 h-4 w-4 ${highlight ? 'text-primary' : 'text-wibe-secondary'}`}
                  aria-hidden
                />
                <span
                  className={`wibe-small font-bold tabular-nums leading-none ${
                    highlight ? 'text-primary' : 'text-foreground'
                  }`}
                >
                  {value.toLocaleString('fa-IR')}
                </span>
                <span className="mt-1 wibe-caption text-wibe-secondary">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {data.profilePicks && data.profilePicks.length > 0 ? (
          <div className="mt-5 px-4 lg:px-0">
            <ProfilePicksSection
              userId={data.user.id}
              isOwner={isOwnProfile}
              publicShelves={data.profilePicks}
            />
          </div>
        ) : null}

        {data.topTags.length > 0 ? (
          <section className="mt-5 px-4 lg:px-0">
            <h2 className="mb-3 wibe-h3 text-foreground">سلیقه</h2>
            <div className="space-y-2.5 rounded-2xl bg-wibe-card p-4 shadow-sm ring-1 ring-wibe/90">
              {data.topTags.map((tag) => (
                <div key={tag.slug} className="flex items-center gap-2.5">
                  <span className="text-lg" aria-hidden>
                    {tag.icon}
                  </span>
                  <span className="min-w-0 flex-1 wibe-small font-medium text-foreground">
                    {tag.name}
                  </span>
                  <div className="h-1.5 w-20 overflow-hidden rounded-full bg-wibe-surface">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${tag.percent}%` }}
                    />
                  </div>
                  <span className="w-8 wibe-caption tabular-nums text-wibe-secondary">
                    {tag.percent.toLocaleString('fa-IR')}٪
                  </span>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <section className="mt-5 px-4 pb-8 lg:px-0">
          <h2 className="mb-3 wibe-h3 text-foreground">لیست‌های عمومی</h2>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-4 xl:grid-cols-4">
            {data.publicLists.map((list) => (
              <Link
                key={list.id}
                href={`/lists/${list.slug}`}
                className="block overflow-hidden rounded-2xl bg-wibe-card shadow-sm ring-1 ring-wibe/90 transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 active:scale-[0.99] lg:hover:shadow-md lg:hover:ring-primary/25"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-wibe-surface">
                  <ListCoverImage
                    coverImage={list.coverImage}
                    title={list.title}
                    slug={list.slug}
                    categorySlug={list.categories?.slug}
                    className="h-full w-full object-cover"
                    fallbackIcon={list.categories?.icon ?? '📋'}
                    fallbackClassName="flex h-full w-full items-center justify-center bg-wibe-surface text-2xl"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
                  {list.isFeatured ? (
                    <span className="absolute end-2 top-2 rounded-full bg-warning px-2 py-0.5 wibe-caption font-semibold text-white">
                      ویژه
                    </span>
                  ) : null}
                  <div className="absolute inset-x-0 bottom-0 p-2">
                    <ListCardStats saves={list.saves} itemCount={list.items} variant="overlay" />
                  </div>
                </div>
                <div className="px-2.5 py-2.5 text-start">
                  <h3 className="line-clamp-2 wibe-caption font-semibold leading-snug text-foreground">
                    {list.title}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
          {data.publicLists.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-wibe bg-wibe-card py-10 text-center">
              <p className="wibe-small text-wibe-secondary">هنوز لیست عمومی ندارد</p>
            </div>
          ) : null}
        </section>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}
