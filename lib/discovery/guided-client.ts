import type { GuidedDiscoveryPayload } from '@/lib/discovery/guided-recommendations';
import type { GuidedScenario } from '@/lib/discovery/guided-intent';

export type GuidedDiscoveryQueryParams = {
  scenario: GuidedScenario;
  location?: string;
  timeBudget?: string;
};

export function guidedDiscoveryQueryKey(params: GuidedDiscoveryQueryParams) {
  return [
    'guided-discovery',
    params.scenario,
    params.location ?? '',
    params.timeBudget ?? '',
  ] as const;
}

export function guidedDiscoverySearchParams(params: GuidedDiscoveryQueryParams): string {
  const sp = new URLSearchParams({ scenario: params.scenario });
  if (params.location) sp.set('location', params.location);
  if (params.timeBudget) sp.set('timeBudget', params.timeBudget);
  return sp.toString();
}

export async function fetchGuidedDiscovery(
  params: GuidedDiscoveryQueryParams
): Promise<GuidedDiscoveryPayload> {
  const res = await fetch(`/api/discovery/guided?${guidedDiscoverySearchParams(params)}`);
  const json = await res.json();
  if (!json.success) {
    throw new Error(json.error ?? 'خطا در دریافت پیشنهادها');
  }
  return json.data as GuidedDiscoveryPayload;
}

/** Fire-and-forget warm for mood card pointerdown (HTTP cache + connection). */
export function prefetchGuidedDiscovery(params: GuidedDiscoveryQueryParams): void {
  void fetch(`/api/discovery/guided?${guidedDiscoverySearchParams(params)}`).catch(() => {});
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
    keepalive: true,
  }).catch(() => {});
}
