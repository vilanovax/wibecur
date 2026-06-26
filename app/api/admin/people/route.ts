import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { discoverPeopleFromItems } from '@/lib/person-profiles-server';
import { isPersonRole } from '@/lib/people';

/** GET /api/admin/people?role=&q=&limit= */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const roleRaw = searchParams.get('role');
    const role = roleRaw && isPersonRole(roleRaw) ? roleRaw : undefined;
    const q = searchParams.get('q') ?? undefined;
    const limit = Math.min(Number(searchParams.get('limit') ?? 200) || 200, 500);

    const people = await discoverPeopleFromItems(undefined, { role, q, limit });

    return NextResponse.json({ success: true, data: people });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطا در بارگذاری اشخاص';
    const status = message.includes('Unauthorized') ? 401 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
