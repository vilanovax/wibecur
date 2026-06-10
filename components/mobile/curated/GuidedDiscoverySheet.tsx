'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import BottomSheet from '@/components/mobile/shared/BottomSheet';
import GuidedDiscoveryResults from './GuidedDiscoveryResults';
import {
  GUIDED_SCENARIO_CONFIGS,
  type GuidedScenario,
} from '@/lib/discovery/guided-intent';
import type { GuidedDiscoveryPayload } from '@/lib/discovery/guided-recommendations';
import { fetchGuidedDiscovery, trackGuidedDiscoveryEvent } from '@/lib/discovery/guided-client';

type Props = {
  scenario: GuidedScenario | null;
  isOpen: boolean;
  onClose: () => void;
};

type Step = 'question' | 'loading' | 'results';

export default function GuidedDiscoverySheet({ scenario, isOpen, onClose }: Props) {
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
    if (!isOpen || !scenario) return;
    reset();
    trackGuidedDiscoveryEvent('scenario_start', { scenario });

    const cfg = GUIDED_SCENARIO_CONFIGS.find((c) => c.id === scenario);
    if (!cfg?.question) {
      setStep('loading');
    }
  }, [isOpen, scenario, reset]);

  const loadResults = useCallback(
    async (params: { location?: string; timeBudget?: string }) => {
      if (!scenario) return;
      setStep('loading');
      setError(null);
      try {
        const result = await fetchGuidedDiscovery({
          scenario,
          location: params.location,
          timeBudget: params.timeBudget,
        });
        setData(result);
        setStep('results');
      } catch (e) {
        setError(e instanceof Error ? e.message : 'خطا در دریافت پیشنهادها');
        setStep('question');
      }
    },
    [scenario]
  );

  useEffect(() => {
    if (!isOpen || !scenario || step !== 'loading') return;
    const cfg = GUIDED_SCENARIO_CONFIGS.find((c) => c.id === scenario);
    if (cfg?.question) return;

    void loadResults({
      location: cfg?.preset?.location,
      timeBudget: cfg?.preset?.timeBudget,
    });
  }, [isOpen, scenario, step, loadResults]);

  const handleAnswer = (value: string) => {
    if (!scenario || !config?.question) return;

    if (config.question.id === 'location') {
      setLocation(value);
      trackGuidedDiscoveryEvent('question_answered', { scenario, location: value });
      void loadResults({ location: value });
      return;
    }

    setTimeBudget(value);
    trackGuidedDiscoveryEvent('question_answered', { scenario, timeBudget: value });
    void loadResults({ timeBudget: value });
  };

  const handleClose = () => {
    onClose();
    reset();
  };

  if (!scenario || !config) return null;

  const title =
    step === 'results' ? config.label : step === 'loading' ? 'در حال آماده‌سازی…' : 'کشف هوشمند';

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      maxHeight="92vh"
      desktopMaxWidth="lg"
    >
      <div className="px-4 pb-4 pt-2 lg:px-0" dir="rtl">
        {step === 'question' && config.question && (
          <div className="space-y-4">
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
            <p className="wibe-small text-wibe-secondary">پیشنهادها رو جمع می‌کنیم…</p>
          </div>
        )}

        {step === 'results' && data && (
          <GuidedDiscoveryResults data={data} scenario={scenario} onItemClick={handleClose} />
        )}
      </div>
    </BottomSheet>
  );
}
