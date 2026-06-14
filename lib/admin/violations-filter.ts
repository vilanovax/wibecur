import type { Prisma } from '@prisma/client';
import type { PenaltyThresholds } from '@/lib/comment-permission';

export type ViolationStatusFilter = 'all' | 'warn' | 'restricted' | 'banned';

const PERMANENT_BAN_DATE = new Date('2099-01-01T00:00:00.000Z');

export function parseViolationStatusFilter(
  value: string | undefined
): ViolationStatusFilter {
  if (value === 'warn' || value === 'restricted' || value === 'banned') {
    return value;
  }
  return 'all';
}

export function buildViolationsStatusWhere(
  status: ViolationStatusFilter,
  thresholds: PenaltyThresholds,
  now = new Date()
): Prisma.user_violationsWhereInput {
  if (status === 'all') return {};

  if (status === 'banned') {
    return {
      OR: [
        { users: { isActive: false } },
        { totalPenaltyScore: { gte: thresholds.ban } },
        {
          users: {
            commentRestrictedUntil: { gte: PERMANENT_BAN_DATE },
          },
        },
      ],
    };
  }

  if (status === 'restricted') {
    return {
      users: { isActive: true },
      OR: [
        {
          users: {
            commentRestrictedUntil: { gt: now, lt: PERMANENT_BAN_DATE },
          },
        },
        {
          AND: [
            { totalPenaltyScore: { gte: thresholds.restrict } },
            {
              OR: [
                { totalPenaltyScore: { lt: thresholds.ban } },
                { users: { commentRestrictedUntil: null } },
              ],
            },
          ],
        },
      ],
    };
  }

  // warn
  return {
    totalPenaltyScore: { gte: thresholds.warn, lt: thresholds.restrict },
    users: {
      isActive: true,
      OR: [
        { commentRestrictedUntil: null },
        { commentRestrictedUntil: { lte: now } },
      ],
    },
  };
}
