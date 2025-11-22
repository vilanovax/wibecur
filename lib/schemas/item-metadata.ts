import { z } from 'zod';

// ===================================
// Movie/Series Metadata Schema
// ===================================
export const MovieMetadataSchema = z.object({
  year: z.union([z.number(), z.string()]).optional().transform((val) => {
    if (typeof val === 'string') return parseInt(val) || undefined;
    return val;
  }),
  genre: z.string().optional(),
  director: z.string().optional(),
  imdbRating: z.string().optional(), // e.g., "8.5/10"
});

export type MovieMetadata = z.infer<typeof MovieMetadataSchema>;

// ===================================
// Book Metadata Schema
// ===================================
export const BookMetadataSchema = z.object({
  author: z.string().optional(),
  genre: z.string().optional(),
});

export type BookMetadata = z.infer<typeof BookMetadataSchema>;

// ===================================
// Cafe/Restaurant Metadata Schema
// ===================================
export const CafeMetadataSchema = z.object({
  address: z.string().min(1, 'آدرس الزامی است'),
  priceRange: z.enum(['$', '$$', '$$$', '$$$$'], {
    errorMap: () => ({ message: 'بازه قیمت الزامی است' }),
  }),
  cuisine: z.string().optional(),
});

export type CafeMetadata = z.infer<typeof CafeMetadataSchema>;

// ===================================
// Union Type for all metadata
// ===================================
export type ItemMetadata = MovieMetadata | BookMetadata | CafeMetadata;

// ===================================
// Helper: Get metadata schema by category slug
// ===================================
export function getMetadataSchema(categorySlug: string) {
  switch (categorySlug) {
    case 'movie':
    case 'film':
    case 'movies':
      return MovieMetadataSchema;
    case 'book':
    case 'books':
      return BookMetadataSchema;
    case 'cafe':
    case 'restaurant':
      return CafeMetadataSchema;
    default:
      return z.object({}).optional(); // Empty schema for other categories
  }
}

// ===================================
// Helper: Validate metadata
// ===================================
export function validateMetadata(
  categorySlug: string,
  metadata: unknown
): { success: boolean; data?: ItemMetadata; error?: string } {
  const schema = getMetadataSchema(categorySlug);
  const result = schema.safeParse(metadata);

  if (result.success) {
    return { success: true, data: result.data };
  } else {
    return {
      success: false,
      error: result.error.errors.map((e) => e.message).join(', '),
    };
  }
}

// ===================================
// Constants for Select Options
// ===================================
export const MOVIE_GENRES = [
  'اکشن',
  'کمدی',
  'درام',
  'علمی-تخیلی',
  'ترسناک',
  'ماجراجویی',
  'انیمیشن',
  'جنایی',
  'مستند',
  'خانوادگی',
  'فانتزی',
  'تاریخی',
  'موزیکال',
  'معمایی',
  'عاشقانه',
  'هیجان‌انگیز',
  'جنگی',
  'وسترن',
];

export const PRICE_RANGES = [
  { value: '$', label: '$ - ارزان' },
  { value: '$$', label: '$$ - متوسط' },
  { value: '$$$', label: '$$$ - گران' },
  { value: '$$$$', label: '$$$$ - لوکس' },
];

export const BOOK_GENRES = [
  'رمان',
  'داستان کوتاه',
  'شعر',
  'علمی-تخیلی',
  'فانتزی',
  'معمایی و جنایی',
  'هیجان‌انگیز',
  'عاشقانه',
  'تاریخی',
  'بیوگرافی',
  'خودیاری و توسعه فردی',
  'روانشناسی',
  'فلسفه',
  'علمی و آموزشی',
  'اقتصاد و کسب‌وکار',
  'سیاسی و اجتماعی',
  'مذهبی',
  'هنر و ادبیات',
  'کودک و نوجوان',
  'طنز',
];

export const CUISINE_TYPES = [
  'ایرانی',
  'ایتالیایی',
  'فست‌فود',
  'سنتی',
  'کافه',
  'دریایی',
  'چینی',
  'ژاپنی',
  'فرانسوی',
  'مکزیکی',
  'هندی',
  'ترکی',
  'عربی',
  'بین‌المللی',
];
