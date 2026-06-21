import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/auth/require-permission';
import { parsePlacementBody } from '../route';

function safeJson(value: unknown): unknown {
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(safeJson);
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = safeJson(v);
    }
    return out;
  }
  return value;
}

/** PATCH /api/admin/custom/sponsored/[id] */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userOrRes = await requirePermission('manage_lists');
    if (userOrRes instanceof NextResponse) return userOrRes;

    const { id } = await params;
    const existing = await prisma.sponsored_placement.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'تبلیغ یافت نشد' }, { status: 404 });
    }

    const body = await request.json();
    const merged = {
      name: body.name ?? existing.name,
      scopeType: body.scopeType ?? existing.scopeType,
      categoryId: body.categoryId ?? existing.categoryId,
      listIds: body.listIds ?? existing.listIds,
      listId: body.listId ?? existing.listId,
      surface: body.surface ?? existing.surface,
      headline: body.headline ?? existing.headline,
      bodyText: body.bodyText ?? existing.bodyText,
      ctaLabel: body.ctaLabel ?? existing.ctaLabel,
      destinationUrl: body.destinationUrl ?? existing.destinationUrl,
      sponsorName: body.sponsorName ?? existing.sponsorName,
      disclosureLabel: body.disclosureLabel ?? existing.disclosureLabel,
      startAt: body.startAt ?? existing.startAt.toISOString(),
      endAt: body.endAt !== undefined ? body.endAt : existing.endAt?.toISOString() ?? null,
      isActive: body.isActive !== undefined ? body.isActive : existing.isActive,
      priority: body.priority !== undefined ? body.priority : existing.priority,
    };
    const parsed = parsePlacementBody(merged);
    if ('error' in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const updated = await prisma.sponsored_placement.update({
      where: { id },
      data: { ...parsed.data, updatedAt: new Date() },
    });

    return NextResponse.json({ success: true, data: safeJson(updated) });
  } catch (err: unknown) {
    console.error('Admin sponsored PATCH error:', err);
    return NextResponse.json({ error: 'خطا در ویرایش تبلیغ' }, { status: 500 });
  }
}

/** DELETE /api/admin/custom/sponsored/[id] */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userOrRes = await requirePermission('manage_lists');
    if (userOrRes instanceof NextResponse) return userOrRes;

    const { id } = await params;
    await prisma.sponsored_placement.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error('Admin sponsored DELETE error:', err);
    return NextResponse.json({ error: 'خطا در حذف تبلیغ' }, { status: 500 });
  }
}
