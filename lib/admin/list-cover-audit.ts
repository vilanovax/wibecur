import { prisma } from '@/lib/prisma';
import { getSharp } from '@/lib/get-sharp';
import { getImageProfile, type ImageProfile } from '@/lib/image-config';
import { isOurStorageUrl } from '@/lib/object-storage-config';
import { isPlaceholderCoverPath } from '@/lib/image-url-policy';
import {
  ensureImageInLiara,
  getObjectByPublicUrl,
  headObjectByPublicUrl,
} from '@/lib/object-storage';
import {
  URGENCY_RANK,
  formatCoverBytes,
  type CoverAuditSummary,
  type CoverUrgency,
  type ListCoverField,
  type ListCoverImageAudit,
} from '@/lib/admin/list-cover-audit-shared';
import { toNodeBuffer } from '@/lib/to-node-buffer';

export type {
  CoverAuditSummary,
  CoverUrgency,
  ListCoverField,
  ListCoverImageAudit,
} from '@/lib/admin/list-cover-audit-shared';
export { formatCoverBytes, isUrgentAudit } from '@/lib/admin/list-cover-audit-shared';

const FIELD_META: Record<ListCoverField, { label: string; profile: ImageProfile }> = {
  coverImage: { label: 'کاور عمودی', profile: 'coverList' },
  horizontalImage: { label: 'بنر افقی', profile: 'coverListHorizontal' },
};

function formatBytes(bytes: number): string {
  return formatCoverBytes(bytes);
}

async function fetchImageDimensions(
  url: string,
  knownBytes: number | null
): Promise<{ width: number | null; height: number | null; contentType: string | null; bytes: number | null }> {
  if (knownBytes != null && knownBytes > 8 * 1024 * 1024) {
    return { width: null, height: null, contentType: null, bytes: knownBytes };
  }

  const obj = await getObjectByPublicUrl(url);
  if (!obj?.buffer?.length) {
    return { width: null, height: null, contentType: null, bytes: knownBytes };
  }

  try {
    const sharp = await getSharp();
    const meta = await sharp(toNodeBuffer(obj.buffer)).metadata();
    return {
      width: meta.width ?? null,
      height: meta.height ?? null,
      contentType: obj.contentType ?? null,
      bytes: obj.buffer.length,
    };
  } catch {
    return {
      width: null,
      height: null,
      contentType: obj.contentType ?? null,
      bytes: obj.buffer.length,
    };
  }
}

function evaluateCoverAudit(input: {
  url: string | null;
  profile: ImageProfile;
  bytes: number | null;
  width: number | null;
  height: number | null;
  contentType: string | null;
  onStorage: boolean;
}): Pick<ListCoverImageAudit, 'urgency' | 'issues' | 'optimizable'> {
  const profileCfg = getImageProfile(input.profile);
  const issues: string[] = [];
  let urgency: CoverUrgency = 'none';

  const bump = (level: CoverUrgency, message: string) => {
    issues.push(message);
    if (URGENCY_RANK[level] > URGENCY_RANK[urgency]) urgency = level;
  };

  if (!input.url?.trim() || isPlaceholderCoverPath(input.url)) {
    bump('critical', 'تصویر تنظیم نشده');
    return { urgency, issues, optimizable: false };
  }

  if (!input.onStorage) {
    bump('high', 'خارج از استوریج ParsPack — نیاز به آپلود/مهاجرت');
  }

  if (input.bytes != null) {
    if (input.bytes > profileCfg.maxSize * 2) {
      bump('high', `حجم زیاد (${formatBytes(input.bytes)} — هدف ~${formatBytes(profileCfg.maxSize)})`);
    } else if (input.bytes > profileCfg.maxSize) {
      bump('medium', `حجم بالاتر از هدف (${formatBytes(input.bytes)})`);
    } else if (input.bytes > profileCfg.skipOptimizationIfSmallerThan * 1.5 && input.onStorage) {
      bump('low', `قابل فشرده‌سازی بیشتر (${formatBytes(input.bytes)})`);
    }
  } else if (input.onStorage) {
    bump('medium', 'اندازه فایل از استوریج خوانده نشد');
  }

  if (input.width != null && input.height != null) {
    if (input.width > profileCfg.maxWidth * 1.2 || input.height > profileCfg.maxHeight * 1.2) {
      bump('high', `ابعاد بزرگ (${input.width}×${input.height} — هدف ${profileCfg.maxWidth}×${profileCfg.maxHeight})`);
    } else if (input.width > profileCfg.maxWidth || input.height > profileCfg.maxHeight) {
      bump('medium', `ابعاد بالاتر از استاندارد (${input.width}×${input.height})`);
    }
  }

  const ct = (input.contentType ?? '').toLowerCase();
  if (input.onStorage && ct && !ct.includes('webp')) {
    bump('medium', `فرمت ${ct.replace('image/', '')} — ترجیح WebP`);
  }

  const optimizable =
    input.onStorage &&
    (URGENCY_RANK[urgency] >= URGENCY_RANK.low ||
      (input.bytes != null && input.bytes > profileCfg.skipOptimizationIfSmallerThan));

  return { urgency, issues, optimizable };
}

