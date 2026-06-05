'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  configured?: boolean;
  hint?: string;
  placeholder?: string;
  testButton?: React.ReactNode;
};

export default function SecretInput({
  label,
  value,
  onChange,
  configured = false,
  hint,
  placeholder = 'برای جایگزینی وارد کنید',
  testButton,
}: Props) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-1.5">
        <label className="text-sm font-medium text-[var(--color-text)]">
          {label}
        </label>
        {configured && (
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
            تنظیم شده
          </span>
        )}
        {!configured && (
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-[var(--color-bg)] text-[var(--color-text-muted)]">
            خالی
          </span>
        )}
      </div>
      <div className="flex gap-2">
        <div className="relative flex-1 min-w-0">
          <input
            type={visible ? 'text' : 'password'}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full pl-10 pr-3 py-2 text-sm rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] focus:ring-2 focus:ring-[var(--primary)]/30"
            placeholder={configured ? 'برای تغییر، کلید جدید وارد کنید' : placeholder}
            autoComplete="off"
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-[var(--color-border-muted)]"
            aria-label={visible ? 'مخفی' : 'نمایش'}
          >
            {visible ? (
              <EyeOff className="w-4 h-4 text-[var(--color-text-muted)]" />
            ) : (
              <Eye className="w-4 h-4 text-[var(--color-text-muted)]" />
            )}
          </button>
        </div>
        {testButton}
      </div>
      {hint && (
        <p className="text-[11px] text-[var(--color-text-subtle)] mt-1">{hint}</p>
      )}
    </div>
  );
}
