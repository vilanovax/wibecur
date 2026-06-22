import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import { getUserPenaltyScore } from '@/lib/comment-permission';
import { notifyCommentRestriction } from '@/lib/comment-restriction-notify';

export type LiftCommentRestrictionResult = {
  previousPenaltyScore: number;
  hadTimedRestriction: boolean;
  previousBanReason: string | null;
};

/** رفع دستی محدودیت کامنت — پاک‌سازی بازهٔ زمانی + صفر کردن امتیاز منفی */
export async function liftUserCommentRestriction(
  userId: string
): Promise<LiftCommentRestrictionResult> {
  const [user, previousPenaltyScore] = await Promise.all([
    dbQuery(() =>
      prisma.users.findUnique({
        where: { id: userId },
        select: {
          commentRestrictedUntil: true,
          commentBanReason: true,
        },
      })
    ),
    getUserPenaltyScore(userId),
  ]);

  if (!user) {
    throw new Error('کاربر یافت نشد');
  }

  const now = Date.now();
  const hadTimedRestriction =
    user.commentRestrictedUntil != null && user.commentRestrictedUntil.getTime() > now;

  await dbQuery(() =>
    prisma.$transaction([
      prisma.users.update({
        where: { id: userId },
        data: {
          commentRestrictedUntil: null,
          commentBanReason: null,
          updatedAt: new Date(),
        },
      }),
      prisma.user_violations.updateMany({
        where: { userId },
        data: {
          totalPenaltyScore: 0,
          updatedAt: new Date(),
        },
      }),
    ])
  );

  await notifyCommentRestriction(userId, 'lifted');

  return {
    previousPenaltyScore,
    hadTimedRestriction,
    previousBanReason: user.commentBanReason,
  };
}
