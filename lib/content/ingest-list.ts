import { readFileSync } from 'node:fs';
import type { ListBadge, Prisma, PrismaClient } from '@prisma/client';
import { nanoid } from 'nanoid';
import { sanitizeBulkImportJsonText, validateBulkImportRow } from '@/lib/admin/bulk-import';
import { executeBulkImportForList } from '@/lib/admin/bulk-import-execute';
import { resolveBulkImportMatchesBatch } from '@/lib/admin/bulk-import-resolve';
import { ensureImageInLiara } from '@/lib/object-storage';
import {
  parseIngestDocument,
  type IngestDocument,
  type IngestIssue,
  type IngestKind,
  type IngestListInput,
} from '@/lib/content/ingest-models';

const IMPORT_CHUNK = 100;

export type IngestRowReport = {
  index: number;
  title: string;
  valid: boolean;
  errors: string[];
  warnings: string[];
  match?: 'new' | 'existing_catalog' | 'already_in_list' | 'lightweight';
  status?: string;
  message?: string;
};

export type IngestPreview = {
  new: number;
  existing_catalog: number;
  already_in_list: number;
  lightweight: number;
};

export type IngestReport = {
  ok: boolean;
  dryRun: boolean;
  categorySlug?: string;
  categoryName?: string;
  kind?: IngestKind;
  list?: {
    action: 'create' | 'update';
    id?: string;
    slug: string;
    title: string;
  };
  summary?: {
    total: number;
    invalid: number;
    created: number;
    linked: number;
    updated: number;
    lightweight: number;
  };
  preview?: IngestPreview;
  rows?: IngestRowReport[];
  issues?: IngestIssue[];
  error?: string;
  cacheRevalidated?: boolean;
  cacheNote?: string;
};

