'use client';

import {
  MOVIE_GENRES,
  BOOK_GENRES,
  PRICE_RANGES,
  CUISINE_TYPES,
} from '@/lib/schemas/item-metadata';
import { parseYear } from '@/lib/utils/number-converter';
import { isBookCategorySlug } from '@/lib/book-cover-search';
import { isLifestyleCategory } from '@/lib/list-entry';

interface DynamicMetadataFieldsProps {
  categorySlug: string;
  metadata: any;
  onChange: (metadata: any) => void;
  /** وقتی داخل سکشن تاشو استفاده می‌شود */
  hideTitle?: boolean;
  layout?: 'stack' | 'grid';
  /** فقط فیلدهای مکان (برای ورودی سبک لایف‌استایل) */
  placeFieldsOnly?: boolean;
}

function isCafeCategorySlug(slug: string): boolean {
  const s = slug.toLowerCase();
  return (
    s === 'cafe' ||
    s === 'restaurant' ||
    s.includes('cafe') ||
    s.includes('restaurant')
  );
}

function isMovieCategorySlug(slug: string): boolean {
  const s = slug.toLowerCase();
  return (
    s === 'movie' ||
    s === 'film' ||
    s === 'movies' ||
    s === 'series' ||
    s === 'cinema' ||
    s.includes('movie') ||
    s.includes('film')
  );
}

