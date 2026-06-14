'use client';

import {
  MOVIE_GENRES,
  BOOK_GENRES,
  PRICE_RANGES,
  CUISINE_TYPES,
} from '@/lib/schemas/item-metadata';
import { parseYear } from '@/lib/utils/number-converter';

interface DynamicMetadataFieldsProps {
  categorySlug: string;
  metadata: any;
  onChange: (metadata: any) => void;
  /** وقتی داخل سکشن تاشو استفاده می‌شود */
  hideTitle?: boolean;
  layout?: 'stack' | 'grid';
}

export default function DynamicMetadataFields({
  categorySlug,
  metadata,
  onChange,
  hideTitle = false,
  layout = 'stack',
}: DynamicMetadataFieldsProps) {
  const handleChange = (field: string, value: any) => {
    onChange({ ...metadata, [field]: value });
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Allow empty input
    if (!inputValue || !inputValue.trim()) {
      handleChange('year', undefined);
      return;
    }
    
    const parsedYear = parseYear(inputValue);
    handleChange('year', parsedYear || undefined);
  };

  const fieldWrap = layout === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 gap-4' : 'space-y-4';
  const fieldFull = layout === 'grid' ? 'sm:col-span-2' : '';

  // Movie/Series metadata fields
  if (categorySlug === 'movie' || categorySlug === 'film' || categorySlug === 'movies') {
    return (
      <div className={fieldWrap}>
        {!hideTitle && (
          <h3 className={`text-lg font-semibold text-gray-900 ${fieldFull}`}>
            اطلاعات تکمیلی فیلم/سریال
          </h3>
        )}

        {/* Year */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
            سال تولید
            <span className="text-xs text-gray-500 font-normal mr-2">(اختیاری)</span>
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={metadata?.year || ''}
            onChange={handleYearChange}
            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white dark:bg-gray-800"
            placeholder="2024 یا ۱۴۰۳"
          />
          <p className="text-[11px] text-gray-500 mt-1">اعداد فارسی و سال شمسی قابل قبول است</p>
        </div>

        {/* Genre */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
            ژانر <span className="text-xs text-gray-500 font-normal">(اختیاری)</span>
          </label>
          <select
            value={metadata?.genre || ''}
            onChange={(e) => handleChange('genre', e.target.value || undefined)}
            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white dark:bg-gray-800"
          >
            <option value="">انتخاب کنید...</option>
            {MOVIE_GENRES.map((genre) => (
              <option key={genre} value={genre}>
                {genre}
              </option>
            ))}
          </select>
        </div>

        {/* Director */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
            کارگردان <span className="text-xs text-gray-500 font-normal">(اختیاری)</span>
          </label>
          <input
            type="text"
            value={metadata?.director || ''}
            onChange={(e) => handleChange('director', e.target.value || undefined)}
            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white dark:bg-gray-800"
            placeholder="نام کارگردان..."
          />
        </div>

        {/* Country */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
            کشور سازنده <span className="text-xs text-gray-500 font-normal">(اختیاری)</span>
          </label>
          <input
            type="text"
            value={metadata?.country || ''}
            onChange={(e) => handleChange('country', e.target.value || undefined)}
            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white dark:bg-gray-800"
            placeholder="مثلاً ایالات متحده"
          />
        </div>

        {/* Actors */}
        <div className={fieldFull}>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
            بازیگران مهم <span className="text-xs text-gray-500 font-normal">(حداکثر ۲)</span>
          </label>
          <input
            type="text"
            value={
              Array.isArray(metadata?.actors)
                ? metadata.actors.join('، ')
                : metadata?.actors || ''
            }
            onChange={(e) => {
              const raw = e.target.value.trim();
              if (!raw) {
                handleChange('actors', undefined);
                return;
              }
              handleChange(
                'actors',
                raw
                  .split(/[,،]/)
                  .map((s: string) => s.trim())
                  .filter(Boolean)
                  .slice(0, 2)
              );
            }}
            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white dark:bg-gray-800"
            placeholder="Edward Norton، Brad Pitt"
          />
        </div>

        {/* IMDb Rating */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
            امتیاز IMDb <span className="text-xs text-gray-500 font-normal">(اختیاری)</span>
          </label>
          <input
            type="text"
            value={metadata?.imdbRating || ''}
            onChange={(e) => handleChange('imdbRating', e.target.value || undefined)}
            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white dark:bg-gray-800"
            placeholder="8.5"
            pattern="[0-9]+\.?[0-9]*"
          />
        </div>
      </div>
    );
  }

  // Book metadata fields
  if (categorySlug === 'book' || categorySlug === 'books') {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">
          اطلاعات تکمیلی کتاب
        </h3>

        {/* Author */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            نویسنده (اختیاری)
          </label>
          <input
            type="text"
            value={metadata?.author || ''}
            onChange={(e) => handleChange('author', e.target.value || undefined)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="نام نویسنده..."
          />
        </div>

        {/* Genre */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ژانر (اختیاری)
          </label>
          <select
            value={metadata?.genre || ''}
            onChange={(e) => handleChange('genre', e.target.value || undefined)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="">انتخاب کنید...</option>
            {BOOK_GENRES.map((genre) => (
              <option key={genre} value={genre}>
                {genre}
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  }

  // Cafe/Restaurant metadata fields
  if (categorySlug === 'cafe' || categorySlug === 'restaurant') {
    return (
      <div className={fieldWrap}>
        {!hideTitle && (
          <h3 className={`text-lg font-semibold text-gray-900 ${fieldFull}`}>
            اطلاعات تکمیلی کافه/رستوران
          </h3>
        )}

        <div className={fieldFull}>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            آدرس <span className="text-red-500">*</span>
          </label>
          <textarea
            required
            value={metadata?.address || ''}
            onChange={(e) => handleChange('address', e.target.value)}
            rows={2}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="آدرس کامل..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            بازه قیمت <span className="text-red-500">*</span>
          </label>
          <select
            required
            value={metadata?.priceRange || ''}
            onChange={(e) => handleChange('priceRange', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="">انتخاب کنید...</option>
            {PRICE_RANGES.map((range) => (
              <option key={range.value} value={range.value}>
                {range.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            نوع غذا (اختیاری)
          </label>
          <select
            value={metadata?.cuisine || ''}
            onChange={(e) => handleChange('cuisine', e.target.value || undefined)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="">انتخاب کنید...</option>
            {CUISINE_TYPES.map((cuisine) => (
              <option key={cuisine} value={cuisine}>
                {cuisine}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">تلفن (اختیاری)</label>
          <input
            type="tel"
            dir="ltr"
            value={metadata?.phone || ''}
            onChange={(e) => handleChange('phone', e.target.value || undefined)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="021-12345678"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">اینستاگرام (اختیاری)</label>
          <input
            type="text"
            dir="ltr"
            value={metadata?.instagram || ''}
            onChange={(e) => handleChange('instagram', e.target.value || undefined)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="@username یا لینک"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">وب‌سایت (اختیاری)</label>
          <input
            type="url"
            dir="ltr"
            value={metadata?.website || ''}
            onChange={(e) => handleChange('website', e.target.value || undefined)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="https://example.com"
          />
        </div>

        <div className={fieldFull}>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            لینک مسیریابی (اختیاری)
          </label>
          <input
            type="url"
            dir="ltr"
            value={metadata?.mapsUrl || ''}
            onChange={(e) => handleChange('mapsUrl', e.target.value || undefined)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="Google Maps یا مختصات"
          />
          <p className="mt-1 text-[11px] text-gray-500">
            لینک گوگل‌مپ یا آدرس متنی — در صورت آدرس، لینک مسیریابی ساخته می‌شود
          </p>
        </div>
      </div>
    );
  }

  // No metadata fields for this category
  return null;
}
