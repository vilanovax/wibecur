'use client';

import type { ReactNode } from 'react';

type Props = {
  title: string;
  description?: string;
  icon?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  id?: string;
};

export default function SettingsSectionCard({
  title,
  description,
  icon,
  children,
  footer,
  id,
}: Props) {
  return (
    <section
      id={id}
      className="rounded-2xl border border-(--color-border) bg-(--color-surface) shadow-sm overflow-hidden"
      dir="rtl"
    >
      <div className="px-4 sm:px-5 py-4 border-b border-(--color-border)">
        <div className="flex items-center gap-2">
          {icon}
          <div>
            <h2 className="text-base font-semibold text-(--color-text)">
              {title}
            </h2>
            {description && (
              <p className="text-xs text-wibe-secondary mt-0.5">
                {description}
              </p>
            )}
          </div>
        </div>
      </div>
      <div className="px-4 sm:px-5 py-4 space-y-4">{children}</div>
      {footer && (
        <div className="px-4 sm:px-5 py-3 border-t border-(--color-border) bg-(--color-bg)/50 flex justify-end">
          {footer}
        </div>
      )}
    </section>
  );
}