export default function DynamicMetadataFields({
  categorySlug,
  metadata,
  onChange,
  hideTitle = false,
  layout = 'stack',
  placeFieldsOnly = false,
}: DynamicMetadataFieldsProps) {
  const handleChange = (field: string, value: any) => {
    onChange({ ...metadata, [field]: value });
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;

    if (!inputValue || !inputValue.trim()) {
      handleChange('year', undefined);
      return;
    }

    const parsedYear = parseYear(inputValue);
    handleChange('year', parsedYear || undefined);
  };

  const fieldWrap = layout === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 gap-4' : 'space-y-4';
  const fieldFull = layout === 'grid' ? 'sm:col-span-2' : '';
  const inputClass =
    'w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white dark:bg-gray-800';

  const placeFields = (
    <>
      <div className={fieldFull}>
        <label className="mb-2 block text-sm font-medium text-(--color-text)">
          آدرس {isCafeCategorySlug(categorySlug) && !placeFieldsOnly ? <span className="text-red-500">*</span> : <span className="text-xs font-normal text-wibe-secondary">(اختیاری)</span>}
        </label>
        <textarea
          required={isCafeCategorySlug(categorySlug) && !placeFieldsOnly}
          value={metadata?.address || ''}
          onChange={(e) => handleChange('address', e.target.value || undefined)}
          rows={2}
          className={inputClass}
          placeholder="آدرس کامل..."
        />
      </div>

      {isCafeCategorySlug(categorySlug) && !placeFieldsOnly && (
        <>
          <div>
            <label className="mb-2 block text-sm font-medium text-(--color-text)">
              بازه قیمت <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={metadata?.priceRange || ''}
              onChange={(e) => handleChange('priceRange', e.target.value)}
              className={inputClass}
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
            <label className="mb-2 block text-sm font-medium text-(--color-text)">
              نوع غذا <span className="text-xs font-normal text-wibe-secondary">(اختیاری)</span>
            </label>
            <select
              value={metadata?.cuisine || ''}
              onChange={(e) => handleChange('cuisine', e.target.value || undefined)}
              className={inputClass}
            >
              <option value="">انتخاب کنید...</option>
              {CUISINE_TYPES.map((cuisine) => (
                <option key={cuisine} value={cuisine}>
                  {cuisine}
                </option>
              ))}
            </select>
          </div>
        </>
      )}

      <div>
        <label className="mb-2 block text-sm font-medium text-(--color-text)">تلفن (اختیاری)</label>
        <input
          type="tel"
          dir="ltr"
          value={metadata?.phone || ''}
          onChange={(e) => handleChange('phone', e.target.value || undefined)}
          className={inputClass}
          placeholder="021-12345678"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-(--color-text)">اینستاگرام (اختیاری)</label>
        <input
          type="text"
          dir="ltr"
          value={metadata?.instagram || ''}
          onChange={(e) => handleChange('instagram', e.target.value || undefined)}
          className={inputClass}
          placeholder="@username یا لینک"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-(--color-text)">وب‌سایت (اختیاری)</label>
        <input
          type="url"
          dir="ltr"
          value={metadata?.website || ''}
          onChange={(e) => handleChange('website', e.target.value || undefined)}
          className={inputClass}
          placeholder="https://example.com"
        />
      </div>

      <div className={fieldFull}>
        <label className="mb-2 block text-sm font-medium text-(--color-text)">
          لینک مسیریابی / نقشه (اختیاری)
        </label>
        <input
          type="url"
          dir="ltr"
          value={metadata?.mapsUrl || ''}
          onChange={(e) => handleChange('mapsUrl', e.target.value || undefined)}
          className={inputClass}
          placeholder="لینک بلد، گوگل‌مپ یا مختصات"
        />
        <p className="mt-1 text-xs text-wibe-secondary">
          لینک بلد یا گوگل‌مپ — برای پین نقشه و دکمهٔ مسیریابی
        </p>
      </div>
    </>
  );

  if (placeFieldsOnly || isLifestyleCategory(categorySlug)) {
    return (
      <div className={fieldWrap}>
        {!hideTitle && (
          <h3 className={`text-lg font-semibold text-(--color-text) ${fieldFull}`}>
            اطلاعات مکان
          </h3>
        )}
        {placeFields}
      </div>
    );
  }

  if (isMovieCategorySlug(categorySlug)) {
    return (
      <div className={fieldWrap}>
        {!hideTitle && (
          <h3 className={`text-lg font-semibold text-(--color-text) ${fieldFull}`}>
            اطلاعات تکمیلی فیلم/سریال
          </h3>
        )}

        <div>
          <label className="mb-2 block text-sm font-medium text-(--color-text) dark:text-gray-200">
            سال تولید
            <span className="me-2 text-xs font-normal text-wibe-secondary">(اختیاری)</span>
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={metadata?.year || ''}
            onChange={handleYearChange}
            className={inputClass}
            placeholder="2024 یا ۱۴۰۳"
          />
          <p className="mt-1 text-xs text-wibe-secondary">اعداد فارسی و سال شمسی قابل قبول است</p>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-(--color-text) dark:text-gray-200">
            ژانر <span className="text-xs font-normal text-wibe-secondary">(اختیاری)</span>
          </label>
          <select
            value={metadata?.genre || ''}
            onChange={(e) => handleChange('genre', e.target.value || undefined)}
            className={inputClass}
          >
            <option value="">انتخاب کنید...</option>
            {MOVIE_GENRES.map((genre) => (
              <option key={genre} value={genre}>
                {genre}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-(--color-text) dark:text-gray-200">
            کارگردان <span className="text-xs font-normal text-wibe-secondary">(اختیاری)</span>
          </label>
          <input
            type="text"
            value={metadata?.director || ''}
            onChange={(e) => handleChange('director', e.target.value || undefined)}
            className={inputClass}
            placeholder="نام کارگردان..."
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-(--color-text) dark:text-gray-200">
            کشور سازنده <span className="text-xs font-normal text-wibe-secondary">(اختیاری)</span>
          </label>
          <input
            type="text"
            value={metadata?.country || ''}
            onChange={(e) => handleChange('country', e.target.value || undefined)}
            className={inputClass}
            placeholder="مثلاً ایالات متحده"
          />
        </div>

        <div className={fieldFull}>
          <label className="mb-2 block text-sm font-medium text-(--color-text) dark:text-gray-200">
            بازیگران مهم <span className="text-xs font-normal text-wibe-secondary">(حداکثر ۲)</span>
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
            className={inputClass}
            placeholder="Edward Norton، Brad Pitt"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-(--color-text) dark:text-gray-200">
            امتیاز IMDb <span className="text-xs font-normal text-wibe-secondary">(اختیاری)</span>
          </label>
          <input
            type="text"
            value={metadata?.imdbRating || ''}
            onChange={(e) => handleChange('imdbRating', e.target.value || undefined)}
            className={inputClass}
            placeholder="8.5"
            pattern="[0-9]+\.?[0-9]*"
          />
        </div>
      </div>
    );
  }

  if (isBookCategorySlug(categorySlug)) {
    return (
      <div className={fieldWrap}>
        {!hideTitle && (
          <h3 className={`text-lg font-semibold text-(--color-text) ${fieldFull}`}>
            اطلاعات تکمیلی کتاب
          </h3>
        )}

        <div>
          <label className="mb-2 block text-sm font-medium text-(--color-text)">
            نویسنده (اختیاری)
          </label>
          <input
            type="text"
            value={metadata?.author || ''}
            onChange={(e) => handleChange('author', e.target.value || undefined)}
            className={inputClass}
            placeholder="نام نویسنده..."
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-(--color-text)">
            ژانر (اختیاری)
          </label>
          <select
            value={metadata?.genre || ''}
            onChange={(e) => handleChange('genre', e.target.value || undefined)}
            className={inputClass}
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

  if (isCafeCategorySlug(categorySlug)) {
    return (
      <div className={fieldWrap}>
        {!hideTitle && (
          <h3 className={`text-lg font-semibold text-(--color-text) ${fieldFull}`}>
            اطلاعات تکمیلی کافه/رستوران
          </h3>
        )}
        {placeFields}
      </div>
    );
  }

  return null;
}
