import type { Prisma, PrismaClient } from '@prisma/client';
import { ensureImageInLiara } from '@/lib/object-storage';
import { withPlacementOverrides, type PlacementOverrideField } from '@/lib/admin/placement-overrides';
import {
  revalidateCategoryCache,
  revalidateItemDetailCache,
  revalidateListDetailCache,
} from '@/lib/public-cache';

export type IngestPlacementPatch = {
  scope?: unknown;
  title?: unknown;
  description?: unknown;
  imageUrl?: unknown;
  externalUrl?: unknown;
  tip?: unknown;
  listNote?: unknown;
  metadata?: unknown;
};

export type IngestPlacementResult =
  | {
      ok: true;
      placement: {
        id: string;
        listId: string;
        catalogItemId: string | null;
        title: string;
        description: string | null;
        imageUrl: string | null;
        externalUrl: string | null;
        listNote: string | null;
        order: number;
        metadata: unknown;
        updatedAt: string;
      };
      otherPlacementsAffected: 0;
      scope: 'placement';
    }
  | { ok: false; status: number; code: string; error: string };

function asMeta(value: unknown): Record<string, unknown> {
  if (value != null && typeof value === 'object' && !Array.isArray(value)) {
    return { ...(value as Record<string, unknown>) };
  }
  return {};
}

function optionalStringOrNull(
  value: unknown
): { present: false } | { present: true; value: string | null } {
  if (value === undefined) return { present: false };
  if (value === null) return { present: true, value: null };
  if (typeof value === 'string') return { present: true, value: value.trim() || null };
  return { present: false };
}

/**
 * ویرایش فقط همین placement — کاتالوگ و لیست‌های دیگر دست نخورده می‌مانند.
 */
