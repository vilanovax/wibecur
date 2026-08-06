'use client';

import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Sparkles } from 'lucide-react';
import { useHomeUserState } from '@/hooks/useHomeUserState';
import { useHomeOnboardingInterests } from '@/hooks/useHomeOnboardingInterests';
import { openHomeCreateSheet } from '@/lib/home-create-sheet';
import { forYouQueryKey } from '@/hooks/useForYouRecommendations';
import { useSession } from 'next-auth/react';

type CategoryChip = { id: string; slug: string; name: string; icon: string | null };

async function fetchActiveCategories(): Promise<CategoryChip[]> {
  const res = await fetch('/api/categories');
  const json = await res.json();
  if (!res.ok || !json.success) return [];
  return json.data ?? [];
}

export default function HomeStartStrip() {
  const { isNewUser, isLoading: userLoading } = useHomeUserState();
  const { shouldShowStartStrip, interests, saveInterests, completeOnboarding, hydrated } =
    useHomeOnboardingInterests();
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    if (interests.length > 0) {
      setSelected(interests);
    }
  }, [interests]);

  const { data: categories = [] } = useQuery({
    queryKey: ['categories', 'active', 'onboarding'],
    queryFn: fetchActiveCategories,
    staleTime: 10 * 60 * 1000,
    enabled: hydrated && shouldShowStartStrip && isNewUser,
  });

  if (userLoading || !hydrated || !shouldShowStartStrip || !isNewUser) {
    return null;
  }

  const toggleSlug = (slug: string) => {
    setSelected((prev) => {
      if (prev.includes(slug)) return prev.filter((s) => s !== slug);
      if (prev.length >= 3) return prev;
      return [...prev, slug];
    });
  };

  const handleContinue = () => {
    if (selected.length > 0) {
      saveInterests(selected);
      void queryClient.invalidateQueries({
        queryKey: forYouQueryKey(session?.user?.id, selected),
      });
    }
    completeOnboarding();
  };

  return (
    <section
      className="mx-4 mb-3 rounded-2xl border border-primary/20 bg-gradient-to-b from-primary/8 to-primary/3 p-4 lg:mx-0 lg:mb-0 lg:p-5"
      aria-label="شروع در وایب"
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between lg:gap-6">
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3 lg:block">
            <div>
              <p className="flex items-center gap-1.5 wibe-caption font-semibold text-primary">
                <Sparkles className="h-4 w-4" />
                شروع سریع
              </p>
              <h2 className="mt-1 wibe-body font-bold text-foreground lg:text-lg">
                ۳ تا از علاقه‌مندی‌ات را انتخاب کن
              </h2>
              <p className="mt-1 wibe-small text-wibe-secondary">
                فید «برای تو» بر اساس انتخاب‌هایت پر می‌شود
              </p>
            </div>
            <button
              type="button"
              onClick={completeOnboarding}
              className="shrink-0 wibe-caption text-wibe-secondary hover:text-foreground lg:hidden"
            >
              رد کردن
            </button>
          </div>

          <div className="mt-3 flex flex-wrap gap-2 lg:mt-4">
            {categories.slice(0, 8).map((cat) => {
              const isSelected = selected.includes(cat.slug);
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => toggleSlug(cat.slug)}
                  className={`h-9 rounded-lg border px-3 wibe-small font-medium transition-colors ${
                    isSelected
                      ? 'border-primary bg-primary text-white'
                      : 'border-wibe bg-wibe-card text-foreground hover:border-primary/30'
                  }`}
                >
                  {cat.icon ? `${cat.icon} ` : ''}
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-2 lg:min-w-[11rem] lg:pt-1">
          <button
            type="button"
            onClick={completeOnboarding}
            className="hidden text-right wibe-caption text-wibe-secondary hover:text-foreground lg:block"
          >
            رد کردن
          </button>
          <div className="flex flex-wrap items-center gap-2 lg:flex-col lg:items-stretch">
            <button
              type="button"
              onClick={handleContinue}
              className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 wibe-small font-semibold text-white hover:bg-primary-dark lg:w-full"
            >
              {selected.length > 0 ? 'ادامه با انتخاب‌ها' : 'ادامه بدون انتخاب'}
            </button>
            <button
              type="button"
              onClick={openHomeCreateSheet}
              className="inline-flex items-center justify-center gap-1 rounded-lg border border-wibe bg-wibe-card px-4 py-2 wibe-small font-medium text-foreground hover:border-primary/30 lg:w-full"
            >
              <Plus className="h-4 w-4" />
              اولین لیستت را بساز
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
