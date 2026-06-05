export type PulseTab = 'live' | 'trend' | 'risk';

export const PULSE_TABS: { id: PulseTab; label: string }[] = [
  { id: 'live', label: 'زنده' },
  { id: 'trend', label: 'روند و ترند' },
  { id: 'risk', label: 'ریسک و اقدام' },
];

export function parsePulseTab(tab: string | null | undefined): PulseTab {
  if (tab === 'trend' || tab === 'risk') return tab;
  return 'live';
}
