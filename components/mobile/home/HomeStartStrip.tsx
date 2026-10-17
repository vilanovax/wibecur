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
import { Button } from '@/components/ui/button';

type CategoryChip = { id: string; slug: string; name: string; icon: string | null };

async function fetchActiveCategories(): Promise<CategoryChip[]> {
  const res = await fetch('/api/categories');
  const json = await res.json();
  if (!res.ok || !json.success) return [];
  return json.data ?? [];
}

export default function HomeStartStrip({
  initialCategories,
}: {
  initialCategories?: CategoryChip[];
}) {
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

  const needsOnboarding = hydrated && shouldShowStartStrip && isNewUser;
  const { data: categories = initialCategories ?? [] } = useQuery({
    queryKey: ['categories', 'active', 'onboarding'],
    queryFn: fetchActiveCategories,
    staleTime: 10 * 60 * 1000,
    initialData:
      initialCategories && initialCategories.length > 0
        ? initialCategories
        : undefined,
    initialDataUpdatedAt:
      initialCategories && initialCategories.length > 0 ? Date.now() : undefined,
    enabled:
      needsOnboarding &&
      !(initialCategories && initialCategories.length > 0),
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
      className="mx-4 mb-3 rounded-surface border border-dashed border-brand/30 bg-brand/5 p-4 lg:mx-0 lg:mb-0 lg:max-w-3xl lg:p-5"
      aria-label="شروع در وایب"
    >
      <div className="flex flex-col gap-3 lg:gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-balance wibe-h3 text-foreground">{copy.title}</h2>
            <p className="mt-1.5 text-pretty text-sm text-muted-foreground">
              {copy.description}
            </p>
          </div>
          <Button type="button" variant="ghost" size="sm" className="h-11 shrink-0" onClick={completeOnboarding}>
            {copy.skip}
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {categories.slice(0, 8).map((cat) => {
            const isSelected = selected.includes(cat.slug);
            return (
              <Button
                key={cat.id}
                type="button"
                size="sm"
                variant={isSelected ? 'default' : 'outline'}
                className="h-11"
                onClick={() => toggleSlug(cat.slug)}
              >
                {cat.icon ? `${cat.icon} ` : ''}
                {cat.name}
              </Button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="brand" size="lg" className="flex-1 sm:flex-none" onClick={handleContinue}>
            {selected.length > 0 ? copy.continueWith : copy.continueWithout}
          </Button>
          <Button type="button" variant="outline" size="lg" className="flex-1 sm:flex-none" onClick={openHomeCreateSheet}>
            <Plus className="size-4" aria-hidden />
            {copy.createList}
          </Button>
        </div>
      </div>
    </section>
  );
}
