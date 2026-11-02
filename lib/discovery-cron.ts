/**
 * اجرای دسته‌ای cron کشف سلیقه — تا timeout یک درخواست کل کاربران را نکشد.
 */

import type { PrismaClient } from '@prisma/client';
import { computeAndUpsertUserCategoryAffinity } from '@/lib/discovery';

export const DISCOVERY_CRON_DEFAULT_LIMIT = 50;
export const DISCOVERY_CRON_MAX_LIMIT = 500;
export const DISCOVERY_CRON_DEFAULT_CONCURRENCY = 5;
export const DISCOVERY_CRON_MAX_CONCURRENCY = 20;

export async function collectDiscoveryCandidateUserIds(
  prisma: PrismaClient
): Promise<string[]> {
  const [bookmarkUsers, listUsers, likeUsers] = await Promise.all([
    prisma.bookmarks.findMany({
      select: { userId: true },
      distinct: ['userId'],
    }),
    prisma.lists.findMany({
      where: { isPublic: true },
      select: { userId: true },
      distinct: ['userId'],
    }),
    prisma.list_likes.findMany({
      select: { userId: true },
      distinct: ['userId'],
    }),
  ]);

  const all = new Set<string>();
  for (const row of bookmarkUsers) all.add(row.userId);
  for (const row of listUsers) all.add(row.userId);
  for (const row of likeUsers) all.add(row.userId);

  return [...all].sort();
}

export function sliceDiscoveryBatch(
  sortedUserIds: string[],
  options: { cursor?: string | null; limit: number }
): { batch: string[]; nextCursor: string | null; hasMore: boolean } {
  const { cursor, limit } = options;
  let start = 0;
  if (cursor) {
    const idx = sortedUserIds.findIndex((id) => id > cursor);
    start = idx === -1 ? sortedUserIds.length : idx;
  }
  const batch = sortedUserIds.slice(start, start + limit);
  const last = batch[batch.length - 1] ?? null;
  const end = start + batch.length;
  return {
    batch,
    nextCursor: last,
    hasMore: end < sortedUserIds.length,
  };
}

export async function runPool<T>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<void>
): Promise<void> {
  if (items.length === 0) return;
  const width = Math.max(1, Math.min(concurrency, items.length));
  let index = 0;

  async function runWorker() {
    while (index < items.length) {
      const current = index;
      index += 1;
      const item = items[current];
      if (item === undefined) return;
      await worker(item);
    }
  }

  await Promise.all(Array.from({ length: width }, () => runWorker()));
}

export type DiscoveryCronResult = {
  processed: number;
  totalCandidates: number;
  nextCursor: string | null;
  hasMore: boolean;
  limit: number;
  concurrency: number;
};

export async function runDiscoveryAffinityBatch(
  prisma: PrismaClient,
  options?: {
    cursor?: string | null;
    limit?: number;
    concurrency?: number;
  }
): Promise<DiscoveryCronResult> {
  const limit = Math.min(
    DISCOVERY_CRON_MAX_LIMIT,
    Math.max(1, options?.limit ?? DISCOVERY_CRON_DEFAULT_LIMIT)
  );
  const concurrency = Math.min(
    DISCOVERY_CRON_MAX_CONCURRENCY,
    Math.max(1, options?.concurrency ?? DISCOVERY_CRON_DEFAULT_CONCURRENCY)
  );

  const sorted = await collectDiscoveryCandidateUserIds(prisma);
  const { batch, nextCursor, hasMore } = sliceDiscoveryBatch(sorted, {
    cursor: options?.cursor,
    limit,
  });

  await runPool(batch, concurrency, async (userId) => {
    await computeAndUpsertUserCategoryAffinity(prisma, userId);
  });

  return {
    processed: batch.length,
    totalCandidates: sorted.length,
    nextCursor: hasMore ? nextCursor : null,
    hasMore,
    limit,
    concurrency,
  };
}

export function parseDiscoveryCronParams(request: Request): {
  cursor: string | null;
  limit: number;
  concurrency: number;
} {
  const url = new URL(request.url);
  const cursorRaw = url.searchParams.get('cursor')?.trim() || null;
  const limitRaw = parseInt(url.searchParams.get('limit') ?? '', 10);
  const concurrencyRaw = parseInt(url.searchParams.get('concurrency') ?? '', 10);

  return {
    cursor: cursorRaw,
    limit: Number.isFinite(limitRaw)
      ? Math.min(DISCOVERY_CRON_MAX_LIMIT, Math.max(1, limitRaw))
      : DISCOVERY_CRON_DEFAULT_LIMIT,
    concurrency: Number.isFinite(concurrencyRaw)
      ? Math.min(DISCOVERY_CRON_MAX_CONCURRENCY, Math.max(1, concurrencyRaw))
      : DISCOVERY_CRON_DEFAULT_CONCURRENCY,
  };
}