async function inspectOneSlot(
  list: {
    id: string;
    title: string;
    slug: string;
    coverImage: string | null;
    horizontalImage: string | null;
    categories: { name: string; icon: string | null } | null;
  },
  field: ListCoverField
): Promise<ListCoverImageAudit> {
  const meta = FIELD_META[field];
  const url = field === 'coverImage' ? list.coverImage : list.horizontalImage;
  const trimmed = url?.trim() || null;
  const onStorage = !!(trimmed && isOurStorageUrl(trimmed));

  let bytes: number | null = null;
  let width: number | null = null;
  let height: number | null = null;
  let contentType: string | null = null;

  if (trimmed && onStorage) {
    const head = await headObjectByPublicUrl(trimmed);
    bytes = head?.bytes ?? null;
    contentType = head?.contentType ?? null;
    const dims = await fetchImageDimensions(trimmed, bytes);
    width = dims.width;
    height = dims.height;
    if (dims.bytes != null) bytes = dims.bytes;
    if (dims.contentType) contentType = dims.contentType;
  }

  const profileCfg = getImageProfile(meta.profile);
  const evalResult = evaluateCoverAudit({
    url: trimmed,
    profile: meta.profile,
    bytes,
    width,
    height,
    contentType,
    onStorage,
  });

  return {
    listId: list.id,
    listTitle: list.title,
    listSlug: list.slug,
    categoryName: list.categories?.name ?? '—',
    categoryIcon: list.categories?.icon ?? '📋',
    field,
    fieldLabel: meta.label,
    url: trimmed,
    profile: meta.profile,
    bytes,
    width,
    height,
    contentType,
    onStorage,
    maxBytes: profileCfg.maxSize,
    maxWidth: profileCfg.maxWidth,
    maxHeight: profileCfg.maxHeight,
    ...evalResult,
  };
}

export async function inspectListCoverAudits(listIds: string[]): Promise<{
  items: ListCoverImageAudit[];
  summary: CoverAuditSummary;
}> {
  if (listIds.length === 0) {
    return {
      items: [],
      summary: { totalSlots: 0, missing: 0, urgent: 0, totalBytes: 0, optimizable: 0 },
    };
  }

  const lists = await prisma.lists.findMany({
    where: { id: { in: listIds }, deletedAt: null },
    select: {
      id: true,
      title: true,
      slug: true,
      coverImage: true,
      horizontalImage: true,
      categories: { select: { name: true, icon: true } },
    },
  });

  const items: ListCoverImageAudit[] = [];
  for (const list of lists) {
    for (const field of ['coverImage', 'horizontalImage'] as const) {
      items.push(await inspectOneSlot(list, field));
    }
  }

  const summary: CoverAuditSummary = {
    totalSlots: items.length,
    missing: items.filter((i) => i.urgency === 'critical').length,
    urgent: items.filter((i) => URGENCY_RANK[i.urgency] >= URGENCY_RANK.medium).length,
    totalBytes: items.reduce((sum, i) => sum + (i.bytes ?? 0), 0),
    optimizable: items.filter((i) => i.optimizable).length,
  };

  return { items, summary };
}

