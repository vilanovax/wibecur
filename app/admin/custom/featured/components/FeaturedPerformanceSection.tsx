'use client';

import { useState, useEffect } from 'react';
import { Lightbulb } from 'lucide-react';
import type { FeaturedSlotPerformance } from '@/lib/admin/featured-management-types';

type Props = {
  slotId: string;
  /** وقتی متریک‌ها در نوار وضعیت نشان داده می‌شوند، فقط پیشنهادها را ببین */
  metricsInStrip?: boolean;
  initialPerformance?: FeaturedSlotPerformance | null;
  initialRecommendations?: string[];
};

export default function FeaturedPerformanceSection({
  slotId,
  metricsInStrip = false,
  initialPerformance = null,
  initialRecommendations = [],
}: Props) {
  const [recommendations, setRecommendations] = useState<string[]>(
    initialRecommendations
  );
  const [loading, setLoading] = useState(
    !initialPerformance && initialRecommendations.length === 0
  );

  useEffect(() => {
    if (initialPerformance || initialRecommendations.length > 0) {
      setRecommendations(initialRecommendations);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    fetch(`/api/admin/custom/featured/${slotId}/performance`)
      .then(async (res) => {
        const json = await res.json();
        if (cancelled) return;
        setRecommendations(
          Array.isArray(json.recommendations) ? json.recommendations : []
        );
      })
      .catch(() => {
        if (!cancelled) setRecommendations([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slotId, initialPerformance, initialRecommendations]);

  if (loading) {
    if (metricsInStrip) return null;
    return (
      <p className="text-sm text-wibe-secondary" dir="rtl">
        در حال بارگذاری پیشنهادها…
      </p>
    );
  }

  if (recommendations.length === 0) return null;

  return (
    <div
      className="rounded-xl border border-amber-200 bg-amber-50/80 p-4"
      dir="rtl"
    >
      <div className="mb-2 flex items-center gap-2 text-sm font-medium text-amber-900">
        <Lightbulb className="size-4" strokeWidth={1.5} />
        پیشنهاد سیستم
      </div>
      <ul className="space-y-1 text-sm leading-relaxed text-amber-900">
        {recommendations.map((text, i) => (
          <li key={i}>{text}</li>
        ))}
      </ul>
    </div>
  );
}
