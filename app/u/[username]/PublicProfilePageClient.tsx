'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { List, Users, UserPlus, Bookmark, Check, Loader2 } from 'lucide-react';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import ListCardStats from '@/components/shared/ListCardStats';
import CuratorBadge from '@/components/shared/CuratorBadge';
import { VIBE_AVATARS } from '@/lib/vibe-avatars';
import { getLevelConfig, type CuratorLevelKey } from '@/lib/curator';
import Toast from '@/components/shared/Toast';

interface PublicProfilePageClientProps {
  username: string;
  currentUserId: string | null;
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
    updatedAt: Date;
    isFeatured?: boolean;
    categories?: { name: string; icon: string } | null;
  }[];
  likedLists: unknown[];
  recentActivity: unknown[];
}

export default function PublicProfilePageClient({
  username,
  currentUserId,
}: PublicProfilePageClientProps) {
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFollowing, setIsFollowing] = useState(false);
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
    fetchProfile();
  }, [username]);

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
  const levelConfig = getLevelConfig(levelKey);
  const vibeAvatar =
    data.user.avatarType === 'DEFAULT' && data.user.avatarId
      ? VIBE_AVATARS.find((a) => a.id === data.user.avatarId)
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
      <div className="min-h-screen bg-wibe-surface">
        <div className="relative rounded-b-lg overflow-hidden bg-primary pb-6 pt-8 px-4">
          <div className="relative z-10 flex flex-col items-center">
            <div className="relative">
              <div className={`absolute -inset-2 rounded-full blur-lg ${levelConfig.glowClass} opacity-40`} />
              <div className="relative w-24 h-24 rounded-full border-4 border-wibe-card overflow-hidden bg-wibe-card shadow-sm">
                {vibeAvatar ? (
                  <div className={`w-full h-full flex items-center justify-center text-4xl ${vibeAvatar.bgClass}`}>
                    {vibeAvatar.emoji}
                  </div>
                ) : data.user.image ? (
                  <ImageWithFallback
                    src={data.user.image}
                    alt={data.user.name || ''}
                    className="w-full h-full object-cover"
                    fallbackIcon={(data.user.name?.[0] || '?').toUpperCase()}
                    fallbackClassName="w-full h-full bg-primary text-white text-2xl font-bold flex items-center justify-center"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary text-white text-2xl font-bold">
                    {(data.user.name?.[0] || '?').toUpperCase()}
                  </div>
                )}
              </div>
            </div>
            <h1 className="wibe-h2 text-white mt-4 text-center">{data.user.name || 'کاربر'}</h1>
            <p className="wibe-small text-white/85">@{data.user.username}</p>
            {data.user.bio && (
              <p className="wibe-small text-white/90 text-center mt-2 max-w-md line-clamp-2">{data.user.bio}</p>
            )}
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              {data.user.showBadge !== false && (
                <CuratorBadge
                  level={levelKey}
                  size="small"
                  showIcon
                  showLabel
                  className="bg-white/15 text-white border border-white/25"
                />
              )}
              {data.user.globalRank != null && data.user.globalRank <= 50 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-pill bg-warning text-white wibe-caption font-semibold">
                  Top {data.user.globalRank <= 10 ? 10 : 50}
                </span>
              )}
              {data.user.monthlyRank != null && data.user.monthlyRank <= 10 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-pill bg-wibe-card/20 text-white wibe-caption font-semibold border border-white/30">
                  برتر ماه
                </span>
              )}
              {data.user.spotlightActive && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-pill bg-warning text-white wibe-caption font-semibold">
                  Spotlight
                  {data.user.spotlightEndDate &&
                    ` · ${new Date(data.user.spotlightEndDate).toLocaleDateString('fa-IR', { month: 'long', year: 'numeric' })}`}
                </span>
              )}
            </div>

            <div className="mt-4 flex gap-3">
              {isOwnProfile ? (
                <Link
                  href="/profile"
                  className="flex items-center gap-2 px-6 py-2.5 bg-wibe-card rounded-md shadow-sm text-primary wibe-small font-semibold"
                >
                  ویرایش پروفایل
                </Link>
              ) : currentUserId ? (
                <button
                  type="button"
                  onClick={handleFollowToggle}
                  disabled={followLoading}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-md wibe-small font-semibold transition-all active:scale-[0.98] disabled:opacity-50 ${
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
            </div>
          </div>
        </div>

        <div className="px-4 pt-4">
          <div className="rounded-lg bg-wibe-card shadow-sm border border-wibe p-4 grid grid-cols-4 gap-2">
            {statItems.map(({ icon: Icon, value, label, highlight }) => (
              <div key={label} className="flex flex-col items-center">
                <Icon className={`w-5 h-5 mb-1 ${highlight ? 'text-primary' : 'text-wibe-secondary'}`} />
                <span className={`text-h3 font-bold ${highlight ? 'text-primary' : 'text-foreground'}`}>
                  {value.toLocaleString('fa-IR')}
                </span>
                <span className="wibe-caption text-wibe-secondary">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {data.topTags.length > 0 && (
          <section className="px-4 mt-6">
            <h2 className="wibe-h3 mb-3">سلیقه</h2>
            <div className="rounded-lg bg-wibe-card p-4 shadow-sm border border-wibe space-y-2">
              {data.topTags.map((tag) => (
                <div key={tag.slug} className="flex items-center gap-2">
                  <span className="text-lg">{tag.icon}</span>
                  <span className="wibe-small text-foreground flex-1">{tag.name}</span>
                  <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${tag.percent}%` }}
                    />
                  </div>
                  <span className="wibe-caption text-wibe-secondary w-8">{tag.percent}%</span>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="px-4 mt-6 pb-8">
          <h2 className="wibe-h3 mb-3">لیست‌های عمومی</h2>
          <div className="grid grid-cols-2 gap-3">
            {data.publicLists.map((list) => (
              <Link
                key={list.id}
                href={`/lists/${list.slug}`}
                className="block rounded-lg bg-wibe-card overflow-hidden border border-wibe shadow-sm active:scale-[0.99] transition-transform"
              >
                <div className="aspect-[4/3] bg-gray-200 relative overflow-hidden">
                  <ImageWithFallback
                    src={list.coverImage ?? ''}
                    alt={list.title}
                    className="w-full h-full object-cover"
                    fallbackIcon="📋"
                    fallbackClassName="w-full h-full flex items-center justify-center text-2xl bg-gray-200"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
                  {list.isFeatured && (
                    <span className="absolute top-2 right-2 px-2 py-0.5 rounded-pill bg-warning text-white wibe-caption font-semibold">
                      ویژه
                    </span>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 p-2">
                    <ListCardStats saves={list.saves} itemCount={list.items} variant="overlay" />
                  </div>
                </div>
                <div className="p-2.5">
                  <h3 className="wibe-small font-semibold text-foreground line-clamp-2">{list.title}</h3>
                </div>
              </Link>
            ))}
          </div>
          {data.publicLists.length === 0 && (
            <p className="text-center wibe-small text-wibe-secondary py-8">هنوز لیست عمومی ندارد</p>
          )}
        </section>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}
