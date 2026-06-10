import { logSearchQuery } from '@/lib/search-analytics';
import type { GuidedScenario } from '@/lib/discovery/guided-intent';

export type GuidedDiscoveryEvent =
  | 'scenario_start'
  | 'question_answered'
  | 'result_click';

const SOURCE = 'guided_discovery';

export async function logGuidedDiscoveryEvent(
  event: GuidedDiscoveryEvent,
  data: {
    scenario: GuidedScenario;
    location?: string;
    timeBudget?: string;
    listSlug?: string;
    itemId?: string;
    rowId?: string;
  }
): Promise<void> {
  let query: string;
  switch (event) {
    case 'scenario_start':
      query = `[دستیار] شروع:${data.scenario}`;
      break;
    case 'question_answered':
      query = `[دستیار] پاسخ:${data.scenario}:${data.location ?? data.timeBudget ?? ''}`;
      break;
    case 'result_click':
      query = `[دستیار] کلیک:${data.scenario}:${data.listSlug ?? data.itemId ?? 'unknown'}`;
      break;
    default:
      return;
  }

  try {
    await logSearchQuery(query, SOURCE);
  } catch {
    /* analytics نباید UX را بشکند */
  }
}
