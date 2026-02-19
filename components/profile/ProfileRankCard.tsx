'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Trophy, TrendingUp, ChevronLeft } from 'lucide-react';

interface RankData {
  rank: number;
  rankChange: number | null;
  monthlyRank: number | null;
}

interface ProfileRankCardProps {
  userId: string;
}

async function fetchMyRank(userId: string): Promise<RankData | null> {
  try {
    const [globalRes, monthlyRes] = await Promise.all([
      fetch('/api/leaderboard?type=global'),
      fetch('/api/leaderboard?type=monthly'),
    ]);
    const globalJson = await globalRes.json();
    const monthlyJson = await monthlyRes.json();
    const globalList = globalJson.success ? globalJson.data ?? [] : [];
    const monthlyList = monthlyJson.success ? monthlyJson.data ?? [] : [];
    const globalEntry = globalList.find((e: { userId: string }) => e.userId === userId);
    const monthlyEntry = monthlyList.find((e: { userId: string }) => e.userId === userId);
    if (!globalEntry && !monthlyEntry) return null;
    const rank = globalEntry?.rank ?? monthlyEntry?.rank ?? 0;
    const rankChange = globalEntry?.rankChange ?? null;
    const monthlyRank = monthlyEntry?.monthlyRank ?? globalEntry?.monthlyRank ?? null;
    return { rank, rankChange, monthlyRank };
  } catch {
    return null;
  }
}

export default function ProfileRankCard({ userId }: ProfileRankCardProps) {
  const [rankData, setRankData] = useState<RankData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchMyRank(userId).then((data) => {
      if (!cancelled) {
        setRankData(data);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  return (
    <Link
      href="/leaderboard"
      className="block rounded-2xl border-2 border-amber-200/80 bg-gradient-to-br from-amber-50/50 to-white p-4 shadow-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-md hover:border-amber-300 active:scale-[0.99]"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
          <Trophy className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-gray-500">رتبه‌بندی کریتورها</p>
          {loading ? (
            <p className="mt-0.5 text-lg font-bold text-gray-800">...</p>
          ) : rankData ? (
            <div className="mt-0.5 flex flex-wrap items-center gap-2">
              <span className="text-lg font-bold text-gray-900">رتبه شما: #{rankData.rank}</span>
              {rankData.rankChange != null && rankData.rankChange > 0 && (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-100 px-1.5 py-0.5 text-xs font-medium text-emerald-700">
                  <TrendingUp className="h-3 w-3" />
                  {rankData.rankChange} این هفته
                </span>
              )}
            </div>
          ) : (
            <p className="mt-0.5 text-base font-bold text-primary">مشاهده جدول برترین‌ها</p>
          )}
        </div>
        <ChevronLeft className="h-5 w-5 shrink-0 rotate-180 text-gray-400" />
      </div>
    </Link>
  );
}
