import type { BookRecord, WibeBookImportItem } from '@/lib/books/types';
import { sanitizeBookText } from '@/lib/books/normalize';

export function bookRecordToWibeItem(record: BookRecord): WibeBookImportItem {
  const author = record.authors.filter(Boolean).join('، ') || undefined;
  const genre = record.genres.filter(Boolean).join('، ') || undefined;

  return {
    title: sanitizeBookText(record.title),
    description: sanitizeBookText(record.description) || undefined,
    imageUrl: record.coverUrl?.trim() || undefined,
    externalUrl: record.bookUrl,
    metadata: {
      author,
      genre,
      isbn: record.isbn?.trim() || undefined,
      source: record.source,
      sourceId: record.bookId,
      contentType: record.contentType ?? undefined,
      publisher: record.publisher?.trim() || undefined,
      rating: record.rating ?? undefined,
      price: record.price ?? undefined,
    },
  };
}

export function bookRecordsToImportPayload(records: BookRecord[]): { items: WibeBookImportItem[] } {
  return { items: records.map(bookRecordToWibeItem) };
}
