export type ItemDescriptionAIContext = {
  title: string;
  categorySlug: string;
  categoryName?: string | null;
  listTitle?: string | null;
  listDescription?: string | null;
  entryKind?: string | null;
  listNote?: string | null;
  externalUrl?: string | null;
  metadata?: Record<string, unknown> | null;
  plot?: string | null;
};

export type InferredContentType =
  | 'movie'
  | 'book'
  | 'podcast'
  | 'cafe'
  | 'restaurant'
  | 'generic';

const PODCAST_RE = /podcast|پادکست|podcasts|رادیو|radio/i;
const MOVIE_RE = /movie|movies|film|cinema|فیلم|سریال|سینما/i;
const BOOK_RE = /book|books|کتاب|رمان/i;

function contextHaystack(ctx: ItemDescriptionAIContext): string {
  return [
    ctx.listTitle,
    ctx.listDescription,
    ctx.categoryName,
    ctx.categorySlug,
    ctx.entryKind,
    ctx.listNote,
  ]
    .filter((part) => typeof part === 'string' && part.trim())
    .join(' ')
    .toLowerCase();
}

export function inferContentType(ctx: ItemDescriptionAIContext): InferredContentType {
  const haystack = contextHaystack(ctx);
  const slug = (ctx.categorySlug || '').toLowerCase();

  if (PODCAST_RE.test(haystack)) return 'podcast';

  if (slug === 'movie' || slug === 'film' || slug === 'movies' || slug === 'cinema') {
    return 'movie';
  }

  if (slug === 'cafe') return 'cafe';
  if (slug === 'restaurant') return 'restaurant';

  if (slug === 'book' || slug === 'books' || BOOK_RE.test(haystack)) {
    if (PODCAST_RE.test(haystack)) return 'podcast';
    return 'book';
  }

  if (MOVIE_RE.test(haystack)) return 'movie';
  if (PODCAST_RE.test(haystack)) return 'podcast';

  return 'generic';
}

function buildContextBlock(ctx: ItemDescriptionAIContext): string {
  const lines: string[] = [];
  if (ctx.categoryName?.trim()) lines.push(`- دسته: ${ctx.categoryName.trim()}`);
  if (ctx.listTitle?.trim()) lines.push(`- لیست: ${ctx.listTitle.trim()}`);
  if (ctx.listDescription?.trim()) {
    lines.push(`- توضیح لیست: ${ctx.listDescription.trim()}`);
  }
  if (ctx.entryKind?.trim()) lines.push(`- نوع ورودی: ${ctx.entryKind.trim()}`);
  if (ctx.listNote?.trim()) lines.push(`- نکته درباره آیتم در لیست: ${ctx.listNote.trim()}`);
  if (ctx.externalUrl?.trim()) lines.push(`- لینک: ${ctx.externalUrl.trim()}`);

  return lines.length > 0 ? `\n\nزمینه:\n${lines.join('\n')}` : '';
}

const JSON_DESCRIPTION_ONLY = `{
  "description": "توضیحات جذاب و مختصر به زبان فارسی (۲ تا ۴ جمله)"
}`;

export const ITEM_DESCRIPTION_SYSTEM_PROMPT =
  'شما نویسنده توضیحات curated برای پلتفرم وایب هستید. از زمینه دسته و لیست برای فهمیدن «نوع واقعی» آیتم استفاده کنید — عنوان معمولاً نام یک موجودیت مشخص (پادکست، کتاب، فیلم، کافه و …) است نه واژه عمومی. هرگز تعریف دیکشنری یا ریشه‌شناسی عنوان را ننویسید مگر اینکه لیست صریحاً درباره واژه‌ها باشد. پاسخ را فقط به صورت JSON بدهید.';

