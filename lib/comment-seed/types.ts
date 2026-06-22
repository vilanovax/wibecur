import { z } from 'zod';

export const toneMixSchema = z.object({
  positive: z.number().min(0).max(100).default(40),
  negative: z.number().min(0).max(100).default(10),
  neutral: z.number().min(0).max(100).default(35),
  question: z.number().min(0).max(100).default(15),
});

export type ToneMix = z.infer<typeof toneMixSchema>;

export type CommentSeedTone = 'positive' | 'negative' | 'neutral' | 'question';

export type CommentSeedTargetType = 'item' | 'list' | 'category';

export const campaignCreateSchema = z.object({
  title: z.string().min(2).max(120),
  targetType: z.enum(['item', 'list', 'category']),
  targetIds: z.array(z.string().min(1)).min(1),
  commentCount: z.number().int().min(1).max(100).default(10),
  perItemCount: z.number().int().min(1).max(20).optional(),
  toneMix: toneMixSchema,
  wordCountMin: z.number().int().min(20).max(300).default(40),
  wordCountMax: z.number().int().min(20).max(400).default(120),
  dateFrom: z.string().datetime(),
  dateTo: z.string().datetime(),
  openaiModel: z.string().optional(),
});

export const draftUpdateSchema = z.object({
  content: z.string().min(5).max(500).optional(),
  personaId: z.string().optional(),
  scheduledAt: z.string().datetime().optional(),
  status: z.enum(['draft', 'approved', 'rejected']).optional(),
  tone: z.enum(['positive', 'negative', 'neutral', 'question']).optional(),
});

export const ruleUpsertSchema = z.object({
  scopeType: z.enum(['category', 'list', 'item']),
  scopeId: z.string().min(1),
  enabled: z.boolean(),
  campaignId: z.string().optional().nullable(),
});

export type SeedItemContext = {
  id: string;
  title: string;
  description: string | null;
  listTitle: string | null;
  categoryName: string | null;
  categorySlug: string | null;
};

export const DEFAULT_TONE_MIX: ToneMix = {
  positive: 40,
  negative: 10,
  neutral: 35,
  question: 15,
};

export const MAX_SEED_COMMENTS_PER_GENERATE = 50;
