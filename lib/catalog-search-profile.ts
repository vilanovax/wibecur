import { z } from 'zod';
import type { Prisma, PrismaClient } from '@prisma/client';
import { createAdminOpenAIChatCompletion, formatOpenAIError } from '@/lib/openai-chat';
import { resolveOpenAIModel } from '@/lib/openai-models';
import { getDecryptedSettings } from '@/lib/settings';

export const CatalogSearchProfileSchema = z.object({
  genres: z.array(z.string()).default([]),
  subgenres: z.array(z.string()).default([]),
  themes: z.array(z.string()).default([]),
  keywords: z.array(z.string()).default([]),
  searchText: z.string().min(8),
});

export type CatalogSearchProfile = z.infer<typeof CatalogSearchProfileSchema> & {
  enrichedAt?: string;
  model?: string;
};

const LLMResponseSchema = z.object({
  genres: z.union([z.array(z.string()), z.string()]).optional(),
  subgenres: z.union([z.array(z.string()), z.string()]).optional(),
  themes: z.union([z.array(z.string()), z.string()]).optional(),
  keywords: z.union([z.array(z.string()), z.string()]).optional(),
  searchText: z.string().optional(),
});

function normalizeStringList(value: unknown, max = 12): string[] {
  if (Array.isArray(value)) {
    return [...new Set(value.map((v) => String(v).trim()).filter(Boolean))].slice(0, max);
  }
  if (typeof value === 'string' && value.trim()) {
    return [
      ...new Set(
        value
          .split(/[,،|]/)
          .map((s) => s.trim())
          .filter(Boolean)
      ),
    ].slice(0, max);
  }
  return [];
}

export function getSearchProfileFromMetadata(metadata: unknown): CatalogSearchProfile | null {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return null;
  const raw = (metadata as Record<string, unknown>).searchProfile;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const parsed = CatalogSearchProfileSchema.safeParse(raw);
  if (!parsed.success) return null;
  const enrichedAt =
    typeof (raw as Record<string, unknown>).enrichedAt === 'string'
      ? String((raw as Record<string, unknown>).enrichedAt)
      : undefined;
  const model =
    typeof (raw as Record<string, unknown>).model === 'string'
      ? String((raw as Record<string, unknown>).model)
      : undefined;
  return { ...parsed.data, enrichedAt, model };
}

export function catalogHasSearchProfile(metadata: unknown): boolean {
  return getSearchProfileFromMetadata(metadata) != null;
}

export function mergeSearchProfileIntoMetadata(
  metadata: Record<string, unknown> | null | undefined,
  profile: CatalogSearchProfile
): Record<string, unknown> {
  return {
    ...(metadata ?? {}),
    searchProfile: {
      genres: profile.genres,
      subgenres: profile.subgenres,
      themes: profile.themes,
      keywords: profile.keywords,
      searchText: profile.searchText,
      enrichedAt: profile.enrichedAt ?? new Date().toISOString(),
      ...(profile.model ? { model: profile.model } : {}),
    },
  };
}

export function formatSearchProfileSummary(profile: CatalogSearchProfile): string {
  const parts = [
    profile.genres.slice(0, 3).join('، '),
    profile.keywords.slice(0, 4).join('، '),
  ].filter(Boolean);
  return parts.join(' · ') || profile.searchText.slice(0, 80);
}

