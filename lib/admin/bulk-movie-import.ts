/**
 * @deprecated Import from '@/lib/admin/bulk-import' instead.
 * Re-exports for backward compatibility.
 */
export {
  extractImdbIdFromUrl,
  parseBulkImportJson as parseBulkMovieJson,
  getBulkImportJsonExample,
  BULK_MOVIE_JSON_EXAMPLE,
  type BulkImportRow as BulkMovieImportRow,
  type BulkImportPayloadItem,
} from '@/lib/admin/bulk-import';

export { isMovieLikeCategory as isMovieLikeListCategory } from '@/lib/resolve-item-image';

// Legacy aliases
export type { BulkImportRaw as BulkMovieImportRaw } from '@/lib/admin/bulk-import';
