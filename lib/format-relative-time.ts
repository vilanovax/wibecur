import { formatDistanceToNow } from 'date-fns/formatDistanceToNow';
import { faIR } from 'date-fns/locale/fa-IR';

/**
 * زمان نسبی فارسی — یک import عمیق به‌جای barrel `date-fns`
 * تا چانک مشترک کلاینت/ادمین سبک بماند.
 */
export function formatRelativeTime(
  date: Date | string | number,
  options?: { addSuffix?: boolean }
): string {
  const value =
    typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  return formatDistanceToNow(value, {
    addSuffix: options?.addSuffix ?? true,
    locale: faIR,
  });
}
