import OpenAI from 'openai';
import { prisma } from '@/lib/prisma';
import { getDecryptedSettings } from '@/lib/settings';
import {
  formatOpenAIError,
  extractChatCompletionText,
  normalizeOpenAICompletionOptions,
} from '@/lib/openai-chat';
import { resolveOpenAIModel } from '@/lib/openai-models';
import { DEFAULT_DEEPSEEK_MODEL, resolveDeepSeekModel } from '@/lib/deepseek-models';
import {
  commentAiProviderLabel,
  resolveCommentAiProvider,
  type CommentAiProvider,
  type PersonBioAiSettings,
} from '@/lib/comment-ai-provider';
import { PERSON_ROLE_META, type PersonRole } from '@/lib/people';
import type { DiscoveredPerson } from '@/lib/person-profiles';
import { buildPersonBioJsonSchemaDoc } from '@/lib/person-bio-ai-shared';

export {
  PersonBioImportItemSchema,
  PersonBioImportPayloadSchema,
  PERSON_BIO_JSON_EXAMPLE,
  buildPersonBioJsonSchemaDoc,
  parsePersonBioImportPayload,
  tryParsePersonBioImportPayload,
  normalizePersonBioImportRaw,
  type PersonBioImportItem,
  type PersonBioImportPayload,
} from '@/lib/person-bio-ai-shared';

export function buildExternalAiPrompt(people: DiscoveredPerson[]): string {
  const roleLabels = Object.fromEntries(
    (Object.keys(PERSON_ROLE_META) as PersonRole[]).map((role) => [
      role,
      PERSON_ROLE_META[role].label,
    ])
  );

  const lines = people.map(
    (p) =>
      `- role: ${p.role} (${roleLabels[p.role]}) | slug: ${p.slug} | name: ${p.displayName} | items: ${p.itemCount}`
  );

  return `برای هر شخص زیر یک bio کوتاه فارسی (۲ تا ۴ جمله) بنویس و خروجی را فقط به صورت JSON معتبر برگردان.

قوانین:
- فقط JSON برگردان، بدون markdown یا توضیح اضافه
- role و slug را دقیقاً همان‌طور که داده شده حفظ کن
- bio باید فارسی، رسمی-صمیمی و مناسب صفحه پروفایل در اپ «وایب» باشد
- برای بازیگر/کارگردان می‌توانی به سبک آثار و شهرت اشاره کنی بدون ادعای جزئیات نادرست

فرمت خروجی:
${buildPersonBioJsonSchemaDoc()}

لیست اشخاص:
${lines.join('\n')}`;
}

export function formatMissingBioCopyList(people: DiscoveredPerson[]): string {
  return people.map((p) => p.displayName).join('\n');
}

export async function getPersonBioAiProvider(): Promise<CommentAiProvider> {
  const row = await prisma.comment_settings.findFirst({
    select: { personBioAiProvider: true },
  });
  return resolveCommentAiProvider(row?.personBioAiProvider);
}

export async function setPersonBioAiProvider(provider: CommentAiProvider): Promise<void> {
  const resolved = resolveCommentAiProvider(provider);
  const existing = await prisma.comment_settings.findFirst({ select: { id: true } });
  if (existing) {
    await prisma.comment_settings.update({
      where: { id: existing.id },
      data: { personBioAiProvider: resolved },
    });
    return;
  }
  await prisma.comment_settings.create({
    data: {
      personBioAiProvider: resolved,
      commentAiProvider: 'openai',
    },
  });
}

type PersonBioKeySettings = {
  openaiApiKey: string | null;
  deepseekApiKey: string | null;
};

/** provider انتخاب‌شده را با fallback به کلید موجود resolve می‌کند */
export function resolvePersonBioChatProvider(
  preferred: CommentAiProvider,
  settings: PersonBioKeySettings
): CommentAiProvider {
  const hasOpenai = Boolean(settings.openaiApiKey?.trim());
  const hasDeepseek = Boolean(settings.deepseekApiKey?.trim());

  if (preferred === 'deepseek' && hasDeepseek) return 'deepseek';
  if (preferred === 'openai' && hasOpenai) return 'openai';
  if (hasOpenai) return 'openai';
  if (hasDeepseek) return 'deepseek';

  throw new Error(
    'هیچ کلید هوش مصنوعی فعال نیست — در تنظیمات → یکپارچه‌سازی کلید OpenAI یا DeepSeek را وارد کنید'
  );
}

