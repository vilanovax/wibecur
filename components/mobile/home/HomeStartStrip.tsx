'use client';

import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { useHomeUserState } from '@/hooks/useHomeUserState';
import { useHomeOnboardingInterests } from '@/hooks/useHomeOnboardingInterests';
import { openHomeCreateSheet } from '@/lib/home-create-sheet';
import { forYouQueryKey } from '@/hooks/useForYouRecommendations';
import { useSession } from 'next-auth/react';
import { ACTIVATION } from '@/lib/activation-copy';

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

  const copy = ACTIVATION.startStrip;

  return (
    <section
      className="mx-4 mb-3 rounded-2xl border border-dashed border-primary/25 bg-gradient-to-b from-primary/[0.08] to-wibe-card p-4 lg:mx-0 lg:mb-0 lg:max-w-3xl lg:p-5"
      aria-label="شروع در وایب"
    >
      <div className="flex flex-col gap-3 lg:gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-balance wibe-h3 text-foreground">{copy.title}</h2>
            <p className="mt-1.5 text-pretty wibe-small text-wibe-secondary">
              {copy.description}
            </p>
          </div>
          <button
            type="button"
            onClick={completeOnboarding}
            className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg px-3 wibe-caption font-medium text-wibe-secondary transition-colors hover:bg-wibe-surface hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            {copy.skip}
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {categories.slice(0, 8).map((cat) => {
            const isSelected = selected.includes(cat.slug);
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => toggleSlug(cat.slug)}
                className={`inline-flex min-h-11 items-center rounded-xl border px-3.5 wibe-small font-medium transition-colors ${
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

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleContinue}
            className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-primary px-4 py-2.5 wibe-small font-semibold text-white shadow-sm transition-colors hover:bg-primary-dark sm:flex-none sm:min-w-[10.5rem]"
          >
            {selected.length > 0 ? copy.continueWith : copy.continueWithout}
          </button>
          <button
            type="button"
            onClick={openHomeCreateSheet}
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-1 rounded-xl border border-wibe bg-wibe-card px-4 py-2.5 wibe-small font-medium text-foreground transition-colors hover:border-primary/30 sm:flex-none"
          >
            <Plus className="h-4 w-4" aria-hidden />
            {copy.createList}
          </button>
        </div>
      </div>
    </section>
  );
}
