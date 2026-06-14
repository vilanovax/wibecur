import { NextRequest, NextResponse } from 'next/server';
import { getClientErrorMessage } from '@/lib/api-error';
import {
  logGuidedDiscoveryEvent,
  type GuidedDiscoveryEvent,
} from '@/lib/discovery/guided-analytics';
import { parseGuidedScenario } from '@/lib/discovery/guided-intent';

const EVENTS: GuidedDiscoveryEvent[] = [
  'scenario_start',
  'question_answered',
  'result_click',
];

/** POST /api/discovery/guided/event — analytics دستیار کشف */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const event = typeof body.event === 'string' ? body.event : '';
    if (!EVENTS.includes(event as GuidedDiscoveryEvent)) {
      return NextResponse.json({ success: false, error: 'رویداد نامعتبر' }, { status: 400 });
    }

    const scenario = parseGuidedScenario(
      typeof body.scenario === 'string' ? body.scenario : null
    );
    if (!scenario) {
      return NextResponse.json({ success: false, error: 'سناریو نامعتبر' }, { status: 400 });
    }

    await logGuidedDiscoveryEvent(event as GuidedDiscoveryEvent, {
      scenario,
      location: typeof body.location === 'string' ? body.location : undefined,
      timeBudget: typeof body.timeBudget === 'string' ? body.timeBudget : undefined,
      listSlug: typeof body.listSlug === 'string' ? body.listSlug : undefined,
      itemId: typeof body.itemId === 'string' ? body.itemId : undefined,
      rowId: typeof body.rowId === 'string' ? body.rowId : undefined,
    });

    return NextResponse.json({ success: true, data: { logged: true } });
  } catch (error: unknown) {
    const message = getClientErrorMessage(error, 'Internal server error');
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
