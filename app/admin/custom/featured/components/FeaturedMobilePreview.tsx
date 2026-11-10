'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import { Loader2, Move, RotateCcw, Smartphone } from 'lucide-react';
import {
  COVER_DISPLAY_MODE_OPTIONS,
  normalizeCoverDisplayMode,
  type CoverDisplayMode,
} from '@/lib/admin/category-form-constants';
import {
  coverFocusStyle,
  DEFAULT_COVER_FOCUS,
  normalizeCoverFocus,
  type CoverFocus,
} from '@/lib/cover-focus';
import { fa } from '@/lib/utils';

export type PreviewList = {
  id?: string;
  title: string;
  description?: string | null;
  coverImage?: string | null;
  horizontalImage?: string | null;
  saveCount: number;
  itemCount?: number;
  badge?: string | null;
  coverDisplayMode?: string | null;
  categorySlug?: string | null;
  coverFocusX?: number;
  coverFocusY?: number;
};

type Props = {
  list: PreviewList | null;
  mode: 'live' | 'fallback' | 'preview' | 'empty';
  label?: string;
  /** اجازهٔ جابه‌جایی فوکوس (وقتی list.id موجود باشد) */
  editableFocus?: boolean;
  onFocusSaved?: (listId: string, focus: CoverFocus) => void;
};

const badgeLabels: Record<string, string> = {
  trending: '🔥 ترند هفته',
  new: '✨ جدید',
  featured: '⭐ ویژه',
  TRENDING: '🔥 ترند هفته',
  NEW: '✨ جدید',
  FEATURED: '⭐ ویژه',
};

function previewHeroSrc(list: PreviewList): string {
  return list.horizontalImage?.trim() || list.coverImage?.trim() || '';
}

