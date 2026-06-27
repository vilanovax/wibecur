import { z } from 'zod';
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

export const PersonBioImportItemSchema = z.object({
  role: z.enum(['director', 'actor', 'author', 'translator']),
  slug: z.string().min(1),
  displayName: z.string().min(1),
  bio: z.string().min(20),
  imageUrl: z.string().url().optional().nullable(),
  externalUrl: z.string().url().optional().nullable(),
  status: z.enum(['draft', 'published']).optional(),
});

export const PersonBioImportPayloadSchema = z.object({
  people: z.array(PersonBioImportItemSchema).min(1).max(100),
});

export type PersonBioImportItem = z.infer<typeof PersonBioImportItemSchema>;
export type PersonBioImportPayload = z.infer<typeof PersonBioImportPayloadSchema>;

export const PERSON_BIO_JSON_EXAMPLE: PersonBioImportPayload = {
  people: [
    {
      role: 'actor',
      slug: 'brad-pitt',
      displayName: 'Brad Pitt',
      bio: 'برد پیت بازیگر و تهیه‌کننده آمریکایی است که از دهه ۱۹۹۰ در سینما شناخته شده. از آثار شاخص او می‌توان به فیلم‌های درام و اکشن اشاره کرد.',
      imageUrl: null,
      externalUrl: 'https://www.imdb.com/name/nm0000093/',
      status: 'published',
    },
  ],
};

export function buildPersonBioJsonSchemaDoc(): string {
  return JSON.stringify(
    {
      $schema: 'وایب — فرمت ورود bio اشخاص',
      description:
        'آرایه people شامل اشخاص. فیلدهای role و slug باید دقیقاً مطابق لیست ارسالی باشند.',
      people: [
        {
          role: 'director | actor | author | translator',
          slug: 'slug-لاتین-از-لیست',
          displayName: 'نام نمایشی فارسی یا انگلیسی',
          bio: '۲ تا ۴ جمله فارسی، مناسب صفحه پروفایل',
          imageUrl: 'https://… (اختیاری — پس از import با «آپلود خارجی‌ها» به ParsPack منتقل می‌شود)',
          externalUrl: 'https://… (اختیاری)',
          status: 'published | draft (اختیاری)',
        },
      ],
    },
    null,
    2
  );
}

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

export function parsePersonBioImportPayload(raw: unknown): PersonBioImportPayload {
  const normalized = normalizePersonBioImportRaw(raw);
  const parsed = PersonBioImportPayloadSchema.safeParse(normalized);
  if (!parsed.success) {
    throw new Error(formatPersonBioImportError(parsed.error));
  }
  return parsed.data;
}

export function tryParsePersonBioImportPayload(raw: unknown):
  | { success: true; data: PersonBioImportPayload }
  | { success: false; error: string } {
  try {
    const normalized = normalizePersonBioImportRaw(raw);
    const parsed = PersonBioImportPayloadSchema.safeParse(normalized);
    if (!parsed.success) {
      return { success: false, error: formatPersonBioImportError(parsed.error) };
    }
    return { success: true, data: parsed.data };
  } catch {
    return { success: false, error: 'JSON نامعتبر است' };
  }
}

function isTemplateImportEntry(entry: unknown): boolean {
  if (!entry || typeof entry !== 'object') return true;
  const e = entry as Record<string, unknown>;
  const role = String(e.role ?? '');
  const slug = String(e.slug ?? '');
  const bio = String(e.bio ?? '');
  if (role.includes('|') || slug.includes('|') || bio.includes('۲ تا ۴')) return true;
  if (/slug|role|director \|/i.test(slug) || /slug-لاتین/i.test(slug)) return true;
  return false;
}

/** استخراج people از JSON خام — شامل خروجی AI با $schema */
export function normalizePersonBioImportRaw(raw: unknown): unknown {
  if (raw == null) return raw;
  if (Array.isArray(raw)) {
    return { people: raw.filter((entry) => !isTemplateImportEntry(entry)) };
  }
  if (typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    if (Array.isArray(obj.people)) {
      return {
        people: obj.people.filter((entry) => !isTemplateImportEntry(entry)),
      };
    }
  }
  return raw;
}

function formatPersonBioImportError(error: z.ZodError): string {
  const first = error.issues[0];
  if (!first) return 'ساختار JSON نامعتبر است';
  const path = first.path.length ? ` (${first.path.join('.')})` : '';
  return `ساختار JSON نامعتبر${path} — role، slug، displayName و bio (حداقل ۲۰ کاراکتر) الزامی‌اند`;
}

export async function getActivePersonBioAiLabel(): Promise<string> {
  const provider = await getPersonBioAiProvider();
  return commentAiProviderLabel(provider);
}

export function formatPersonBioAiError(error: unknown): string {
  const msg = formatOpenAIError(error);
  return msg.replace('OpenAI', 'هوش مصنوعی');
}
