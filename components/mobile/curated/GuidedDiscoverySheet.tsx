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
  const title =
    step === 'results'
      ? moodMeta.title
      : step === 'loading'
        ? 'در حال آماده‌سازی…'
        : moodMeta.title;

  const resultsHeadline = moodMeta.subtitle || data?.headline;

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      maxHeight="92vh"
      desktopMaxWidth="lg"
    >
      <div className="px-4 pb-4 pt-2 lg:px-0" dir="rtl">
        {step === 'question' && config.question && needsQuestion(scenario, { location, timeBudget }) && (
          <div className="space-y-4">
            {moodMeta.subtitle && (
              <p className="text-right wibe-caption text-wibe-secondary">{moodMeta.subtitle}</p>
            )}
            <p className="text-right wibe-body text-foreground">{config.question.prompt}</p>
            <div className="grid gap-2.5 sm:grid-cols-2">
              {config.question.options.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleAnswer(opt.value)}
                  className="rounded-xl border border-wibe bg-wibe-card px-4 py-3.5 text-right wibe-small font-semibold text-foreground transition-colors hover:border-primary/30 hover:bg-primary/5 active:scale-[0.99]"
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {error && <p className="wibe-caption text-red-600">{error}</p>}
          </div>
        )}

        {step === 'loading' && (
          <div className="flex flex-col items-center justify-center gap-3 py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-center wibe-small text-wibe-secondary">
              {moodMeta.subtitle || 'پیشنهادها رو جمع می‌کنیم…'}
            </p>
          </div>
        )}

        {step === 'results' && data && (
          <GuidedDiscoveryResults
            data={data}
            scenario={scenario}
            headlineOverride={resultsHeadline}
            onItemClick={handleClose}
          />
        )}
      </div>
    </BottomSheet>
  );
}