function buildSearchProfilePrompt(input: {
  title: string;
  categorySlug: string | null;
  description?: string | null;
  metadata?: Record<string, unknown> | null;
}): string {
  const meta = input.metadata ?? {};
  const metaLines = [
    meta.genre ? `ژانر فعلی: ${meta.genre}` : null,
    meta.director ? `کارگردان: ${meta.director}` : null,
    meta.author ? `نویسنده: ${meta.author}` : null,
    meta.actors
      ? `بازیگران: ${Array.isArray(meta.actors) ? meta.actors.join('، ') : meta.actors}`
      : null,
    meta.year ? `سال: ${meta.year}` : null,
    meta.cuisine ? `نوع غذا: ${meta.cuisine}` : null,
    meta.address ? `آدرس: ${meta.address}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  return `برای این آیتم در اپ Wibe یک پروفایل جستجو بساز تا کاربران با کلمات کلیدی مثل ژانر فرعی، تم، مود و مترادف فارسی/انگلیسی پیدایش کنند.

عنوان: ${input.title}
دسته: ${input.categorySlug || 'عمومی'}
${input.description?.trim() ? `توضیحات:\n${input.description.trim()}` : ''}
${metaLines ? `متادیتای موجود:\n${metaLines}` : ''}

خروجی JSON با این ساختار (فقط JSON معتبر):
{
  "genres": ["ژانرهای اصلی به فارسی و انگلیسی"],
  "subgenres": ["زیرژانرها مثل Gun Fu، Heist، Neo-noir"],
  "themes": ["تم‌ها مثل انتقام، سرقت، ماشین‌سواری"],
  "keywords": ["کلیدواژه‌های جستجو فارسی و انگلیسی شامل نام‌های مشهور مرتبط"],
  "searchText": "یک پاراگراف کوتاه فارسی (۳–۵ جمله) که همهٔ مضامین، فضا و کلمات کلیدی را پوشش دهد — برای ایندکس جستجو"
}

قوانین:
- اگر فیلم/سریال است: ژانر، زیرژانر، بازیگران شناخته‌شده، franchiseهای مرتبط
- اگر کتاب است: نویسنده، سبک، موضوع
- اگر کافه/مکان است: فضا، نوع غذا، محله، تجربه
- keywords باید شامل فارسی و انگلیسی باشد
- اطلاعات حدسی واضح را ننویس؛ اگر مطمئن نیستی keyword کمتری بده`;
}

export function parseSearchProfileResponse(
  raw: unknown,
  model?: string
): CatalogSearchProfile {
  const parsed = LLMResponseSchema.parse(raw);
  const profile: CatalogSearchProfile = {
    genres: normalizeStringList(parsed.genres),
    subgenres: normalizeStringList(parsed.subgenres),
    themes: normalizeStringList(parsed.themes),
    keywords: normalizeStringList(parsed.keywords, 20),
    searchText: (parsed.searchText ?? '').trim(),
    enrichedAt: new Date().toISOString(),
    ...(model ? { model } : {}),
  };

  if (!profile.searchText) {
    profile.searchText = [
      profile.genres.join(' '),
      profile.subgenres.join(' '),
      profile.themes.join(' '),
      profile.keywords.join(' '),
    ]
      .filter(Boolean)
      .join(' ')
      .trim();
  }

  const validated = CatalogSearchProfileSchema.parse(profile);
  return { ...validated, enrichedAt: profile.enrichedAt, model: profile.model };
}

export async function generateCatalogSearchProfile(input: {
  title: string;
  categorySlug: string | null;
  description?: string | null;
  metadata?: Record<string, unknown> | null;
}): Promise<CatalogSearchProfile> {
  const settings = await getDecryptedSettings();
  const model = resolveOpenAIModel(settings.openaiModel);

  const completion = await createAdminOpenAIChatCompletion(
    [
      {
        role: 'system',
        content:
          'شما متخصص تگ‌گذاری و سئوی محتوا هستید. فقط JSON معتبر برگردانید — بدون markdown.',
      },
      {
        role: 'user',
        content: buildSearchProfilePrompt(input),
      },
    ],
    {
      temperature: 0.4,
      max_tokens: 700,
      response_format: { type: 'json_object' },
    }
  );

  const content = completion.choices[0]?.message?.content?.trim();
  if (!content) {
    throw new Error('پاسخ خالی از OpenAI');
  }

  let json: unknown;
  try {
    json = JSON.parse(content);
  } catch {
    throw new Error('پاسخ OpenAI JSON معتبر نبود');
  }

  return parseSearchProfileResponse(json, model);
}

export type EnrichCatalogSearchResult = {
  catalogId: string;
  title: string;
  status: 'updated' | 'skipped' | 'error';
  profile?: CatalogSearchProfile;
  error?: string;
};

export async function enrichCatalogSearchProfile(
  prisma: PrismaClient,
  catalogId: string,
  options?: { force?: boolean }
): Promise<EnrichCatalogSearchResult> {
  const row = await prisma.catalog_items.findUnique({
    where: { id: catalogId },
    select: {
      id: true,
      title: true,
      description: true,
      categorySlug: true,
      metadata: true,
    },
  });

  if (!row) {
    return { catalogId, title: '', status: 'error', error: 'یافت نشد' };
  }

  const existingMeta =
    row.metadata != null && typeof row.metadata === 'object' && !Array.isArray(row.metadata)
      ? (row.metadata as Record<string, unknown>)
      : {};

  if (!options?.force && catalogHasSearchProfile(existingMeta)) {
    return {
      catalogId: row.id,
      title: row.title,
      status: 'skipped',
      profile: getSearchProfileFromMetadata(existingMeta) ?? undefined,
    };
  }

  try {
    const profile = await generateCatalogSearchProfile({
      title: row.title,
      categorySlug: row.categorySlug,
      description: row.description,
      metadata: existingMeta,
    });

    const merged = mergeSearchProfileIntoMetadata(existingMeta, profile);

    await prisma.catalog_items.update({
      where: { id: row.id },
      data: { metadata: merged as Prisma.InputJsonValue },
    });

    return {
      catalogId: row.id,
      title: row.title,
      status: 'updated',
      profile,
    };
  } catch (error: unknown) {
    return {
      catalogId: row.id,
      title: row.title,
      status: 'error',
      error: formatOpenAIError(error),
    };
  }
}

export async function enrichCatalogSearchProfilesBulk(
  prisma: PrismaClient,
  catalogIds: string[],
  options?: { force?: boolean }
): Promise<{
  results: EnrichCatalogSearchResult[];
  updated: number;
  skipped: number;
  failed: number;
}> {
  const results: EnrichCatalogSearchResult[] = [];
  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const catalogId of catalogIds) {
    const result = await enrichCatalogSearchProfile(prisma, catalogId, options);
    results.push(result);
    if (result.status === 'updated') updated += 1;
    else if (result.status === 'skipped') skipped += 1;
    else failed += 1;
  }

  return { results, updated, skipped, failed };
}
