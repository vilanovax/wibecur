import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import type { CommentSeedCampaignStatus } from '@prisma/client';
import { generateSeedComment } from './generator';
import {
  distributeCommentCounts,
  pickToneFromMix,
  randomDateInRange,
} from './distribution';
import { resolveSeedTargetItems } from './target-resolver';
import { toneMixSchema, MAX_SEED_COMMENTS_PER_GENERATE, type CommentSeedTone, type ToneMix } from './types';

const draftInclude = {
  persona: { select: { id: true, displayName: true, username: true, avatarUrl: true } },
  items: { select: { id: true, title: true } },
} as const;

export type RegenerateDraftInput = {
  tone?: CommentSeedTone;
  wordCountMin?: number;
  wordCountMax?: number;
  personaId?: string;
  scheduledAt?: Date;
  reschedule?: boolean;
};

export async function pickRandomActivePersonaIds(count: number): Promise<string[]> {
  const personas = await dbQuery(() =>
    prisma.comment_personas.findMany({
      where: { isActive: true },
      select: { id: true },
      take: Math.max(count * 2, 30),
    })
  );
  if (personas.length === 0) {
    throw new Error('هیچ پرسونای فعالی وجود ندارد. ابتدا اسکریپت create-comment-personas را اجرا کنید.');
  }

  const shuffled = [...personas].sort(() => Math.random() - 0.5);
  const result: string[] = [];
  for (let i = 0; i < count; i++) {
    result.push(shuffled[i % shuffled.length]!.id);
  }
  return result;
}

export async function runCampaignGeneration(campaignId: string): Promise<{
  created: number;
  skipped: number;
}> {
  const campaign = await dbQuery(() =>
    prisma.comment_seed_campaigns.findUnique({ where: { id: campaignId } })
  );
  if (!campaign) throw new Error('کمپین یافت نشد');

  await dbQuery(() =>
    prisma.comment_seed_campaigns.update({
      where: { id: campaignId },
      data: { status: 'generating', updatedAt: new Date() },
    })
  );

  try {
    const items = await resolveSeedTargetItems(campaign.targetType, campaign.targetIds);
    if (items.length === 0) {
      throw new Error('آیتمی برای تولید کامنت یافت نشد');
    }

    const toneMix = toneMixSchema.parse(campaign.toneMix);
    const distribution = distributeCommentCounts(
      items.map((i) => i.id),
      Math.min(campaign.commentCount, MAX_SEED_COMMENTS_PER_GENERATE),
      campaign.perItemCount
    );

    const itemById = new Map(items.map((i) => [i.id, i]));
    const slots: { itemId: string; tone: ReturnType<typeof pickToneFromMix> }[] = [];
    for (const [itemId, n] of distribution) {
      for (let i = 0; i < n; i++) {
        slots.push({ itemId, tone: pickToneFromMix(toneMix) });
      }
    }

    const personaIds = await pickRandomActivePersonaIds(slots.length);
    let created = 0;
    let skipped = 0;

    for (let i = 0; i < slots.length; i++) {
      const slot = slots[i]!;
      const item = itemById.get(slot.itemId);
      if (!item) {
        skipped += 1;
        continue;
      }

      const content = await generateSeedComment({
        item,
        tone: slot.tone,
        wordCountMin: campaign.wordCountMin,
        wordCountMax: campaign.wordCountMax,
      });

      const scheduledAt = randomDateInRange(campaign.dateFrom, campaign.dateTo);

      await dbQuery(() =>
        prisma.comment_seed_drafts.create({
          data: {
            campaignId,
            itemId: slot.itemId,
            personaId: personaIds[i]!,
            content,
            tone: slot.tone,
            wordCount: content.length,
            scheduledAt,
            status: 'draft',
            updatedAt: new Date(),
          },
        })
      );
      created += 1;
    }

    await dbQuery(() =>
      prisma.comment_seed_campaigns.update({
        where: { id: campaignId },
        data: { status: 'ready', updatedAt: new Date() },
      })
    );

    return { created, skipped };
  } catch (error) {
    await dbQuery(() =>
      prisma.comment_seed_campaigns.update({
        where: { id: campaignId },
        data: { status: 'draft', updatedAt: new Date() },
      })
    );
    throw error;
  }
}

