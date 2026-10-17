'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import BottomSheet from '@/components/mobile/shared/BottomSheet';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import GuidedDiscoveryResults from './GuidedDiscoveryResults';
import {
  GUIDED_SCENARIO_CONFIGS,
  type GuidedScenario,
} from '@/lib/discovery/guided-intent';
import type { MoodExplorerSelection } from '@/lib/discovery/mood-explorer-config';
import {
  fetchGuidedDiscovery,
  guidedDiscoveryQueryKey,
  trackGuidedDiscoveryEvent,
} from '@/lib/discovery/guided-client';

type Props = {
  selection: MoodExplorerSelection | null;
  isOpen: boolean;
  onClose: () => void;
};

function needsQuestion(
  scenario: GuidedScenario,
  answers: { location?: string; timeBudget?: string }
): boolean {
  const config = GUIDED_SCENARIO_CONFIGS.find((c) => c.id === scenario);
  if (!config?.question) return false;
  if (config.question.id === 'location' && answers.location) return false;
  if (config.question.id === 'timeBudget' && answers.timeBudget) return false;
  return true;
}

function optionVisual(questionId: 'location' | 'timeBudget', value: string): string {
  if (questionId === 'location') {
    if (value === 'out') return '🚶';
    if (value === 'home') return '🏠';
  }
  if (value === '5') return '⚡';
  if (value === '30') return '⏱️';
  if (value === 'free') return '🌙';
  return '✨';
}

export default function GuidedDiscoverySheet({ selection, isOpen, onClose }: Props) {
  const scenario = selection?.scenario ?? null;
  const config = useMemo(
    () => GUIDED_SCENARIO_CONFIGS.find((c) => c.id === scenario) ?? null,
    [scenario]
  );

  const [location, setLocation] = useState<string | undefined>();
  const [timeBudget, setTimeBudget] = useState<string | undefined>();

  // Reset local answers + analytics when a new mood opens
  useEffect(() => {
    if (!isOpen || !selection || !scenario) return;
    setLocation(undefined);
    setTimeBudget(undefined);
    trackGuidedDiscoveryEvent('scenario_start', { scenario });
  }, [isOpen, selection?.moodId, scenario]);

  const resolvedLocation =
    location ?? selection?.preset?.location ?? config?.preset?.location;
  const resolvedTimeBudget =
    timeBudget ?? selection?.preset?.timeBudget ?? config?.preset?.timeBudget;

  const waitingOnQuestion =
    Boolean(scenario) &&
    needsQuestion(scenario!, {
      location: resolvedLocation,
      timeBudget: resolvedTimeBudget,
    });

  const fetchEnabled = isOpen && Boolean(scenario) && !waitingOnQuestion;

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: guidedDiscoveryQueryKey({
      scenario: scenario ?? 'bored',
      location: resolvedLocation,
      timeBudget: resolvedTimeBudget,
    }),
    queryFn: () =>
      fetchGuidedDiscovery({
        scenario: scenario!,
        location: resolvedLocation,
        timeBudget: resolvedTimeBudget,
      }),
    enabled: fetchEnabled,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnMount: false,
    retry: 1,
  });

  const handleAnswer = useCallback(
    (value: string) => {
      if (!scenario || !config?.question) return;

      if (config.question.id === 'location') {
        setLocation(value);
        trackGuidedDiscoveryEvent('question_answered', { scenario, location: value });
        return;
      }

      setTimeBudget(value);
      trackGuidedDiscoveryEvent('question_answered', { scenario, timeBudget: value });
    },
    [scenario, config]
  );

  const handleClose = () => {
    onClose();
  };

  if (!selection || !scenario || !config) return null;

  const moodMeta = selection.moodMeta;
  const moodIcon = moodMeta.icon;
  const showQuestion = waitingOnQuestion;
  const showLoading = fetchEnabled && isLoading && !data;
  const showResults = Boolean(data) && !showQuestion;
  const showError = isError && !data && !showQuestion;

  const title = showLoading
    ? 'در حال آماده‌سازی…'
    : showResults
      ? moodMeta.title
      : moodMeta.title;
  const subtitle = showResults ? moodMeta.subtitle : undefined;

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      subtitle={subtitle}
      maxHeight="92vh"
      desktopMaxWidth="xl"
    >
      <div className="px-4 pb-6 pt-1 lg:px-0 lg:pb-7" dir="rtl">
        {showQuestion && config.question && (
          <div className="space-y-5">
            {(moodIcon || moodMeta.subtitle) && (
              <div className="flex items-center gap-3">
                {moodIcon ? (
                  <span
                    className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-muted text-2xl"
                    aria-hidden
                  >
                    {moodIcon}
                  </span>
                ) : null}
                {moodMeta.subtitle ? (
                  <p className="min-w-0 flex-1 text-start text-sm leading-relaxed text-muted-foreground">
                    {moodMeta.subtitle}
                  </p>
                ) : null}
              </div>
            )}

            <div>
              <p className="mb-3 text-start text-base font-bold text-foreground">
                {config.question.prompt}
              </p>
              <div
                className={
                  config.question.options.length === 2
                    ? 'grid grid-cols-2 gap-2.5'
                    : 'grid gap-2.5'
                }
              >
                {config.question.options.map((opt) => {
                  const visual = optionVisual(config.question!.id, opt.value);
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleAnswer(opt.value)}
                      className="flex min-h-12 items-center gap-3 rounded-surface border border-border bg-popover px-4 py-3 text-start transition-colors hover:border-brand/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
                    >
                      <span
                        className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted text-xl"
                        aria-hidden
                      >
                        {visual}
                      </span>
                      <span className="min-w-0 flex-1 wibe-small font-bold text-foreground">
                        {opt.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {showLoading && (
          <div className="space-y-5 py-4 lg:py-6">
            <div className="flex flex-col items-center gap-3">
              {moodIcon ? (
                <span className="flex size-14 items-center justify-center rounded-xl bg-muted text-3xl">
                  {moodIcon}
                </span>
              ) : null}
              <div className="size-7 animate-spin rounded-full border-2 border-brand border-t-transparent" />
              <p className="text-center text-sm text-muted-foreground">
                پیشنهادها رو جمع می‌کنیم…
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {[1, 2, 3, 4].map((card) => (
                <Card key={card} className="overflow-hidden bg-popover p-0">
                  <Skeleton className="aspect-video w-full rounded-none" />
                  <div className="space-y-2 p-3">
                    <Skeleton className="h-4 w-4/5" />
                    <Skeleton className="h-3 w-2/5" />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {showError && (
          <div className="space-y-3 py-8 text-center">
            <p className="text-sm text-destructive">
              {error instanceof Error ? error.message : 'خطا در دریافت پیشنهادها'}
            </p>
            <Button type="button" variant="brand" size="lg" onClick={() => void refetch()}>
              تلاش مجدد
            </Button>
          </div>
        )}

        {showResults && data ? (
          <div className="relative">
            {isFetching && !isLoading ? (
              <div
                className="pointer-events-none absolute inset-x-0 top-0 z-10 h-0.5 overflow-hidden rounded-full bg-primary/15"
                aria-hidden
              >
                <div className="h-full w-1/3 animate-pulse bg-primary/50" />
              </div>
            ) : null}
            <GuidedDiscoveryResults
              data={data}
              scenario={scenario}
              onItemClick={handleClose}
            />
          </div>
        ) : null}
      </div>
    </BottomSheet>
  );
}
