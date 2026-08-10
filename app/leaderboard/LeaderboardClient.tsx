'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Trophy, TrendingUp, Globe, Film, Calendar, Bookmark } from 'lucide-react';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import CuratorBadge from '@/components/shared/CuratorBadge';
import { getLevelConfig, type CuratorLevelKey } from '@/lib/curator';
import { resolveVibeAvatar } from '@/lib/vibe-avatars';
import VibeAvatarDisplay from '@/components/shared/VibeAvatarDisplay';
import type { LeaderboardRow, LeaderboardCategoryOption } from '@/lib/leaderboard';
import PageBreadcrumb from '@/components/shared/PageBreadcrumb';
import JsonLdBreadcrumb from '@/components/shared/JsonLdBreadcrumb';
import { uiBreadcrumbToSchema } from '@/lib/breadcrumb-schema';
import { trackCreatorProfileView } from '@/lib/analytics';

type TabType = 'global' | 'rising' | 'category' | 'monthly';

interface LeaderboardClientProps {
  initialList?: LeaderboardRow[];
  initialCategories?: LeaderboardCategoryOption[];
}

const TOP3_STYLES: Record<number, { card: string; medal: string }> = {
  1: { card: 'border-warning/40 bg-warning/5', medal: 'bg-warning text-white' },
  2: { card: 'border-wibe bg-wibe-surface', medal: 'bg-foreground/40 text-white' },
  3: { card: 'border-warning/30 bg-warning/5', medal: 'bg-warning/80 text-white' },
};

function RankChangeIndicator({ change }: { change: number }) {
  if (change === 0) return null;
  const isUp = change > 0;
  return (
    <span
      className={`inline-flex items-center wibe-caption font-medium tabular-nums ${
        isUp ? 'text-success' : 'text-danger'
      }`}
    >
      {isUp ? `↑ ${change}` : `↓ ${Math.abs(change)}`}
    </span>
  );
}

