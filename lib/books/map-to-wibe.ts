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

function buildTip(record: BookRecord, opts?: BookImportMapOptions): string | undefined {
  if (opts?.fastMode) return narratorTip(record.authors);

  const narrator = narratorTip(record.authors);
  if (narrator) return narrator;

  return translatorTip(record);
}

function tipsAreEquivalent(tip: string, description: string): boolean {
  const a = sanitizeBookText(tip);
  const b = sanitizeBookText(description);
  if (!a || !b) return false;
  if (a === b) return true;
  if (b.startsWith(a) || a.startsWith(b)) return true;
  return false;
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

  const item: WibeBookImportItem = {
    title: shortBookDisplayTitle(sanitizeBookText(record.title)),
    imageUrl: record.coverUrl?.trim() || undefined,
    externalUrl: record.bookUrl,
    metadata,
  };
  if (description) item.description = description;
  if (tip && !(description && tipsAreEquivalent(tip, description))) {
    item.tip = tip;
  }
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
        "source": "ketabrah",
        "sourceId": "40821",
        "isbn": "9786226840125"
      }
    }
  ]
}`;
