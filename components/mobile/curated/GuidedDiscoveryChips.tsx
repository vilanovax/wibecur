'use client';

import { GUIDED_SCENARIO_CONFIGS, type GuidedScenario } from '@/lib/discovery/guided-intent';

type Props = {
  onSelect: (scenario: GuidedScenario) => void;
  disabled?: boolean;
};

export default function GuidedDiscoveryChips({ onSelect, disabled = false }: Props) {
  return (
    <div className="scrollbar-hide -mx-2.5 flex gap-2 overflow-x-auto px-2.5 pb-0.5 lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0">
      {GUIDED_SCENARIO_CONFIGS.map((scenario) => (
        <button
          key={scenario.id}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(scenario.id)}
          className="flex shrink-0 items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3.5 py-2 wibe-caption font-semibold text-primary transition-colors hover:border-primary/35 hover:bg-primary/10 active:scale-[0.98] disabled:opacity-50 lg:py-2.5 lg:wibe-small"
        >
          <span aria-hidden>{scenario.icon}</span>
          {scenario.label}
        </button>
      ))}
    </div>
  );
}
