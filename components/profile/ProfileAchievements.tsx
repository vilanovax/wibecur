'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useQuery } from '@tanstack/react-query';
import { Trophy, ChevronLeft } from 'lucide-react';
import Toast from '@/components/shared/Toast';
import type { AchievementModel, AchievementMetrics } from '@/components/mobile/profile/AchievementBottomSheet';
import type { CreatorStats } from './types';

const AchievementBottomSheet = dynamic(
  () => import('@/components/mobile/profile/AchievementBottomSheet'),
  { ssr: false }
);

const MAX_VISIBLE = 6;

interface AchievementsResponse {
  achievements: AchievementModel[];
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

function deriveMetrics(achievement: AchievementModel, stats?: CreatorStats | null): AchievementMetrics | null {
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

function deriveRankingContext(achievement: AchievementModel, stats?: CreatorStats | null): string | null {
  if (!stats) return null;
  if (achievement.category === 'impact' && (stats.viralListsCount ?? 0) >= 1) {
    return (stats.viralListsCount ?? 0) >= 3 ? 'جزو برترین کریتورهای وایرال' : 'لیست شما وایرال شده';
  }
  if (achievement.category === 'community' && (stats.totalLikesReceived ?? 0) >= 100) {
    return 'جزو محبوب‌ترین کریتورها';
  }
  return null;
}

interface ProfileAchievementsProps {
  creatorStats?: CreatorStats | null;
}

export default function ProfileAchievements({ creatorStats }: ProfileAchievementsProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['user', 'achievements'],
    queryFn: fetchAchievements,
  });
  const list = data?.achievements ?? [];
  const unlocked = list.filter((a) => a.unlocked);
  const visible = unlocked.slice(0, MAX_VISIBLE);
  const hasMore = unlocked.length > MAX_VISIBLE || list.some((a) => !a.unlocked);

  const [selected, setSelected] = useState<AchievementModel | null>(null);
  const [showAllSheet, setShowAllSheet] = useState(false);
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

  if (isLoading && list.length === 0) {
    return (
      <section className="mt-6">
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
    <section className="mt-6">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-3">
        <Trophy className="w-4 h-4 text-amber-500" />
        دستاوردها
      </h2>
      <div className="grid grid-cols-6 gap-2">
        {visible.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => setSelected(a)}
            title={a.title}
            className="flex flex-col items-center justify-center p-2 rounded-xl border border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 transition-all active:scale-95"
          >
            <span className="text-xl mb-0.5">{a.icon}</span>
            <span className="text-[9px] font-medium text-center line-clamp-1 max-w-full text-gray-600">
              {a.title}
            </span>
          </button>
        ))}
      </div>
      {hasMore && (
        <button
          type="button"
          onClick={() => setShowAllSheet(true)}
          className="mt-3 w-full py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-1"
        >
          مشاهده همه دستاوردها
          <ChevronLeft className="w-4 h-4 rotate-180" />
        </button>
      )}

      <AchievementBottomSheet
        achievement={selected}
        metrics={selected ? deriveMetrics(selected, creatorStats) : null}
        rankingContext={selected ? deriveRankingContext(selected, creatorStats) : null}
        onClose={() => setSelected(null)}
      />

      {showAllSheet && (
        <AllAchievementsSheet
          achievements={list}
          onSelect={(a) => {
            setShowAllSheet(false);
            setSelected(a);
          }}
          onClose={() => setShowAllSheet(false)}
        />
      )}

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </section>
  );
}

function AllAchievementsSheet({
  achievements,
  onSelect,
  onClose,
}: {
  achievements: AchievementModel[];
  onSelect: (a: AchievementModel) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white" dir="rtl">
      <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-3">
        <button
          type="button"
          onClick={onClose}
          className="p-2 -m-2 rounded-full hover:bg-gray-100"
          aria-label="بستن"
        >
          <ChevronLeft className="w-5 h-5 rotate-180" />
        </button>
        <h2 className="text-lg font-bold text-gray-900">همه دستاوردها</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-4 gap-3">
          {achievements.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => onSelect(a)}
              className={`
                flex flex-col items-center justify-center p-3 rounded-xl border transition-all active:scale-95
                ${a.unlocked ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50'}
              `}
            >
              <span className={`text-2xl mb-1 ${a.unlocked ? '' : 'grayscale opacity-50'}`}>
                {a.unlocked ? a.icon : a.isSecret ? '?' : '🔒'}
              </span>
              <span className={`text-[10px] font-medium text-center line-clamp-2 ${a.unlocked ? 'text-gray-700' : 'text-gray-400'}`}>
                {a.unlocked || !a.isSecret ? a.title : '???'}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
