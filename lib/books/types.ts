import type { BookContentFilter, BookContentType } from '@/lib/books/content-type';

export type BookSource = 'taaghche' | 'fidibo' | 'ketabrah';

export type BookRecord = {
  source: BookSource;
  bookId: string;
  contentType?: BookContentType | null;
  title: string;
  authors: string[];
  translator?: string | null;
  subtitle?: string | null;
  /** خلاصه کوتاه — معمولاً برای tip در حالت جزئیات کامل */
  excerpt?: string | null;
  genres: string[];
  description?: string | null;
  isbn?: string | null;
  coverUrl?: string | null;
  bookUrl: string;
  publisher?: string | null;
  price?: number | null;
  rating?: number | null;
  scrapedAt: string;
};

export type BookSearchCandidate = {
  bookId: string;
  contentType?: BookContentType | null;
  title: string;
  authors: string[];
  coverUrl?: string | null;
  bookUrl: string;
  subtitle?: string | null;
  matchScore?: number;
};

export type WibeBookImportItem = {
  title: string;
  description?: string;
  tip?: string;
  imageUrl?: string;
  externalUrl: string;
  metadata?: {
    author?: string;
    genre?: string;
    isbn?: string;
    source?: BookSource;
    sourceId?: string;
    contentType?: BookContentType;
    publisher?: string;
    rating?: number;
    price?: number;
  };
};

export type BookExtractOptions = {
  enrichDetails?: boolean;
  fastMode?: boolean;
  fuzzyMinScore?: number;
  delayMs?: number;
  maxRetries?: number;
  limit?: number;
  contentTypeFilter?: BookContentFilter;
  autoImport?: boolean;
};

export type BookExtractTitlesInput = {
  titles: string[];
};

export type BookExtractCategoryInput = {
  categoryUrl: string;
  limit: number;
};

export type BookExtractImportResult = {
  imported: number;
  created: number;
  linked: number;
  updated: number;
  errors: number;
  message?: string;
};

export type BookExtractProgressMeta = {
  done: number;
  total: number;
  currentTitle?: string | null;
  /** مرحله جاری — مثلاً «جستجو در فیدیبو» */
  currentStep?: string | null;
  notFound: string[];
  errors: { title: string; message: string }[];
  /** عناوین پردازش‌شده — برای resume */
  processedTitles?: string[];
  importResult?: BookExtractImportResult | null;
  /** عناوینی که از کاتالوگ دیتابیس آمده‌اند — بدون استخراج خارجی */
  fromDatabase?: string[];
  /** خلاصه نتیجه پس از اتمام */
  summary?: string | null;
};

export const DEFAULT_BOOK_EXTRACT_OPTIONS: Required<BookExtractOptions> = {
  enrichDetails: true,
  fastMode: false,
  fuzzyMinScore: 70,
  delayMs: 1200,
  maxRetries: 2,
  limit: 20,
  contentTypeFilter: 'ebook',
  autoImport: false,
};
