'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import BottomSheet from '@/components/mobile/shared/BottomSheet';
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
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-wibe-surface text-2xl ring-1 ring-wibe"
                    aria-hidden
                  >
                    {moodIcon}
                  </span>
                ) : null}
                {moodMeta.subtitle ? (
                  <p className="min-w-0 flex-1 text-right wibe-small leading-relaxed text-wibe-secondary">
                    {moodMeta.subtitle}
                  </p>
                ) : null}
              </div>
            )}

            <div>
              <p className="mb-3 text-right wibe-body font-bold text-foreground">
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
                      className="flex items-center gap-3 rounded-2xl border border-wibe bg-wibe-card px-3.5 py-3.5 text-right transition-colors hover:border-primary/30 hover:bg-primary/[0.04] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 active:scale-[0.99] lg:py-4"
                    >
                      <span
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-wibe-surface text-xl"
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
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-wibe-surface text-3xl ring-1 ring-wibe">
                  {moodIcon}
                </span>
              ) : null}
              <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="text-center wibe-small text-wibe-secondary">
                پیشنهادها رو جمع می‌کنیم…
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {[1, 2, 3, 4].map((card) => (
                <div key={card} className="overflow-hidden rounded-xl border border-wibe">
                  <div className="aspect-[16/10] animate-pulse bg-wibe-surface" />
                  <div className="space-y-2 p-2.5">
                    <div className="h-3.5 w-[80%] animate-pulse rounded bg-wibe-surface" />
                    <div className="h-3 w-[40%] animate-pulse rounded bg-wibe-surface" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {showError && (
          <div className="space-y-3 py-8 text-center">
            <p className="wibe-small text-red-600">
              {error instanceof Error ? error.message : 'خطا در دریافت پیشنهادها'}
            </p>
            <button
              type="button"
              onClick={() => void refetch()}
              className="rounded-xl bg-primary px-4 py-2.5 wibe-small font-semibold text-white"
            >
              تلاش مجدد
            </button>
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
