'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import BottomSheet from '@/components/mobile/shared/BottomSheet';
import GuidedDiscoveryResults from './GuidedDiscoveryResults';
import {
  GUIDED_SCENARIO_CONFIGS,
  type GuidedScenario,
} from '@/lib/discovery/guided-intent';
import type { MoodExplorerSelection } from '@/lib/discovery/mood-explorer-config';
import type { GuidedDiscoveryPayload } from '@/lib/discovery/guided-recommendations';
import { fetchGuidedDiscovery, trackGuidedDiscoveryEvent } from '@/lib/discovery/guided-client';

type Props = {
  selection: MoodExplorerSelection | null;
  isOpen: boolean;
  onClose: () => void;
};

type Step = 'question' | 'loading' | 'results';

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

  const [step, setStep] = useState<Step>('question');
  const [location, setLocation] = useState<string | undefined>();
  const [timeBudget, setTimeBudget] = useState<string | undefined>();
  const [data, setData] = useState<GuidedDiscoveryPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setStep('question');
    setLocation(undefined);
    setTimeBudget(undefined);
    setData(null);
    setError(null);
  }, []);

  useEffect(() => {
    if (!isOpen || !selection || !scenario) return;
    reset();

    const preset = selection.preset;
    if (preset?.location) setLocation(preset.location);
    if (preset?.timeBudget) setTimeBudget(preset.timeBudget);

    trackGuidedDiscoveryEvent('scenario_start', { scenario });

    if (
      !needsQuestion(scenario, {
        location: preset?.location,
        timeBudget: preset?.timeBudget,
      })
    ) {
      setStep('loading');
    }
  }, [isOpen, selection, scenario, reset]);

  const loadResults = useCallback(
    async (params: { location?: string; timeBudget?: string }) => {
      if (!scenario) return;
      setStep('loading');
      setError(null);
      try {
        const result = await fetchGuidedDiscovery({
          scenario,
          location: params.location ?? selection?.preset?.location,
          timeBudget: params.timeBudget ?? selection?.preset?.timeBudget,
        });
        setData(result);
        setStep('results');
      } catch (e) {
        setError(e instanceof Error ? e.message : 'خطا در دریافت پیشنهادها');
        setStep('question');
      }
    },
    [scenario, selection?.preset]
  );

  useEffect(() => {
    if (!isOpen || !scenario || !selection || step !== 'loading') return;

    const resolvedLocation =
      location ?? selection.preset?.location ?? config?.preset?.location;
    const resolvedTimeBudget =
      timeBudget ?? selection.preset?.timeBudget ?? config?.preset?.timeBudget;

    if (
      needsQuestion(scenario, {
        location: resolvedLocation,
        timeBudget: resolvedTimeBudget,
      })
    ) {
      setStep('question');
      return;
    }

    void loadResults({
      location: resolvedLocation,
      timeBudget: resolvedTimeBudget,
    });
  }, [isOpen, scenario, selection, step, loadResults, location, timeBudget, config]);

  const handleAnswer = (value: string) => {
    if (!scenario || !config?.question) return;

    if (config.question.id === 'location') {
      setLocation(value);
      trackGuidedDiscoveryEvent('question_answered', { scenario, location: value });
      void loadResults({ location: value, timeBudget: timeBudget ?? selection?.preset?.timeBudget });
      return;
    }

    setTimeBudget(value);
    trackGuidedDiscoveryEvent('question_answered', { scenario, timeBudget: value });
    void loadResults({ timeBudget: value, location: location ?? selection?.preset?.location });
  };

  const handleClose = () => {
    onClose();
    reset();
  };

  if (!selection || !scenario || !config) return null;

  const moodMeta = selection.moodMeta;
  const moodIcon = moodMeta.icon;
  const isQuestion =
    step === 'question' && config.question && needsQuestion(scenario, { location, timeBudget });

  const title = step === 'loading' ? 'در حال آماده‌سازی…' : moodMeta.title;
  const subtitle = step === 'results' ? moodMeta.subtitle : undefined;

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
        {isQuestion && config.question && (
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

            {error ? (
              <p className="rounded-xl bg-red-50 px-3 py-2 text-center wibe-caption text-red-600">
                {error}
              </p>
            ) : null}
          </div>
        )}

        {step === 'loading' && (
          <div className="space-y-5 py-4 lg:py-6">
            <div className="flex flex-col items-center gap-3">
              {moodIcon ? (
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-wibe-surface text-3xl ring-1 ring-wibe">
                  {moodIcon}
                </span>
              ) : null}
              <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="text-center wibe-small text-wibe-secondary">پیشنهادها رو جمع می‌کنیم…</p>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {[1, 2, 3, 4].map((card) => (
                <div key={card} className="overflow-hidden rounded-xl border border-wibe">
                  <div className="aspect-[16/10] animate-pulse bg-wibe-surface" />
                  <div className="space-y-2 p-2.5">
                    <div className="h-3.5 w-4/5 animate-pulse rounded bg-wibe-surface" />
                    <div className="h-3 w-2/5 animate-pulse rounded bg-wibe-surface" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 'results' && data ? (
          <GuidedDiscoveryResults data={data} scenario={scenario} onItemClick={handleClose} />
        ) : null}
      </div>
    </BottomSheet>
  );
}
