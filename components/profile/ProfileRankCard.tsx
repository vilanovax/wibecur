'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Trophy, TrendingUp, ChevronLeft, Plus } from 'lucide-react';

interface RankData {
  rank: number | null;
  rankChange: number | null;
  monthlyRank: number | null;
  totalCurators: number;
}

async function fetchMyRank(): Promise<RankData> {
  const res = await fetch('/api/user/rank');
  const json = await res.json();
  if (!json.success || !json.data) {
    return { rank: null, rankChange: null, monthlyRank: null, totalCurators: 0 };
  }
  return json.data as RankData;
}

interface ProfileRankCardProps {
  userId: string;
}

export default function ProfileRankCard({ userId }: ProfileRankCardProps) {
  const { data: rankData, isLoading } = useQuery({
    queryKey: ['user', userId, 'rank'],
    queryFn: fetchMyRank,
    staleTime: 60_000,
  });

  const hasRank = rankData?.rank != null && rankData.rank > 0;

  return (
    <Link
      href="/leaderboard"
      className="block rounded-lg border border-wibe bg-wibe-card p-4 shadow-sm transition-transform active:scale-[0.99]"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-warning/10 text-warning">
          <Trophy className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="wibe-caption text-wibe-secondary">رتبه‌بندی کیوریتورها</p>
          {isLoading ? (
            <p className="mt-0.5 h-5 w-32 bg-gray-200 rounded animate-pulse" />
          ) : hasRank ? (
            <div className="mt-0.5 space-y-1">
              <p className="wibe-body font-bold text-foreground">
                رتبه #{rankData!.rank!.toLocaleString('fa-IR')}
                {rankData!.totalCurators > 0 && (
                  <span className="wibe-caption font-normal text-wibe-secondary">
                    {' '}
                    از {rankData!.totalCurators.toLocaleString('fa-IR')} کیوریتور
                  </span>
                )}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                {rankData!.rankChange != null && rankData!.rankChange > 0 && (
                  <span className="inline-flex items-center gap-0.5 rounded-pill bg-success/10 px-1.5 py-0.5 wibe-caption font-medium text-success">
                    <TrendingUp className="h-3 w-3" />+{rankData!.rankChange.toLocaleString('fa-IR')} این
                    هفته
                  </span>
                )}
                {rankData!.monthlyRank != null && rankData!.monthlyRank > 0 && (
                  <span className="wibe-caption text-wibe-secondary">
                    ماهانه: #{rankData!.monthlyRank.toLocaleString('fa-IR')}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="mt-1">
              <p className="wibe-small font-semibold text-primary">هنوز در جدول نیستی</p>
              <p className="wibe-caption text-wibe-secondary mt-0.5 flex items-center gap-1">
                <Plus className="w-3 h-3 shrink-0" />
                اولین لیستت را بساز تا وارد رتبه‌بندی شوی
              </p>
            </div>
          )}
        </div>
        <ChevronLeft className="h-5 w-5 shrink-0 rotate-180 text-wibe-secondary" />
      </div>
    </Link>
  );
}
