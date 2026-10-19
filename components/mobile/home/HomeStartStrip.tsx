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
  const atLimit = selected.length >= 3;

  return (
    <section
      className="mx-4 mb-3 rounded-surface border border-dashed border-brand/30 bg-brand/5 px-4 py-3 lg:mx-0 lg:mb-0 lg:max-w-xl"
      aria-label="شروع در وایب"
    >
      <div className="flex flex-col gap-3">
        <div className="text-start">
          <h2 className="text-balance wibe-h3 text-foreground">{copy.title}</h2>
          <p className="mt-1 text-pretty wibe-small text-muted-foreground">{copy.description}</p>
          <p className="mt-1 wibe-caption tabular-nums text-muted-foreground" aria-live="polite">
            {selected.length.toLocaleString('fa-IR')} از ۳
          </p>
        </div>

        <div className="grid grid-cols-2 gap-1.5" role="group" aria-label="علاقه‌مندی‌ها">
          {categories.slice(0, 4).map((cat) => {
            const isSelected = selected.includes(cat.slug);
            const locked = atLimit && !isSelected;
            return (
              <Button
                key={cat.id}
                type="button"
                size="sm"
                variant={isSelected ? 'brand' : 'outline'}
                className="h-11 w-full"
                aria-pressed={isSelected}
                disabled={locked}
                onClick={() => toggleSlug(cat.slug)}
              >
                {cat.icon ? `${cat.icon} ` : ''}
                {cat.name}
              </Button>
            );
          })}
        </div>

        <Button type="button" variant="brand" size="lg" className="w-full" onClick={handleContinue}>
          {selected.length > 0 ? copy.continueWith : copy.continueWithout}
        </Button>
        <div className="flex items-center justify-between gap-2">
          <Button type="button" variant="ghost" size="sm" className="h-11" onClick={openHomeCreateSheet}>
            <Plus aria-hidden />
            {copy.createList}
          </Button>
          <Button type="button" variant="ghost" size="sm" className="h-11" onClick={completeOnboarding}>
            {copy.skip}
          </Button>
        </div>
      </div>
    </section>
  );
}
