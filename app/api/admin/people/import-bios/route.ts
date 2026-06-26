import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { upsertPersonProfile } from '@/lib/person-profiles-server';
import { parsePersonBioImportPayload } from '@/lib/person-bio-ai';

/** POST /api/admin/people/import-bios — ورود JSON از هوش مصنوعی خارجی */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const payload = parsePersonBioImportPayload(body);

    let updated = 0;
    const errors: string[] = [];

    for (const item of payload.people) {
      try {
        await upsertPersonProfile(prisma, {
          role: item.role,
          slug: item.slug,
          displayName: item.displayName.trim(),
          bio: item.bio.trim(),
          imageUrl: item.imageUrl?.trim() || null,
          externalUrl: item.externalUrl?.trim() || null,
          status: item.status ?? 'published',
        });
        updated += 1;
      } catch (err: unknown) {
        errors.push(
          `${item.displayName}: ${err instanceof Error ? err.message : 'خطا'}`
        );
      }
    }

    return NextResponse.json({
      success: true,
      data: { updated, failed: errors.length, errors: errors.slice(0, 10) },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطا در ورود JSON';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