export function chunkItems<T>(items: T[], size = IMPORT_CHUNK): T[][] {
  if (size < 1) throw new Error('اندازهٔ تکه نامعتبر است');
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

export function readIngestFile(filePath: string): unknown {
  let text: string;
  try {
    text = readFileSync(filePath, 'utf8');
  } catch {
    throw new Error(`فایل خوانده نشد: ${filePath}`);
  }
  const cleaned = sanitizeBulkImportJsonText(text);
  if (!cleaned) throw new Error('JSON خالی است');
  try {
    return JSON.parse(cleaned);
  } catch (error) {
    const detail = error instanceof Error ? error.message : '';
    throw new Error(`JSON نامعتبر است${detail ? `: ${detail}` : ''}`);
  }
}

function previewCounts(rows: IngestRowReport[]): IngestPreview {
  const preview: IngestPreview = {
    new: 0,
    existing_catalog: 0,
    already_in_list: 0,
    lightweight: 0,
  };
  for (const row of rows) {
    if (row.match) preview[row.match] += 1;
  }
  return preview;
}

function rowReports(document: IngestDocument): IngestRowReport[] {
  return document.items.map((item, index) => {
    const row = validateBulkImportRow(item, index, document.categorySlug);
    return {
      index,
      title: row.title || item.title || '',
      valid: row.valid,
      errors: row.errors,
      warnings: row.warnings,
    };
  });
}

async function resolveOwnerId(db: PrismaClient): Promise<string> {
  for (const role of ['ADMIN', 'SUPER_ADMIN', 'EDITOR'] as const) {
    const user = await db.users.findFirst({
      where: { role, deletedAt: null, isActive: true },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });
    if (user) return user.id;
  }
  throw new Error('کاربر ادمین برای مالک لیست پیدا نشد');
}

async function storeListImage(url: string | undefined, profile: 'coverList' | 'coverListHorizontal') {
  if (!url) return undefined;
  const stored = await ensureImageInLiara(url, 'lists', { profile });
  if (!stored) {
    throw new Error('تصویر لیست ذخیره نشد. آدرس را عوض کنید.');
  }
  return stored;
}

function listPatch(list: IngestListInput, categoryId: string): Prisma.listsUpdateInput {
  const data: Prisma.listsUpdateInput = {
    title: list.title,
    categories: { connect: { id: categoryId } },
  };
  if (list.description !== undefined) data.description = list.description || null;
  if (list.badge !== undefined) data.badge = list.badge;
  if (list.isPublic !== undefined) data.isPublic = list.isPublic;
  if (list.isFeatured !== undefined) data.isFeatured = list.isFeatured;
  if (list.isActive !== undefined) data.isActive = list.isActive;
  if (list.commentsEnabled !== undefined) data.commentsEnabled = list.commentsEnabled;
  if (list.tags !== undefined) data.tags = list.tags;
  return data;
}

async function revalidateIngestedList(slug: string, categoryId: string): Promise<boolean> {
  try {
    const [{ revalidateListDetailCache, revalidateCategoryCache, revalidateHomeCache }, { revalidateAdminListsAndCategoriesCache }] =
      await Promise.all([
        import('@/lib/public-cache'),
        import('@/lib/admin/admin-cache'),
      ]);
    revalidateListDetailCache(slug);
    revalidateCategoryCache(categoryId);
    revalidateHomeCache();
    revalidateAdminListsAndCategoriesCache();
    return true;
  } catch {
    return false;
  }
}

export async function ingestListDocument(
  db: PrismaClient,
  document: IngestDocument,
  options: { dryRun: boolean; overwriteExistingData?: boolean }
): Promise<IngestReport> {
  const category = await db.categories.findUnique({
    where: { slug: document.categorySlug },
  });
  if (!category || category.deletedAt) {
    return {
      ok: false,
      dryRun: options.dryRun,
      categorySlug: document.categorySlug,
      kind: document.kind,
      error: `دسته «${document.categorySlug}» پیدا نشد. فهرست دسته‌ها را با npm run content:categories ببینید.`,
    };
  }

  const rows = rowReports(document);
  const invalid = rows.filter((row) => !row.valid);
  if (invalid.length > 0) {
    return {
      ok: false,
      dryRun: options.dryRun,
      categorySlug: category.slug,
      categoryName: category.name,
      kind: document.kind,
      error: 'بعضی آیتم‌ها با مدل این دسته جور نیستند. چیزی نوشته نشد.',
      summary: {
        total: rows.length,
        invalid: invalid.length,
        created: 0,
        linked: 0,
        updated: 0,
        lightweight: 0,
      },
      rows,
    };
  }

  const existing = await db.lists.findUnique({ where: { slug: document.list.slug } });
  if (existing?.deletedAt) {
    return {
      ok: false,
      dryRun: options.dryRun,
      categorySlug: category.slug,
      categoryName: category.name,
      kind: document.kind,
      error: `لیست «${document.list.slug}» در زباله‌دان است. از پنل بازیابی کنید یا slug دیگری بگذارید.`,
    };
  }
  if (existing && existing.categoryId && existing.categoryId !== category.id) {
    return {
      ok: false,
      dryRun: options.dryRun,
      categorySlug: category.slug,
      categoryName: category.name,
      kind: document.kind,
      error: `لیست «${document.list.slug}» در دستهٔ دیگری است و از اینجا جابه‌جا نمی‌شود.`,
    };
  }

  const listAction = existing ? 'update' : 'create';
  const matches =
    document.items.length > 0
      ? await resolveBulkImportMatchesBatch(db, category.slug, existing?.id ?? '', document.items)
      : [];
  const previewRows = rows.map((row, index) => ({
    ...row,
    match: matches[index]?.kind,
  }));

  if (options.dryRun) {
    return {
      ok: true,
      dryRun: true,
      categorySlug: category.slug,
      categoryName: category.name,
      kind: document.kind,
      list: {
        action: listAction,
        id: existing?.id,
        slug: document.list.slug,
        title: document.list.title,
      },
      summary: {
        total: previewRows.length,
        invalid: 0,
        created: 0,
        linked: 0,
        updated: 0,
        lightweight: 0,
      },
      preview: previewCounts(previewRows),
      rows: previewRows,
    };
  }

  let listId = existing?.id;
  if (!existing) {
    const userId = await resolveOwnerId(db);
    const created = await db.lists.create({
      data: {
        id: nanoid(),
        title: document.list.title,
        slug: document.list.slug,
        description: document.list.description || null,
        categoryId: category.id,
        userId,
        badge: (document.list.badge ?? null) as ListBadge | null,
        isPublic: document.list.isPublic ?? true,
        isFeatured: document.list.isFeatured ?? false,
        isActive: document.list.isActive ?? true,
        commentsEnabled: document.list.commentsEnabled ?? true,
        tags: document.list.tags ?? [],
      },
    });
    listId = created.id;
  } else {
    await db.lists.update({
      where: { id: existing.id },
      data: listPatch(document.list, category.id),
    });
  }

  if (!listId) throw new Error('لیست ساخته نشد');

  const coverImage = await storeListImage(document.list.coverImage, 'coverList');
  const horizontalImage = await storeListImage(document.list.horizontalImage, 'coverListHorizontal');
  if (coverImage || horizontalImage) {
    await db.lists.update({
      where: { id: listId },
      data: {
        ...(coverImage ? { coverImage } : {}),
        ...(horizontalImage ? { horizontalImage } : {}),
      },
    });
  }

  let created = 0;
  let linked = 0;
  let updated = 0;
  let lightweight = 0;
  const imported: IngestRowReport[] = [];
  let offset = 0;
  for (const chunk of chunkItems(document.items)) {
    const result = await executeBulkImportForList(listId, chunk, {
      prisma: db,
      notify: false,
      overwriteExistingData: options.overwriteExistingData === true,
    });
    created += result.created;
    linked += result.linked;
    updated += result.updated;
    lightweight += result.lightweight;
    for (const row of result.results) {
      const preview = previewRows[row.index + offset];
      imported.push({
        index: row.index + offset,
        title: row.title,
        valid: row.status !== 'error',
        errors: row.status === 'error' && row.message ? [row.message] : [],
        warnings: preview?.warnings ?? [],
        match: preview?.match,
        status: row.status,
        message: row.message,
      });
    }
    offset += chunk.length;
  }

  const failed = imported.filter((row) => !row.valid);
  const cacheRevalidated = await revalidateIngestedList(document.list.slug, category.id);

  return {
    ok: failed.length === 0,
    dryRun: false,
    categorySlug: category.slug,
    categoryName: category.name,
    kind: document.kind,
    list: {
      action: listAction,
      id: listId,
      slug: document.list.slug,
      title: document.list.title,
    },
    summary: {
      total: document.items.length,
      invalid: failed.length,
      created,
      linked,
      updated,
      lightweight,
    },
    rows: imported,
    cacheRevalidated,
    cacheNote: cacheRevalidated
      ? undefined
      : 'داده در دیتابیس نوشته شد. کش صفحهٔ لیست حداکثر تا ۵ دقیقهٔ دیگر تازه می‌شود.',
    error: failed.length > 0 ? 'بعضی آیتم‌ها وارد نشدند. اجرای دوباره آیتم‌های سالم را دوبله نمی‌کند.' : undefined,
  };
}

export async function ingestListFile(
  db: PrismaClient,
  filePath: string,
  options: { dryRun: boolean; overwriteExistingData?: boolean }
): Promise<IngestReport> {
  let raw: unknown;
  try {
    raw = readIngestFile(filePath);
  } catch (error) {
    return {
      ok: false,
      dryRun: options.dryRun,
      error: error instanceof Error ? error.message : 'فایل خوانده نشد',
    };
  }

  const parsed = parseIngestDocument(raw);
  if (!parsed.ok) {
    return {
      ok: false,
      dryRun: options.dryRun,
      error: 'JSON با مدل این دسته جور نیست. چیزی نوشته نشد.',
      issues: parsed.issues,
    };
  }

  return ingestListDocument(db, parsed.document, options);
}
