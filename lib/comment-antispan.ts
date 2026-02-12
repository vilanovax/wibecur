import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';

const RATE_LIMIT_1M = 3;
const RATE_LIMIT_1D = 20;
const RATE_WINDOW_1M_MS = 60 * 1000;
const RATE_WINDOW_1D_MS = 24 * 60 * 60 * 1000;
const DUPLICATE_WINDOW_MS = 24 * 60 * 60 * 1000;

export type RateLimitResult = { ok: true } | { ok: false; message: string };

/**
 * Rate limit: max 3 per 60s, max 20 per day
 * Uses DB (no Redis required)
 */
export async function checkCommentRateLimit(userId: string): Promise<RateLimitResult> {
  const now = new Date();
  const window1m = new Date(now.getTime() - RATE_WINDOW_1M_MS);
  const window1d = new Date(now.getTime() - RATE_WINDOW_1D_MS);

  const [count1m, count1d] = await Promise.all([
    dbQuery(() =>
      prisma.list_comments.count({
        where: {
          userId,
          createdAt: { gte: window1m },
          deletedAt: null,
        },
      })
    ),
    dbQuery(() =>
      prisma.list_comments.count({
        where: {
          userId,
          createdAt: { gte: window1d },
          deletedAt: null,
        },
      })
    ),
  ]);

  if (count1m >= RATE_LIMIT_1M) {
    return { ok: false, message: 'کمی صبر کن بعد دوباره نظر بده 🙂' };
  }
  if (count1d >= RATE_LIMIT_1D) {
    return { ok: false, message: 'امروز خیلی فعال بودی 👌 فردا دوباره منتظر نظرت هستیم' };
  }
  return { ok: true };
}

/**
 * Duplicate: same user, same list, same content hash within 24h
 */
export async function checkDuplicateComment(
  listId: string,
  userId: string,
  contentHash: string
): Promise<boolean> {
  const window = new Date(Date.now() - DUPLICATE_WINDOW_MS);
  const existing = await dbQuery(() =>
    prisma.list_comments.findFirst({
      where: {
        listId,
        userId,
        contentHash,
        createdAt: { gte: window },
        deletedAt: null,
      },
    })
  );
  return !!existing;
}

/**
 * Shadow ban check: suspicious user → status=hidden
 * Triggers: low reputation, repeated violations
 */
export async function shouldShadowBan(userId: string): Promise<boolean> {
  const user = await dbQuery(() =>
    prisma.users.findUnique({
      where: { id: userId },
      select: { reputationScore: true },
    })
  );
  if (!user) return false;
  return user.reputationScore < -5;
}
