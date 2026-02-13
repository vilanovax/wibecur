'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Trophy, TrendingUp, Globe, Film, Calendar } from 'lucide-react';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import CuratorBadge from '@/components/shared/CuratorBadge';
import { getLevelConfig, type CuratorLevelKey } from '@/lib/curator';
import { VIBE_AVATARS } from '@/lib/vibe-avatars';

type TabType = 'global' | 'rising' | 'category' | 'monthly';

interface LeaderboardRow {
  rank: number;
  userId: string;
  name: string | null;
  username: string | null;
  image: string | null;
  avatarType: string | null;
  avatarId: string | null;
  curatorLevel: string;
  viralCount: number;
  totalLikes: number;
  totalSaves: number;
  listCount: number;
  momentumScore: number;
  rankingScore: number;
  rankChange: number | null;
  growthPercent: number | null;
  monthlyRank: number | null;
  monthYear: string | null;
}

interface CategoryOption {
  slug: string;
  name: string;
  icon: string;
}

const TOP3_GRADIENTS: Record<number, { card: string; medal: string; glow: string }> = {
  1: {
    card: 'from-amber-400/20 via-amber-50 to-yellow-50 border-amber-300/60',
    medal: 'from-amber-400 to-yellow-500 text-amber-950',
    glow: 'shadow-[0_0_28px_rgba(245,158,11,0.35)]',
  },
  2: {
    card: 'from-slate-200/30 via-slate-50 to-gray-50 border-slate-300/50',
    medal: 'from-slate-300 to-slate-500 text-slate-900',
    glow: 'shadow-[0_0_24px_rgba(100,116,139,0.3)]',
  },
  3: {
    card: 'from-amber-700/20 via-amber-100/50 to-orange-50 border-amber-600/40',
    medal: 'from-amber-600 to-amber-800 text-amber-100',
    glow: 'shadow-[0_0_22px_rgba(180,83,9,0.35)]',
  },
};

function RankChangeIndicator({ change }: { change: number }) {
  if (change === 0) return null;
  const isUp = change > 0;
  return (
    <span
      className={`inline-flex items-center text-xs font-medium tabular-nums transition-all duration-300 ${
        isUp ? 'text-emerald-600' : 'text-red-500'
      }`}
      title={isUp ? 'رتبه بهتر شده' : 'رتبه پایین‌تر'}
    >
      {isUp ? (
        <>
          <span className="mr-0.5">↑</span>
          <span>{change}</span>
        </>
      ) : (
        <>
          <span className="mr-0.5">↓</span>
          <span>{Math.abs(change)}</span>
        </>
      )}
    </span>
  );
}

function AvatarWithGlow({
  row,
  size = 'md',
  showGlow = true,
}: {
  row: LeaderboardRow;
  size?: 'sm' | 'md' | 'lg';
  showGlow?: boolean;
}) {
  const levelKey = (row.curatorLevel || 'EXPLORER') as CuratorLevelKey;
  const levelConfig = getLevelConfig(levelKey);
  const vibeAvatar =
    row.avatarType === 'DEFAULT' && row.avatarId
      ? VIBE_AVATARS.find((a) => a.id === row.avatarId)
      : null;
  const sizeClass = size === 'sm' ? 'w-10 h-10' : size === 'lg' ? 'w-16 h-16' : 'w-12 h-12';

  return (
    <div className="relative flex-shrink-0">
      {showGlow && (
        <div
          className={`absolute -inset-1 rounded-full blur-md opacity-70 ${levelConfig.glowClass}`}
          aria-hidden
        />
      )}
      <div
        className={`relative ${sizeClass} rounded-full overflow-hidden border-2 border-white bg-gray-100 shadow-md`}
      >
        {vibeAvatar ? (
          <div
            className={`w-full h-full flex items-center justify-center text-2xl ${vibeAvatar.bgClass}`}
          >
            {vibeAvatar.emoji}
          </div>
        ) : row.image ? (
          <ImageWithFallback
            src={row.image}
            alt={row.name || ''}
            className="w-full h-full object-cover"
            fallbackIcon={(row.name?.[0] || '?').toUpperCase()}
            fallbackClassName="w-full h-full bg-gradient-to-br from-[#7C3AED] to-[#9333EA] text-white font-bold flex items-center justify-center"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#7C3AED] to-[#9333EA] text-white font-bold">
            {(row.name?.[0] || '?').toUpperCase()}
          </div>
        )}
      </div>
    </div>
  );
}