export async function publishCampaignDrafts(
  campaignId: string,
  options?: { draftIds?: string[]; onlyApproved?: boolean }
): Promise<{ published: number; skipped: number }> {
  const campaign = await dbQuery(() =>
    prisma.comment_seed_campaigns.findUnique({ where: { id: campaignId } })
  );
  if (!campaign) throw new Error('کمپین یافت نشد');

  await dbQuery(() =>
    prisma.comment_seed_campaigns.update({
      where: { id: campaignId },
      data: { status: 'publishing', updatedAt: new Date() },
    })
  );

  const draftWhere: {
    campaignId: string;
    status?: { in: Array<'draft' | 'approved' | 'published' | 'rejected'> };
    id?: { in: string[] };
  } = { campaignId };

  if (options?.draftIds?.length) {
    draftWhere.id = { in: options.draftIds };
    draftWhere.status = { in: ['draft', 'approved'] };
  } else if (options?.onlyApproved === false) {
    draftWhere.status = { in: ['draft', 'approved'] };
  } else {
    draftWhere.status = { in: ['approved'] };
  }

  const drafts = await dbQuery(() =>
    prisma.comment_seed_drafts.findMany({
      where: draftWhere,
      include: {
        persona: { include: { users: { select: { id: true } } } },
      },
    })
  );

  let published = 0;
  let skipped = 0;

  for (const draft of drafts) {
    if (draft.status === 'published') {
      skipped += 1;
      continue;
    }

    try {
      await dbQuery(() =>
        prisma.$transaction(async (tx) => {
          const comment = await tx.comments.create({
            data: {
              itemId: draft.itemId,
              userId: draft.persona.userId,
              content: draft.content,
              isApproved: true,
              isFiltered: false,
              isSeeded: true,
              seedCampaignId: campaignId,
              seedDraftId: draft.id,
              createdAt: draft.scheduledAt,
              updatedAt: draft.scheduledAt,
            },
          });

          await tx.comment_seed_drafts.update({
            where: { id: draft.id },
            data: {
              status: 'published',
              publishedCommentId: comment.id,
              updatedAt: new Date(),
            },
          });
        })
      );
      published += 1;
    } catch {
      skipped += 1;
    }
  }

  const nextStatus: CommentSeedCampaignStatus =
    published > 0 ? 'published' : campaign.status === 'publishing' ? 'ready' : campaign.status;

  await dbQuery(() =>
    prisma.comment_seed_campaigns.update({
      where: { id: campaignId },
      data: { status: nextStatus, updatedAt: new Date() },
    })
  );

  return { published, skipped };
}

export function parseToneMix(raw: unknown): ToneMix {
  return toneMixSchema.parse(raw ?? {});
}

export async function regenerateDraft(draftId: string, input: RegenerateDraftInput) {
  const draft = await dbQuery(() =>
    prisma.comment_seed_drafts.findUnique({
      where: { id: draftId },
      include: { campaign: true },
    })
  );
  if (!draft) throw new Error('پیش‌نویس یافت نشد');
  if (draft.status === 'published') {
    throw new Error('پیش‌نویس منتشرشده قابل بازتولید نیست');
  }

  const items = await resolveSeedTargetItems('item', [draft.itemId]);
  const item = items[0];
  if (!item) throw new Error('آیتم یافت نشد');

  const tone = input.tone ?? (draft.tone as CommentSeedTone);
  const wordCountMin = input.wordCountMin ?? draft.campaign.wordCountMin;
  const wordCountMax = input.wordCountMax ?? draft.campaign.wordCountMax;

  const content = await generateSeedComment({ item, tone, wordCountMin, wordCountMax });

  let personaId = draft.personaId;
  if (input.personaId === 'random') {
    const ids = await pickRandomActivePersonaIds(1);
    personaId = ids[0]!;
  } else if (input.personaId) {
    personaId = input.personaId;
  }

  let scheduledAt = draft.scheduledAt;
  if (input.scheduledAt) {
    scheduledAt = input.scheduledAt;
  } else if (input.reschedule) {
    scheduledAt = randomDateInRange(draft.campaign.dateFrom, draft.campaign.dateTo);
  }

  const updated = await dbQuery(() =>
    prisma.comment_seed_drafts.update({
      where: { id: draftId },
      data: {
        content,
        tone,
        personaId,
        scheduledAt,
        wordCount: content.length,
        status: 'draft',
        updatedAt: new Date(),
      },
      include: draftInclude,
    })
  );

  return updated;
}

export async function bulkUpdateDrafts(
  campaignId: string,
  action: 'delete' | 'approve' | 'reject',
  draftIds: string[]
) {
  const drafts = await dbQuery(() =>
    prisma.comment_seed_drafts.findMany({
      where: { campaignId, id: { in: draftIds } },
      select: { id: true, status: true },
    })
  );

  if (drafts.length === 0) throw new Error('پیش‌نویسی یافت نشد');

  if (action === 'delete') {
    const deletable = drafts.filter((d) => d.status !== 'published').map((d) => d.id);
    if (deletable.length === 0) {
      throw new Error('پیش‌نویس منتشرشده قابل حذف نیست');
    }
    await dbQuery(() =>
      prisma.comment_seed_drafts.deleteMany({ where: { id: { in: deletable } } })
    );
    return { affected: deletable.length, skipped: draftIds.length - deletable.length };
  }

  const status = action === 'approve' ? 'approved' : 'rejected';
  const updatable = drafts.filter((d) => d.status !== 'published').map((d) => d.id);
  if (updatable.length === 0) {
    throw new Error('پیش‌نویس منتشرشده قابل تغییر نیست');
  }
  await dbQuery(() =>
    prisma.comment_seed_drafts.updateMany({
      where: { id: { in: updatable } },
      data: { status, updatedAt: new Date() },
    })
  );
  return { affected: updatable.length, skipped: draftIds.length - updatable.length };
}
