'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  ClipboardList,
  Clock,
  KeyRound,
  Loader2,
  LogIn,
  Shield,
  ShieldAlert,
  SlidersHorizontal,
} from 'lucide-react';
import UserAvatar from '@/components/shared/UserAvatar';
import { AdminCard, MetricCard } from '@/components/admin/design-system';
import RoleTemplatePicker from './RoleTemplatePicker';
import PermissionPicker from './PermissionPicker';
import type { AdminFormState } from './AdminFormModal';
import type { AdminAccountRow } from '@/lib/admin/admins-data';
import type { AdminDossier } from '@/lib/admin/admin-dossier';
import { visibleAdminMenu } from '@/lib/admin/admin-menu';
import type { AdminRoleTemplate } from '@/lib/auth/role-templates';
import { ADMIN_ROLE_TEMPLATES } from '@/lib/auth/role-templates';
import type { PermissionGroup } from '@/lib/auth/permission-groups';
import { PERMISSION_GROUPS } from '@/lib/auth/permission-groups';
import type { AdminRole } from '@/lib/auth/roles';
import { formatRelativeTime } from '@/lib/format-relative-time';
import { parseUserAgentShort } from '@/lib/audit/display';
import { usePermissions } from '@/hooks/usePermissions';

type DossierPayload = AdminDossier & {
  roleTemplates: AdminRoleTemplate[];
  permissionGroups: PermissionGroup[];
};

const INPUT =
  'mt-1.5 w-full rounded-xl border border-gray-200 dark:border-gray-600 px-3 py-2.5 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/25 focus:border-violet-400';

const ROLE_BADGE: Record<AdminRole, string> = {
  SUPER_ADMIN: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200',
  ADMIN: 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200',
  EDITOR: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200',
  MODERATOR: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
  ANALYST: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200',
};

function formFromAccount(account: AdminAccountRow): AdminFormState {
  return {
    name: account.name ?? '',
    email: account.email,
    password: '',
    adminNote: account.adminNote ?? '',
    role: account.role,
    useCustomPermissions: account.adminPermissions.length > 0,
    adminPermissions: account.adminPermissions,
    isActive: account.isActive,
  };
}

