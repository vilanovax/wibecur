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
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Skeleton } from '@/components/ui/skeleton';
import { fa } from '@/lib/utils';

type TabType = 'global' | 'rising' | 'category' | 'monthly';

interface LeaderboardClientProps {
  initialList?: LeaderboardRow[];
  initialCategories?: LeaderboardCategoryOption[];
}

const TOP3_STYLES: Record<number, { card: string; medal: string }> = {
  1: { card: 'border-warning/40 bg-warning/5', medal: 'bg-warning text-white' },
  2: { card: 'border-border bg-muted', medal: 'bg-foreground/40 text-white' },
  3: { card: 'border-warning/30 bg-warning/5', medal: 'bg-warning/80 text-white' },
};

function RankChangeIndicator({ change }: { change: number }) {
  if (change === 0) return null;
  const isUp = change > 0;
  return (
    <span
      className={`inline-flex items-center wibe-caption font-medium tabular-nums ${
        isUp ? 'text-success' : 'text-destructive'
      }`}
    >
      {isUp ? `↑ ${fa(change)}` : `↓ ${fa(Math.abs(change))}`}
    </span>
  );
}

function CreatorStatsLine({ row }: { row: LeaderboardRow }) {
  return (
    <p className="flex flex-wrap items-center justify-center gap-1 text-xs text-muted-foreground">
      <span className="inline-flex items-center gap-0.5 font-medium text-brand">
        <Bookmark className="size-3" />
        {row.totalSaves.toLocaleString('fa-IR')}
      </span>
      <span>·</span>
      <span>{fa(row.listCount)} لیست</span>
      {row.viralCount > 0 && (
        <>
          <span>·</span>
          <span>{fa(row.viralCount)} ترند</span>
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
  const sizeClass = size === 'sm' ? 'size-11' : size === 'lg' ? 'size-16' : 'size-12';
  const avatarSize = size === 'sm' ? 44 : size === 'lg' ? 64 : 48;

  return (
    <div className="relative flex-shrink-0">
      {showGlow && (
        <div className={`absolute -inset-1 rounded-full blur-md opacity-50 ${levelConfig.glowClass}`} aria-hidden />
      )}
      <div className={`relative ${sizeClass} overflow-hidden rounded-full border border-border bg-muted shadow-sm`}>
        {vibeAvatar ? (
          <VibeAvatarDisplay avatar={vibeAvatar} size={avatarSize} className="h-full w-full" />
        ) : row.image ? (
          <ImageWithFallback
            src={row.image}
            alt={row.name || ''}
            className="w-full h-full object-cover"
            fallbackIcon={(row.name?.[0] || '?').toUpperCase()}
            fallbackClassName="flex h-full w-full items-center justify-center bg-brand font-bold text-brand-foreground"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-brand font-bold text-brand-foreground">
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
        <Trophy className="size-6 shrink-0 text-warning" />
        <h1 className="wibe-h2">رتبه‌بندی کریتورها</h1>
      </div>

      <div className="-mx-4 overflow-x-auto px-4 pb-2">
        <SegmentedControl
          aria-label="نوع رتبه‌بندی"
          value={tab}
          onChange={(value) => setTab(value as TabType)}
          options={tabs.map(({ id, label, icon: Icon }) => ({
            value: id,
            label: (
              <span className="inline-flex items-center gap-1.5">
                <Icon className="size-4" aria-hidden />
                {label}
              </span>
            ),
          }))}
        />
      </div>

      {tab === 'category' && (
        <div className="flex gap-2 overflow-x-auto py-2 mb-2 scrollbar-hide -mx-4 px-4">
          {categories.map((c) => (
            <button
              key={c.slug}
              type="button"
              onClick={() => setCategorySlug(c.slug)}
              className={`h-11 shrink-0 rounded-full border px-3 text-sm font-medium transition-colors ${
                categorySlug === c.slug
                  ? 'border-brand bg-brand text-brand-foreground'
                  : 'border-border bg-popover text-foreground'
              }`}
            >
              {c.icon} {c.name}
            </button>
          ))}
        </div>
      )}

      {tab === 'monthly' && (
        <p className="mb-2 text-sm text-muted-foreground">رتبه‌بندی این ماه — هر ماه از نو محاسبه می‌شود.</p>
      )}

      {loading ? (
        <div className="mt-6 space-y-3">
          <Skeleton className="h-40 rounded-surface" />
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 rounded-surface" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <EmptyState
          className="mt-6"
          title="هنوز رتبه‌ای ثبت نشده"
          description="بعد از به‌روزرسانی روزانه، رتبه‌ها اینجا ظاهر می‌شود."
        />
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
                    className="block"
                  >
                    <Card className={`flex flex-col items-center bg-popover p-3 text-center ${style.card}`}>
                    <span className={`inline-flex size-11 items-center justify-center rounded-full text-sm font-bold ${style.medal}`}>
                      {row.rank.toLocaleString('fa-IR')}
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
                      <p className="mt-1 wibe-caption text-success font-medium">+{row.growthPercent.toLocaleString('fa-IR')}٪</p>
                    )}
                    </Card>
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
                  className="block"
                >
                  <Card className="flex items-center gap-3 bg-popover p-3">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-bold text-muted-foreground">
                    {row.rank.toLocaleString('fa-IR')}
                  </span>
                  <AvatarWithGlow row={row} size="sm" showGlow={false} />
                  <div className="flex-1 min-w-0">
                    <p className="wibe-small font-semibold text-foreground truncate">{row.name || 'کاربر'}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <CuratorBadge level={(row.curatorLevel || 'EXPLORER') as CuratorLevelKey} size="small" glow={false} />
                      <span className="inline-flex items-center gap-0.5 text-xs font-medium text-brand">
                        <Bookmark className="w-3 h-3" />
                        {row.totalSaves.toLocaleString('fa-IR')}
                      </span>
                      {(tab === 'global' || tab === 'monthly') && row.rankChange != null && row.rankChange !== 0 && (
                        <RankChangeIndicator change={row.rankChange} />
                      )}
                      {tab === 'rising' && row.growthPercent != null && row.growthPercent > 0 && (
                        <span className="wibe-caption text-success font-medium">+{row.growthPercent.toLocaleString('fa-IR')}٪</span>
                      )}
                    </div>
                  </div>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
