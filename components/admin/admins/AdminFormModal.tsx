'use client';

import { useEffect } from 'react';
import { Loader2, X, KeyRound, Shield, SlidersHorizontal } from 'lucide-react';
import type { AdminRoleTemplate } from '@/lib/auth/role-templates';
import type { PermissionGroup } from '@/lib/auth/permission-groups';
import type { AdminRole } from '@/lib/auth/roles';
import { getRoleLabel } from '@/lib/auth/roles';
import type { Permission } from '@/lib/auth/permissions';
import RoleTemplatePicker from './RoleTemplatePicker';
import PermissionPicker from './PermissionPicker';

export type AdminFormState = {
  name: string;
  email: string;
  password: string;
  role: AdminRole;
  useCustomPermissions: boolean;
  adminPermissions: Permission[];
  isActive: boolean;
};

type Props = {
  mode: 'create' | 'edit';
  form: AdminFormState;
  saving: boolean;
  assignableRoles: AdminRoleTemplate[];
  permissionGroups: PermissionGroup[];
  roleTemplates: AdminRoleTemplate[];
  onClose: () => void;
  onSubmit: () => void;
  onChange: (patch: Partial<AdminFormState>) => void;
  onRoleChange: (role: AdminRole) => void;
};

const INPUT =
  'mt-1.5 w-full rounded-xl border border-gray-200 dark:border-gray-600 px-3 py-2.5 text-sm bg-white dark:bg-gray-900 text-[var(--color-text)] dark:text-white placeholder:text-[var(--color-text-subtle)] focus:outline-none focus:ring-2 focus:ring-violet-500/25 focus:border-violet-400 transition-shadow';

function FieldLabel({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <span className="block text-sm font-medium text-[var(--color-text)] dark:text-gray-200" id={htmlFor}>
      {children}
    </span>
  );
}

function Section({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: typeof Shield;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-gray-200 dark:border-gray-600 overflow-hidden">
      <div className="flex items-start gap-2.5 border-b border-gray-100 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-900/40 px-4 py-3">
        <Icon className="h-4 w-4 shrink-0 text-violet-600 mt-0.5" />
        <div>
          <h3 className="text-sm font-semibold text-[var(--color-text)] dark:text-white">{title}</h3>
          {description ? (
            <p className="text-xs text-[var(--color-text-muted)] dark:text-[var(--color-text-subtle)] mt-0.5">{description}</p>
          ) : null}
        </div>
      </div>
      <div className="p-4 space-y-4">{children}</div>
    </section>
  );
}

