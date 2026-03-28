'use client';

import { useMemo } from 'react';
import { useHomeData } from '@/contexts/HomeDataContext';

export default function SocialProofTicker() {
  const { data, isLoading } = useHomeData();

  const totalSaves = useMemo(() => {
    if (!data) return 0;
    const trending = data.trending?.reduce((s, l) => s + l.saveCount, 0) ?? 0;
    const rising = data.rising?.reduce((s, l) => s + l.saveCount, 0) ?? 0;
    return trending + rising;
  }, [data]);

  if (isLoading || totalSaves === 0) return null;

  const formatted = totalSaves.toLocaleString('fa-IR');

  return (
    <div className="px-4 -mt-1 mb-1">
      <div className="flex items-center justify-center gap-1.5 py-1.5 text-[12px] text-gray-500">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span>{formatted}+ ذخیره این هفته توسط کاربران وایب</span>
      </div>
    </div>
  );
}
