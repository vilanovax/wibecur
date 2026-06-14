import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import { notifyCommentRestriction } from '@/lib/comment-restriction-notify';

export const DEFAULT_PENALTY_THRESHOLDS = {
  warn: 5,
  restrict: 10,
  ban: 15,
  restrictDays: 7,
} as const;

export type PenaltyThresholds = {
  warn: number;
  restrict: number;
  ban: number;
  restrictDays: number;
};

export type CommentPermissionStatus = 'allowed' | 'warn' | 'restricted' | 'banned';

export type CommentPermissionResult = {
  allowed: boolean;
  status: CommentPermissionStatus;
  reason?: string;
  totalPenaltyScore: number;
  restrictedUntil: Date | null;
};

export type UserCommentModerationMeta = {
  totalPenaltyScore: number;
  status: CommentPermissionStatus;
  restrictedUntil: string | null;
  commentBanReason: string | null;
};

let cachedThresholds: PenaltyThresholds | null = null;
let thresholdsLoadedAt = 0;
const THRESHOLDS_TTL_MS = 60_000;

export function invalidatePenaltyThresholdsCache(): void {
  cachedThresholds = null;
  thresholdsLoadedAt = 0;
}

export async function getPenaltyThresholds(): Promise<PenaltyThresholds> {
  const now = Date.now();
  if (cachedThresholds && now - thresholdsLoadedAt < THRESHOLDS_TTL_MS) {
    return cachedThresholds;
  }

  try {
    const settings = await dbQuery(() => prisma.comment_settings.findFirst());
    cachedThresholds = {
      warn: settings?.penaltyWarnThreshold ?? DEFAULT_PENALTY_THRESHOLDS.warn,
      restrict:
        settings?.penaltyRestrictThreshold ?? DEFAULT_PENALTY_THRESHOLDS.restrict,
      ban: settings?.penaltyBanThreshold ?? DEFAULT_PENALTY_THRESHOLDS.ban,
      restrictDays:
        settings?.penaltyRestrictDays ?? DEFAULT_PENALTY_THRESHOLDS.restrictDays,
    };
  } catch {
    cachedThresholds = { ...DEFAULT_PENALTY_THRESHOLDS };
  }

  thresholdsLoadedAt = now;
  return cachedThresholds;
}

export function resolveCommentStatus(
  totalPenaltyScore: number,
  restrictedUntil: Date | null,
  isActive: boolean,
  thresholds: PenaltyThresholds = DEFAULT_PENALTY_THRESHOLDS
): CommentPermissionStatus {
  if (!isActive) return 'banned';
  const now = Date.now();
  if (restrictedUntil && restrictedUntil.getTime() > now) return 'restricted';
  if (totalPenaltyScore >= thresholds.ban) return 'banned';
  if (totalPenaltyScore >= thresholds.restrict) return 'restricted';
  if (totalPenaltyScore >= thresholds.warn) return 'warn';
  return 'allowed';
}

export async function getUserPenaltyScore(userId: string): Promise<number> {
  const agg = await dbQuery(() =>
    prisma.user_violations.aggregate({
      where: { userId },
      _sum: { totalPenaltyScore: true },
    })
  );
  return agg._sum.totalPenaltyScore ?? 0;
}

export async function getCommentPermission(userId: string): Promise<CommentPermissionResult> {
  const [user, totalPenaltyScore, thresholds] = await Promise.all([
    dbQuery(() =>
      prisma.users.findUnique({
        where: { id: userId },
        select: {
          isActive: true,
          commentRestrictedUntil: true,
          commentBanReason: true,
        },
      })
    ),
    getUserPenaltyScore(userId),
    getPenaltyThresholds(),
  ]);

  if (!user) {
    return {
      allowed: false,
      status: 'banned',
      reason: 'حساب کاربری یافت نشد',
      totalPenaltyScore: 0,
      restrictedUntil: null,
    };
  }

  if (!user.isActive) {
    return {
      allowed: false,
      status: 'banned',
      reason: 'حساب کاربری غیرفعال است',
      totalPenaltyScore,
      restrictedUntil: user.commentRestrictedUntil,
    };
  }

  const now = Date.now();
  const restrictedUntil = user.commentRestrictedUntil;
  const isTimedRestriction =
    restrictedUntil != null && restrictedUntil.getTime() > now;

  if (isTimedRestriction) {
    return {
      allowed: false,
      status: 'restricted',
      reason:
        user.commentBanReason ||
        'به‌خاطر تخلف، فعلاً امکان ثبت کامنت نداری. بعداً دوباره امتحان کن.',
      totalPenaltyScore,
      restrictedUntil,
    };
  }

  if (totalPenaltyScore >= thresholds.ban) {
    return {
      allowed: false,
      status: 'banned',
      reason:
        user.commentBanReason ||
        'به‌خاطر امتیاز منفی بالا، امکان ثبت کامنت غیرفعال شده است.',
      totalPenaltyScore,
      restrictedUntil,
    };
  }

  if (totalPenaltyScore >= thresholds.restrict) {
    return {
      allowed: false,
      status: 'restricted',
      reason:
        'به‌خاطر امتیاز منفی، فعلاً امکان ثبت کامنت نداری. با پشتیبانی تماس بگیر.',
      totalPenaltyScore,
      restrictedUntil,
    };
  }

  const status = resolveCommentStatus(
    totalPenaltyScore,
    restrictedUntil,
    user.isActive,
    thresholds
  );

  return {
    allowed: true,
    status,
    totalPenaltyScore,
    restrictedUntil,
  };
}