function formatExact(iso: string) {
  return new Date(iso).toLocaleString('fa-IR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function EmptyLine({ children }: { children: string }) {
  return <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">{children}</p>;
}

export default function AdminDossierClient({ adminId }: { adminId: string }) {
  const { can, role: actorRole } = usePermissions();
  const canManage = can('manage_roles');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [missing, setMissing] = useState(false);
  const [dossier, setDossier] = useState<DossierPayload | null>(null);
  const [roleTemplates, setRoleTemplates] = useState<AdminRoleTemplate[]>(ADMIN_ROLE_TEMPLATES);
  const [permissionGroups, setPermissionGroups] = useState<PermissionGroup[]>(PERMISSION_GROUPS);
  const [form, setForm] = useState<AdminFormState | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    setMissing(false);
    try {
      const res = await fetch(`/api/admin/admins/${adminId}`);
      const json = await res.json();
      if (res.status === 404) {
        setMissing(true);
        setDossier(null);
        return;
      }
      if (!res.ok || !json.success) throw new Error(json.error || 'خطا در بارگذاری');
      const data = json.data as DossierPayload;
      setDossier(data);
      setRoleTemplates(data.roleTemplates ?? ADMIN_ROLE_TEMPLATES);
      setPermissionGroups(data.permissionGroups ?? PERMISSION_GROUPS);
      setForm(formFromAccount(data.account));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'خطا');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [adminId]);

  useEffect(() => {
    if (canManage) load();
    else setLoading(false);
  }, [canManage, load]);

  const assignableRoles = useMemo(
    () => roleTemplates.filter((template) => actorRole === 'SUPER_ADMIN' || template.role !== 'SUPER_ADMIN'),
    [roleTemplates, actorRole]
  );

  const draftPermissions = useMemo(() => {
    if (!form || !dossier) return [];
    if (form.useCustomPermissions) return form.adminPermissions;
    return roleTemplates.find((template) => template.role === form.role)?.permissions ?? dossier.account.effectivePermissions;
  }, [form, dossier, roleTemplates]);

  const menu = useMemo(() => visibleAdminMenu(draftPermissions), [draftPermissions]);

  const patchForm = (patch: Partial<AdminFormState>) => {
    setForm((current) => (current ? { ...current, ...patch } : current));
  };

  const applyRole = (role: AdminRole) => {
    setForm((current) => (current ? { ...current, role } : current));
  };

  const save = async () => {
    if (!form) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/admins/${adminId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          adminNote: form.adminNote,
          role: form.role,
          isActive: form.isActive,
          useCustomPermissions: form.useCustomPermissions,
          adminPermissions: form.useCustomPermissions ? form.adminPermissions : [],
          ...(form.password ? { password: form.password } : {}),
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'خطا');
      setMessage(json.message || 'ذخیره شد');
      await load(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'خطا');
    } finally {
      setSaving(false);
    }
  };

  if (!canManage) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900" dir="rtl">
        دسترسی «مدیریت نقش‌ها» برای پرونده ادمین لازم است.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center" dir="rtl">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    );
  }

  if (missing || !dossier || !form) {
    return (
      <div className="space-y-4" dir="rtl">
        <Link href="/admin/admins" className="inline-flex min-h-11 items-center gap-1 text-sm text-gray-500">
          <ArrowRight className="h-4 w-4" />
          بازگشت به ادمین‌ها
        </Link>
        <p className="text-sm text-gray-700 dark:text-gray-200">{error || 'ادمین یافت نشد'}</p>
      </div>
    );
  }

  const { account, performance, logins, operations } = dossier;
  const canSubmit =
    !form.useCustomPermissions || form.adminPermissions.length > 0;
  const selectedTemplate = roleTemplates.find((template) => template.role === form.role);

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <Link
          href="/admin/admins"
          className="inline-flex min-h-11 items-center gap-1 text-sm text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
        >
          <ArrowRight className="h-4 w-4" />
          بازگشت به ادمین‌ها
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <UserAvatar src={null} name={account.name} email={account.email} size={48} />
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {account.name || 'بدون نام'}
            </h1>
            <p className="text-sm text-gray-500 font-mono" dir="ltr">
              {account.email}
            </p>
          </div>
          <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${ROLE_BADGE[account.role]}`}>
            {account.roleLabel}
          </span>
          <span
            className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${
              account.isActive
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200'
                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
            }`}
          >
            {account.isActive ? 'فعال' : 'غیرفعال'}
          </span>
        </div>
      </div>

      {message ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {message}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
      ) : null}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard
          title="عملیات ۳۰ روز"
          value={performance.operationCount}
          icon={ClipboardList}
        />
        <MetricCard
          title="ورود موفق"
          value={performance.loginSuccess}
          icon={LogIn}
          delta={performance.lastLoginAt ? formatRelativeTime(performance.lastLoginAt) : 'هنوز ورودی نیست'}
        />
        <MetricCard title="ورود ناموفق" value={performance.loginFailure} icon={ShieldAlert} />
        <MetricCard
          title="آخرین عملیات"
          value={performance.lastActivityAt ? formatRelativeTime(performance.lastActivityAt) : 'هنوز عملیاتی نیست'}
          valueLocale={false}
          icon={Clock}
        />
      </div>

      {performance.byAction.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {performance.byAction.slice(0, 8).map((row) => (
            <span
              key={row.action}
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1 text-xs text-gray-700 dark:text-gray-200"
            >
              {row.label}
              <span className="font-semibold tabular-nums">{row.count.toLocaleString('fa-IR')}</span>
            </span>
          ))}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <AdminCard hover={false} className="space-y-4">
          <div className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-violet-600" />
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">حساب و دسترسی</h2>
          </div>

          <label className="block">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">نام نمایشی</span>
            <input
              value={form.name}
              onChange={(event) => patchForm({ name: event.target.value })}
              className={INPUT}
              autoComplete="name"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">توضیحات</span>
            <textarea
              value={form.adminNote}
              onChange={(event) => patchForm({ adminNote: event.target.value })}
              rows={3}
              maxLength={500}
              placeholder="مثلاً مسئول کامنت‌های شب"
              className={INPUT}
            />
            <p className="mt-1 text-xs text-gray-400">
              فقط در پنل دیده می‌شود. {form.adminNote.length.toLocaleString('fa-IR')} از{' '}
              {(500).toLocaleString('fa-IR')}
            </p>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">رمز جدید</span>
            <input
              type="password"
              value={form.password}
              onChange={(event) => patchForm({ password: event.target.value })}
              placeholder="خالی بماند، رمز عوض نمی‌شود"
              className={INPUT}
              autoComplete="new-password"
            />
          </label>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-800 dark:text-gray-100">
              <Shield className="h-4 w-4 text-violet-600" />
              نقش و سطح دسترسی
            </div>
            <RoleTemplatePicker templates={assignableRoles} value={form.role} onChange={applyRole} />
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-dashed border-gray-200 dark:border-gray-600 p-3">
              <input
                type="checkbox"
                checked={form.useCustomPermissions}
                onChange={(event) => {
                  const checked = event.target.checked;
                  patchForm({
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
                <span className="block text-sm font-medium">دسترسی سفارشی</span>
                <span className="block text-xs text-gray-500 mt-0.5">
                  به‌جای قالب نقش، دسترسی هر بخش را خودتان انتخاب کنید
                </span>
              </span>
            </label>
            {form.useCustomPermissions ? (
              <div className="space-y-2">
                <p className="flex items-center gap-1.5 text-xs text-gray-500">
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  {form.adminPermissions.length.toLocaleString('fa-IR')} دسترسی انتخاب شده
                </p>
                <PermissionPicker
                  groups={permissionGroups}
                  selected={form.adminPermissions}
                  onChange={(adminPermissions) => patchForm({ adminPermissions })}
                />
              </div>
            ) : null}
          </div>

          <label className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-gray-600 px-4 py-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) => patchForm({ isActive: event.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
            />
            <span className="text-sm">
              <span className="font-medium text-gray-900 dark:text-white">حساب فعال</span>
              <span className="block text-xs text-gray-500 mt-0.5">حساب غیرفعال نمی‌تواند وارد پنل شود</span>
            </span>
          </label>

          <button
            type="button"
            disabled={saving || !canSubmit}
            onClick={save}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            ذخیره تغییرات
          </button>
        </AdminCard>

        <AdminCard hover={false} className="space-y-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">منوی قابل‌مشاهده</h2>
            <p className="mt-1 text-xs text-gray-500">
              همین آیتم‌ها در ساید این ادمین دیده می‌شود. پیش‌نمایش بر اساس فرم فعلی است و بعد از ذخیره اعمال می‌شود.
            </p>
          </div>
          {menu.length === 0 ? (
            <EmptyLine>با این دسترسی هیچ آیتمی در منو دیده نمی‌شود.</EmptyLine>
          ) : (
            <div className="space-y-4">
              {menu.map((group) => (
                <section key={group.id}>
                  <h3 className="text-xs font-medium text-gray-500 mb-2">{group.label}</h3>
                  <ul className="flex flex-wrap gap-2">
                    {group.links.map((link) => (
                      <li
                        key={link.href}
                        className="rounded-lg bg-gray-100 dark:bg-gray-700/60 px-2.5 py-1 text-sm text-gray-800 dark:text-gray-100"
                      >
                        {link.label}
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </AdminCard>
      </div>

      <AdminCard hover={false}>
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">تاریخچه ورود</h2>
        <p className="mt-1 text-xs text-gray-500">۲۰ ورود آخر، موفق و ناموفق</p>
        {logins.length === 0 ? (
          <EmptyLine>هنوز ورودی برای این ادمین ثبت نشده.</EmptyLine>
        ) : (
          <ul className="mt-3 divide-y divide-gray-100 dark:divide-gray-700">
            {logins.map((row) => (
              <li key={row.id} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:gap-4">
                <span
                  className={`inline-flex w-fit rounded-md px-2 py-0.5 text-xs font-medium ${
                    row.success
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
                  }`}
                >
                  {row.success ? 'موفق' : 'ناموفق'}
                </span>
                <time className="text-sm text-gray-800 dark:text-gray-100" dateTime={row.createdAt}>
                  {formatExact(row.createdAt)}
                </time>
                <span className="text-xs text-gray-500">{formatRelativeTime(row.createdAt)}</span>
                <span className="font-mono text-xs text-gray-600 dark:text-gray-300 sm:ms-auto" dir="ltr">
                  {row.ipAddress || '—'}
                </span>
                <span className="text-xs text-gray-500">{parseUserAgentShort(row.userAgent) || '—'}</span>
              </li>
            ))}
          </ul>
        )}
      </AdminCard>

      <AdminCard hover={false}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">عملیات</h2>
            <p className="mt-1 text-xs text-gray-500">۲۰ عمل آخر از لاگ تغییرات</p>
          </div>
          <Link
            href={`/admin/audit?actorQuery=${encodeURIComponent(account.id)}`}
            className="inline-flex min-h-11 items-center text-sm text-violet-700 hover:text-violet-900 dark:text-violet-300"
          >
            مشاهده همه در لاگ
          </Link>
        </div>
        {operations.length === 0 ? (
          <EmptyLine>هنوز عملیاتی برای این ادمین ثبت نشده.</EmptyLine>
        ) : (
          <ul className="mt-3 divide-y divide-gray-100 dark:divide-gray-700">
            {operations.map((row) => (
              <li key={row.id} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:gap-3">
                <span className="text-sm font-medium text-gray-900 dark:text-white">{row.actionLabel}</span>
                <span className="text-xs text-gray-500">
                  {row.entityTypeLabel}
                  {row.entityName ? ` · ${row.entityName}` : ''}
                </span>
                <time className="text-xs text-gray-500 sm:ms-auto" dateTime={row.createdAt}>
                  {formatExact(row.createdAt)}
                </time>
              </li>
            ))}
          </ul>
        )}
      </AdminCard>
    </div>
  );
}
