import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth';
import {
  getPersonBioAiSettings,
  setPersonBioAiProvider,
} from '@/lib/person-bio-ai';
import { resolveCommentAiProvider } from '@/lib/comment-ai-provider';

/** GET /api/admin/people/settings */
export async function GET() {
  try {
    const session = await checkAdminAuth();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const data = await getPersonBioAiSettings();
    return NextResponse.json({
      success: true,
      data,
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