function CreatorStatsLine({ row }: { row: LeaderboardRow }) {
  return (
    <p className="wibe-caption text-wibe-secondary flex items-center justify-center gap-1 flex-wrap">
      <span className="inline-flex items-center gap-0.5 text-primary font-medium">
        <Bookmark className="w-3 h-3" />
        {row.totalSaves.toLocaleString('fa-IR')}
      </span>
      <span>·</span>
      <span>{row.listCount} لیست</span>
      {row.viralCount > 0 && (
        <>
          <span>·</span>
          <span>{row.viralCount} ترند</span>
        </>
      )}
    </p>
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
      ? resolveVibeAvatar(row.avatarId)
      : null;
  const sizeClass = size === 'sm' ? 'w-10 h-10' : size === 'lg' ? 'w-16 h-16' : 'w-12 h-12';
  const avatarSize = size === 'sm' ? 40 : size === 'lg' ? 64 : 48;

  return (
    <div className="relative flex-shrink-0">
      {showGlow && (
        <div className={`absolute -inset-1 rounded-full blur-md opacity-50 ${levelConfig.glowClass}`} aria-hidden />
      )}
      <div className={`relative ${sizeClass} rounded-full overflow-hidden border-2 border-wibe-card bg-wibe-surface shadow-sm`}>
        {vibeAvatar ? (
          <VibeAvatarDisplay avatar={vibeAvatar} size={avatarSize} className="h-full w-full" />
        ) : row.image ? (
          <ImageWithFallback
            src={row.image}
            alt={row.name || ''}
            className="w-full h-full object-cover"
            fallbackIcon={(row.name?.[0] || '?').toUpperCase()}
            fallbackClassName="w-full h-full bg-primary text-white font-bold flex items-center justify-center"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-primary text-white font-bold">
            {(row.name?.[0] || '?').toUpperCase()}
          </div>
        )}
      </div>
    </div>
  );
}

export default function LeaderboardClient({
  initialList = [],
  initialCategories = [],
}: LeaderboardClientProps) {
  const [tab, setTab] = useState<TabType>('global');
  const [categorySlug, setCategorySlug] = useState<string | null>(
    initialCategories[0]?.slug ?? null
  );
  const [categories, setCategories] = useState<LeaderboardCategoryOption[]>(initialCategories);
  const [list, setList] = useState<LeaderboardRow[]>(initialList);
  const [loading, setLoading] = useState(initialList.length === 0);

  useEffect(() => {
    if (initialCategories.length > 0) return;
    fetch('/api/categories')
      .then((r) => r.json())
      .then((j) => {
        if (j.success && Array.isArray(j.data)) {
          const mapped = j.data.slice(0, 10).map((c: { slug: string; name: string; icon: string }) => ({
            slug: c.slug,
            name: c.name,
            icon: c.icon,
          }));
          setCategories(mapped);
          if (!categorySlug && mapped[0]) setCategorySlug(mapped[0].slug);
        }
      })
      .catch(() => {});
  }, [initialCategories.length, categorySlug]);

  useEffect(() => {
    if (tab === 'global' && initialList.length > 0) {
      setList(initialList);
      setLoading(false);
      return;
    }
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
  }, [tab, categorySlug, initialList]);

  const top3 = list.slice(0, 3);
  const rest = list.slice(3);

  const tabs: { id: TabType; label: string; icon: typeof Globe }[] = [
    { id: 'global', label: 'جهانی', icon: Globe },
    { id: 'category', label: 'دسته', icon: Film },
    { id: 'rising', label: 'در حال رشد', icon: TrendingUp },
    { id: 'monthly', label: 'ماهانه', icon: Calendar },
  ];

  const breadcrumbItems = [
    { label: 'خانه', href: '/' },
    { label: 'رتبه‌بندی' },
  ];

  return (
    <div className="px-4 py-4 lg:max-w-3xl lg:mx-auto">
      <JsonLdBreadcrumb items={uiBreadcrumbToSchema(breadcrumbItems)} />
      <PageBreadcrumb className="mb-3" items={breadcrumbItems} />
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-6 h-6 text-warning flex-shrink-0" />
        <h1 className="wibe-h2">رتبه‌بندی کریتورها</h1>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2.5 rounded-md wibe-small font-medium transition-colors ${
              tab === id ? 'bg-primary text-white shadow-sm' : 'bg-wibe-surface text-wibe-secondary'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {tab === 'category' && (
        <div className="flex gap-2 overflow-x-auto py-2 mb-2 scrollbar-hide -mx-4 px-4">
          {categories.map((c) => (
            <button
              key={c.slug}
              type="button"
              onClick={() => setCategorySlug(c.slug)}
              className={`flex-shrink-0 px-3 py-2 rounded-md wibe-small font-medium transition-colors ${
                categorySlug === c.slug ? 'bg-primary/10 text-primary' : 'bg-wibe-card text-wibe-secondary border border-wibe'
              }`}
            >
              {c.icon} {c.name}
            </button>
          ))}
        </div>
      )}

      {tab === 'monthly' && (
        <p className="wibe-caption text-wibe-secondary mb-2">رتبه‌بندی این ماه — هر ماه از نو محاسبه می‌شود.</p>
      )}

      {loading ? (
        <div className="space-y-3 mt-6">
          <div className="h-40 rounded-lg bg-wibe-surface animate-pulse" />
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 rounded-lg bg-wibe-surface animate-pulse" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <p className="text-center wibe-small text-wibe-secondary py-12">
          هنوز رتبه‌ای ثبت نشده. بعد از به‌روزرسانی روزانه رتبه‌ها اینجا ظاهر می‌شود.
        </p>
      ) : (
        <>
          {top3.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mt-4">
              {top3.map((row) => {
                const style = TOP3_STYLES[row.rank] ?? TOP3_STYLES[1];
                return (
                  <Link
                    key={row.userId}
                    href={row.username ? `/u/${encodeURIComponent(row.username)}` : '#'}
                    onClick={() => {
                      if (row.username) trackCreatorProfileView(row.username, 'leaderboard');
                    }}
                    className={`relative rounded-lg border bg-wibe-card p-3 flex flex-col items-center text-center active:scale-[0.98] transition-transform ${style.card}`}
                  >
                    <span className={`inline-flex w-7 h-7 items-center justify-center rounded-full wibe-caption font-bold ${style.medal}`}>
                      {row.rank}
                    </span>
                    <div className="mt-2">
                      <AvatarWithGlow row={row} size="lg" showGlow />
                    </div>
                    <p className="mt-2 wibe-small font-semibold text-foreground truncate w-full">{row.name || 'کاربر'}</p>
                    <CuratorBadge
                      level={(row.curatorLevel || 'EXPLORER') as CuratorLevelKey}
                      size="small"
                      glow={false}
                      className="mt-1"
                    />
                    <div className="mt-1.5 w-full">
                      <CreatorStatsLine row={row} />
                    </div>
                    {(tab === 'global' || tab === 'monthly') && row.rankChange != null && row.rankChange !== 0 && (
                      <div className="mt-1">
                        <RankChangeIndicator change={row.rankChange} />
                      </div>
                    )}
                    {tab === 'rising' && row.growthPercent != null && row.growthPercent > 0 && (
                      <p className="mt-1 wibe-caption text-success font-medium">+{row.growthPercent}%</p>
                    )}
                  </Link>
                );
              })}
            </div>
          )}

          <ul className="space-y-2 mt-6">
            {rest.map((row) => (
              <li key={row.userId}>
                <Link
                  href={row.username ? `/u/${encodeURIComponent(row.username)}` : '#'}
                  onClick={() => {
                    if (row.username) trackCreatorProfileView(row.username, 'leaderboard');
                  }}
                  className="flex items-center gap-3 p-3 rounded-lg bg-wibe-card border border-wibe shadow-sm active:scale-[0.99] transition-transform"
                >
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-wibe-surface flex items-center justify-center wibe-small font-bold text-wibe-secondary">
                    {row.rank}
                  </span>
                  <AvatarWithGlow row={row} size="sm" showGlow={false} />
                  <div className="flex-1 min-w-0">
                    <p className="wibe-small font-semibold text-foreground truncate">{row.name || 'کاربر'}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <CuratorBadge level={(row.curatorLevel || 'EXPLORER') as CuratorLevelKey} size="small" glow={false} />
                      <span className="wibe-caption text-primary font-medium inline-flex items-center gap-0.5">
                        <Bookmark className="w-3 h-3" />
                        {row.totalSaves.toLocaleString('fa-IR')}
                      </span>
                      {(tab === 'global' || tab === 'monthly') && row.rankChange != null && row.rankChange !== 0 && (
                        <RankChangeIndicator change={row.rankChange} />
                      )}
                      {tab === 'rising' && row.growthPercent != null && row.growthPercent > 0 && (
                        <span className="wibe-caption text-success font-medium">+{row.growthPercent}%</span>
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