export default function FeaturedMobilePreview({
  list,
  mode,
  label,
  editableFocus = true,
  onFocusSaved,
}: Props) {
  const modeLabel =
    label ??
    (mode === 'live'
      ? 'نمایش فعلی در اپ'
      : mode === 'fallback'
        ? 'لیست جایگزین'
        : mode === 'preview'
          ? 'پیش‌نمایش انتخاب'
          : 'پیش‌نمایش');

  const coverMode: CoverDisplayMode = normalizeCoverDisplayMode(list?.coverDisplayMode);
  const coverModeLabel =
    COVER_DISPLAY_MODE_OPTIONS.find((o) => o.value === coverMode)?.label ?? 'عنوان روی کاور';
  const showCoverScrim = coverMode === 'ui';
  const showCoverTitle = coverMode !== 'baked';
  const showTitleBelow = coverMode === 'baked' || coverMode === 'photo';

  const canEdit = Boolean(editableFocus && list?.id);
  const frameRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    origin: CoverFocus;
  } | null>(null);

  const [focus, setFocus] = useState<CoverFocus>(() =>
    normalizeCoverFocus({
      coverFocusX: list?.coverFocusX,
      coverFocusY: list?.coverFocusY,
    })
  );
  const focusRef = useRef(focus);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveOk, setSaveOk] = useState(false);

  useEffect(() => {
    const next = normalizeCoverFocus({
      coverFocusX: list?.coverFocusX,
      coverFocusY: list?.coverFocusY,
    });
    focusRef.current = next;
    setFocus(next);
    setSaveError(null);
    setSaveOk(false);
  }, [list?.id, list?.coverFocusX, list?.coverFocusY]);

  const applyFocus = useCallback((next: CoverFocus) => {
    const normalized = normalizeCoverFocus(next);
    focusRef.current = normalized;
    setFocus(normalized);
    return normalized;
  }, []);

  const persistFocus = useCallback(
    async (next: CoverFocus) => {
      if (!list?.id) return;
      const normalized = normalizeCoverFocus(next);
      setSaving(true);
      setSaveError(null);
      setSaveOk(false);
      try {
        const res = await fetch('/api/admin/custom/featured/cover-focus', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            listId: list.id,
            coverFocusX: normalized.coverFocusX,
            coverFocusY: normalized.coverFocusY,
          }),
        });
        const json = (await res.json().catch(() => ({}))) as {
          error?: string;
          coverFocusX?: number;
          coverFocusY?: number;
        };
        if (!res.ok) {
          throw new Error(json.error || 'ذخیره نشد');
        }
        const saved = normalizeCoverFocus({
          coverFocusX: json.coverFocusX ?? normalized.coverFocusX,
          coverFocusY: json.coverFocusY ?? normalized.coverFocusY,
        });
        focusRef.current = saved;
        setFocus(saved);
        setSaveOk(true);
        onFocusSaved?.(list.id, saved);
      } catch (err) {
        setSaveError(err instanceof Error ? err.message : 'خطا در ذخیره');
      } finally {
        setSaving(false);
      }
    },
    [list?.id, onFocusSaved]
  );

  const focusFromPointer = (
    e: ReactPointerEvent<HTMLDivElement>,
    origin: CoverFocus
  ): CoverFocus => {
    const rect = frameRef.current?.getBoundingClientRect();
    if (!rect || rect.width <= 0 || rect.height <= 0) return origin;
    const drag = dragRef.current;
    if (!drag) return origin;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    return normalizeCoverFocus({
      coverFocusX: origin.coverFocusX - (dx / rect.width) * 100,
      coverFocusY: origin.coverFocusY - (dy / rect.height) * 100,
    });
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!canEdit || !frameRef.current) return;
    e.preventDefault();
    frameRef.current.setPointerCapture(e.pointerId);
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      origin: focusRef.current,
    };
    setSaveOk(false);
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    applyFocus(focusFromPointer(e, drag.origin));
  };

  const endDrag = (e: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    const next = applyFocus(focusFromPointer(e, drag.origin));
    dragRef.current = null;
    if (frameRef.current?.hasPointerCapture(e.pointerId)) {
      frameRef.current.releasePointerCapture(e.pointerId);
    }
    const moved =
      Math.abs(next.coverFocusX - drag.origin.coverFocusX) > 0.2 ||
      Math.abs(next.coverFocusY - drag.origin.coverFocusY) > 0.2;
    if (moved) void persistFocus(next);
  };

  const resetFocus = () => {
    const next = applyFocus({ ...DEFAULT_COVER_FOCUS });
    void persistFocus(next);
  };

  const heroSrc = list ? previewHeroSrc(list) : '';

  return (
    <div className="sticky top-4" dir="rtl">
      <div className="mb-3 flex items-center gap-2 text-xs font-medium text-wibe-secondary">
        <Smartphone className="size-4" aria-hidden strokeWidth={1.5} />
        {modeLabel}
      </div>
      <div className="mx-auto max-w-70 rounded-3xl border-8 border-foreground bg-foreground p-2 shadow-xl">
        <div className="overflow-hidden rounded-2xl bg-background">
          {!list ? (
            <div className="flex h-52 items-center justify-center bg-(--color-bg) p-4 text-center text-sm text-wibe-secondary">
              لیستی برای پیش‌نمایش انتخاب نشده
            </div>
          ) : (
            <>
              <div
                ref={frameRef}
                className={`relative h-44 touch-none select-none ${
                  canEdit ? 'cursor-grab active:cursor-grabbing' : ''
                }`}
                onPointerDown={canEdit ? onPointerDown : undefined}
                onPointerMove={canEdit ? onPointerMove : undefined}
                onPointerUp={canEdit ? endDrag : undefined}
                onPointerCancel={canEdit ? endDrag : undefined}
                role={canEdit ? 'slider' : undefined}
                aria-label={canEdit ? 'جابه‌جایی تصویر پوستر' : undefined}
                aria-valuemin={canEdit ? 0 : undefined}
                aria-valuemax={canEdit ? 100 : undefined}
                aria-valuenow={canEdit ? Math.round(focus.coverFocusX) : undefined}
                aria-valuetext={
                  canEdit
                    ? `افقی ${fa(Math.round(focus.coverFocusX))}، عمودی ${fa(Math.round(focus.coverFocusY))}`
                    : undefined
                }
              >
                <ImageWithFallback
                  src={heroSrc}
                  alt={list.title}
                  className="pointer-events-none h-full w-full object-cover"
                  style={coverFocusStyle(focus)}
                  fallbackIcon="🎬"
                  fallbackClassName="h-full w-full"
                />
                {showCoverScrim ? (
                  <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-foreground/85 via-foreground/35 to-transparent" />
                ) : (
                  <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-foreground/40 via-transparent to-foreground/10" />
                )}
                <div className="pointer-events-none absolute inset-e-2 top-2">
                  <span className="rounded-full bg-destructive px-2 py-0.5 text-[10px] font-bold text-destructive-foreground">
                    {badgeLabels[list.badge ?? 'featured'] ?? '⭐ ویژه'}
                  </span>
                </div>
                {showCoverTitle && coverMode === 'ui' ? (
                  <div className="pointer-events-none absolute inset-x-3 bottom-2 text-start">
                    <h3 className="line-clamp-2 text-sm font-bold text-background">{list.title}</h3>
                    {list.description ? (
                      <p className="mt-0.5 line-clamp-1 text-[10px] text-background/85">
                        {list.description}
                      </p>
                    ) : null}
                    <p className="mt-1 text-[10px] text-background/80">
                      ⭐ {list.saveCount.toLocaleString('fa-IR')} ·{' '}
                      {(list.itemCount ?? 0).toLocaleString('fa-IR')} آیتم
                    </p>
                  </div>
                ) : null}
                {canEdit ? (
                  <div className="pointer-events-none absolute inset-s-2 bottom-2 inline-flex items-center gap-1 rounded-full bg-foreground/55 px-2 py-1 text-[10px] font-medium text-background backdrop-blur-sm">
                    <Move className="size-3" strokeWidth={2} aria-hidden />
                    بکشید تا جابه‌جا شود
                  </div>
                ) : null}
              </div>
              {showTitleBelow ? (
                <div className="border-t border-border px-3 py-2 text-start">
                  <h3 className="line-clamp-2 text-xs font-bold text-(--color-text)">
                    {list.title}
                  </h3>
                  <p className="mt-0.5 text-[10px] text-wibe-secondary">
                    حالت کاور دسته: {coverModeLabel}
                  </p>
                </div>
              ) : (
                <p className="border-t border-border px-3 py-1.5 text-[10px] text-wibe-secondary">
                  حالت کاور دسته: {coverModeLabel}
                  {list.categorySlug ? ` · /${list.categorySlug}` : ''}
                </p>
              )}
              <div className="flex gap-1.5 bg-background p-2">
                <div className="flex-1 rounded-lg bg-primary py-2 text-center text-[10px] font-medium text-primary-foreground">
                  ذخیره کن ⭐
                </div>
                <div className="flex-1 rounded-lg border border-border py-2 text-center text-[10px] font-medium text-wibe-secondary">
                  مشاهده لیست
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {canEdit && list ? (
        <div className="mt-3 space-y-2 rounded-xl border border-border bg-card p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium text-(--color-text)">فوکوس تصویر موبایل</p>
            <button
              type="button"
              onClick={resetFocus}
              disabled={saving}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-xs text-wibe-secondary hover:bg-(--color-bg) hover:text-(--color-text) disabled:opacity-50"
            >
              <RotateCcw className="size-3.5" strokeWidth={1.5} aria-hidden />
              وسط‌چین
            </button>
          </div>
          <p className="wibe-caption text-wibe-secondary">
            تصویر را بکشید تا متن یا سوژهٔ پوستر داخل قاب بماند. مختصات:{' '}
            {fa(Math.round(focus.coverFocusX))}٪ / {fa(Math.round(focus.coverFocusY))}٪
          </p>
          {saving ? (
            <p className="inline-flex items-center gap-1.5 text-[10px] text-wibe-secondary">
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
              در حال ذخیره…
            </p>
          ) : null}
          {saveOk && !saving ? (
            <p className="text-[10px] text-emerald-700 dark:text-emerald-400">ذخیره شد</p>
          ) : null}
          {saveError ? (
            <p className="text-[10px] text-destructive">{saveError}</p>
          ) : null}
        </div>
      ) : (
        <p className="mt-2 text-center wibe-caption text-wibe-secondary">
          تنظیم حالت متن/تصویر از{' '}
          <a href="/admin/categories" className="text-primary hover:underline">
            دسته‌بندی‌ها
          </a>
        </p>
      )}
    </div>
  );
}
