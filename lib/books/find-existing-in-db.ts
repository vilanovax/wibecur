import { prisma } from '@/lib/prisma';
import { findCatalogByTitleMatch } from '@/lib/catalog-items';
import type { BookRecord, BookSource, WibeBookImportItem } from '@/lib/books/types';
import { bookRecordToWibeItem } from '@/lib/books/map-to-wibe';

type CatalogBookRow = {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  externalUrl: string | null;
  metadata: unknown;
};

const BOOK_SOURCES: BookSource[] = ['taaghche', 'fidibo', 'ketabrah'];

function parseCatalogMetadata(raw: unknown): Record<string, unknown> {
  if (raw != null && typeof raw === 'object' && !Array.isArray(raw)) {
    return raw as Record<string, unknown>;
  }
  return {};
}

function readMetaString(meta: Record<string, unknown>, key: string): string | undefined {
  const value = meta[key];
  if (value == null) return undefined;
  const text = String(value).trim();
  return text || undefined;
}

function readMetaNumber(meta: Record<string, unknown>, key: string): number | undefined {
  const value = meta[key];
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

export function catalogBookToRecord(catalog: CatalogBookRow): BookRecord {
  const meta = parseCatalogMetadata(catalog.metadata);
  const sourceRaw = readMetaString(meta, 'source');
  const source = BOOK_SOURCES.includes(sourceRaw as BookSource)
    ? (sourceRaw as BookSource)
    : 'ketabrah';
  const author = readMetaString(meta, 'author');
  const genre = readMetaString(meta, 'genre');

  return {
    source,
    bookId: readMetaString(meta, 'sourceId') ?? catalog.id,
    title: catalog.title,
    authors: author ? author.split('، ').map((part) => part.trim()).filter(Boolean) : [],
    genres: genre ? genre.split('، ').map((part) => part.trim()).filter(Boolean) : [],
    description: catalog.description,
    isbn: readMetaString(meta, 'isbn') ?? null,
    coverUrl: catalog.imageUrl,
    bookUrl: catalog.externalUrl?.trim() || '#',
    publisher: readMetaString(meta, 'publisher') ?? null,
    price: readMetaNumber(meta, 'price') ?? null,
    rating: readMetaNumber(meta, 'rating') ?? null,
    scrapedAt: new Date().toISOString(),
  };
}

export function catalogBookToWibeItem(catalog: CatalogBookRow): WibeBookImportItem {
  return bookRecordToWibeItem(catalogBookToRecord(catalog));
}

export type ExistingBookMatch = {
  queryTitle: string;
  catalogId: string;
  catalogTitle: string;
  record: BookRecord;
  item: WibeBookImportItem;
};

export type ResolveExistingBooksResult = {
  matches: ExistingBookMatch[];
  remainingTitles: string[];
};

/**
 * عناوین ورودی را با کاتالوگ کتاب‌های موجود تطبیق می‌دهد.
 * عناوین تکراری برای استخراج خارجی کنار گذاشته می‌شوند.
 */
export async function resolveExistingBooksByTitles(
  titles: string[]
): Promise<ResolveExistingBooksResult> {
  const cleaned = titles.map((title) => title.trim()).filter(Boolean);
  const matches: ExistingBookMatch[] = [];
  const remainingTitles: string[] = [];
  const usedCatalogIds = new Set<string>();

  for (const queryTitle of cleaned) {
    const catalog = await findCatalogByTitleMatch(prisma, 'books', queryTitle);
    if (!catalog) {
      remainingTitles.push(queryTitle);
      continue;
    }

    if (usedCatalogIds.has(catalog.id)) {
      continue;
    }

    usedCatalogIds.add(catalog.id);
    const record = catalogBookToRecord(catalog);
    matches.push({
      queryTitle,
      catalogId: catalog.id,
      catalogTitle: catalog.title,
      record,
      item: bookRecordToWibeItem(record),
    });
  }

  return { matches, remainingTitles };
}
