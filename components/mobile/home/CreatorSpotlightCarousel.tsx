'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import CuratorBadge from '@/components/shared/CuratorBadge';
import { VIBE_AVATARS } from '@/lib/vibe-avatars';
import { getLevelConfig, type CuratorLevelKey } from '@/lib/curator';

interface CreatorItem {
  userId: string;
  name: string | null;
  username: string | null;
  image: string | null;
  avatarType: string | null;
  avatarId: string | null;
  curatorLevel: string;
  totalSaves: number;
}

async function fetchLeaderboard(): Promise<CreatorItem[]> {
  const res = await fetch('/api/leaderboard?type=global');
  const json = await res.json();
  if (!json.success || !Array.isArray(json.data)) return [];
  return json.data.slice(0, 8).map((c: { userId: string; name: string | null; username: string | null; image: string | null; avatarType: string | null; avatarId: string | null; curatorLevel: string; totalSaves?: number }) => ({
    userId: c.userId,
    name: c.name,
    username: c.username,
    image: c.image,
    avatarType: c.avatarType,
    avatarId: c.avatarId,
    curatorLevel: c.curatorLevel ?? 'EXPLORER',
    totalSaves: c.totalSaves ?? 0,
  }));
}

export default function CreatorSpotlightCarousel() {
  const { data: creators = [], isLoading } = useQuery({
    queryKey: ['leaderboard', 'global'],
    queryFn: fetchLeaderboard,
    staleTime: 10 * 60 * 1000,
  });

  if (isLoading && creators.length === 0) {
    return (
      <section className="mb-8">
        <div className="px-4 mb-3">
          <div className="h-5 w-44 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="flex gap-3 px-4 overflow-hidden">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex-shrink-0 w-28 rounded-2xl h-36 bg-gray-100 animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  if (creators.length === 0) return null;

  return (
    <section className="mb-8">
      <div className="px-4 mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <span>🏆</span>
          کیوریتورهای داغ
        </h2>
        <Link href="/leaderboard" className="text-primary text-sm font-medium">
          دیدن رتبه‌بندی کامل
        </Link>
      </div>
      <div className="flex gap-3 overflow-x-auto scrollbar-hide px-4 snap-x snap-mandatory -mx-1">
        {creators.map((c) => {
          const levelKey = (c.curatorLevel || 'EXPLORER') as CuratorLevelKey;
          const vibeAvatar = c.avatarType === 'DEFAULT' && c.avatarId
            ? VIBE_AVATARS.find((a) => a.id === c.avatarId)
            : null;

          return (
            <Link
              key={c.userId}
              href={c.username ? `/u/${encodeURIComponent(c.username)}` : '#'}
              className="flex-shrink-0 w-28 snap-start"
            >
              <div className="rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-sm p-4 text-center">
                <div className="relative w-14 h-14 mx-auto rounded-full overflow-hidden bg-gray-100">
                  {vibeAvatar ? (
                    <div className={`w-full h-full flex items-center justify-center text-2xl ${vibeAvatar.bgClass}`}>
                      {vibeAvatar.emoji}
                    </div>
                  ) : c.image ? (
                    <ImageWithFallback
                      src={c.image}
                      alt={c.name || ''}
                      className="w-full h-full object-cover"
                      fallbackIcon={(c.name?.[0] || '?').toUpperCase()}
                      fallbackClassName="w-full h-full bg-gradient-to-br from-[#7C3AED] to-[#9333EA] text-white font-bold flex items-center justify-center text-lg"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#7C3AED] to-[#9333EA] text-white font-bold text-lg">
                      {(c.name?.[0] || '?').toUpperCase()}
                    </div>
                  )}
                </div>
                <p className="font-semibold text-gray-900 text-sm mt-2 line-clamp-1">
                  {c.name || 'کاربر'}
                </p>
                <CuratorBadge level={levelKey} size="small" glow={false} className="mt-1 justify-center" />
                <p className="text-xs text-gray-500 mt-1">
                  {c.totalSaves.toLocaleString('fa-IR')} ذخیره
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
