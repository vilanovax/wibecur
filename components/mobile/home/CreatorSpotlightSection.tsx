'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { UserPlus, Check, User } from 'lucide-react';
import ListCoverImage from '@/components/shared/ListCoverImage';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import { track } from '@/lib/analytics';
import CuratorBadge from '@/components/shared/CuratorBadge';
import { VIBE_AVATARS } from '@/lib/vibe-avatars';
import { type CuratorLevelKey } from '@/lib/curator';
import HomeSectionTitle from './HomeSectionTitle';

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
        <div className="rounded-lg border border-wibe bg-wibe-card p-5 h-48 animate-pulse" />
      </section>
    );
  }

  if (!data) return null;

  const c = data.creator;
  const levelKey = (c.curatorLevel || 'EXPLORER') as CuratorLevelKey;
  const vibeAvatar =
    c.avatarType === 'DEFAULT' && c.avatarId ? VIBE_AVATARS.find((a) => a.id === c.avatarId) : null;

  return (
    <section className="mb-6 px-4">
      <HomeSectionTitle icon="🏆" title="کیوریتور منتخب" subtitle="لیست‌های برتر از یک سازنده" />

      <div className="rounded-lg border border-wibe bg-wibe-card shadow-card overflow-hidden">
        <div className="p-5">
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-wibe bg-gray-100">
              {vibeAvatar ? (
                <div className={`w-full h-full flex items-center justify-center text-3xl ${vibeAvatar.bgClass}`}>
                  {vibeAvatar.emoji}
                </div>
              ) : c.image ? (
                <ImageWithFallback
                  src={c.image}
                  alt={c.name || ''}
                  className="w-full h-full object-cover"
                  fallbackIcon={(c.name?.[0] || '?').toUpperCase()}
                  fallbackClassName="w-full h-full bg-primary/10 text-primary font-bold flex items-center justify-center text-2xl"
                  placeholderSize="square"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-bold text-2xl">
                  {(c.name?.[0] || '?').toUpperCase()}
                </div>
              )}
            </div>
            <p className="wibe-small font-semibold text-foreground mt-3">{c.name || 'کاربر'}</p>
            <CuratorBadge level={levelKey} size="small" glow={false} className="mt-1" />
            {c.bio && <p className="wibe-small text-wibe-secondary mt-2 line-clamp-2 max-w-md">{c.bio}</p>}
            <p className="wibe-caption text-wibe-secondary mt-2">
              {c.listCount} لیست · {c.totalLikes.toLocaleString('fa-IR')} لایک
            </p>
          </div>

          <div className="flex gap-3 mt-4">
            <Link
              href={c.username ? `/u/${encodeURIComponent(c.username)}` : '#'}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-md border border-wibe text-primary font-semibold wibe-small"
            >
              <User className="w-5 h-5" />
              پروفایل
            </Link>
            {session?.user?.id && session.user.id !== c.userId && (
              <button
                type="button"
                onClick={handleFollow}
                disabled={following}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-md wibe-small font-semibold transition-colors ${
                  following ? 'bg-gray-100 text-wibe-secondary' : 'bg-primary text-white'
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
                    دنبال کردن
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {data.lists.length > 0 && (
          <div className="border-t border-wibe px-4 py-3">
            <p className="wibe-caption text-wibe-secondary mb-2">لیست‌های برتر</p>
            <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-1">
              {data.lists.map((list) => (
                <Link
                  key={list.id}
                  href={`/lists/${list.slug}`}
                  className="flex-shrink-0 w-28 rounded-md overflow-hidden border border-wibe bg-wibe-surface"
                >
                  <div className="aspect-[3/4] w-full bg-gray-200 relative">
                    <ListCoverImage
                      coverImage={list.coverImage}
                      title={list.title}
                      slug={list.slug}
                      className="w-full h-full object-cover"
                      fallbackIcon={list.categoryIcon ?? '📋'}
                      fallbackClassName="w-full h-full flex items-center justify-center bg-gray-200 text-2xl"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                      <p className="text-white wibe-caption font-medium line-clamp-2">{list.title}</p>
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
