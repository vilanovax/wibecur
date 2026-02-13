'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { List, Users, UserPlus, Bookmark, Check, Loader2 } from 'lucide-react';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
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
    } catch (e) {
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
          if (data.stats) setData((d) => d ? { ...d, stats: { ...d.stats, followersCount: json.data.followersCount } } : d);
        }
      } else {
        const res = await fetch(`/api/follow/${data.user.id}`, { method: 'POST' });
        const json = await res.json();
        if (json.success) {
          setIsFollowing(true);
          setToast({ message: 'از این به بعد لیست‌های جدیدش رو می‌بینی 🔥', type: 'success' });
          if (data.stats) setData((d) => d ? { ...d, stats: { ...d.stats, followersCount: json.data.followersCount } } : d);
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
        <Loader2 className="w-10 h-10 text-[#7C3AED] animate-spin mb-4" />
        <p className="text-gray-500 text-sm">در حال بارگذاری...</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <p className="text-gray-600 text-center mb-4">{error}</p>
        <button
          onClick={fetchProfile}
          className="px-5 py-2.5 rounded-xl bg-[#7C3AED] text-white text-sm font-medium"
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
  const vibeAvatar = data.user.avatarType === 'DEFAULT' && data.user.avatarId
    ? VIBE_AVATARS.find((a) => a.id === data.user.avatarId)
    : null;

  return (
    <>
      <div className="min-h-screen bg-[#F8F7FC]">
        {/* Hero */}
        <div className="relative rounded-b-[24px] overflow-hidden bg-gradient-to-b from-[#7C3AED] via-[#8B5CF6] to-[#9333EA] pb-6 pt-8 px-4">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(255,255,255,0.12),transparent)]" />
          <div className="relative z-10 flex flex-col items-center">
            <div className="relative">
              <div className={`absolute -inset-2 rounded-full blur-lg ${levelConfig.glowClass} opacity-50`} />
              <div className="relative w-24 h-24 rounded-full border-4 border-white/90 overflow-hidden bg-white shadow-xl">
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
                    fallbackClassName="w-full h-full bg-gradient-to-br from-[#7C3AED] to-[#9333EA] text-white text-2xl font-bold flex items-center justify-center"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#7C3AED] to-[#9333EA] text-white text-2xl font-bold">
                    {(data.user.name?.[0] || '?').toUpperCase()}
                  </div>
                )}
              </div>
            </div>
            <h1 className="text-xl font-bold text-white mt-4 text-center">
              {data.user.name || 'کاربر'}
            </h1>
            <p className="text-white/80 text-sm">@{data.user.username}</p>
            {data.user.bio && (
              <p className="text-white/90 text-sm text-center mt-2 max-w-md line-clamp-2">
                {data.user.bio}
              </p>
            )}
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              {data.user.showBadge !== false && (
                <CuratorBadge
                  level={levelKey}
                  size="small"
                  showIcon
                  showLabel
                  className="bg-white/20 text-white border border-white/30"
                />
              )}
              {data.user.globalRank != null && data.user.globalRank <= 50 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-400/90 text-amber-900 text-xs font-bold border border-amber-500/50">
                  Top {data.user.globalRank <= 10 ? 10 : 50} Creator
                </span>
              )}
              {data.user.monthlyRank != null && data.user.monthlyRank <= 10 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-violet-500/90 text-white text-xs font-bold border border-violet-600/50">
                  Top Creator – Month
                </span>
              )}
              {data.user.spotlightActive && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-400/90 text-amber-900 text-xs font-bold border border-amber-500/50">
                  🌟 Spotlight
                  {data.user.spotlightEndDate &&
                    ` – ${new Date(data.user.spotlightEndDate).toLocaleDateString('fa-IR', { month: 'long', year: 'numeric' })}`}
                </span>
              )}
            </div>

            {/* Follow / Edit */}
            <div className="mt-4 flex gap-3">
              {isOwnProfile ? (
                <Link
                  href="/profile"
                  className="flex items-center gap-2 px-6 py-2.5 bg-white rounded-[20px] shadow-md text-[#7C3AED] font-medium text-sm"
                >
                  ویرایش پروفایل
                </Link>
              ) : currentUserId ? (
                <button
                  type="button"
                  onClick={handleFollowToggle}
                  disabled={followLoading}
                  className={`
                    flex items-center gap-2 px-6 py-2.5 rounded-[20px] font-medium text-sm
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
                      Following
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      Follow
                    </>
                  )}
                </button>
              ) : null}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="px-4 -mt-2 relative z-20">
          <div className="rounded-2xl bg-white shadow-sm border border-gray-100 p-4 grid grid-cols-4 gap-2">
            <div className="flex flex-col items-center">
              <List className="w-5 h-5 text-[#7C3AED] mb-1" />
              <span className="text-lg font-bold text-gray-900">{data.stats.listsCount}</span>
              <span className="text-xs text-gray-500">لیست</span>
            </div>
            <div className="flex flex-col items-center">
              <Users className="w-5 h-5 text-[#7C3AED] mb-1" />
              <span className="text-lg font-bold text-gray-900">{data.stats.followersCount}</span>
              <span className="text-xs text-gray-500">دنبال‌کننده</span>
            </div>
            <div className="flex flex-col items-center">
              <UserPlus className="w-5 h-5 text-gray-400 mb-1" />
              <span className="text-lg font-bold text-gray-900">{data.stats.followingCount}</span>
              <span className="text-xs text-gray-500">دنبال‌شونده</span>
            </div>
            <div className="flex flex-col items-center">
              <Bookmark className="w-5 h-5 text-amber-500 mb-1" />
              <span className="text-lg font-bold text-gray-900">{data.stats.savedCount}</span>
              <span className="text-xs text-gray-500">ذخیره</span>
            </div>
          </div>
        </div>

        {/* Top Tags */}
        {data.topTags.length > 0 && (
          <section className="px-4 mt-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">سلیقه</h2>
            <div className="rounded-2xl bg-white p-4 shadow-sm border border-gray-100 space-y-2">
              {data.topTags.map((tag) => (
                <div key={tag.slug} className="flex items-center gap-2">
                  <span className="text-lg">{tag.icon}</span>
                  <span className="text-sm text-gray-700 flex-1">{tag.name}</span>
                  <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#7C3AED] rounded-full"
                      style={{ width: `${tag.percent}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 w-8">{tag.percent}%</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Public Lists */}
        <section className="px-4 mt-6 pb-8">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">لیست‌های عمومی</h2>
          <div className="grid grid-cols-2 gap-3">
            {data.publicLists.map((list) => (
              <Link
                key={list.id}
                href={`/lists/${list.slug}`}
                className="block rounded-2xl bg-white overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
                  <ImageWithFallback
                    src={list.coverImage ?? ''}
                    alt={list.title}
                    className="w-full h-full object-cover"
                    fallbackIcon="📋"
                    fallbackClassName="w-full h-full flex items-center justify-center text-2xl"
                  />
                  {list.isFeatured && (
                    <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-amber-400/90 text-amber-900 text-[10px] font-medium">
                      Top
                    </span>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="font-medium text-gray-900 text-sm line-clamp-2">{list.title}</h3>
                  <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-500">
                    <span>{list.items} آیتم</span>
                    <span>·</span>
                    <span>{list.saves} ذخیره</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          {data.publicLists.length === 0 && (
            <p className="text-center text-gray-500 text-sm py-8">هنوز لیست عمومی ندارد</p>
          )}
        </section>
      </div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </>
  );
}
