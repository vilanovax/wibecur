import { z } from 'zod';
import { createCommentSeedChatCompletion, formatCommentAiError } from '@/lib/comment-ai-chat';
import type { CommentSeedTone, SeedItemContext } from './types';

const generatedCommentSchema = z.object({
  content: z.string().min(5).max(500),
});

const TONE_LABELS: Record<CommentSeedTone, string> = {
  positive: 'مثبت و راضی',
  negative: 'منفی یا انتقادی ملایم',
  neutral: 'خنثی و توصیفی',
  question: 'سوالی یا کنجکاوانه',
};

export async function generateSeedComment(input: {
  item: SeedItemContext;
  tone: CommentSeedTone;
  wordCountMin: number;
  wordCountMax: number;
}): Promise<string> {
  const { item, tone, wordCountMin, wordCountMax } = input;
  const contextParts = [
    `عنوان آیتم: ${item.title}`,
    item.description ? `توضیح: ${item.description.slice(0, 400)}` : null,
    item.listTitle ? `لیست: ${item.listTitle}` : null,
    item.categoryName ? `دسته: ${item.categoryName}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  const system = `تو یک کاربر فارسی‌زبان در یک اپ لیست‌سازی هستی. یک کامنت کوتاه و طبیعی بنویس.
قوانین:
- فقط JSON با کلید content برگردان
- فارسی محاوره‌ای و واقعی
- بدون ذکر هوش مصنوعی، ربات، یا تبلیغ
- بدون لینک و هشتگ
- لحن: ${TONE_LABELS[tone]}
- طول تقریبی: ${wordCountMin} تا ${wordCountMax} کاراکتر (نه کلمه)
- از تکرار عبارات کلیشه‌ای مثل «عالی بود» خودداری کن`;

  const user = `برای این آیتم یک کامنت بنویس:\n${contextParts}`;

  try {
    const completion = await createCommentSeedChatCompletion(
      [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      { temperature: 0.85, max_completion_tokens: 300 }
    );

    const raw = completion.choices[0]?.message?.content?.trim() ?? '';
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const parsed = generatedCommentSchema.parse(
      JSON.parse(jsonMatch ? jsonMatch[0] : `{"content":${JSON.stringify(raw)}}`)
    );
    return parsed.content.trim();
  } catch (error) {
    throw new Error(formatCommentAiError(error));
  }
}
