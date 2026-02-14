'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { UserPlus, Check } from 'lucide-react';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import { track } from '@/lib/analytics';
import CuratorBadge from '@/components/shared/CuratorBadge';
import { VIBE_AVATARS } from '@/lib/vibe-avatars';
import type { CuratorLevelKey } from '@/lib/curator';

interface SpotlightCreator {
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
}

interface PersonalizedSpotlightResponse {
  creator: SpotlightCreator | null;
  explanation: string | null;
}

async function fetchPersonalizedSpotlight(): Promise<PersonalizedSpotlightResponse> {
  const res = await fetch('/api/spotlight/personalized');
  const json = await res.json();
  if (json.success && json.data?.creator)
    return { creator: json.data.creator, explanation: json.data.explanation ?? null };
  return { creator: null, explanation: null };
}

export default function PersonalizedSpotlightSection() {
  const { data: session, status } = useSession();
  const { data, isLoading: loading } = useQuery({
    queryKey: ['spotlight', 'personalized'],
    queryFn: fetchPersonalizedSpotlight,
    enabled: status === 'authenticated',
    staleTime: 10 * 60 * 1000,
  });
  const creator = data?.creator ?? null;
  const explanation = data?.explanation ?? null;
  const [following, setFollowing] = useState(false);

  const handleFollow = async () => {
    if (!creator || following) return;
    try {
      const res = await fetch(`/api/follow/${creator.userId}`, { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        setFollowing(true);
        track('follow', { targetUserId: creator.userId });
      }
    } catch {
      // ignore
    }
  };

  if (status !== 'authenticated' || (!creator && !loading)) return null;

  if (loading) {
    return (
      <section className="mb-8 px-4">
        <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-3" />
        <div className="rounded-2xl border border-gray-100 bg-white p-5 h-44 animate-pulse" />
      </section>
    );
  }

  if (!creator) return null;

  const vibeAvatar =
    creator.avatarType === 'DEFAULT' && creator.avatarId
      ? VIBE_AVATARS.find((a) => a.id === creator.avatarId)
      : null;

  return (
    <section className="mb-8 px-4">
      <h2 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
        <span>✨</span>
        پیشنهاد ویژه برای تو
      </h2>
      <p className="text-sm text-gray-500 mb-3">کیوریتوری که با سلیقه‌ات هم‌خوانه</p>

      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <Link
          href={creator.username ? `/u/${encodeURIComponent(creator.username)}` : '#'}
          className="flex gap-4 p-4 block"
        >
          <div className="flex-shrink-0 w-16 h-16 rounded-full overflow-hidden border-2 border-gray-100 bg-gray-100">
            {vibeAvatar ? (
              <div
                className={`w-full h-full flex items-center justify-center text-3xl ${vibeAvatar.bgClass}`}
              >
                {vibeAvatar.emoji}
              </div>
            ) : creator.image ? (
              <ImageWithFallback
                src={creator.image}
                alt={creator.name || ''}
                className="w-full h-full object-cover"
                fallbackIcon={(creator.name?.[0] || '?').toUpperCase()}
                fallbackClassName="w-full h-full bg-gradient-to-br from-[#7C3AED] to-[#9333EA] text-white font-bold flex items-center justify-center text-xl"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#7C3AED] to-[#9333EA] text-white font-bold text-xl">
                {(creator.name?.[0] || '?').toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-900">{creator.name || 'کاربر'}</p>
            <CuratorBadge
              level={(creator.curatorLevel || 'EXPLORER') as CuratorLevelKey}
              size="small"
              glow={false}
              className="mt-1"
            />
            {creator.topCategories.length > 0 && (
              <p className="text-sm text-gray-500 mt-1.5">
                {creator.topCategories
                  .slice(0, 2)
                  .map((c) => `${c.icon} ${c.name}`)
                  .join(' · ')}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-0.5">
              🔥 {creator.viralCount} وایرال · ❤️ {creator.totalLikes.toLocaleString('fa-IR')} لایک
            </p>
          </div>
        </Link>

        {explanation && (
          <div className="px-4 pb-2">
            <p className="text-sm text-gray-600 bg-gray-50 rounded-xl px-3 py-2 border border-gray-100">
              {explanation}
            </p>
          </div>
        )}

        <div className="px-4 pb-4">
          <button
            type="button"
            onClick={handleFollow}
            disabled={following}
            className={`
              w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-colors
              ${following ? 'bg-gray-100 text-gray-500' : 'bg-[#7C3AED] text-white active:opacity-90'}
            `}
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
        </div>
      </div>
    </section>
  );
}
