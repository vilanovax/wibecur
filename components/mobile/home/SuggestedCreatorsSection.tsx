'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { UserPlus, Check } from 'lucide-react';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import CuratorBadge from '@/components/shared/CuratorBadge';
import { VIBE_AVATARS } from '@/lib/vibe-avatars';
import type { CuratorLevelKey } from '@/lib/curator';

interface SuggestedCreator {
  userId: string;
  name: string | null;
  username: string | null;
  image: string | null;
  avatarType: string | null;
  avatarId: string | null;
  curatorLevel: string;
  topCategories: { slug: string; name: string; icon: string }[];
  totalLikes: number;
  listCount: number;
  viralCount: number;
  isFollowing?: boolean;
}

async function fetchDiscoveryCreators(): Promise<SuggestedCreator[]> {
  const res = await fetch('/api/discovery/creators');
  const json = await res.json();
  return json.success && Array.isArray(json.data) ? json.data : [];
}

export default function SuggestedCreatorsSection() {
  const { status } = useSession();
  const { data: creators = [], isLoading: loading } = useQuery({
    queryKey: ['discovery', 'creators'],
    queryFn: fetchDiscoveryCreators,
    enabled: status === 'authenticated',
    staleTime: 10 * 60 * 1000,
  });
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());

  const handleFollow = async (creatorId: string) => {
    if (followingIds.has(creatorId)) return;
    try {
      const res = await fetch(`/api/follow/${creatorId}`, { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        setFollowingIds((prev) => new Set(prev).add(creatorId));
      }
    } catch {
      // ignore
    }
  };

  if (status !== 'authenticated' || (creators.length === 0 && !loading)) return null;

  if (loading && creators.length === 0) {
    return (
      <section className="mb-8">
        <div className="px-4 mb-3">
          <div className="h-6 w-56 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="flex gap-3 overflow-hidden px-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex-shrink-0 w-[160px] rounded-2xl h-44 bg-gray-100 animate-pulse"
            />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="mb-8">
      <h2 className="px-4 text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
        <span>✨</span>
        کیوریتورهای پیشنهادی برای تو
      </h2>
      <p className="px-4 text-sm text-gray-500 mb-3">بر اساس سلیقه و فعالیتت</p>
      <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
        <div className="flex gap-3 pb-2" style={{ minWidth: 'min-content' }}>
          {creators.map((c) => {
            const isFollowing = c.isFollowing ?? followingIds.has(c.userId);
            const vibeAvatar =
              c.avatarType === 'DEFAULT' && c.avatarId
                ? VIBE_AVATARS.find((a) => a.id === c.avatarId)
                : null;
            return (
              <div
                key={c.userId}
                className="flex-shrink-0 w-[168px] rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden"
              >
                <Link
                  href={c.username ? `/u/${encodeURIComponent(c.username)}` : '#'}
                  className="block p-3"
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-gray-100 bg-gray-100">
                      {vibeAvatar ? (
                        <div
                          className={`w-full h-full flex items-center justify-center text-2xl ${vibeAvatar.bgClass}`}
                        >
                          {vibeAvatar.emoji}
                        </div>
                      ) : c.image ? (
                        <ImageWithFallback
                          src={c.image}
                          alt={c.name || ''}
                          className="w-full h-full object-cover"
                          fallbackIcon={(c.name?.[0] || '?').toUpperCase()}
                          fallbackClassName="w-full h-full bg-gradient-to-br from-[#7C3AED] to-[#9333EA] text-white font-bold flex items-center justify-center"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#7C3AED] to-[#9333EA] text-white font-bold text-lg">
                          {(c.name?.[0] || '?').toUpperCase()}
                        </div>
                      )}
                    </div>
                    <p className="font-semibold text-gray-900 text-sm mt-2 truncate w-full">
                      {c.name || 'کاربر'}
                    </p>
                    <CuratorBadge
                      level={(c.curatorLevel || 'EXPLORER') as CuratorLevelKey}
                      size="small"
                      glow={false}
                      className="mt-1"
                    />
                    {c.topCategories.length > 0 && (
                      <p className="text-xs text-gray-500 mt-1.5 line-clamp-2">
                        {c.topCategories
                          .slice(0, 2)
                          .map((cat) => `${cat.icon} ${cat.name}`)
                          .join(' · ')}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-0.5">
                      ❤️ {c.totalLikes.toLocaleString('fa-IR')} لایک
                    </p>
                  </div>
                </Link>
                <div className="px-3 pb-3">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      handleFollow(c.userId);
                    }}
                    disabled={isFollowing}
                    className={`
                      w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium transition-colors
                      ${isFollowing ? 'bg-gray-100 text-gray-500' : 'bg-[#7C3AED] text-white active:opacity-90'}
                    `}
                  >
                    {isFollowing ? (
                      <>
                        <Check className="w-4 h-4" />
                        دنبال می‌کنی
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        Follow
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
