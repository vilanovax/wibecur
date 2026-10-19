'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { List, Users, UserPlus, Bookmark, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Spinner } from '@/components/ui/spinner';
import ListCoverImage from '@/components/shared/ListCoverImage';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import ListCardStats from '@/components/shared/ListCardStats';
import CuratorBadge from '@/components/shared/CuratorBadge';
import { resolveVibeAvatar } from '@/lib/vibe-avatars';
import VibeAvatarDisplay from '@/components/shared/VibeAvatarDisplay';
import { getLevelConfig, type CuratorLevelKey } from '@/lib/curator';
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
  const router = useRouter();
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
        <Spinner size="lg" label="در حال بارگذاری…" className="text-foreground" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <p className="mb-4 text-center text-base text-muted-foreground">{error}</p>
        <Button type="button" variant="brand" size="lg" onClick={fetchProfile}>
          تلاش مجدد
        </Button>
      </div>
    );
  }

  if (!data) return null;

  const isOwnProfile = currentUserId === data.user.id;
  const levelKey = (data.user.curatorLevel ?? 'EXPLORER') as CuratorLevelKey;
  const levelConfig = getLevelConfig(levelKey);
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
      <div className="min-h-screen bg-background">
        <div className="relative overflow-hidden rounded-b-lg bg-primary px-4 pb-6 pt-8 lg:rounded-xl lg:mx-0 lg:px-8 lg:pb-8 lg:pt-10">
          <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center lg:max-w-none lg:flex-row lg:items-end lg:justify-center lg:gap-8">
            <div className="relative">
              <div className={`absolute -inset-2 rounded-full blur-lg ${levelConfig.glowClass} opacity-40`} />
              <div className="relative size-24 overflow-hidden rounded-full border-4 border-popover bg-popover shadow-sm">
                {vibeAvatar ? (
                  <VibeAvatarDisplay avatar={vibeAvatar} size={96} className="h-full w-full" />
                ) : data.user.image ? (
                  <ImageWithFallback
                    src={data.user.image}
                    alt={data.user.name || ''}
                    className="w-full h-full object-cover"
                    fallbackIcon={(data.user.name?.[0] || '?').toUpperCase()}
                    fallbackClassName="flex h-full w-full items-center justify-center bg-brand text-2xl font-bold text-brand-foreground"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-brand text-2xl font-bold text-brand-foreground">
                    {(data.user.name?.[0] || '?').toUpperCase()}
                  </div>
                )}
              </div>
            </div>
            <div className="mt-4 flex flex-col items-center text-center lg:mt-0 lg:flex-1 lg:items-start lg:text-start">
            <h1 className="wibe-h2 text-background lg:wibe-h1">{data.user.name || 'کاربر'}</h1>
            <p className="wibe-small text-background/85">@{data.user.username}</p>
            {data.user.bio && (
              <p className="mt-2 line-clamp-3 max-w-md wibe-small text-background/90 lg:max-w-xl">{data.user.bio}</p>
            )}
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2 lg:justify-start">
              {data.user.showBadge !== false && (
                <CuratorBadge
                  level={levelKey}
                  size="small"
                  showIcon
                  showLabel
                  className="bg-background/15 text-background border border-background/40"
                />
              )}
              {data.user.globalRank != null && data.user.globalRank <= 50 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-warning px-2.5 py-1 text-sm font-semibold text-foreground">
                  {data.user.globalRank <= 10 ? '۱۰' : '۵۰'} برتر
                </span>
              )}
              {data.user.monthlyRank != null && data.user.monthlyRank <= 10 && (
                <span className="inline-flex items-center gap-1 rounded-full border border-background/40 bg-background/20 px-2.5 py-1 text-sm font-semibold text-background">
                  برتر ماه
                </span>
              )}
              {data.user.spotlightActive && (
                <span className="inline-flex items-center gap-1 rounded-full bg-warning px-2.5 py-1 text-sm font-semibold text-foreground">
                  ویترین
                  {data.user.spotlightEndDate &&
                    ` · ${new Date(data.user.spotlightEndDate).toLocaleDateString('fa-IR', { month: 'long', year: 'numeric' })}`}
                </span>
              )}
            </div>

            <div className="mt-4 flex gap-3 lg:justify-start">
              {isOwnProfile ? (
                <Button variant="secondary" size="lg" onClick={() => router.push('/profile')}>
                  ویرایش پروفایل
                </Button>
              ) : currentUserId ? (
                <Button
                  type="button"
                  variant={isFollowing ? 'outline' : 'secondary'}
                  size="lg"
                  onClick={handleFollowToggle}
                  disabled={followLoading}
                  className={isFollowing ? 'border-background/50 bg-background/20 text-background hover:bg-background/30' : undefined}
                >
                  {followLoading ? (
                    <Spinner size="sm" className="text-current" />
                  ) : isFollowing ? (
                    <>
                      <Check className="size-4" />
                      دنبال می‌کنی
                    </>
                  ) : (
                    <>
                      <UserPlus className="size-4" />
                      دنبال کردن
                    </>
                  )}
                </Button>
              ) : null}
            </div>
            </div>
          </div>
        </div>

        <div className="px-4 pt-4 lg:px-0">
          <Card className="grid grid-cols-4 gap-2 bg-popover p-4 lg:gap-4">
            {statItems.map(({ icon: Icon, value, label, highlight }) => (
              <div key={label} className="flex flex-col items-center">
                <Icon className={`mb-1 size-5 ${highlight ? 'text-brand' : 'text-muted-foreground'}`} />
                <span className={`text-h3 font-bold ${highlight ? 'text-brand' : 'text-foreground'}`}>
                  {value.toLocaleString('fa-IR')}
                </span>
                <span className="text-xs text-muted-foreground">{label}</span>
              </div>
            ))}
          </Card>
        </div>

        {data.profilePicks && data.profilePicks.length > 0 && (
          <div className="mt-6 px-4 lg:px-0">
            <ProfilePicksSection
              userId={data.user.id}
              isOwner={isOwnProfile}
              publicShelves={data.profilePicks}
            />
          </div>
        )}

        {data.topTags.length > 0 && (
          <section className="mt-6 px-4 lg:px-0">
            <h2 className="wibe-h3 mb-3">سلیقه</h2>
            <Card className="space-y-2 bg-popover p-4">
              {data.topTags.map((tag) => (
                <div key={tag.slug} className="flex items-center gap-2">
                  <span className="text-lg">{tag.icon}</span>
                  <span className="wibe-small text-foreground flex-1">{tag.name}</span>
                  <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-brand"
                      style={{ width: `${tag.percent}%` }}
                    />
                  </div>
                  <span className="w-8 text-sm text-muted-foreground">{tag.percent.toLocaleString('fa-IR')}٪</span>
                </div>
              ))}
            </Card>
          </section>
        )}

        <section className="mt-6 px-4 pb-8 lg:px-0">
          <h2 className="wibe-h3 mb-3">لیست‌های عمومی</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-2 lg:grid-cols-3 lg:gap-4 xl:grid-cols-4">
            {data.publicLists.map((list) => (
              <Link
                key={list.id}
                href={`/lists/${list.slug}`}
                className="block"
              >
                <Card className="overflow-hidden bg-popover p-0">
                <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                  <ListCoverImage
                    coverImage={list.coverImage}
                    title={list.title}
                    slug={list.slug}
                    categorySlug={list.categories?.slug}
                    className="w-full h-full object-cover"
                    fallbackIcon={list.categories?.icon ?? '📋'}
                    fallbackClassName="flex h-full w-full items-center justify-center bg-muted text-2xl"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
                  {list.isFeatured && (
                    <span className="absolute end-2 top-2 rounded-full bg-warning px-2 py-0.5 text-sm font-semibold text-foreground">
                      ویژه
                    </span>
                  )}
                  <div className="absolute inset-x-0 bottom-0 p-2">
                    <ListCardStats saves={list.saves} itemCount={list.items} variant="overlay" />
                  </div>
                </div>
                <div className="p-2.5">
                  <h3 className="line-clamp-2 text-sm font-semibold text-foreground">{list.title}</h3>
                </div>
                </Card>
              </Link>
            ))}
          </div>
          {data.publicLists.length === 0 && (
            <EmptyState title="هنوز لیست عمومی ندارد" description="وقتی لیستی عمومی شود، اینجا دیده می‌شود." />
          )}
        </section>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}
