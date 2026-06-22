import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import type { CommentSeedCampaignStatus } from '@prisma/client';
import { generateSeedComment } from './generator';
import {
  distributeCommentCounts,
  pickToneFromMix,
  randomDateInRange,
  countWords,
} from './distribution';
import { resolveSeedTargetItems } from './target-resolver';
import { toneMixSchema, MAX_SEED_COMMENTS_PER_GENERATE, type ToneMix } from './types';

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
            wordCount: countWords(content),
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
