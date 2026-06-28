import { z } from 'zod';
import { PERSON_ROLE_META, type PersonRole } from '@/lib/people';
import type { PersonImageStatus } from '@/lib/person-image-utils';

export const PersonImageImportItemSchema = z.object({
  role: z.enum(['director', 'actor', 'author', 'translator']),
  slug: z.string().min(1),
  displayName: z.string().min(1),
  imageUrl: z
    .string()
    .refine(
      (v) => !v.trim() || z.string().url().safeParse(v.trim()).success,
      'imageUrl باید URL معتبر یا خالی باشد'
    ),
});

export const PersonImageImportPayloadSchema = z.object({
  people: z.array(PersonImageImportItemSchema).min(1).max(100),
});

export type PersonImageImportItem = z.infer<typeof PersonImageImportItemSchema>;
export type PersonImageImportPayload = z.infer<typeof PersonImageImportPayloadSchema>;

export type PersonMissingImageEntry = {
  role: PersonRole;
  slug: string;
  displayName: string;
  itemCount: number;
  imageStatus: PersonImageStatus;
};

export const PERSON_IMAGE_JSON_EXAMPLE: PersonImageImportPayload = {
  people: [
    {
      role: 'director',
      slug: 'alex-garland',
      displayName: 'Alex Garland',
      imageUrl: '',
    },
  ],
};

export function buildPersonImageJsonSchemaDoc(): string {
  return JSON.stringify(
    {
      $schema: 'وایب — فرمت ورود تصویر اشخاص',
      description:
        'آرایه people شامل اشخاص. role و slug باید دقیقاً مطابق لیست ارسالی باشند. برای director/actor ترجیحاً imageUrl خالی بگذارید تا از TMDB API جستجو شود.',
      people: [
        {
          role: 'director | actor | author | translator',
          slug: 'slug-لاتین-از-لیست',
          displayName: 'نام نمایشی',
          imageUrl: '"" برای director/actor، یا لینک مستقیم Wikipedia/IMDb برای author/translator',
        },
      ],
    },
    null,
    2
  );
}

export function personImageStatusLabel(status: PersonImageStatus): string {
  switch (status) {
    case 'none':
      return 'بدون تصویر';
    case 'storage':
      return 'روی استوریج';
    case 'external':
      return 'لینک خارجی';
  }
}

export function formatMissingImageNameList(people: PersonMissingImageEntry[]): string {
  return people.map((p) => p.displayName).join('\n');
}

export function formatMissingImageNameListWithStatus(people: PersonMissingImageEntry[]): string {
  return people
    .map((p) => `${p.displayName} · ${personImageStatusLabel(p.imageStatus)}`)
    .join('\n');
}

export function formatMissingImageDetailedList(people: PersonMissingImageEntry[]): string {
  const roleLabels = Object.fromEntries(
    (Object.keys(PERSON_ROLE_META) as PersonRole[]).map((role) => [
      role,
      PERSON_ROLE_META[role].label,
    ])
  );

  return people
    .map(
      (p) =>
        `- ${p.displayName} | role: ${p.role} (${roleLabels[p.role]}) | slug: ${p.slug} | items: ${p.itemCount}`
    )
    .join('\n');
}

export function buildExternalAiImagePrompt(people: PersonMissingImageEntry[]): string {
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

  return `برای هر شخص زیر یک URL تصویر پرتره عمومی و قابل دانلود پیدا کن و خروجی را فقط به صورت JSON معتبر برگردان.

قوانین:
- فقط JSON برگردان، بدون markdown یا توضیح اضافه
- role و slug را دقیقاً همان‌طور که داده شده حفظ کن
- imageUrl باید لینک مستقیم فایل تصویر باشد (Wikipedia، IMDb، یا منبع معتبر غیر TMDB)
- برای director و actor: imageUrl را خالی بگذار ("") — سیستم خودش از TMDB API با slug جستجو می‌کند
- هرگز URL TMDB (image.tmdb.org) در JSON ننویس — hash فایل را حدس نزن
- تصویر باید پرتره/headshot مناسب پروفایل باشد، نه پوستر فیلم

فرمت خروجی:
${buildPersonImageJsonSchemaDoc()}

لیست اشخاص:
${lines.join('\n')}`;
}

export function tryParsePersonImageImportPayload(
  raw: unknown
): { success: true; data: PersonImageImportPayload } | { success: false; error: string } {
  const parsed = PersonImageImportPayloadSchema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return {
      success: false,
      error: issue?.message ?? 'ساختار JSON نامعتبر است',
    };
  }
  return { success: true, data: parsed.data };
}

export function parsePersonImageImportPayload(raw: unknown): PersonImageImportPayload {
  const result = tryParsePersonImageImportPayload(normalizePersonImageImportRaw(raw));
  if (!result.success) {
    throw new Error(result.error);
  }
  return result.data;
}

/** JSON کامل AI (با $schema) یا فقط { people } */
export function normalizePersonImageImportRaw(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return raw;
  const obj = raw as Record<string, unknown>;
  if (Array.isArray(obj.people)) {
    return { people: obj.people };
  }
  return raw;
}