export type OptimizeCoverResult = {
  listId: string;
  field: ListCoverField;
  status: 'optimized' | 'skipped' | 'failed';
  previousUrl?: string | null;
  newUrl?: string | null;
  beforeBytes?: number | null;
  afterBytes?: number | null;
  message?: string;
};

export async function optimizeListCoverSlot(
  listId: string,
  field: ListCoverField
): Promise<OptimizeCoverResult> {
  try {
    const list = await prisma.lists.findUnique({
      where: { id: listId },
      select: { id: true, coverImage: true, horizontalImage: true },
    });

    if (!list) {
      return { listId, field, status: 'failed', message: 'لیست یافت نشد' };
    }

    const url = field === 'coverImage' ? list.coverImage : list.horizontalImage;
    if (!url?.trim() || isPlaceholderCoverPath(url)) {
      return { listId, field, status: 'skipped', message: 'تصویری برای بهینه‌سازی نیست' };
    }

    if (!isOurStorageUrl(url)) {
      return { listId, field, status: 'failed', message: 'فقط تصاویر ParsPack قابل بهینه‌سازی گروهی هستند' };
    }

    const headBefore = await headObjectByPublicUrl(url);
    const profile = FIELD_META[field].profile;

    const newUrl = await ensureImageInLiara(url, 'lists', { profile, forceOptimize: true });
    if (!newUrl) {
      return { listId, field, status: 'failed', previousUrl: url, message: 'بهینه‌سازی ناموفق' };
    }

    if (newUrl === url) {
      return {
        listId,
        field,
        status: 'skipped',
        previousUrl: url,
        newUrl,
        beforeBytes: headBefore?.bytes ?? null,
        afterBytes: headBefore?.bytes ?? null,
        message: 'قبلاً بهینه است',
      };
    }

    await prisma.lists.update({
      where: { id: listId },
      data: {
        [field]: newUrl,
        updatedAt: new Date(),
      },
    });

    const headAfter = await headObjectByPublicUrl(newUrl);

    return {
      listId,
      field,
      status: 'optimized',
      previousUrl: url,
      newUrl,
      beforeBytes: headBefore?.bytes ?? null,
      afterBytes: headAfter?.bytes ?? null,
      message: 'بهینه و جایگزین شد',
    };
  } catch (error: unknown) {
    console.error(`optimizeListCoverSlot ${listId}:${field}:`, error);
    return {
      listId,
      field,
      status: 'failed',
      message: error instanceof Error ? error.message : 'خطای غیرمنتظره',
    };
  }
}

export function sortCoverAudits(
  items: ListCoverImageAudit[],
  sortBy: 'urgency' | 'bytes_desc' | 'bytes_asc' | 'width_desc' | 'height_desc'
): ListCoverImageAudit[] {
  const arr = [...items];
  switch (sortBy) {
    case 'bytes_desc':
      return arr.sort((a, b) => (b.bytes ?? 0) - (a.bytes ?? 0));
    case 'bytes_asc':
      return arr.sort((a, b) => (a.bytes ?? 0) - (b.bytes ?? 0));
    case 'width_desc':
      return arr.sort((a, b) => (b.width ?? 0) - (a.width ?? 0));
    case 'height_desc':
      return arr.sort((a, b) => (b.height ?? 0) - (a.height ?? 0));
    default:
      return arr.sort((a, b) => {
        const u = URGENCY_RANK[b.urgency] - URGENCY_RANK[a.urgency];
        if (u !== 0) return u;
        return (b.bytes ?? 0) - (a.bytes ?? 0);
      });
  }
}
