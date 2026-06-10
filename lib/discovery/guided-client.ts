import type { GuidedDiscoveryPayload } from '@/lib/discovery/guided-recommendations';
import type { GuidedScenario } from '@/lib/discovery/guided-intent';

export async function fetchGuidedDiscovery(params: {
  scenario: GuidedScenario;
  location?: string;
  timeBudget?: string;
}): Promise<GuidedDiscoveryPayload> {
  const sp = new URLSearchParams({ scenario: params.scenario });
  if (params.location) sp.set('location', params.location);
  if (params.timeBudget) sp.set('timeBudget', params.timeBudget);

  const res = await fetch(`/api/discovery/guided?${sp.toString()}`);
  const json = await res.json();
  if (!json.success) {
    throw new Error(json.error ?? 'خطا در دریافت پیشنهادها');
  }
  return json.data as GuidedDiscoveryPayload;
}

export function trackGuidedDiscoveryEvent(
  event: 'scenario_start' | 'question_answered' | 'result_click',
  data: {
    scenario: GuidedScenario;
    location?: string;
    timeBudget?: string;
    listSlug?: string;
    itemId?: string;
    rowId?: string;
  }
): void {
  void fetch('/api/discovery/guided/event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event, ...data }),
  }).catch(() => {});
}
