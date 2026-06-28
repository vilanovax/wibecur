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

function MoodSheetHeader({ icon, subtitle }: { icon?: string; subtitle?: string }) {
  if (!icon && !subtitle) return null;

  return (
    <div className="mb-4 flex items-start gap-3 rounded-2xl border border-primary/15 bg-primary/[0.04] p-3.5 lg:mb-5 lg:p-4">
      {icon && (
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm"
          aria-hidden
        >
          {icon}
        </span>
      )}
      {subtitle && (
        <p className="flex-1 pt-0.5 text-right wibe-small leading-relaxed text-wibe-secondary lg:text-[0.9375rem]">
          {subtitle}
        </p>
      )}
    </div>
  );
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
  const sheetSubtitle =
    step === 'results' || step === 'loading' ? moodMeta.subtitle : undefined;

  const title =
    step === 'loading' ? 'در حال آماده‌سازی…' : moodMeta.title;

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      subtitle={sheetSubtitle}
      maxHeight="92vh"
      desktopMaxWidth="xl"
    >
      <div className="px-4 pb-5 pt-1 lg:px-0 lg:pb-6" dir="rtl">
        {step === 'question' && config.question && needsQuestion(scenario, { location, timeBudget }) && (
          <div className="space-y-5">
            <MoodSheetHeader icon={moodIcon} subtitle={moodMeta.subtitle} />
            <div>
              <p className="mb-3 text-right wibe-body font-semibold text-foreground">
                {config.question.prompt}
              </p>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {config.question.options.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleAnswer(opt.value)}
                    className="rounded-2xl border border-wibe bg-wibe-card px-4 py-4 text-right wibe-small font-bold text-foreground transition-all hover:border-primary/35 hover:bg-primary/[0.04] active:scale-[0.99] lg:py-4.5"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            {error && (
              <p className="rounded-xl bg-red-50 px-3 py-2 text-center wibe-caption text-red-600">
                {error}
              </p>
            )}
          </div>
        )}

        {step === 'loading' && (
          <div className="space-y-6 py-6 lg:py-10">
            <div className="flex flex-col items-center gap-4">
              {moodIcon && (
                <span className="flex h-16 w-16 animate-pulse items-center justify-center rounded-3xl bg-primary/10 text-4xl">
                  {moodIcon}
                </span>
              )}
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="text-center wibe-small text-wibe-secondary">پیشنهادها رو جمع می‌کنیم…</p>
            </div>
            <div className="space-y-4 px-1">
              {[1, 2].map((row) => (
                <div key={row} className="space-y-3">
                  <div className="h-5 w-28 animate-pulse rounded-lg bg-gray-200" />
                  <div className="flex gap-3 overflow-hidden">
                    {[1, 2, 3].map((card) => (
                      <div
                        key={card}
                        className="h-36 w-[58%] max-w-[220px] shrink-0 animate-pulse rounded-2xl bg-gray-200 lg:w-full lg:max-w-none"
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 'results' && data && (
          <GuidedDiscoveryResults data={data} scenario={scenario} onItemClick={handleClose} />
        )}
      </div>
    </BottomSheet>
  );
}
