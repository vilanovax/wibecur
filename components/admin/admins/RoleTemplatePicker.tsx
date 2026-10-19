'use client';

import { Check } from 'lucide-react';
import type { AdminRoleTemplate } from '@/lib/auth/role-templates';
import type { AdminRole } from '@/lib/auth/roles';

const ROLE_ACCENT: Record<AdminRole, string> = {
  SUPER_ADMIN: 'border-purple-300 bg-purple-50 ring-purple-500 dark:bg-purple-950/30 dark:border-purple-700',
  ADMIN: 'border-violet-300 bg-violet-50 ring-violet-500 dark:bg-violet-950/30 dark:border-violet-700',
  EDITOR: 'border-blue-300 bg-blue-50 ring-blue-500 dark:bg-blue-950/30 dark:border-blue-700',
  MODERATOR: 'border-amber-300 bg-amber-50 ring-amber-500 dark:bg-amber-950/30 dark:border-amber-700',
  ANALYST: 'border-sky-300 bg-sky-50 ring-sky-500 dark:bg-sky-950/30 dark:border-sky-700',
};

const ROLE_BADGE: Record<AdminRole, string> = {
  SUPER_ADMIN: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200',
  ADMIN: 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200',
  EDITOR: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200',
  MODERATOR: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
  ANALYST: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200',
};

type Props = {
  templates: AdminRoleTemplate[];
  value: AdminRole;
  onChange: (role: AdminRole) => void;
  disabled?: boolean;
};

export default function RoleTemplatePicker({ templates, value, onChange, disabled }: Props) {
  return (
    <div className="grid grid-cols-1 gap-2" role="radiogroup" aria-label="قالب نقش">
      {templates.map((template) => {
        const selected = template.role === value;
        return (
          <button
            key={template.role}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            onClick={() => onChange(template.role)}
            className={[
              'relative w-full rounded-xl border p-3.5 text-right transition-all',
              'hover:border-gray-300 dark:hover:border-gray-500',
              'disabled:opacity-60 disabled:cursor-not-allowed',
              selected
                ? `${ROLE_ACCENT[template.role]} ring-2 ring-offset-1 dark:ring-offset-gray-900`
                : 'border-gray-200 bg-white dark:border-gray-600 dark:bg-gray-900/40',
            ].join(' ')}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-sm text-[var(--color-text)] dark:text-white">
                    {template.label}
                  </span>
                  <span
                    className={`inline-flex rounded-md px-1.5 py-0.5 text-[10px] font-medium tabular-nums ${ROLE_BADGE[template.role]}`}
                  >
                    {template.permissions.length.toLocaleString('fa-IR')} دسترسی
                  </span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-[var(--color-text-muted)] dark:text-[var(--color-text-subtle)]">
                  {template.description}
                </p>
              </div>
              <span
                className={[
                  'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors',
                  selected
                    ? 'border-violet-600 bg-violet-600 text-white'
                    : 'border-gray-300 bg-white dark:border-gray-500 dark:bg-gray-800',
                ].join(' ')}
              >
                {selected ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