export default function LeaderboardClient() {
  const [tab, setTab] = useState<TabType>('global');
  const [categorySlug, setCategorySlug] = useState<string | null>(null);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [list, setList] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/categories')
      .then((r) => r.json())
      .then((j) => {
        if (j.success && Array.isArray(j.data)) {
          setCategories(
            j.data.slice(0, 10).map((c: { slug: string; name: string; icon: string }) => ({
              slug: c.slug,
              name: c.name,
              icon: c.icon,
            }))
          );
          if (!categorySlug && j.data[0]) setCategorySlug(j.data[0].slug);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (tab === 'category' && !categorySlug) {
      setList([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const params = new URLSearchParams({ type: tab });
    if (tab === 'category' && categorySlug) params.set('category', categorySlug);
    fetch(`/api/leaderboard?${params}`)
      .then((r) => r.json())
      .then((j) => {
        if (j.success && Array.isArray(j.data)) setList(j.data);
        else setList([]);
      })
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, [tab, categorySlug]);

  const top3 = list.slice(0, 3);
  const rest = list.slice(3);

  return (
    <div className="px-4 py-4 pb-24 max-w-lg mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-6 h-6 text-amber-500 flex-shrink-0" />
        <h1 className="text-lg font-bold text-gray-900">رتبه‌بندی کریتورها</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
        <button
          type="button"
          onClick={() => setTab('global')}
          className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-colors ${
            tab === 'global' ? 'bg-[#7C3AED] text-white shadow-md' : 'bg-gray-100 text-gray-600'
          }`}
        >
          <Globe className="w-4 h-4" />
          جهانی
        </button>
        <button
          type="button"
          onClick={() => setTab('category')}
          className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-colors ${
            tab === 'category' ? 'bg-[#7C3AED] text-white shadow-md' : 'bg-gray-100 text-gray-600'
          }`}
        >
          <Film className="w-4 h-4" />
          دسته
        </button>
        <button
          type="button"
          onClick={() => setTab('rising')}
          className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-colors ${
            tab === 'rising' ? 'bg-[#7C3AED] text-white shadow-md' : 'bg-gray-100 text-gray-600'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          در حال رشد
        </button>
        <button
          type="button"
          onClick={() => setTab('monthly')}
          className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-colors ${
            tab === 'monthly' ? 'bg-[#7C3AED] text-white shadow-md' : 'bg-gray-100 text-gray-600'
          }`}
        >
          <Calendar className="w-4 h-4" />
          ماهانه
        </button>
      </div>

      {tab === 'category' && (
        <div className="flex gap-2 overflow-x-auto py-2 mb-2 scrollbar-hide -mx-4 px-4">
          {categories.map((c) => (
            <button
              key={c.slug}
              type="button"
              onClick={() => setCategorySlug(c.slug)}
              className={`flex-shrink-0 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                categorySlug === c.slug ? 'bg-[#7C3AED]/15 text-[#7C3AED]' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {c.icon} {c.name}
            </button>
          ))}
        </div>
      )}

      {tab === 'monthly' && (
        <p className="text-xs text-gray-500 mb-2">رتبه‌بندی این ماه — هر ماه از نو محاسبه می‌شود.</p>
      )}

      {loading ? (
        <div className="space-y-3 mt-6">
          <div className="h-40 rounded-2xl bg-gray-100 animate-pulse" />
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 rounded-2xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <p className="text-center text-gray-500 py-12 text-sm">
          هنوز رتبه‌ای ثبت نشده. بعد از به‌روزرسانی روزانه رتبه‌ها اینجا ظاهر می‌شود.
        </p>
      ) : (
        <>
          {/* Top 3 — Premium cards */}
          {top3.length > 0 && (
            <div className="grid grid-cols-3 gap-3 mt-4">
              {top3.map((row, idx) => {
                const style = TOP3_GRADIENTS[row.rank] ?? TOP3_GRADIENTS[1];
                return (
                  <Link
                    key={row.userId}
                    href={row.username ? `/u/${encodeURIComponent(row.username)}` : '#'}
                    className={`relative rounded-2xl border-2 bg-gradient-to-b p-4 flex flex-col items-center text-center transition-transform active:scale-[0.98] ${style.card}`}
                  >
                    <div className={`absolute -inset-px rounded-2xl blur-sm opacity-40 ${style.glow}`} />
                    <span
                      className={`relative inline-flex w-8 h-8 items-center justify-center rounded-full bg-gradient-to-br text-sm font-bold ${style.medal}`}
                    >
                      {row.rank}
                    </span>
                    <div className="relative mt-2">
                      <AvatarWithGlow row={row} size="lg" showGlow />
                    </div>
                    <p className="relative mt-2 font-semibold text-gray-900 text-sm truncate w-full">
                      {row.name || 'کاربر'}
                    </p>
                    <CuratorBadge
                      level={(row.curatorLevel || 'EXPLORER') as CuratorLevelKey}
                      size="small"
                      glow={false}
                      className="relative mt-1"
                    />
                    <p className="relative mt-1.5 text-xs text-gray-500">
                      🔥 {row.viralCount} · ❤️ {row.totalLikes.toLocaleString('fa-IR')}
                    </p>
                    {(tab === 'global' || tab === 'monthly') && row.rankChange != null && row.rankChange !== 0 && (
                      <div className="relative mt-1">
                        <RankChangeIndicator change={row.rankChange} />
                      </div>
                    )}
                    {tab === 'rising' && row.growthPercent != null && row.growthPercent > 0 && (
                      <p className="relative mt-1 text-xs text-emerald-600 font-medium">
                        +{row.growthPercent}% رشد ۳۰ روز
                      </p>
                    )}
                  </Link>
                );
              })}
            </div>
          )}

          {/* Rest of list */}
          <ul className="space-y-2 mt-6">
            {rest.map((row) => (
              <li key={row.userId}>
                <Link
                  href={row.username ? `/u/${encodeURIComponent(row.username)}` : '#'}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-gray-100 shadow-sm transition-shadow active:bg-gray-50"
                >
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-600">
                    {row.rank}
                  </span>
                  <AvatarWithGlow row={row} size="sm" showGlow />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{row.name || 'کاربر'}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <CuratorBadge
                        level={(row.curatorLevel || 'EXPLORER') as CuratorLevelKey}
                        size="small"
                        glow={false}
                      />
                      <span className="text-xs text-gray-500">
                        🔥 {row.viralCount} · ❤️ {row.totalLikes.toLocaleString('fa-IR')}
                      </span>
                      {(tab === 'global' || tab === 'monthly') && row.rankChange != null && row.rankChange !== 0 && (
                        <RankChangeIndicator change={row.rankChange} />
                      )}
                      {tab === 'rising' && row.growthPercent != null && row.growthPercent > 0 && (
                        <span className="text-xs text-emerald-600 font-medium">
                          +{row.growthPercent}%
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
