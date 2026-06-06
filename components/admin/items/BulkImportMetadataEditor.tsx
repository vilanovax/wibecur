'use client';

import {
  BOOK_GENRES,
  CUISINE_TYPES,
  MOVIE_GENRES,
  PRICE_RANGES,
} from '@/lib/schemas/item-metadata';
import ItemTipField from '@/components/admin/items/ItemTipField';
import type { BulkImportCategoryKind } from '@/lib/admin/bulk-import';
import type { BulkImportRow } from '@/lib/admin/bulk-import';

const fieldClass =
  'w-full mt-1 text-sm rounded-lg border border-gray-200 px-2 py-1';

type Props = {
  kind: BulkImportCategoryKind;
  row: BulkImportRow;
  onUpdate: (metadata: Record<string, unknown>) => void;
};

export default function BulkImportMetadataEditor({ kind, row, onUpdate }: Props) {
  const m = row.metadata;

  const set = (key: string, value: unknown) => {
    onUpdate({ ...m, [key]: value === '' || value === undefined ? undefined : value });
  };

  const wrap = (content: React.ReactNode) => (
    <div className="space-y-2">
      {content}
      <ItemTipField
        compact
        value={String(m.tip ?? '')}
        onChange={(tip) => set('tip', tip.trim() || undefined)}
      />
    </div>
  );

  if (kind === 'general') {
    if (Object.keys(m).length === 0) {
      return wrap(<p className="text-xs text-gray-500">این دسته metadata اختصاصی ندارد.</p>);
    }
    return wrap(
      <div>
        <label className="text-[10px] font-semibold text-gray-500">metadata (JSON)</label>
        <textarea
          dir="ltr"
          rows={3}
          value={JSON.stringify(m, null, 2)}
          onChange={(e) => {
            try {
              onUpdate(JSON.parse(e.target.value) as Record<string, unknown>);
            } catch {
              /* ignore while typing */
            }
          }}
          className="w-full mt-1 text-xs font-mono rounded-lg border border-gray-200 px-2 py-1.5"
        />
      </div>
    );
  }

  if (kind === 'book') {
    return wrap(
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div>
          <label className="text-[10px] font-semibold text-gray-500">نویسنده</label>
          <input
            value={String(m.author ?? '')}
            onChange={(e) => set('author', e.target.value || undefined)}
            className={fieldClass}
          />
        </div>
        <div>
          <label className="text-[10px] font-semibold text-gray-500">ژانر</label>
          <select
            value={String(m.genre ?? '')}
            onChange={(e) => set('genre', e.target.value || undefined)}
            className={fieldClass}
          >
            <option value="">—</option>
            {BOOK_GENRES.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[10px] font-semibold text-gray-500">ISBN</label>
          <input
            dir="ltr"
            value={String(m.isbn ?? '')}
            onChange={(e) => set('isbn', e.target.value || undefined)}
            className={fieldClass}
          />
        </div>
      </div>
    );
  }

  if (kind === 'cafe') {
    return wrap(
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div className="sm:col-span-3">
          <label className="text-[10px] font-semibold text-gray-500">آدرس *</label>
          <input
            value={String(m.address ?? '')}
            onChange={(e) => set('address', e.target.value || undefined)}
            className={fieldClass}
          />
        </div>
        <div>
          <label className="text-[10px] font-semibold text-gray-500">بازه قیمت *</label>
          <select
            value={String(m.priceRange ?? '')}
            onChange={(e) => set('priceRange', e.target.value || undefined)}
            className={fieldClass}
          >
            <option value="">—</option>
            {PRICE_RANGES.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="text-[10px] font-semibold text-gray-500">نوع غذا</label>
          <select
            value={String(m.cuisine ?? '')}
            onChange={(e) => set('cuisine', e.target.value || undefined)}
            className={fieldClass}
          >
            <option value="">—</option>
            {CUISINE_TYPES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  }

  // movie
  return wrap(
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      <div>
        <label className="text-[10px] font-semibold text-gray-500">سال</label>
        <input
          type="number"
          value={m.year != null ? String(m.year) : ''}
          onChange={(e) =>
            set('year', e.target.value ? parseInt(e.target.value, 10) : undefined)
          }
          className={fieldClass}
        />
      </div>
      <div>
        <label className="text-[10px] font-semibold text-gray-500">ژانر</label>
        <select
          value={String(m.genre ?? '')}
          onChange={(e) => set('genre', e.target.value || undefined)}
          className={fieldClass}
        >
          <option value="">—</option>
          {MOVIE_GENRES.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-[10px] font-semibold text-gray-500">کارگردان</label>
        <input
          value={String(m.director ?? '')}
          onChange={(e) => set('director', e.target.value || undefined)}
          className={fieldClass}
        />
      </div>
      <div>
        <label className="text-[10px] font-semibold text-gray-500">IMDb</label>
        <input
          value={String(m.imdbRating ?? '')}
          onChange={(e) => set('imdbRating', e.target.value || undefined)}
          className={fieldClass}
        />
      </div>
      <div>
        <label className="text-[10px] font-semibold text-gray-500">کشور سازنده</label>
        <input
          value={String(m.country ?? '')}
          onChange={(e) => set('country', e.target.value || undefined)}
          className={fieldClass}
        />
      </div>
      <div className="sm:col-span-2">
        <label className="text-[10px] font-semibold text-gray-500">بازیگران (حداکثر ۲، با کاما)</label>
        <input
          value={
            Array.isArray(m.actors)
              ? m.actors.join('، ')
              : typeof m.actors === 'string'
                ? m.actors
                : ''
          }
          onChange={(e) => {
            const raw = e.target.value.trim();
            if (!raw) {
              set('actors', undefined);
              return;
            }
            set(
              'actors',
              raw
                .split(/[,،]/)
                .map((s) => s.trim())
                .filter(Boolean)
                .slice(0, 2)
            );
          }}
          className={fieldClass}
          placeholder="مثلاً Keanu Reeves، Laurence Fishburne"
        />
      </div>
      <div>
        <label className="text-[10px] font-semibold text-gray-500">imdbId (داخلی)</label>
        <input
          dir="ltr"
          value={String(m.imdbId ?? '')}
          onChange={(e) => set('imdbId', e.target.value || undefined)}
          className={`${fieldClass} font-mono text-xs`}
        />
      </div>
      <div>
        <label className="text-[10px] font-semibold text-gray-500">tmdbId (داخلی)</label>
        <input
          type="number"
          value={m.tmdbId != null ? String(m.tmdbId) : ''}
          onChange={(e) =>
            set('tmdbId', e.target.value ? parseInt(e.target.value, 10) : undefined)
          }
          className={fieldClass}
        />
      </div>
    </div>
  );
}

export function bulkImportFallbackIcon(kind: BulkImportCategoryKind): string {
  switch (kind) {
    case 'movie':
      return '🎬';
    case 'book':
      return '📚';
    case 'cafe':
      return '☕';
    default:
      return '📦';
  }
}