/** پس از ثبت penalty — محدودیت خودکار در صورت عبور از آستانه */
export async function applyAutoRestrictionAfterPenalty(
  userId: string,
  totalPenaltyScore: number
): Promise<void> {
  const thresholds = await getPenaltyThresholds();

  if (totalPenaltyScore >= thresholds.ban) {
    await dbQuery(() =>
      prisma.users.update({
        where: { id: userId },
        data: {
          commentRestrictedUntil: new Date('2099-01-01T00:00:00.000Z'),
          commentBanReason: 'مسدودسازی کامنت — امتیاز منفی بالا',
          updatedAt: new Date(),
        },
      })
    );
    await notifyCommentRestriction(userId, 'permanent');
    return;
  }

  if (totalPenaltyScore >= thresholds.restrict) {
    const user = await dbQuery(() =>
      prisma.users.findUnique({
        where: { id: userId },
        select: { commentRestrictedUntil: true },
      })
    );
    const now = Date.now();
    const hasActiveRestriction =
      user?.commentRestrictedUntil && user.commentRestrictedUntil.getTime() > now;

    if (!hasActiveRestriction) {
      const until = new Date();
      until.setDate(until.getDate() + thresholds.restrictDays);
      await dbQuery(() =>
        prisma.users.update({
          where: { id: userId },
          data: {
            commentRestrictedUntil: until,
            commentBanReason: 'محدودیت موقت کامنت — امتیاز منفی',
            updatedAt: new Date(),
          },
        })
      );
      await notifyCommentRestriction(userId, 'temporary', { until });
    }
  }
}

export async function getUsersCommentModerationMeta(
  userIds: string[]
): Promise<Map<string, UserCommentModerationMeta>> {
  const uniqueIds = [...new Set(userIds.filter(Boolean))];
  const map = new Map<string, UserCommentModerationMeta>();
  if (uniqueIds.length === 0) return map;

  const [users, violations, thresholds] = await Promise.all([
    dbQuery(() =>
      prisma.users.findMany({
        where: { id: { in: uniqueIds } },
        select: {
          id: true,
          isActive: true,
          commentRestrictedUntil: true,
          commentBanReason: true,
        },
      })
    ),
    dbQuery(() =>
      prisma.user_violations.groupBy({
        by: ['userId'],
        where: { userId: { in: uniqueIds } },
        _sum: { totalPenaltyScore: true },
      })
    ),
    getPenaltyThresholds(),
  ]);

  const scoreByUser = new Map(
    violations.map((v) => [v.userId, v._sum.totalPenaltyScore ?? 0])
  );

  for (const user of users) {
    const totalPenaltyScore = scoreByUser.get(user.id) ?? 0;
    map.set(user.id, {
      totalPenaltyScore,
      status: resolveCommentStatus(
        totalPenaltyScore,
        user.commentRestrictedUntil,
        user.isActive,
        thresholds
      ),
      restrictedUntil: user.commentRestrictedUntil?.toISOString() ?? null,
      commentBanReason: user.commentBanReason,
    });
  }

  return map;
}

export function commentStatusLabel(status: CommentPermissionStatus): string {
  switch (status) {
    case 'banned':
      return 'مسدود';
    case 'restricted':
      return 'محدود';
    case 'warn':
      return 'اخطار';
    default:
      return 'آزاد';
  }
}

export const BAD_WORD_PENALTY_SCORE = 1;

export type PenaltyModalAction = 'delete' | 'edit' | 'report' | 'reject';

export function getDefaultPenaltyScore(action: PenaltyModalAction): number {
  if (action === 'reject' || action === 'delete') return 2;
  if (action === 'report') return 1;
  return 0;
}

type ViolationClient = Pick<
  typeof prisma,
  'user_violations' | 'list_comment_reports' | 'comment_reports'
>;

/** ثبت تخلف کلمه ممنوع + امتیاز منفی خودکار */
export async function recordBadWordViolation(
  userId: string,
  commentId: string,
  client: ViolationClient = prisma,
  options?: { skipAutoRestrict?: boolean }
): Promise<void> {
  const existingViolation = await client.user_violations.findFirst({
    where: { userId },
  });

  if (existingViolation) {
    await client.user_violations.update({
      where: { id: existingViolation.id },
      data: {
        violationCount: { increment: 1 },
        totalPenaltyScore: { increment: BAD_WORD_PENALTY_SCORE },
        lastViolationDate: new Date(),
        violationType: 'bad_word',
      },
    });
  } else {
    await client.user_violations.create({
      data: {
        userId,
        commentId,
        violationType: 'bad_word',
        violationCount: 1,
        totalPenaltyScore: BAD_WORD_PENALTY_SCORE,
        lastViolationDate: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  if (!options?.skipAutoRestrict) {
    const totalScore = await getUserPenaltyScore(userId);
    await applyAutoRestrictionAfterPenalty(userId, totalScore);
  }
}

