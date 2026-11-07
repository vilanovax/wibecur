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
  Monitor,
  Shield,
  ShieldAlert,
  SlidersHorizontal,
} from 'lucide-react';
import UserAvatar from '@/components/shared/UserAvatar';
import { AdminCard } from '@/components/admin/design-system';
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
import {
  authEmailToPhone,
  formatIranPhoneDisplay,
  isPhoneAuthEmail,
} from '@/lib/phone-auth';
import { faNumber } from '@/lib/utils';

type DossierPayload = AdminDossier & {
  roleTemplates: AdminRoleTemplate[];
  permissionGroups: PermissionGroup[];
};

const INPUT =
  'mt-2 w-full rounded-xl border border-(--color-border) bg-(--color-surface) px-3 py-2.5 text-sm text-(--color-text) placeholder:text-wibe-secondary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30';

const ROLE_BADGE: Record<AdminRole, string> = {
  SUPER_ADMIN: 'bg-purple-50 text-purple-800',
  ADMIN: 'bg-violet-50 text-violet-800',
  EDITOR: 'bg-blue-50 text-blue-800',
  MODERATOR: 'bg-amber-50 text-amber-800',
  ANALYST: 'bg-sky-50 text-sky-800',
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

function accountContact(email: string): string {
  if (isPhoneAuthEmail(email)) {
    const phone = authEmailToPhone(email);
    return phone ? formatIranPhoneDisplay(phone) : email;
  }
  return email;
}

function EmptyLine({ children }: { children: string }) {
  return (
    <p className="py-8 text-center text-sm text-wibe-secondary">{children}</p>
  );
}

function StatCell({
  icon: Icon,
  label,
  value,
  hint,
  tone = 'default',
}: {
  icon: typeof ClipboardList;
  label: string;
  value: string;
  hint?: string;
  tone?: 'default' | 'danger';
}) {
  return (
    <div className="flex min-w-0 items-start gap-3 rounded-xl border border-(--color-border) bg-(--color-surface) px-3 py-3">
      <div
        className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${
          tone === 'danger' ? 'bg-red-50 text-red-700' : 'bg-primary/10 text-primary'
        }`}
      >
        <Icon className="size-4" strokeWidth={1.5} />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-wibe-secondary">{label}</p>
        <p className="mt-1 truncate text-lg font-bold leading-snug tabular-nums text-(--color-text)">
          {value}
        </p>
        {hint ? (
          <p className="mt-1 truncate text-sm text-wibe-secondary">{hint}</p>
        ) : null}
      </div>
    </div>
  );
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
  const [activityTab, setActivityTab] = useState<'logins' | 'ops'>('logins');

  const load = useCallback(
    async (silent = false) => {
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
    },
    [adminId]
  );

  useEffect(() => {
    if (canManage) load();
    else setLoading(false);
  }, [canManage, load]);

  const assignableRoles = useMemo(
    () =>
      roleTemplates.filter(
        (template) => actorRole === 'SUPER_ADMIN' || template.role !== 'SUPER_ADMIN'
      ),
    [roleTemplates, actorRole]
  );

  const draftPermissions = useMemo(() => {
    if (!form || !dossier) return [];
    if (form.useCustomPermissions) return form.adminPermissions;
    return (
      roleTemplates.find((template) => template.role === form.role)?.permissions ??
      dossier.account.effectivePermissions
    );
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
      <div
        className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900"
        dir="rtl"
      >
        دسترسی «مدیریت نقش‌ها» برای پرونده ادمین لازم است.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center" dir="rtl">
        <Loader2 className="size-8 animate-spin text-primary" strokeWidth={1.5} />
      </div>
    );
  }

  if (missing || !dossier || !form) {
    return (
      <div className="space-y-4" dir="rtl">
        <Link
          href="/admin/users?tab=admins"
          className="inline-flex min-h-11 items-center gap-1 text-sm text-wibe-secondary"
        >
          <ArrowRight className="size-4" strokeWidth={1.5} />
          بازگشت به ادمین‌ها
        </Link>
        <p className="text-sm text-(--color-text)">{error || 'ادمین یافت نشد'}</p>
      </div>
    );
  }

  const { account, performance, logins, operations } = dossier;
  const canSubmit = !form.useCustomPermissions || form.adminPermissions.length > 0;
  const selectedTemplate = roleTemplates.find((template) => template.role === form.role);
  const contact = accountContact(account.email);
  const contactIsPhone = isPhoneAuthEmail(account.email);

  return (
    <div className="space-y-4" dir="rtl">
      <Link
        href="/admin/users?tab=admins"
        className="inline-flex min-h-11 items-center gap-1 text-sm text-wibe-secondary hover:text-(--color-text)"
      >
        <ArrowRight className="size-4" strokeWidth={1.5} />
        بازگشت به ادمین‌ها
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-(--color-border) bg-(--color-surface) p-4">
        <div className="flex min-w-0 items-start gap-3">
          <UserAvatar src={null} name={account.name} email={account.email} size={48} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-2xl font-bold leading-snug text-(--color-text)">
                {account.name || 'بدون نام'}
              </h1>
              <span
                className={`inline-flex rounded-md px-2 py-0.5 text-sm font-medium ${ROLE_BADGE[account.role]}`}
              >
                {account.roleLabel}
              </span>
              <span
                className={`inline-flex rounded-md px-2 py-0.5 text-sm font-medium ${
                  account.isActive
                    ? 'bg-emerald-50 text-emerald-800'
                    : 'bg-red-50 text-red-800'
                }`}
              >
                {account.isActive ? 'فعال' : 'غیرفعال'}
              </span>
            </div>
            <p
              className="mt-1 truncate text-sm text-wibe-secondary"
              dir={contactIsPhone ? 'ltr' : undefined}
            >
              {contact}
            </p>
          </div>
        </div>
        <button
          type="button"
          disabled={saving || !canSubmit}
          onClick={save}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {saving ? <Loader2 className="size-4 animate-spin" strokeWidth={1.5} /> : null}
          ذخیره تغییرات
        </button>
      </header>

      {message ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {message}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
        <StatCell
          icon={ClipboardList}
          label="عملیات ۳۰ روز"
          value={faNumber(performance.operationCount)}
        />
        <StatCell
          icon={LogIn}
          label="ورود موفق"
          value={faNumber(performance.loginSuccess)}
          hint={
            performance.lastLoginAt
              ? formatRelativeTime(performance.lastLoginAt)
              : 'هنوز ورودی نیست'
          }
        />
        <StatCell
          icon={ShieldAlert}
          label="ورود ناموفق"
          value={faNumber(performance.loginFailure)}
          tone={performance.loginFailure > 0 ? 'danger' : 'default'}
        />
        <StatCell
          icon={Clock}
          label="آخرین عملیات"
          value={
            performance.lastActivityAt
              ? formatRelativeTime(performance.lastActivityAt)
              : 'هنوز عملیاتی نیست'
          }
        />
      </div>

      {performance.byAction.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {performance.byAction.slice(0, 8).map((row) => (
            <span
              key={row.action}
              className="inline-flex min-h-8 items-center gap-2 rounded-lg bg-(--color-bg) px-3 text-sm text-(--color-text)"
            >
              {row.label}
              <span className="font-semibold tabular-nums text-wibe-secondary">
                {faNumber(row.count)}
              </span>
            </span>
          ))}
        </div>
      ) : null}

      <AdminCard hover={false} className="space-y-6" padding="default">
        <div className="flex items-center gap-2">
          <KeyRound className="size-4 text-primary" strokeWidth={1.5} />
          <h2 className="text-base font-semibold leading-snug text-(--color-text)">
            حساب، نقش و دسترسی
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-(--color-text)">نام نمایشی</span>
            <input
              value={form.name}
              onChange={(event) => patchForm({ name: event.target.value })}
              className={INPUT}
              autoComplete="name"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-(--color-text)">رمز جدید</span>
            <input
              type="password"
              value={form.password}
              onChange={(event) => patchForm({ password: event.target.value })}
              placeholder="خالی بماند، رمز عوض نمی‌شود"
              className={INPUT}
              autoComplete="new-password"
              dir="ltr"
            />
          </label>
        </div>

        <label className="block">
          <span className="text-sm font-medium text-(--color-text)">توضیحات</span>
          <textarea
            value={form.adminNote}
            onChange={(event) => patchForm({ adminNote: event.target.value })}
            rows={2}
            maxLength={500}
            placeholder="مثلاً مسئول کامنت‌های شب"
            className={INPUT}
          />
          <p className="mt-1 text-sm text-wibe-secondary">
            فقط در پنل دیده می‌شود · {faNumber(form.adminNote.length)} از {faNumber(500)}
          </p>
        </label>

        <div className="space-y-3 border-t border-(--color-border) pt-4">
          <div className="flex items-center gap-2 text-sm font-medium text-(--color-text)">
            <Shield className="size-4 text-primary" strokeWidth={1.5} />
            نقش و سطح دسترسی
          </div>
          <RoleTemplatePicker
            templates={assignableRoles}
            value={form.role}
            onChange={applyRole}
          />
          <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border border-dashed border-(--color-border) p-3">
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
              className="mt-1 size-4 rounded border-(--color-border) text-primary focus:ring-primary/30"
            />
            <span>
              <span className="block text-sm font-medium text-(--color-text)">
                دسترسی سفارشی
              </span>
              <span className="mt-1 block text-sm text-wibe-secondary">
                به‌جای قالب نقش، دسترسی هر بخش را خودتان انتخاب کنید
              </span>
            </span>
          </label>
          {form.useCustomPermissions ? (
            <div className="space-y-2">
              <p className="flex items-center gap-1 text-sm text-wibe-secondary">
                <SlidersHorizontal className="size-4" strokeWidth={1.5} />
                {faNumber(form.adminPermissions.length)} دسترسی انتخاب‌شده
              </p>
              <PermissionPicker
                groups={permissionGroups}
                selected={form.adminPermissions}
                onChange={(adminPermissions) => patchForm({ adminPermissions })}
              />
            </div>
          ) : null}
        </div>

        <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-(--color-border) px-4 py-3">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(event) => patchForm({ isActive: event.target.checked })}
            className="size-4 rounded border-(--color-border) text-primary focus:ring-primary/30"
          />
          <span className="text-sm">
            <span className="font-medium text-(--color-text)">حساب فعال</span>
            <span className="mt-1 block text-sm text-wibe-secondary">
              حساب غیرفعال نمی‌تواند وارد پنل شود
            </span>
          </span>
        </label>

        <div className="space-y-3 border-t border-(--color-border) pt-4">
          <div>
            <h3 className="text-sm font-semibold text-(--color-text)">منوی قابل‌مشاهده</h3>
            <p className="mt-1 text-sm text-wibe-secondary">
              پیش‌نمایش بر اساس فرم فعلی؛ بعد از ذخیره در ساید اعمال می‌شود.
            </p>
          </div>
          {menu.length === 0 ? (
            <EmptyLine>با این دسترسی هیچ آیتمی در منو دیده نمی‌شود.</EmptyLine>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {menu.map((group) => (
                <section
                  key={group.id}
                  className="rounded-xl border border-(--color-border) bg-(--color-bg) p-3"
                >
                  <h4 className="mb-2 text-sm font-medium text-wibe-secondary">
                    {group.label}
                  </h4>
                  <ul className="flex flex-wrap gap-2">
                    {group.links.map((link) => (
                      <li
                        key={link.href}
                        className="rounded-lg border border-(--color-border) bg-(--color-surface) px-2 py-1 text-sm text-(--color-text)"
                      >
                        {link.label}
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-(--color-border) pt-4">
          <button
            type="button"
            disabled={saving || !canSubmit}
            onClick={save}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {saving ? <Loader2 className="size-4 animate-spin" strokeWidth={1.5} /> : null}
            ذخیره تغییرات
          </button>
        </div>
      </AdminCard>

      <AdminCard hover={false} padding="default">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div
            role="tablist"
            aria-label="فعالیت ادمین"
            className="flex gap-2 overflow-x-auto"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activityTab === 'logins'}
              onClick={() => setActivityTab('logins')}
              className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-4 text-sm font-medium ${
                activityTab === 'logins'
                  ? 'bg-primary text-white'
                  : 'border border-(--color-border) text-wibe-secondary hover:bg-(--color-bg) hover:text-(--color-text)'
              }`}
            >
              <Monitor className="size-4" strokeWidth={activityTab === 'logins' ? 2 : 1.5} />
              تاریخچه ورود
              <span className="tabular-nums opacity-80">{faNumber(logins.length)}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activityTab === 'ops'}
              onClick={() => setActivityTab('ops')}
              className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-4 text-sm font-medium ${
                activityTab === 'ops'
                  ? 'bg-primary text-white'
                  : 'border border-(--color-border) text-wibe-secondary hover:bg-(--color-bg) hover:text-(--color-text)'
              }`}
            >
              <ClipboardList className="size-4" strokeWidth={activityTab === 'ops' ? 2 : 1.5} />
              عملیات
              <span className="tabular-nums opacity-80">{faNumber(operations.length)}</span>
            </button>
          </div>
          {activityTab === 'ops' ? (
            <Link
              href={`/admin/audit?actorQuery=${encodeURIComponent(account.id)}`}
              className="inline-flex min-h-11 items-center text-sm text-primary hover:underline"
            >
              مشاهده همه در لاگ
            </Link>
          ) : null}
        </div>

        {activityTab === 'logins' ? (
          logins.length === 0 ? (
            <EmptyLine>هنوز ورودی برای این ادمین ثبت نشده.</EmptyLine>
          ) : (
            <>
              <p className="mt-3 text-sm text-wibe-secondary">
                ۲۰ ورود آخر، موفق و ناموفق
              </p>
              <ul className="mt-2 divide-y divide-(--color-border)">
                {logins.map((row) => (
                  <li
                    key={row.id}
                    className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:gap-4"
                  >
                    <span
                      className={`inline-flex w-fit rounded-md px-2 py-0.5 text-sm font-medium ${
                        row.success
                          ? 'bg-emerald-50 text-emerald-800'
                          : 'bg-red-50 text-red-800'
                      }`}
                    >
                      {row.success ? 'موفق' : 'ناموفق'}
                    </span>
                    <div className="min-w-0 flex-1">
                      <time
                        className="block text-sm text-(--color-text)"
                        dateTime={row.createdAt}
                      >
                        {formatExact(row.createdAt)}
                      </time>
                      <p className="mt-1 text-sm text-wibe-secondary">
                        {formatRelativeTime(row.createdAt)}
                      </p>
                    </div>
                    <span
                      className="font-mono text-sm text-wibe-secondary sm:text-end"
                      dir="ltr"
                    >
                      {row.ipAddress || '—'}
                    </span>
                    <span className="text-sm text-wibe-secondary sm:max-w-56 sm:truncate">
                      {parseUserAgentShort(row.userAgent) || '—'}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )
        ) : operations.length === 0 ? (
          <EmptyLine>هنوز عملیاتی برای این ادمین ثبت نشده.</EmptyLine>
        ) : (
          <>
            <p className="mt-3 text-sm text-wibe-secondary">۲۰ عمل آخر از لاگ تغییرات</p>
            <ul className="mt-2 divide-y divide-(--color-border)">
              {operations.map((row) => (
                <li
                  key={row.id}
                  className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:gap-3"
                >
                  <span className="text-sm font-medium text-(--color-text)">
                    {row.actionLabel}
                  </span>
                  <span className="text-sm text-wibe-secondary">
                    {row.entityTypeLabel}
                    {row.entityName ? ` · ${row.entityName}` : ''}
                  </span>
                  <time
                    className="text-sm text-wibe-secondary sm:ms-auto"
                    dateTime={row.createdAt}
                  >
                    {formatExact(row.createdAt)}
                  </time>
                </li>
              ))}
            </ul>
          </>
        )}
      </AdminCard>
    </div>
  );
}
