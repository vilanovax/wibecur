'use client';

import DatePicker, { type DateObject } from 'react-multi-date-picker';
import persian from 'react-date-object/calendars/persian';
import persian_fa from 'react-date-object/locales/persian_fa';

type Props = {
  label: string;
  date: DateObject | null;
  time: string;
  onDateChange: (d: DateObject | null) => void;
  onTimeChange: (t: string) => void;
  className?: string;
  disabled?: boolean;
};

export default function PersianDateTimeField({
  label,
  date,
  time,
  onDateChange,
  onTimeChange,
  className = '',
  disabled = false,
}: Props) {
  return (
    <label className={`block text-sm font-medium ${className}`}>
      {label}
      <div className="mt-1.5 flex flex-wrap gap-2">
        <DatePicker
          value={date}
          onChange={(d) => onDateChange((d as DateObject) ?? null)}
          calendar={persian}
          locale={persian_fa}
          calendarPosition="bottom-right"
          disabled={disabled}
          inputClass="w-full min-w-[10rem] flex-1 rounded-xl border border-[var(--color-border)] bg-white px-3 py-2.5 text-sm text-right disabled:opacity-60"
          placeholder="تاریخ شمسی"
        />
        <input
          type="time"
          value={time}
          disabled={disabled}
          onChange={(e) => onTimeChange(e.target.value)}
          className="rounded-xl border border-[var(--color-border)] bg-white px-3 py-2.5 text-sm disabled:opacity-60"
        />
      </div>
    </label>
  );
}
