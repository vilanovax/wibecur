import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth/require-permission';
import {
  assignMediaImage,
  clearMediaImage,
  exportHeaviestMedia,
  exportMissingMediaAssignments,
  importMediaAssignments,
  replaceSiteBanner,
} from '@/lib/admin/media-library';
import { isMediaKind, parseMediaFilter, parseMediaImport, parseMediaRank, parseMediaState } from '@/lib/admin/media-targets';

export async function GET(request: NextRequest) {
  const userOrRes = await requirePermission('edit_list_media');
  if (userOrRes instanceof NextResponse) return userOrRes;

  const filter = parseMediaFilter(request.nextUrl.searchParams.get('kind') ?? undefined);
  const state = parseMediaState(request.nextUrl.searchParams.get('state'));
  const q = request.nextUrl.searchParams.get('q') ?? '';
  const heaviest = parseMediaRank(request.nextUrl.searchParams.get('rank')) === 'bytes';
  const body = heaviest
    ? await exportHeaviestMedia({ filter, q, state })
    : await exportMissingMediaAssignments({ filter, state });
  const parts = [heaviest ? 'media-heaviest' : 'media-missing'];
  if (filter !== 'all') parts.push(filter);
  if (state !== 'all') parts.push(state);
  return new NextResponse(JSON.stringify(body, null, 2), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'content-disposition': `attachment; filename="${parts.join('-')}.json"`,
      'cache-control': 'no-store',
    },
  });
}

export async function POST(request: NextRequest) {
  const userOrRes = await requirePermission('edit_list_media');
  if (userOrRes instanceof NextResponse) return userOrRes;

  const contentType = request.headers.get('content-type') ?? '';
  if (contentType.includes('multipart/form-data')) {
    const form = await request.formData();
    const file = form.get('file');
    const id = typeof form.get('id') === 'string' ? String(form.get('id')) : '';
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'فایلی انتخاب نشده است.' }, { status: 400 });
    }
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'فقط فایل تصویری مجاز است.' }, { status: 400 });
    }
    const result = await replaceSiteBanner(id, Buffer.from(await file.arrayBuffer()));
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json(result);
  }

  const body = (await request.json().catch(() => null)) as {
    action?: string;
    kind?: string;
    id?: string;
    detail?: string;
    url?: string;
    assignments?: unknown;
  } | null;
  if (!body?.action) {
    return NextResponse.json({ error: 'درخواست ناقص است.' }, { status: 400 });
  }

  if (body.action === 'import') {
    const parsed = parseMediaImport(body);
    if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
    const result = await importMediaAssignments(parsed);
    return NextResponse.json(result);
  }

  if (body.action !== 'assign' && body.action !== 'clear') {
    return NextResponse.json({ error: 'عمل نامعتبر است.' }, { status: 400 });
  }
  if (!body.kind || !isMediaKind(body.kind) || typeof body.id !== 'string' || !body.id) {
    return NextResponse.json({ error: 'بخش تصویر مشخص نیست.' }, { status: 400 });
  }

  if (body.action === 'clear') {
    const result = await clearMediaImage({ kind: body.kind, id: body.id, detail: body.detail });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json(result);
  }

  if (typeof body.url !== 'string' || !body.url.trim()) {
    return NextResponse.json({ error: 'آدرس تصویر خالی است.' }, { status: 400 });
  }
  const result = await assignMediaImage({
    kind: body.kind,
    id: body.id,
    detail: body.detail,
    url: body.url,
  });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json(result);
}
