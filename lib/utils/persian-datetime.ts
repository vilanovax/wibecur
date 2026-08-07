import { DateObject } from 'react-multi-date-picker';
import persian from 'react-date-object/calendars/persian';
import persian_fa from 'react-date-object/locales/persian_fa';

/** ISO → DateObject با تقویم شمسی */
export function isoToPersianDateObject(iso: string): DateObject {
  return new DateObject({ date: new Date(iso), calendar: persian, locale: persian_fa });
}

/** DateObject + HH:mm → ISO */
export function combinePersianDateAndTime(
  date: { toDate: () => Date } | null | undefined,
  time: string,
  isEnd = false
): string | null {
  if (!date) return null;
  const d = date.toDate();
  const [h, m] = time.split(':').map((x) => parseInt(x, 10));
  if (isEnd) {
    d.setHours(Number.isFinite(h) ? h : 23, Number.isFinite(m) ? m : 59, 59, 999);
  } else {
    d.setHours(Number.isFinite(h) ? h : 0, Number.isFinite(m) ? m : 0, 0, 0);
  }
  return d.toISOString();
}

/** نمایش شمسی مثل ۱۴۰۵/۰۴/۰۴ - ۰۹:۲۸ */
export function formatPersianDateTime(iso: string): string {
  try {
    const d = new Date(iso);
    const datePart = d.toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const timePart = d.toLocaleTimeString('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
    });
    return `${datePart} - ${timePart}`;
  } catch {
    return iso;
  }
}

export function formatPersianDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}

export function isoToTimeString(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
