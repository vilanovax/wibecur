import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth';
import {
  getPersonBioAiProvider,
  setPersonBioAiProvider,
} from '@/lib/person-bio-ai';
import { commentAiProviderLabel, resolveCommentAiProvider } from '@/lib/comment-ai-provider';

/** GET /api/admin/people/settings */
export async function GET() {
  try {
    const session = await checkAdminAuth();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const personBioAiProvider = await getPersonBioAiProvider();
    return NextResponse.json({
      success: true,
      data: {
        personBioAiProvider,
        providerLabel: commentAiProviderLabel(personBioAiProvider),
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطا';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

/** PUT /api/admin/people/settings */
export async function PUT(request: NextRequest) {
  try {
    const session = await checkAdminAuth();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const provider = resolveCommentAiProvider(body.personBioAiProvider);
    await setPersonBioAiProvider(provider);
    return NextResponse.json({
      success: true,
      data: { personBioAiProvider: provider },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطا';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