export function buildItemDescriptionPrompt(ctx: ItemDescriptionAIContext): string {
  const title = ctx.title.trim();
  const contentType = inferContentType(ctx);
  const contextBlock = buildContextBlock(ctx);
  const metadata = ctx.metadata ?? {};

  if (contentType === 'movie') {
    const year = metadata.year ? ` (${String(metadata.year)})` : '';
    const genre = metadata.genre ? ` در ژانر ${String(metadata.genre)}` : '';

    if (ctx.plot?.trim()) {
      return `بر اساس این خلاصه داستان: "${ctx.plot.trim()}"
${contextBlock}

برای فیلم/سریال «${title}»${year}${genre}، JSON زیر را پر کن:
{
  "description": "توضیحات جذاب و مختصر به فارسی (۲ تا ۴ جمله) با خلاصه بدون اسپویل، مضامین و دلیل تماشا",
  "year": "سال تولید (در صورت دانستن)",
  "genre": "ژانر به فارسی",
  "director": "کارگردان (در صورت دانستن)",
  "imdbRating": "امتیاز IMDb (در صورت دانستن)"
}`;
    }

    return `برای فیلم/سریال «${title}»${year}${genre}، JSON زیر را پر کن:
{
  "description": "توضیحات جذاب و مختصر به فارسی (۲ تا ۴ جمله)",
  "year": "سال تولید (در صورت دانستن)",
  "genre": "ژانر به فارسی",
  "director": "کارگردان (در صورت دانستن)",
  "imdbRating": "امتیاز IMDb (در صورت دانستن)"
}${contextBlock}`;
  }

  if (contentType === 'podcast') {
    return `این آیتم در یک لیست curated قرار دارد. نوع محتوا: **پادکست / برنامه شنیداری**.
${contextBlock}

نام پادکست/برنامه: «${title}»

یک JSON با ساختار زیر تولید کن:
{
  "description": "توضیح درباره همین پادکست/برنامه (۲ تا ۴ جمله): موضوعات، سبک روایت، مخاطب، چرا گوش دادن",
  "genre": "موضوع/ژانر پادکست به فارسی (مثلاً تاریخ، true crime، کسب‌وکار)"
}

قوانین مهم:
- درباره پادکست/برنامه با نام «${title}» بنویس.
- هرگز معنی واژه، ریشه یا مفهوم عمومی «${title}» را توضیح نده.
- اگر پادکست را نمی‌شناسی، از زمینه لیست و دسته حدس معقول بزن و صادقانه بنویس.`;
  }

  if (contentType === 'book') {
    const existingAuthor = metadata.author ? ` نوشته ${String(metadata.author)}` : '';
    return `برای کتاب «${title}»${existingAuthor}، JSON زیر را پر کن:
{
  "description": "توضیحات جذاب و مختصر به فارسی (۲ تا ۴ جمله) درباره موضوع و دلیل خواندن",
  "author": "نام نویسنده (در صورت دانستن)",
  "genre": "ژانر کتاب به فارسی"
}${contextBlock}

- درباره کتاب با عنوان «${title}» بنویس، نه معنی واژه عنوان.`;
  }

  if (contentType === 'cafe' || contentType === 'restaurant') {
    const cuisine = metadata.cuisine ? ` با تخصص ${String(metadata.cuisine)}` : '';
    const priceRange = metadata.priceRange ? ` در بازه قیمت ${String(metadata.priceRange)}` : '';
    const label = contentType === 'cafe' ? 'کافه' : 'رستوران';
    return `برای ${label} «${title}»${cuisine}${priceRange}، JSON زیر را پر کن:
${JSON_DESCRIPTION_ONLY}${contextBlock}`;
  }

  return `برای آیتم curated با عنوان «${title}»، JSON زیر را پر کن:
${JSON_DESCRIPTION_ONLY}${contextBlock}

- از زمینه لیست و دسته برای فهمیدن نوع واقعی آیتم استفاده کن.
- درباره همان موجودیت/برند/مکان/اثر مشخص بنویس، نه تعریف واژه عنوان.`;
}

export function extractGeneratedItemMetadata(
  contentType: InferredContentType,
  categorySlug: string,
  result: Record<string, unknown>
): Record<string, string> {
  const generated: Record<string, string> = {};
  const slug = categorySlug.toLowerCase();

  const pick = (key: string) => {
    const val = result[key];
    if (typeof val === 'string' && val.trim()) generated[key] = val.trim();
  };

  if (contentType === 'movie' || slug === 'movie' || slug === 'film' || slug === 'movies') {
    pick('year');
    pick('genre');
    pick('director');
    pick('imdbRating');
  } else if (contentType === 'book' || slug === 'book' || slug === 'books') {
    pick('author');
    pick('genre');
  } else if (contentType === 'podcast') {
    pick('genre');
  }

  return generated;
}
