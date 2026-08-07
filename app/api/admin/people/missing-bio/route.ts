import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth';
import { discoverPeopleFromItems } from '@/lib/person-profiles-server';
import { isPersonRole } from '@/lib/people';
import {
  buildExternalAiPrompt,
  buildPersonBioJsonSchemaDoc,
  formatMissingBioCopyList,
  PERSON_BIO_JSON_EXAMPLE,
} from '@/lib/person-bio-ai';

/** GET /api/admin/people/missing-bio?role=&format=text|json|prompt */
export async function GET(request: NextRequest) {
  try {
    const session = await checkAdminAuth();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const roleRaw = searchParams.get('role');
    const role = roleRaw && isPersonRole(roleRaw) ? roleRaw : undefined;
    const format = searchParams.get('format') ?? 'text';

    const { people: missing } = await discoverPeopleFromItems(undefined, {
      role,
      skipPagination: true,
      missingBioOnly: true,
    });

    if (format === 'json') {
      return NextResponse.json({
        success: true,
        data: {
          count: missing.length,
          people: missing.map((p) => ({
            role: p.role,
            slug: p.slug,
            displayName: p.displayName,
            itemCount: p.itemCount,
          })),
          schema: PERSON_BIO_JSON_EXAMPLE,
        },
      });
    }

    if (format === 'schema') {
      return NextResponse.json({
        success: true,
        data: {
          schemaDoc: buildPersonBioJsonSchemaDoc(),
          example: PERSON_BIO_JSON_EXAMPLE,
        },
      });
    }

    if (format === 'prompt') {
      const prompt = buildExternalAiPrompt(missing);
      return NextResponse.json({
        success: true,
        data: {
          count: missing.length,
          prompt,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        count: missing.length,
        text: formatMissingBioCopyList(missing),
        people: missing,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطا';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
