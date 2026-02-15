'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { UserPlus, Check, User } from 'lucide-react';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import { track } from '@/lib/analytics';
import CuratorBadge from '@/components/shared/CuratorBadge';
import { VIBE_AVATARS } from '@/lib/vibe-avatars';
import { getLevelConfig, type CuratorLevelKey } from '@/lib/curator';

interface SpotlightList {
  id: string;
  title: string;
  slug: string;
  coverImage: string | null;
  likeCount: number;
  saveCount: number;
  itemCount: number;
  categoryName: string | null;
  categoryIcon: string | null;
}

interface SpotlightData {
  id: string;
  userId: string;
  type: string;
  endDate: string;
  creator: {
    userId: string;
    name: string | null;
    username: string | null;
    image: string | null;
    bio: string | null;
    avatarType: string | null;
    avatarId: string | null;
    curatorLevel: string;
    viralCount: number;
    totalLikes: number;
    listCount: number;
  };
  lists: SpotlightList[];
}

async function fetchSpotlightCurrent(): Promise<SpotlightData | null> {
  const res = await fetch('/api/spotlight/current');
  const json = await res.json();
  return json.success && json.data ? json.data : null;
}

export default function CreatorSpotlightSection() {
  const { data: session } = useSession();
  const { data, isLoading: loading } = useQuery({
    queryKey: ['spotlight', 'current'],
    queryFn: fetchSpotlightCurrent,
    staleTime: 10 * 60 * 1000,
  });
  const [following, setFollowing] = useState(false);

  const handleFollow = async () => {
    if (!data?.creator?.userId || following) return;
    try {
      const res = await fetch(`/api/follow/${data.creator.userId}`, { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        setFollowing(true);
        track('follow', { targetUserId: data.creator.userId });
      }
    } catch {
      // ignore
    }
  };

  if (loading) {
    return (
      <section className="mb-6 px-4">
        <div className="h-6 w-52 bg-gray-200 rounded animate-pulse mb-3" />
        <div className="rounded-2xl border border-gray-100 bg-white p-5 h-56 animate-pulse" />
      </section>
    );
  }

  if (!data) return null;

  const c = data.creator;
  const levelKey = (c.curatorLevel || 'EXPLORER') as CuratorLevelKey;
  const levelConfig = getLevelConfig(levelKey);
  const vibeAvatar =
    c.avatarType === 'DEFAULT' && c.avatarId ? VIBE_AVATARS.find((a) => a.id === c.avatarId) : null;

  return (
    <section className="mb-6 px-4">
      <h2 className="text-[18px] font-semibold leading-[1.4] text-gray-900 mb-1 flex items-center gap-2">
        <span>🏆</span>
        کیوریتور منتخب امروز
      </h2>
      <p className="text-[13px] text-gray-500/80 leading-[1.6] mb-3">اقتصاد کیوریشن</p>

      <div className="rounded-[18px] border-2 border-[#7C3AED]/20 bg-white shadow-vibe-card overflow-hidden">
        <div className="p-5">
          <div className="flex flex-col items-center text-center">
            <div className="relative">
              <div
                className={`absolute -inset-2 rounded-full blur-lg opacity-60 ${levelConfig.glowClass}`}
                aria-hidden
              />
              <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-white bg-gray-100 shadow-lg">
                {vibeAvatar ? (
                  <div
                    className={`w-full h-full flex items-center justify-center text-3xl ${vibeAvatar.bgClass}`}
                  >
                    {vibeAvatar.emoji}
                  </div>
                ) : c.image ? (
                  <ImageWithFallback
                    src={c.image}
                    alt={c.name || ''}
                    className="w-full h-full object-cover"
                    fallbackIcon={(c.name?.[0] || '?').toUpperCase()}
                    fallbackClassName="w-full h-full bg-gradient-to-br from-[#7C3AED] to-[#9333EA] text-white font-bold flex items-center justify-center text-2xl"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#7C3AED] to-[#9333EA] text-white font-bold text-2xl">
                    {(c.name?.[0] || '?').toUpperCase()}
                  </div>
                )}
              </div>
            </div>
            <p className="font-semibold text-[15px] leading-[1.4] text-gray-900 mt-3">{c.name || 'کاربر'}</p>
            <CuratorBadge
              level={levelKey}
              size="small"
              glow={false}
              className="mt-1"
            />
            {c.bio && (
              <p className="text-sm text-gray-600 mt-2 line-clamp-2 max-w-md">{c.bio}</p>
            )}
            <p className="text-xs text-gray-500 mt-2">
              🔥 {c.viralCount} وایرال · ❤️ {c.totalLikes.toLocaleString('fa-IR')} لایک
            </p>
          </div>

          <div className="flex gap-3 mt-4">
            <Link
              href={c.username ? `/u/${encodeURIComponent(c.username)}` : '#'}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-[#7C3AED]/30 text-[#7C3AED] font-semibold text-sm"
            >
              <User className="w-5 h-5" />
              مشاهده پروفایل
            </Link>
            {session?.user?.id && session.user.id !== c.userId && (
              <button
                type="button"
                onClick={handleFollow}
                disabled={following}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-colors ${
                  following ? 'bg-gray-100 text-gray-500' : 'bg-[#7C3AED] text-white active:opacity-90'
                }`}
              >
                {following ? (
                  <>
                    <Check className="w-5 h-5" />
                    دنبال می‌کنی
                  </>
                ) : (
                  <>
                    <UserPlus className="w-5 h-5" />
                    Follow
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {data.lists.length > 0 && (
          <div className="border-t border-gray-100 px-4 py-3">
            <p className="text-xs font-medium text-gray-500 mb-2">لیست‌های برتر</p>
            <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-1">
              {data.lists.map((list) => (
                <Link
                  key={list.id}
                  href={`/lists/${list.slug}`}
                  className="flex-shrink-0 w-28 rounded-xl overflow-hidden border border-gray-100 bg-gray-50 active:opacity-95"
                >
                  <div className="aspect-[3/4] w-full bg-gray-200 relative">
                    {list.coverImage ? (
                      <ImageWithFallback
                        src={list.coverImage}
                        alt={list.title}
                        className="w-full h-full object-cover"
                        fallbackIcon="📋"
                        fallbackClassName="w-full h-full flex items-center justify-center bg-gray-200 text-2xl"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl text-gray-300">
                        📋
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                      <p className="text-white text-xs font-medium line-clamp-2 drop-shadow">
                        {list.title}
                      </p>
                      <p className="text-white/90 text-[10px] mt-0.5">
                        ❤️ {list.likeCount.toLocaleString('fa-IR')}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