export default function AdminFormModal({
  mode,
  form,
  saving,
  assignableRoles,
  permissionGroups,
  roleTemplates,
  onClose,
  onSubmit,
  onChange,
  onRoleChange,
}: Props) {
  const selectedTemplate = roleTemplates.find((t) => t.role === form.role);
  const effectiveCount = form.useCustomPermissions
    ? form.adminPermissions.length
    : selectedTemplate?.permissions.length ?? 0;

  const canSubmit =
    form.email.trim().length > 0 &&
    (mode === 'edit' || form.password.length >= 6) &&
    (!form.useCustomPermissions || form.adminPermissions.length > 0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !saving) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, saving]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-[2px]"
      onClick={() => !saving && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-form-title"
        onClick={(e) => e.stopPropagation()}
        className={[
          'flex max-h-[92vh] w-full flex-col overflow-hidden bg-white dark:bg-gray-800 shadow-xl',
          'rounded-t-2xl sm:rounded-2xl border border-gray-200 dark:border-gray-600',
          form.useCustomPermissions ? 'sm:max-w-2xl' : 'sm:max-w-lg',
        ].join(' ')}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-5 py-4">
          <div>
            <h2 id="admin-form-title" className="text-lg font-bold text-[var(--color-text)] dark:text-white">
              {mode === 'create' ? 'ادمین جدید' : 'ویرایش ادمین'}
            </h2>
            <p className="text-xs text-[var(--color-text-muted)] dark:text-[var(--color-text-subtle)] mt-0.5">
              {mode === 'create'
                ? 'حساب ورود و سطح دسترسی را تعریف کنید'
                : 'اطلاعات و دسترسی ادمین را به‌روز کنید'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="بستن"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[var(--color-text-muted)] hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <Section icon={KeyRound} title="اطلاعات حساب" description="نام، ایمیل و رمز ورود">
            <div className="space-y-4">
              <label className="block">
                <FieldLabel>نام نمایشی</FieldLabel>
                <input
                  value={form.name}
                  onChange={(e) => onChange({ name: e.target.value })}
                  placeholder="مثلاً عباس ادمین"
                  className={INPUT}
                  autoComplete="name"
                />
              </label>

              <label className="block">
                <FieldLabel>ایمیل ورود</FieldLabel>
                <input
                  type="email"
                  value={form.email}
                  disabled={mode === 'edit'}
                  onChange={(e) => onChange({ email: e.target.value })}
                  placeholder="admin@example.com"
                  className={`${INPUT} disabled:opacity-60 disabled:bg-gray-50 dark:disabled:bg-gray-900/60`}
                  dir="ltr"
                  autoComplete="email"
                />
                {mode === 'edit' ? (
                  <p className="mt-1 text-[11px] text-[var(--color-text-subtle)]">ایمیل پس از ایجاد قابل تغییر نیست.</p>
                ) : null}
              </label>

              <label className="block">
                <FieldLabel>{mode === 'create' ? 'رمز عبور' : 'رمز عبور جدید (اختیاری)'}</FieldLabel>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => onChange({ password: e.target.value })}
                  placeholder={mode === 'create' ? 'حداقل ۶ کاراکتر' : 'خالی = بدون تغییر'}
                  className={INPUT}
                  autoComplete={mode === 'create' ? 'new-password' : 'off'}
                />
              </label>
            </div>
          </Section>

          <Section
            icon={Shield}
            title="نقش و دسترسی"
            description="یک قالب آماده انتخاب کنید یا دسترسی‌ها را سفارشی کنید"
          >
            {!form.useCustomPermissions ? (
              <RoleTemplatePicker
                templates={assignableRoles}
                value={form.role}
                onChange={onRoleChange}
              />
            ) : null}

            <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-600 p-3.5 space-y-3">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={form.useCustomPermissions}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    onChange({
                      useCustomPermissions: checked,
                      adminPermissions: checked
                        ? form.adminPermissions.length > 0
                          ? form.adminPermissions
                          : [...(selectedTemplate?.permissions ?? [])]
                        : [],
                    });
                  }}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                />
                <span>
                  <span className="block text-sm font-medium text-[var(--color-text)] dark:text-gray-100">
                    دسترسی سفارشی
                  </span>
                  <span className="block text-xs text-[var(--color-text-muted)] dark:text-[var(--color-text-subtle)] mt-0.5">
                    به‌جای قالب نقش، دسترسی‌های هر بخش را خودتان انتخاب کنید
                  </span>
                </span>
              </label>

              {!form.useCustomPermissions && selectedTemplate ? (
                <p className="text-xs text-[var(--color-text-muted)] dark:text-[var(--color-text-subtle)] ps-7">
                  {effectiveCount.toLocaleString('fa-IR')} دسترسی از قالب «{selectedTemplate.label}»
                </p>
              ) : null}

              {form.useCustomPermissions ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                    <span>
                      {form.adminPermissions.length.toLocaleString('fa-IR')} دسترسی انتخاب شده
                    </span>
                  </div>
                  <PermissionPicker
                    groups={permissionGroups}
                    selected={form.adminPermissions}
                    onChange={(adminPermissions) => onChange({ adminPermissions })}
                  />
                </div>
              ) : null}
            </div>
          </Section>

          {mode === 'edit' ? (
            <label className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-900/30 px-4 py-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => onChange({ isActive: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
              />
              <span className="text-sm">
                <span className="font-medium text-[var(--color-text)] dark:text-white">حساب فعال</span>
                <span className="block text-xs text-[var(--color-text-muted)] mt-0.5">
                  نقش فعلی: {getRoleLabel(form.role)}
                </span>
              </span>
            </label>
          ) : null}
        </div>

        <div className="sticky bottom-0 flex items-center justify-start gap-2 border-t border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-5 py-4">
          <button
            type="button"
            disabled={saving || !canSubmit}
            onClick={onSubmit}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50 transition-colors min-w-[100px]"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            ذخیره
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={onClose}
            className="rounded-xl border border-gray-200 dark:border-gray-600 px-5 py-2.5 text-sm text-[var(--color-text)] dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            انصراف
          </button>
        </div>
      </div>
    </div>
  );
}