export async function patchIngestPlacement(
  db: PrismaClient,
  placementId: string,
  body: IngestPlacementPatch
): Promise<IngestPlacementResult> {
  const scope =
    typeof body.scope === 'string' && body.scope.trim() ? body.scope.trim() : 'placement';
  if (scope === 'catalog_and_all') {
    return {
      ok: false,
      status: 403,
      code: 'forbidden_scope',
      error: 'کلید بات اجازهٔ scope:catalog_and_all را ندارد',
    };
  }
  if (scope !== 'placement') {
    return {
      ok: false,
      status: 400,
      code: 'bad_request',
      error: 'scope فقط placement مجاز است',
    };
  }

  const existing = await db.items.findFirst({
    where: { id: placementId, deletedAt: null },
    include: {
      lists: { select: { id: true, slug: true, categoryId: true, deletedAt: true } },
    },
  });
  if (!existing || existing.lists.deletedAt) {
    return { ok: false, status: 404, code: 'not_found', error: 'placement پیدا نشد' };
  }

  const titleField = optionalStringOrNull(body.title);
  if (titleField.present && !titleField.value) {
    return {
      ok: false,
      status: 422,
      code: 'validation_failed',
      error: 'عنوان نمی‌تواند خالی باشد',
    };
  }

  const descriptionField = optionalStringOrNull(body.description);
  const imageField = optionalStringOrNull(body.imageUrl);
  const externalField = optionalStringOrNull(body.externalUrl);
  const tipField = optionalStringOrNull(body.tip);
  const listNoteField = optionalStringOrNull(body.listNote);

  let nextImage = imageField.present ? imageField.value : undefined;
  if (imageField.present && imageField.value) {
    const stored = await ensureImageInLiara(imageField.value, 'items');
    if (!stored) {
      return {
        ok: false,
        status: 422,
        code: 'image_unreachable',
        error: 'تصویر ذخیره نشد. آدرس را عوض کنید.',
      };
    }
    nextImage = stored;
  }

  const prevMeta = asMeta(existing.metadata);
  let nextMeta = { ...prevMeta };

  if (body.metadata !== undefined) {
    if (body.metadata === null) {
      // پاک‌کردن کل metadata ممنوع؛ فقط کلیدهای ارسالی با null پاک می‌شوند
      return {
        ok: false,
        status: 422,
        code: 'validation_failed',
        error: 'metadata را null نکنید؛ برای پاک‌کردن یک کلید، همان کلید را null بفرستید',
      };
    }
    if (typeof body.metadata !== 'object' || Array.isArray(body.metadata)) {
      return {
        ok: false,
        status: 422,
        code: 'validation_failed',
        error: 'metadata باید شیء باشد',
      };
    }
    const incoming = body.metadata as Record<string, unknown>;
    for (const [key, value] of Object.entries(incoming)) {
      if (key === 'entryKind' || key === 'sourceCategorySlug' || key === 'listOverrides') {
        continue;
      }
      if (value === null) {
        delete nextMeta[key];
      } else {
        nextMeta[key] = value;
      }
    }
  }

  if (tipField.present) {
    if (tipField.value == null) delete nextMeta.tip;
    else nextMeta.tip = tipField.value;
  }

  // tip سطح بالا و metadata.tip نباید متناقض باشند اگر هر دو آمده‌اند
  if (
    tipField.present &&
    body.metadata != null &&
    typeof body.metadata === 'object' &&
    !Array.isArray(body.metadata) &&
    Object.prototype.hasOwnProperty.call(body.metadata, 'tip')
  ) {
    const metaTip = (body.metadata as Record<string, unknown>).tip;
    const normalizedMetaTip =
      metaTip === null || metaTip === undefined
        ? null
        : typeof metaTip === 'string'
          ? metaTip.trim() || null
          : undefined;
    if (
      normalizedMetaTip !== undefined &&
      tipField.value !== normalizedMetaTip
    ) {
      return {
        ok: false,
        status: 422,
        code: 'tip_conflict',
        error: 'tip و metadata.tip متفاوت‌اند',
      };
    }
  }

  const overrideFields: PlacementOverrideField[] = [];
  if (titleField.present && titleField.value !== existing.title) overrideFields.push('title');
  if (
    descriptionField.present &&
    (descriptionField.value ?? null) !== (existing.description ?? null)
  ) {
    overrideFields.push('description');
  }
  if (nextImage !== undefined && nextImage !== existing.imageUrl) overrideFields.push('imageUrl');
  const prevTip = typeof prevMeta.tip === 'string' ? prevMeta.tip : '';
  const nextTip = typeof nextMeta.tip === 'string' ? nextMeta.tip : '';
  if (prevTip !== nextTip) overrideFields.push('tip');

  if (existing.catalogItemId && overrideFields.length > 0) {
    nextMeta = withPlacementOverrides(nextMeta, overrideFields);
  }

  // حفظ entryKind قبلی
  if (prevMeta.entryKind != null && nextMeta.entryKind == null) {
    nextMeta.entryKind = prevMeta.entryKind;
  }
  if (prevMeta.sourceCategorySlug != null && nextMeta.sourceCategorySlug == null) {
    nextMeta.sourceCategorySlug = prevMeta.sourceCategorySlug;
  }

  const data: Prisma.itemsUpdateInput = {
    updatedAt: new Date(),
    metadata: nextMeta as Prisma.InputJsonValue,
  };
  if (titleField.present && titleField.value) data.title = titleField.value;
  if (descriptionField.present) data.description = descriptionField.value;
  if (nextImage !== undefined) data.imageUrl = nextImage;
  if (externalField.present) data.externalUrl = externalField.value;
  if (listNoteField.present) data.listNote = listNoteField.value;

  const updated = await db.items.update({
    where: { id: existing.id },
    data,
  });

  revalidateItemDetailCache(updated.id);
  revalidateListDetailCache(existing.lists.slug);
  revalidateCategoryCache(existing.lists.categoryId);

  return {
    ok: true,
    scope: 'placement',
    otherPlacementsAffected: 0,
    placement: {
      id: updated.id,
      listId: updated.listId,
      catalogItemId: updated.catalogItemId,
      title: updated.title,
      description: updated.description,
      imageUrl: updated.imageUrl,
      externalUrl: updated.externalUrl,
      listNote: updated.listNote,
      order: updated.order,
      metadata: updated.metadata,
      updatedAt: updated.updatedAt.toISOString(),
    },
  };
}

export async function getIngestPlacement(
  db: PrismaClient,
  placementId: string
): Promise<IngestPlacementResult> {
  const item = await db.items.findFirst({
    where: { id: placementId, deletedAt: null },
    include: {
      lists: { select: { deletedAt: true } },
    },
  });
  if (!item || item.lists.deletedAt) {
    return { ok: false, status: 404, code: 'not_found', error: 'placement پیدا نشد' };
  }
  return {
    ok: true,
    scope: 'placement',
    otherPlacementsAffected: 0,
    placement: {
      id: item.id,
      listId: item.listId,
      catalogItemId: item.catalogItemId,
      title: item.title,
      description: item.description,
      imageUrl: item.imageUrl,
      externalUrl: item.externalUrl,
      listNote: item.listNote,
      order: item.order,
      metadata: item.metadata,
      updatedAt: item.updatedAt.toISOString(),
    },
  };
}
