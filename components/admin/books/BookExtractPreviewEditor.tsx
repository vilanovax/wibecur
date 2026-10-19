'use client';

import { useState } from 'react';
import { ChevronDown, ExternalLink, Trash2 } from 'lucide-react';
import type { WibeBookImportItem } from '@/lib/books/types';
import { BOOK_GENRES } from '@/lib/schemas/item-metadata';
import ItemTipField from '@/components/admin/items/ItemTipField';
import ImageWithFallback from '@/components/shared/ImageWithFallback';

const CONTENT_TYPE_OPTIONS = [
  { value: '', label: '—' },
  { value: 'ebook', label: 'الکترونیکی' },
  { value: 'audiobook', label: 'صوتی' },
] as const;

const fieldClass =
  'w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm focus:border-violet-400 focus:ring-1 focus:ring-violet-100';

type Props = {
  items: WibeBookImportItem[];
  onChange: (items: WibeBookImportItem[]) => void;
};

export default function BookExtractPreviewEditor({ items, onChange }: Props) {
  const [expanded, setExpanded] = useState<Set<number>>(() => new Set(items.length <= 3 ? items.map((_, i) => i) : [0]));

  const toggle = (index: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const updateItem = (index: number, patch: Partial<WibeBookImportItem>) => {
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const updateMetadata = (index: number, patch: Record<string, unknown>) => {
    onChange(
      items.map((item, i) =>
        i === index
          ? { ...item, metadata: { ...(item.metadata ?? {}), ...patch } }
          : item
      )
    );
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
    setExpanded((prev) => {
      const next = new Set<number>();
      prev.forEach((i) => {
        if (i < index) next.add(i);
        else if (i > index) next.add(i - 1);
      });
      return next;
    });
  };

  if (items.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-sm font-medium text-[var(--color-text)]">پیش‌نمایش و ویرایش ({items.length})</h4>
        <p className="text-xs text-[var(--color-text-muted)]">قبل از import می‌توانید فیلدها را اصلاح کنید</p>
      </div>

      <div className="space-y-2 max-h-[32rem] overflow-y-auto pr-1">
        {items.map((item, index) => {
          const isOpen = expanded.has(index);
          const meta = item.metadata ?? {};
          return (
            <div
              key={`${item.externalUrl}-${index}`}
              className="rounded-xl border border-gray-200 bg-gray-50/50 overflow-hidden"
            >
              <div className="flex items-start gap-3 p-3">
                <div className="shrink-0 w-12 h-16 rounded-lg overflow-hidden bg-gray-200 border border-gray-100">
                  {item.imageUrl ? (
                    <ImageWithFallback
                      src={item.imageUrl}
                      alt=""
                      width={48}
                      height={64}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] text-[var(--color-text-subtle)]">
                      بدون تصویر
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex gap-2 items-start">
                    <input
                      value={item.title}
                      onChange={(e) => updateItem(index, { title: e.target.value })}
                      className={`${fieldClass} font-medium flex-1`}
                      placeholder="عنوان"
                    />
                    <button
                      type="button"
                      onClick={() => toggle(index)}
                      className="shrink-0 p-2 rounded-lg border border-gray-200 bg-white text-[var(--color-text-muted)] hover:bg-gray-50"
                      title={isOpen ? 'جمع کردن' : 'باز کردن'}
                    >
                      <ChevronDown className={`w-4 h-4 transition ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="shrink-0 p-2 rounded-lg border border-red-100 text-red-500 hover:bg-red-50"
                      title="حذف از لیست"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] font-medium text-[var(--color-text-muted)]">نویسنده</label>
                      <input
                        value={meta.author ?? ''}
                        onChange={(e) => updateMetadata(index, { author: e.target.value || undefined })}
                        className={fieldClass}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-medium text-[var(--color-text-muted)]">ژانر</label>
                      <select
                        value={meta.genre ?? ''}
                        onChange={(e) => updateMetadata(index, { genre: e.target.value || undefined })}
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
                      <label className="text-[10px] font-medium text-[var(--color-text-muted)]">نوع</label>
                      <select
                        value={meta.contentType ?? ''}
                        onChange={(e) =>
                          updateMetadata(index, {
                            contentType: e.target.value || undefined,
                          })
                        }
                        className={fieldClass}
                      >
                        {CONTENT_TYPE_OPTIONS.map((o) => (
                          <option key={o.value || 'none'} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {isOpen && (
                <div className="px-3 pb-3 pt-0 space-y-2 border-t border-gray-100 bg-white">
                  <div>
                    <label className="text-[10px] font-medium text-[var(--color-text-muted)]">توضیحات</label>
                    <textarea
                      value={item.description ?? ''}
                      onChange={(e) => updateItem(index, { description: e.target.value || undefined })}
                      rows={3}
                      className={fieldClass}
                      placeholder="توضیح کتاب برای لیست"
                    />
                  </div>
                  <ItemTipField
                    value={item.tip ?? ''}
                    onChange={(tip) => updateItem(index, { tip: tip || undefined })}
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-medium text-[var(--color-text-muted)]">ISBN</label>
                      <input
                        dir="ltr"
                        value={meta.isbn ?? ''}
                        onChange={(e) => updateMetadata(index, { isbn: e.target.value || undefined })}
                        className={fieldClass}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-medium text-[var(--color-text-muted)]">لینک تصویر</label>
                      <input
                        dir="ltr"
                        value={item.imageUrl ?? ''}
                        onChange={(e) => updateItem(index, { imageUrl: e.target.value || undefined })}
                        className={fieldClass}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-medium text-[var(--color-text-muted)]">لینک منبع</label>
                    <div className="flex gap-2">
                      <input
                        dir="ltr"
                        value={item.externalUrl}
                        onChange={(e) => updateItem(index, { externalUrl: e.target.value })}
                        className={fieldClass}
                      />
                      {item.externalUrl && (
                        <a
                          href={item.externalUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="shrink-0 inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 text-xs text-violet-600 hover:bg-violet-50"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          باز
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
