'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { UserPlus, Check, User } from 'lucide-react';
import ListCoverImage from '@/components/shared/ListCoverImage';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import { track, trackCreatorProfileView } from '@/lib/analytics';
import CuratorBadge from '@/components/shared/CuratorBadge';
import { resolveVibeAvatar } from '@/lib/vibe-avatars';
import VibeAvatarDisplay from '@/components/shared/VibeAvatarDisplay';
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
    totalSaves: number;
    listCount: number;
  };
  lists: SpotlightList[];
}

async function fetchSpotlightCurrent(): Promise<SpotlightData | null> {
  const res = await fetch('/api/spotlight/current');
  const json = await res.json();
  return json.success && json.data ? json.data : null;
}

interface CreatorSpotlightSectionProps {
  /** @deprecated sidebar حذف شد — فقط layout تمام‌عرض */
  layout?: 'default';
}

export default function CreatorSpotlightSection({ layout: _layout = 'default' }: CreatorSpotlightSectionProps) {
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
        track('follow', {
          targetUserId: data.creator.userId,
          creator_username: data.creator.username ?? '',
          source: 'creator_spotlight',
        });
      }
    } catch {
      // ignore
    }
  };

  if (loading) {
    return (
      <section className="mb-4 px-4 lg:mb-0 lg:px-0">
        <div className="mb-3 h-6 w-52 animate-pulse rounded bg-gray-200" />
        <div className="h-40 animate-pulse rounded-xl border border-wibe bg-wibe-card p-5 lg:h-44" />
      </section>
    );
  }

  if (!data) return null;

  const c = data.creator;
  const levelKey = (c.curatorLevel || 'EXPLORER') as CuratorLevelKey;
  const vibeAvatar =
    c.avatarType === 'DEFAULT' && c.avatarId ? resolveVibeAvatar(c.avatarId) : null;

  return (
    <section className="mb-4 px-4 pb-2 lg:mb-0 lg:pb-0 lg:px-0">
      <HomeSectionTitle
        icon="🏆"
        title="کیوریتور منتخب"
        subtitle="لیست‌های برتر از یک سازنده"
      />

      <div className="overflow-hidden rounded-lg border border-wibe bg-wibe-card shadow-card lg:rounded-xl">
        <div className="p-5 lg:grid lg:grid-cols-[minmax(0,15rem)_1fr] lg:items-start lg:gap-6 lg:p-6">
          <div className="flex flex-col items-center text-center lg:items-start lg:text-right">
            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-wibe bg-gray-100">
              {vibeAvatar ? (
                <VibeAvatarDisplay avatar={vibeAvatar} size={80} className="h-full w-full" />
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
            <p className="mt-2 wibe-caption text-wibe-secondary">
              {c.listCount} لیست · {c.totalSaves.toLocaleString('fa-IR')} ذخیره
            </p>

            <div className="mt-4 flex w-full gap-3 lg:mt-5">
              <Link
                href={c.username ? `/u/${encodeURIComponent(c.username)}` : '#'}
                onClick={() => {
                  if (c.username) trackCreatorProfileView(c.username, 'spotlight');
                }}
                className="flex flex-1 items-center justify-center gap-2 rounded-md border border-wibe py-3 wibe-small font-semibold text-primary lg:py-2.5"
              >
                <User className="h-5 w-5" />
                پروفایل
              </Link>
              {session?.user?.id && session.user.id !== c.userId && (
                <button
                  type="button"
                  onClick={handleFollow}
                  disabled={following}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-md py-3 wibe-small font-semibold transition-colors lg:py-2.5 ${
                    following ? 'bg-gray-100 text-wibe-secondary' : 'bg-primary text-white'
                  }`}
                >
                  {following ? (
                    <>
                      <Check className="h-5 w-5" />
                      دنبال می‌کنی
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-5 w-5" />
                      دنبال کردن
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {data.lists.length > 0 ? (
            <div className="border-t border-wibe px-4 py-3 lg:border-t-0 lg:px-0 lg:py-0">
            <p className="mb-2 wibe-caption text-wibe-secondary lg:mb-3">لیست‌های برتر</p>
            <div className="-mx-1 flex gap-3 overflow-x-auto scrollbar-hide lg:mx-0 lg:grid lg:grid-cols-4 lg:gap-3 lg:overflow-visible xl:grid-cols-5">
              {data.lists.map((list) => (
                <Link
                  key={list.id}
                  href={`/lists/${list.slug}`}
                  className="w-28 shrink-0 overflow-hidden rounded-md border border-wibe bg-wibe-surface lg:w-full lg:hover:border-primary/20 lg:hover:shadow-sm"
                >
                  <div className="relative aspect-[3/4] w-full bg-gray-200 lg:aspect-[16/10] lg:max-h-[7rem]">
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
          ) : null}
        </div>
      </div>
    </section>
  );
}