export async function getPersonBioAiSettings(): Promise<PersonBioAiSettings> {
  const [personBioAiProvider, settings] = await Promise.all([
    getPersonBioAiProvider(),
    getDecryptedSettings(),
  ]);
  const openaiConfigured = Boolean(settings.openaiApiKey?.trim());
  const deepseekConfigured = Boolean(settings.deepseekApiKey?.trim());
  const providerReady = openaiConfigured || deepseekConfigured;

  let effectiveProvider: CommentAiProvider | null = null;
  if (providerReady) {
    effectiveProvider = resolvePersonBioChatProvider(personBioAiProvider, settings);
  }

  return {
    personBioAiProvider,
    providerLabel: commentAiProviderLabel(personBioAiProvider),
    openaiConfigured,
    deepseekConfigured,
    providerReady,
    effectiveProvider,
    fallbackActive:
      effectiveProvider != null && effectiveProvider !== personBioAiProvider,
  };
}

export function personBioAiErrorStatus(message: string): number {
  if (message.includes('Unauthorized')) return 401;
  if (message.includes('درخواست‌های زیاد')) return 429;
  if (
    message.includes('کلید') ||
    message.includes('تنظیمات') ||
    message.includes('هوش مصنوعی فعال نیست')
  ) {
    return 400;
  }
  return 500;
}

async function createPersonBioChatCompletion(
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[]
) {
  const [preferredProvider, settings] = await Promise.all([
    getPersonBioAiProvider(),
    getDecryptedSettings(),
  ]);
  const provider = resolvePersonBioChatProvider(preferredProvider, settings);
  const tokenLimit = 4000;

  if (provider === 'deepseek') {
    const stored = resolveDeepSeekModel(settings.deepseekModel);
    const model = stored === 'deepseek-reasoner' ? DEFAULT_DEEPSEEK_MODEL : stored;
    const client = new OpenAI({
      apiKey: settings.deepseekApiKey!,
      baseURL: 'https://api.deepseek.com',
    });
    return client.chat.completions.create({
      model,
      messages,
      ...normalizeOpenAICompletionOptions(model, {
        temperature: 0.6,
        max_tokens: tokenLimit,
      }),
    });
  }

  const model = resolveOpenAIModel(settings.openaiModel);
  const client = new OpenAI({ apiKey: settings.openaiApiKey! });
  return client.chat.completions.create({
    model,
    messages,
    ...normalizeOpenAICompletionOptions(model, {
      temperature: 0.6,
      max_tokens: tokenLimit,
    }),
  });
}

function extractJsonObject(raw: string): unknown {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1]?.trim() ?? trimmed;
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('پاسخ هوش مصنوعی JSON معتبر نبود');
  }
  return JSON.parse(candidate.slice(start, end + 1));
}

export async function generatePersonBioWithAi(input: {
  displayName: string;
  role: PersonRole;
  itemCount: number;
  sampleTitles?: string[];
}): Promise<{ bio: string }> {
  const roleLabel = PERSON_ROLE_META[input.role].label;
  const samples =
    input.sampleTitles && input.sampleTitles.length > 0
      ? `\nنمونه آثار در سایت: ${input.sampleTitles.slice(0, 6).join('، ')}`
      : '';

  const userPrompt = `برای ${roleLabel} «${input.displayName}» یک bio کوتاه فارسی (۲ تا ۴ جمله) بنویس.${samples}\nاین شخص در ${input.itemCount} آیتم سایت ذکر شده است.`;

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content:
        'تو نویسنده محتوای فارسی برای اپ لیست‌سازی «وایب» هستی. فقط متن bio را برگردان، بدون عنوان یا markdown.',
    },
    { role: 'user', content: userPrompt },
  ];

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const completion = await createPersonBioChatCompletion(
      attempt === 0
        ? messages
        : [
            ...messages,
            {
              role: 'user',
              content:
                'پاسخ قبلی کافی نبود. فقط یک bio فارسی ۲ تا ۴ جمله‌ای بنویس، بدون توضیح اضافه.',
            },
          ]
    );

    const bio = extractChatCompletionText(completion, { minLength: 0 }).trim();
    if (bio.length >= 20) {
      return { bio };
    }
  }

  throw new Error('پاسخ هوش مصنوعی برای bio کافی نبود — دوباره امتحان کنید');
}

export async function getActivePersonBioAiLabel(): Promise<string> {
  const provider = await getPersonBioAiProvider();
  return commentAiProviderLabel(provider);
}

export function formatPersonBioAiError(error: unknown): string {
  const msg = formatOpenAIError(error);
  return msg.replace('OpenAI', 'هوش مصنوعی');
}
