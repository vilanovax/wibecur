import { z } from 'zod';

/** بخش‌های client-safe از person-bio-ai — بدون prisma / next/cache / OpenAI */

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
