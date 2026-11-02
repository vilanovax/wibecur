/**
 * رأی مفید/غیرمفید با increment اتمیک داخل transaction
 * تا دو رأی همزمان یکی را گم نکنند.
 */

import { nanoid } from 'nanoid';
import type { Prisma } from '@prisma/client';
import { computeWeightedScore } from '@/lib/comment-utils';

export type VoteApplyResult = {
  helpfulUp: number;
  helpfulDown: number;
  weightedScore: number;
  userVote: number | null;
  /** فقط برای کامنت لیست — اگر down زیاد شد */
  shouldAutoFlag?: boolean;
};

type ItemTx = Prisma.TransactionClient;

function deltasForVoteChange(
  existingValue: number | null | undefined,
  nextValue: number | null
): { upDelta: number; downDelta: number } {
  let upDelta = 0;
  let downDelta = 0;
  if (existingValue === 1) upDelta -= 1;
  else if (existingValue === -1) downDelta -= 1;
  if (nextValue === 1) upDelta += 1;
  else if (nextValue === -1) downDelta += 1;
  return { upDelta, downDelta };
}

async function applyCounterDeltas(
  tx: ItemTx,
  kind: 'item' | 'list',
  commentId: string,
  upDelta: number,
  downDelta: number,
  extra?: { status?: string }
): Promise<{ helpfulUp: number; helpfulDown: number; weightedScore: number }> {
  if (kind === 'item') {
    if (upDelta !== 0 || downDelta !== 0) {
      await tx.comments.update({
        where: { id: commentId },
        data: {
          ...(upDelta !== 0 ? { helpfulUp: { increment: upDelta } } : {}),
          ...(downDelta !== 0 ? { helpfulDown: { increment: downDelta } } : {}),
          updatedAt: new Date(),
        },
      });
    }
    const row = await tx.comments.findUniqueOrThrow({
      where: { id: commentId },
      select: { helpfulUp: true, helpfulDown: true },
    });
    const helpfulUp = Math.max(0, row.helpfulUp);
    const helpfulDown = Math.max(0, row.helpfulDown);
    const weightedScore = computeWeightedScore(helpfulUp, helpfulDown);
    await tx.comments.update({
      where: { id: commentId },
      data: {
        ...(row.helpfulUp < 0 || row.helpfulDown < 0
          ? { helpfulUp, helpfulDown }
          : {}),
        weightedScore,
        updatedAt: new Date(),
      },
    });
    return { helpfulUp, helpfulDown, weightedScore };
  }

  if (upDelta !== 0 || downDelta !== 0 || extra?.status) {
    await tx.list_comments.update({
      where: { id: commentId },
      data: {
        ...(upDelta !== 0 ? { helpfulUp: { increment: upDelta } } : {}),
        ...(downDelta !== 0 ? { helpfulDown: { increment: downDelta } } : {}),
        ...(extra?.status ? { status: extra.status } : {}),
        updatedAt: new Date(),
      },
    });
  }
  const row = await tx.list_comments.findUniqueOrThrow({
    where: { id: commentId },
    select: { helpfulUp: true, helpfulDown: true },
  });
  const helpfulUp = Math.max(0, row.helpfulUp);
  const helpfulDown = Math.max(0, row.helpfulDown);
  const weightedScore = computeWeightedScore(helpfulUp, helpfulDown);
  await tx.list_comments.update({
    where: { id: commentId },
    data: {
      ...(row.helpfulUp < 0 || row.helpfulDown < 0 ? { helpfulUp, helpfulDown } : {}),
      weightedScore,
      updatedAt: new Date(),
    },
  });
  return { helpfulUp, helpfulDown, weightedScore };
}

/** رأی روی کامنت آیتم — همهٔ خواندن/نوشتن داخل همان tx */
export async function applyItemCommentVote(
  tx: ItemTx,
  options: { userId: string; commentId: string; value: 1 | -1 }
): Promise<VoteApplyResult> {
  const { userId, commentId, value } = options;
  const comment = await tx.comments.findUnique({
    where: { id: commentId },
    select: { id: true, userId: true },
  });
  if (!comment) {
    throw Object.assign(new Error('NOT_FOUND'), { code: 'NOT_FOUND' });
  }
  if (comment.userId === userId) {
    throw Object.assign(new Error('SELF_VOTE'), { code: 'SELF_VOTE' });
  }

  const existing = await tx.comment_votes.findUnique({
    where: { userId_commentId: { userId, commentId } },
  });

  if (existing && existing.value === value) {
    await tx.comment_votes.delete({
      where: { userId_commentId: { userId, commentId } },
    });
    const { upDelta, downDelta } = deltasForVoteChange(existing.value, null);
    const counts = await applyCounterDeltas(tx, 'item', commentId, upDelta, downDelta);
    return { ...counts, userVote: null };
  }

  const { upDelta, downDelta } = deltasForVoteChange(existing?.value, value);
  await tx.comment_votes.upsert({
    where: { userId_commentId: { userId, commentId } },
    create: { id: nanoid(), userId, commentId, value },
    update: { value },
  });
  const counts = await applyCounterDeltas(tx, 'item', commentId, upDelta, downDelta);
  return { ...counts, userVote: value };
}

/** رأی روی کامنت لیست */
export async function applyListCommentVote(
  tx: ItemTx,
  options: { userId: string; commentId: string; value: 1 | -1 }
): Promise<VoteApplyResult> {
  const { userId, commentId, value } = options;
  const comment = await tx.list_comments.findUnique({
    where: { id: commentId },
    select: { id: true, userId: true },
  });
  if (!comment) {
    throw Object.assign(new Error('NOT_FOUND'), { code: 'NOT_FOUND' });
  }
  if (comment.userId === userId) {
    throw Object.assign(new Error('SELF_VOTE'), { code: 'SELF_VOTE' });
  }

  const existing = await tx.list_comment_votes.findUnique({
    where: { userId_commentId: { userId, commentId } },
  });

  if (existing && existing.value === value) {
    await tx.list_comment_votes.delete({
      where: { userId_commentId: { userId, commentId } },
    });
    const { upDelta, downDelta } = deltasForVoteChange(existing.value, null);
    const counts = await applyCounterDeltas(tx, 'list', commentId, upDelta, downDelta);
    return { ...counts, userVote: null, shouldAutoFlag: false };
  }

  const { upDelta, downDelta } = deltasForVoteChange(existing?.value, value);
  await tx.list_comment_votes.upsert({
    where: { userId_commentId: { userId, commentId } },
    create: { id: nanoid(), userId, commentId, value },
    update: { value },
  });
  const counts = await applyCounterDeltas(tx, 'list', commentId, upDelta, downDelta);
  const shouldAutoFlag = counts.helpfulDown >= 5;
  if (shouldAutoFlag) {
    await tx.list_comments.update({
      where: { id: commentId },
      data: { status: 'review', updatedAt: new Date() },
    });
  }
  return { ...counts, userVote: value, shouldAutoFlag };
}
