/**
 * نقطهٔ فوکوس کاور برای object-position (۰–۱۰۰٪).
 * پیش‌فرض ۵۰/۵۰ = مرکز تصویر.
 */

export type CoverFocus = {
  coverFocusX: number;
  coverFocusY: number;
};

export const DEFAULT_COVER_FOCUS: CoverFocus = {
  coverFocusX: 50,
  coverFocusY: 50,
};

function clampPercent(value: unknown, fallback: number): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(100, Math.max(0, Math.round(n * 10) / 10));
}

export function normalizeCoverFocus(
  input?: Partial<CoverFocus> | null
): CoverFocus {
  return {
    coverFocusX: clampPercent(input?.coverFocusX, DEFAULT_COVER_FOCUS.coverFocusX),
    coverFocusY: clampPercent(input?.coverFocusY, DEFAULT_COVER_FOCUS.coverFocusY),
  };
}

/** مقدار CSS برای object-position */
export function coverFocusToObjectPosition(input?: Partial<CoverFocus> | null): string {
  const { coverFocusX, coverFocusY } = normalizeCoverFocus(input);
  return `${coverFocusX}% ${coverFocusY}%`;
}

export function coverFocusStyle(
  input?: Partial<CoverFocus> | null
): { objectPosition: string } {
  return { objectPosition: coverFocusToObjectPosition(input) };
}
