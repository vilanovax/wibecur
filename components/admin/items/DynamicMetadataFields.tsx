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
}

export default function DynamicMetadataFields({
  categorySlug,
  metadata,
  onChange,
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

  // Movie/Series metadata fields
  if (categorySlug === 'movie' || categorySlug === 'film' || categorySlug === 'movies') {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">
          اطلاعات تکمیلی فیلم/سریال
        </h3>

        {/* Year */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            سال تولید (اختیاری)
            <span className="text-xs text-gray-500 font-normal mr-2">
              - اعداد فارسی و سال شمسی قابل قبول است
            </span>
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={metadata?.year || ''}
            onChange={handleYearChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="2024 یا ۱۴۰۳"
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
            {MOVIE_GENRES.map((genre) => (
              <option key={genre} value={genre}>
                {genre}
              </option>
            ))}
          </select>
        </div>

        {/* Director */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            کارگردان (اختیاری)
          </label>
          <input
            type="text"
            value={metadata?.director || ''}
            onChange={(e) => handleChange('director', e.target.value || undefined)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="نام کارگردان..."
          />
        </div>

        {/* IMDb Rating */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            امتیاز IMDb (اختیاری)
            <span className="text-gray-500 text-xs mr-2">
              مثال: 8.5
            </span>
          </label>
          <input
            type="text"
            value={metadata?.imdbRating || ''}
            onChange={(e) => handleChange('imdbRating', e.target.value || undefined)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
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
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">
          اطلاعات تکمیلی کافه/رستوران
        </h3>

        {/* Address */}
        <div>
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

        {/* Price Range */}
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

        {/* Cuisine */}
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
      </div>
    );
  }

  // No metadata fields for this category
  return null;
}
