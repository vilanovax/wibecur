import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isPersonRole } from '@/lib/people';
import { listPeopleMissingStorageImage } from '@/lib/person-image-storage';
import {
  buildExternalAiImagePrompt,
  buildPersonImageJsonSchemaDoc,
  formatMissingImageDetailedList,
  formatMissingImageNameList,
  PERSON_IMAGE_JSON_EXAMPLE,
  type PersonMissingImageEntry,
} from '@/lib/person-image-ai';

/** GET /api/admin/people/missing-image?role=&format=text|json|prompt|schema&onlyNoImage=1 */
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
    const onlyNoImage = searchParams.get('onlyNoImage') === '1';
    const imageFilterRaw = searchParams.get('imageFilter');
    const imageFilter =
      imageFilterRaw === 'all' ||
      imageFilterRaw === 'none' ||
      imageFilterRaw === 'has' ||
      imageFilterRaw === 'storage' ||
      imageFilterRaw === 'external' ||
      imageFilterRaw === 'missing'
        ? imageFilterRaw
        : onlyNoImage
          ? 'none'
          : 'missing';

    const missing = await listPeopleMissingStorageImage(prisma, { role, imageFilter });
    const entries: PersonMissingImageEntry[] = missing.map((p) => ({
      role: p.role,
      slug: p.slug,
      displayName: p.displayName,
      itemCount: p.itemCount,
      imageStatus: p.imageStatus,
    }));

    if (format === 'json') {
      return NextResponse.json({
        success: true,
        data: {
          count: entries.length,
          people: entries,
          schema: PERSON_IMAGE_JSON_EXAMPLE,
        },
      });
    }

    if (format === 'schema') {
      return NextResponse.json({
        success: true,
        data: {
          schemaDoc: buildPersonImageJsonSchemaDoc(),
          example: PERSON_IMAGE_JSON_EXAMPLE,
        },
      });
    }

    if (format === 'prompt') {
      const prompt = buildExternalAiImagePrompt(entries);
      return NextResponse.json({
        success: true,
        data: {
          count: entries.length,
          prompt,
        },
      });
    }

    if (format === 'detailed') {
      return NextResponse.json({
        success: true,
        data: {
          count: entries.length,
          text: formatMissingImageDetailedList(entries),
          people: entries,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        count: entries.length,
        text: formatMissingImageNameList(entries),
        people: entries,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطا';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
