'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  getHomeInterests,
  isHomeOnboardingDone,
  markHomeOnboardingDone,
  setHomeInterests,
} from '@/lib/home-onboarding-storage';

export function useHomeOnboardingInterests() {
  const [interests, setInterestsState] = useState<string[]>([]);
  const [onboardingDone, setOnboardingDone] = useState(true);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setInterestsState(getHomeInterests());
    setOnboardingDone(isHomeOnboardingDone());
    setHydrated(true);
  }, []);

  const saveInterests = useCallback((slugs: string[]) => {
    const next = slugs.slice(0, 3);
    setHomeInterests(next);
    setInterestsState(next);
  }, []);

  const completeOnboarding = useCallback(() => {
    markHomeOnboardingDone();
    setOnboardingDone(true);
  }, []);

  const shouldShowStartStrip = hydrated && !onboardingDone;

  return {
    interests,
    onboardingDone,
    hydrated,
    shouldShowStartStrip,
    saveInterests,
    completeOnboarding,
  };
}
