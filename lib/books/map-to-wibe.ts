import type { BookRecord, WibeBookImportItem } from '@/lib/books/types';
import { sanitizeBookText, shortBookDisplayTitle, stripHtmlTags } from '@/lib/books/normalize';

export type BookImportMapOptions = {
  listTitle?: string | null;
  /** در fast mode توضیح و tip از دادهٔ جستجو ساخته می‌شود */
  fastMode?: boolean;
};

function primaryAuthors(authors: string[]): string[] {
  return authors.filter((a) => a.trim() && !a.startsWith('راوی:'));
}

function narratorTip(authors: string[]): string | undefined {
  const narrator = authors.find((a) => a.startsWith('راوی:'));
  if (!narrator) return undefined;
  const name = narrator.replace(/^راوی:\s*/, '').trim();
  if (!name) return undefined;
  return `نسخه صوتی — راوی: ${name}`;
}

function translatorTip(record: BookRecord): string | undefined {
  const name = record.translator?.trim();
  if (!name) return undefined;
  return `ترجمه: ${name}`;
}

function tipFromDescription(description: string): string | undefined {
  const text = sanitizeBookText(description);
  if (!text) return undefined;

  const paragraphs = text.split(/\n\n+/).map((p) => p.trim()).filter((p) => p.length > 40);
  if (paragraphs.length >= 2) return paragraphs[1];

  const sentences = text.match(/[^.!?؟۔\n]+[.!?؟۔]+/gu) ?? [];
  const cleaned = sentences.map((s) => sanitizeBookText(s)).filter((s) => s.length > 30);
  if (cleaned.length >= 2) return cleaned[1];
  if (cleaned.length === 1 && cleaned[0]!.length > 80) {
    const mid = Math.min(160, cleaned[0]!.length);
    const slice = cleaned[0]!.slice(0, mid).trim();
    return slice.endsWith('…') ? slice : `${slice}…`;
  }
  return undefined;
}

function buildTip(record: BookRecord, opts?: BookImportMapOptions): string | undefined {
  if (opts?.fastMode) return narratorTip(record.authors);

  const narrator = narratorTip(record.authors);
  if (narrator) return narrator;

  const desc = sanitizeBookText(stripHtmlTags(record.description ?? ''));
  const fromDesc = tipFromDescription(desc);
  if (fromDesc) return fromDesc;

  return translatorTip(record);
}

function withListPrefix(text: string, listTitle?: string | null): string {
  const t = listTitle?.trim();
  if (!t) return text;
  const prefix = `برای لیست «${t}»: `;
  if (text.startsWith(prefix)) return text;
  return `${prefix}${text}`;
}

function buildDescription(record: BookRecord, opts?: BookImportMapOptions): string | undefined {
  const fromSource = sanitizeBookText(stripHtmlTags(record.description ?? ''));
  if (fromSource) {
    return opts?.listTitle ? withListPrefix(fromSource, opts.listTitle) : fromSource;
  }

  if (!opts?.fastMode) return undefined;

  const authors = primaryAuthors(record.authors);
  const authorPart = authors.length > 0 ? ` اثر ${authors.join('، ')}` : '';
  const base = `کتاب «${sanitizeBookText(record.title)}»${authorPart}.`;
  return opts.listTitle ? withListPrefix(base, opts.listTitle) : base;
}

export function bookRecordToWibeItem(
  record: BookRecord,
  opts?: BookImportMapOptions
): WibeBookImportItem {
  const authors = primaryAuthors(record.authors);
  const author = authors.join('، ') || undefined;
  const genre = record.genres.filter(Boolean).join('، ') || undefined;
  const description = buildDescription(record, opts);
  const tip = buildTip(record, opts);

  const metadata: NonNullable<WibeBookImportItem['metadata']> = {};
  if (author) metadata.author = author;
  if (genre) metadata.genre = genre;
  if (record.isbn?.trim()) metadata.isbn = record.isbn.trim();
  metadata.source = record.source;
  metadata.sourceId = record.bookId;
  if (record.contentType) metadata.contentType = record.contentType;
  if (!opts?.fastMode) {
    if (record.publisher?.trim()) metadata.publisher = record.publisher.trim();
    if (record.rating != null) metadata.rating = record.rating;
    if (record.price != null) metadata.price = record.price;
  }

  const item: WibeBookImportItem = {
    title: shortBookDisplayTitle(sanitizeBookText(record.title)),
    imageUrl: record.coverUrl?.trim() || undefined,
    externalUrl: record.bookUrl,
    metadata,
  };
  if (description) item.description = description;
  if (tip) item.tip = tip;
  return item;
}

export function bookRecordsToImportPayload(
  records: BookRecord[],
  opts?: BookImportMapOptions
): { items: WibeBookImportItem[] } {
  return { items: records.map((r) => bookRecordToWibeItem(r, opts)) };
}

/** نمونه فرمت import کتاب — مطابق bulk-import */
export const BOOK_EXTRACT_JSON_EXAMPLE = `{
  "items": [
    {
      "title": "کار عمیق",
      "description": "کتاب کار عمیق نوشته کال نیوپورت نشان می‌دهد چگونه تکنولوژی توانایی تمرکز عمیق را از شما گرفته و چطور می‌توانید بر این معضل غلبه کنید.",
      "tip": "در این اثر استراتژی‌هایی مطرح می‌شود که به بهبود خروجی کار و استفاده بهتر از زمان آزاد کمک می‌کند.",
      "imageUrl": "https://img.ketabrah.com/img/l/example.jpg",
      "externalUrl": "https://ketabrah.com/book/40821",
      "metadata": {
        "author": "کال نیوپورت",
        "genre": "مدیریت ذهن",
        "isbn": "9786226840125"
      }
    }
  ]
}`;
