'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useQuery } from '@tanstack/react-query';
import { Trophy } from 'lucide-react';
import Toast from '@/components/shared/Toast';
import type { AchievementModel, AchievementMetrics } from './AchievementBottomSheet';

const AchievementBottomSheet = dynamic(() => import('./AchievementBottomSheet'), { ssr: false });

interface AchievementItem extends AchievementModel {}

interface CreatorStats {
  viralListsCount?: number;
  popularListsCount?: number;
  totalLikesReceived?: number;
  profileViews?: number;
  totalItemsCurated?: number;
}

interface ProfileAchievementsSectionProps {
  creatorStats?: CreatorStats | null;
}

function deriveMetrics(achievement: AchievementItem, stats?: CreatorStats | null): AchievementMetrics | null {
  if (!stats) return null;
  const m: AchievementMetrics = {};
  if (typeof stats.profileViews === 'number' && stats.profileViews > 0) m.views = stats.profileViews;
  if (typeof stats.totalLikesReceived === 'number' && stats.totalLikesReceived > 0) m.likes = stats.totalLikesReceived;
  if (achievement.code === 'SAVES_100' || achievement.code === 'SAVES_500') {
    m.saves = achievement.code === 'SAVES_500' ? 500 : 100;
  } else if (typeof stats.totalItemsCurated === 'number' && stats.totalItemsCurated > 0) {
    m.saves = stats.totalItemsCurated;
  }
  if (Object.keys(m).length === 0) return null;
  return m;
}

function deriveRankingContext(achievement: AchievementItem, stats?: CreatorStats | null): string | null {
  if (!stats) return null;
  if (achievement.category === 'impact' && (stats.viralListsCount ?? 0) >= 1) {
    return (stats.viralListsCount ?? 0) >= 3
      ? 'جزو برترین کریتورهای وایرال'
      : 'لیست شما وایرال شده';
  }
  if (achievement.category === 'community' && (stats.totalLikesReceived ?? 0) >= 100) {
    return 'جزو محبوب‌ترین کریتورها';
  }
  return null;
}

interface AchievementsResponse {
  achievements: AchievementItem[];
  newlyUnlocked?: { code: string; title: string; icon: string }[];
}

async function fetchAchievements(): Promise<AchievementsResponse> {
  const res = await fetch('/api/user/achievements');
  const json = await res.json();
  return {
    achievements: json.success && Array.isArray(json.data?.achievements) ? json.data.achievements : [],
    newlyUnlocked: json.data?.newlyUnlocked,
  };
}

export default function ProfileAchievementsSection({ creatorStats }: ProfileAchievementsSectionProps) {
  const { data, isLoading: loading } = useQuery({
    queryKey: ['user', 'achievements'],
    queryFn: fetchAchievements,
  });
  const list = data?.achievements ?? [];
  const [selected, setSelected] = useState<AchievementItem | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' } | null>(null);
  const hasShownUnlock = useRef(false);

  useEffect(() => {
    const newly = data?.newlyUnlocked;
    if (Array.isArray(newly) && newly.length > 0 && !hasShownUnlock.current) {
      hasShownUnlock.current = true;
      const first = newly[0];
      setToast({ message: `دستاورد جدید! ${first.title} ${first.icon}`, type: 'success' });
    }
  }, [data?.newlyUnlocked]);

  if (loading && list.length === 0) {
    return (
      <section className="px-4 mt-6">
        <div className="h-5 w-28 bg-gray-100 rounded mb-3" />
        <div className="grid grid-cols-6 gap-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="aspect-square rounded-xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="px-4 mt-6">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-3">
        <Trophy className="w-4 h-4 text-amber-500" />
        دستاوردها
      </h2>
      <div className="grid grid-cols-6 gap-2">
        {list.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => setSelected(a)}
            title={a.unlocked || !a.isSecret ? a.title : 'قفل'}
            className={`
              flex flex-col items-center justify-center p-2 rounded-xl border transition-all
              active:scale-95
              ${a.unlocked
                ? 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                : 'border-gray-100 bg-gray-50'
              }
            `}
          >
            <span
              className={`text-xl mb-0.5 ${a.unlocked ? '' : 'grayscale opacity-40'}`}
              aria-hidden
            >
              {a.unlocked ? a.icon : (a.isSecret ? '?' : '🔒')}
            </span>
            <span className={`text-[9px] font-medium text-center line-clamp-1 max-w-full ${a.unlocked ? 'text-gray-600' : 'text-gray-400'}`}>
              {a.unlocked || !a.isSecret ? a.title : '???'}
            </span>
          </button>
        ))}
      </div>

      <AchievementBottomSheet
        achievement={selected}
        metrics={selected ? deriveMetrics(selected, creatorStats) : null}
        rankingContext={selected ? deriveRankingContext(selected, creatorStats) : null}
        onClose={() => setSelected(null)}
      />

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </section>
  );
}
