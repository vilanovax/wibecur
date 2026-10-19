'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { faIR } from 'date-fns/locale';
import {
  Loader2,
  Plus,
  Shield,
  Power,
  Pencil,
  Users,
  UserCheck,
  SlidersHorizontal,
} from 'lucide-react';
import UserAvatar from '@/components/shared/UserAvatar';
import type { AdminAccountRow } from '@/lib/admin/admins-data';
import type { AdminRoleTemplate } from '@/lib/auth/role-templates';
import type { PermissionGroup } from '@/lib/auth/permission-groups';
import type { AdminRole } from '@/lib/auth/roles';
import { ADMIN_ROLE_TEMPLATES } from '@/lib/auth/role-templates';
import { PERMISSION_GROUPS } from '@/lib/auth/permission-groups';
import type { Permission } from '@/lib/auth/permissions';
import AdminFormModal, { type AdminFormState } from './AdminFormModal';
import { usePermissions } from '@/hooks/usePermissions';

type AdminsPayload = {
  admins: AdminAccountRow[];
  roleTemplates: AdminRoleTemplate[];
  permissionGroups: PermissionGroup[];
};

type FormMode = 'create' | 'edit' | null;

const EMPTY_FORM: AdminFormState = {
  name: '',
  email: '',
  password: '',
  role: 'EDITOR',
  useCustomPermissions: false,
  adminPermissions: [],
  isActive: true,
};

const ROLE_BADGE: Record<AdminRole, string> = {
  SUPER_ADMIN: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200',
  ADMIN: 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200',
  EDITOR: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200',
  MODERATOR: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
  ANALYST: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200',
};

function StatChip({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 min-w-[140px]">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50 dark:bg-violet-900/30">
        <Icon className="h-4 w-4 text-violet-600" />
      </div>
      <div>
        <p className="text-lg font-bold tabular-nums text-[var(--color-text)] dark:text-white leading-none">
          {value.toLocaleString('fa-IR')}
        </p>
        <p className="text-xs text-[var(--color-text-muted)] dark:text-[var(--color-text-subtle)] mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function AdminRowCard({
  admin,
  saving,
  onEdit,
  onToggleActive,
}: {
  admin: AdminAccountRow;
  saving: boolean;
  onEdit: () => void;
  onToggleActive: () => void;
}) {
  const hasCustom = admin.adminPermissions.length > 0;
  const permCount = hasCustom
    ? admin.adminPermissions.length
    : admin.effectivePermissions.length;

  return (
    <article className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 hover:bg-gray-50/60 dark:hover:bg-gray-900/20 transition-colors">
      <div className="flex items-start gap-3 min-w-0 flex-1">
        <UserAvatar src={null} name={admin.name} email={admin.email} size={44} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-[var(--color-text)] dark:text-white truncate">
              {admin.name || 'بدون نام'}
            </h3>
            <span
              className={`inline-flex px-2 py-0.5 rounded-md text-[11px] font-medium ${ROLE_BADGE[admin.role]}`}
            >
              {admin.roleLabel}
            </span>
            <span
              className={`inline-flex px-2 py-0.5 rounded-md text-[11px] font-medium ${
                admin.isActive
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200'
                  : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
              }`}
            >
              {admin.isActive ? 'فعال' : 'غیرفعال'}
            </span>
          </div>
          <p className="text-xs text-[var(--color-text-muted)] font-mono truncate mt-0.5" dir="ltr">
            {admin.email}
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 dark:bg-gray-700/60 px-2 py-0.5 text-[11px] text-[var(--color-text-muted)] dark:text-[var(--color-text-subtle)]">
              {hasCustom ? (
                <>
                  <SlidersHorizontal className="h-3 w-3" />
                  {permCount.toLocaleString('fa-IR')} دسترسی سفارشی
                </>
              ) : (
                <>
                  <Shield className="h-3 w-3" />
                  {permCount.toLocaleString('fa-IR')} دسترسی (قالب)
                </>
              )}
            </span>
            <span className="text-[11px] text-[var(--color-text-subtle)]">
              {formatDistanceToNow(new Date(admin.updatedAt), { addSuffix: true, locale: faIR })}
            </span>
          </div>
        </div>
      </div>

      <div className="flex shrink-0 gap-2 sm:mr-auto">
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 dark:border-gray-600 px-3 py-2 text-xs font-medium hover:bg-white dark:hover:bg-gray-700 transition-colors"
        >
          <Pencil className="h-3.5 w-3.5" />
          ویرایش
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={onToggleActive}
          className={[
            'inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-colors disabled:opacity-50',
            admin.isActive
              ? 'border-red-200 text-red-700 hover:bg-red-50 dark:border-red-800/50 dark:text-red-300 dark:hover:bg-red-950/30'
              : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800/50 dark:text-emerald-300 dark:hover:bg-emerald-950/30',
          ].join(' ')}
        >
          <Power className="h-3.5 w-3.5" />
          {admin.isActive ? 'غیرفعال' : 'فعال'}
        </button>
      </div>
    </article>
  );
}

export default function AdminsPageClient() {
  const { can, role: actorRole } = usePermissions();
  const canManage = can('manage_roles');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [admins, setAdmins] = useState<AdminAccountRow[]>([]);
  const [roleTemplates, setRoleTemplates] = useState<AdminRoleTemplate[]>(ADMIN_ROLE_TEMPLATES);
  const [permissionGroups, setPermissionGroups] = useState<PermissionGroup[]>(PERMISSION_GROUPS);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<FormMode>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AdminFormState>(EMPTY_FORM);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/admins');
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'خطا در بارگذاری');
      const data = json.data as AdminsPayload;
      setAdmins(data.admins);
      setRoleTemplates(data.roleTemplates ?? ADMIN_ROLE_TEMPLATES);
      setPermissionGroups(data.permissionGroups ?? PERMISSION_GROUPS);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'خطا');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (canManage) load();
  }, [canManage, load]);

  const stats = useMemo(
    () => ({
      total: admins.length,
      active: admins.filter((a) => a.isActive).length,
      custom: admins.filter((a) => a.adminPermissions.length > 0).length,
    }),
    [admins]
  );

  const assignableRoles = useMemo(() => {
    return roleTemplates.filter((t) => actorRole === 'SUPER_ADMIN' || t.role !== 'SUPER_ADMIN');
  }, [roleTemplates, actorRole]);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setFormMode('create');
    setMessage(null);
    setError(null);
  };

  const openEdit = (admin: AdminAccountRow) => {
    setForm({
      name: admin.name ?? '',
      email: admin.email,
      password: '',
      role: admin.role,
      useCustomPermissions: admin.adminPermissions.length > 0,
      adminPermissions: admin.adminPermissions,
      isActive: admin.isActive,
    });
    setEditingId(admin.id);
    setFormMode('edit');
    setMessage(null);
    setError(null);
  };

  const applyRoleTemplate = (role: AdminRole) => {
    const template = roleTemplates.find((t) => t.role === role);
    setForm((f) => ({
      ...f,
      role,
      useCustomPermissions: false,
      adminPermissions: template ? [...template.permissions] : f.adminPermissions,
    }));
  };

  const patchForm = (patch: Partial<AdminFormState>) => {
    setForm((f) => ({ ...f, ...patch }));
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const payload = {
        name: form.name,
        email: form.email,
        role: form.role,
        useCustomPermissions: form.useCustomPermissions,
        adminPermissions: form.useCustomPermissions ? form.adminPermissions : [],
        ...(formMode === 'create' ? { password: form.password } : {}),
        ...(formMode === 'edit'
          ? { isActive: form.isActive, ...(form.password ? { password: form.password } : {}) }
          : {}),
      };

      const url = formMode === 'create' ? '/api/admin/admins' : `/api/admin/admins/${editingId}`;
      const method = formMode === 'create' ? 'POST' : 'PATCH';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'خطا');

      setMessage(json.message || 'ذخیره شد');
      setFormMode(null);
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'خطا');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (admin: AdminAccountRow) => {
    if (
      !window.confirm(
        admin.isActive ? `غیرفعال کردن ${admin.name || admin.email}؟` : `فعال کردن ${admin.name || admin.email}؟`
      )
    )
      return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/admins/${admin.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !admin.isActive }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'خطا');
      setMessage(json.message || 'وضعیت به‌روز شد');
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'خطا');
    } finally {
      setSaving(false);
    }
  };

  if (!canManage) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900" dir="rtl">
        دسترسی «مدیریت نقش‌ها» برای این بخش لازم است.
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-violet-600" />
            <h1 className="text-2xl font-bold text-[var(--color-text)] dark:text-white">مدیریت ادمین‌ها</h1>
          </div>
          <p className="mt-1 text-sm text-[var(--color-text-muted)] dark:text-[var(--color-text-subtle)] max-w-xl">
            تعریف ادمین، انتخاب نقش، تنظیم دسترسی بخش‌ها و فعال یا غیرفعال‌سازی حساب
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-violet-700 shadow-sm transition-colors"
        >
          <Plus className="h-4 w-4" />
          ادمین جدید
        </button>
      </div>

      {!loading && admins.length > 0 ? (
        <div className="flex flex-wrap gap-3">
          <StatChip icon={Users} label="کل ادمین‌ها" value={stats.total} />
          <StatChip icon={UserCheck} label="فعال" value={stats.active} />
          <StatChip icon={SlidersHorizontal} label="دسترسی سفارشی" value={stats.custom} />
        </div>
      ) : null}

      {message ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {message}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
      ) : null}

      <div className="rounded-2xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
          </div>
        ) : admins.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 dark:bg-violet-900/30 mb-4">
              <Shield className="h-7 w-7 text-violet-600" />
            </div>
            <p className="text-sm font-medium text-[var(--color-text)] dark:text-white">هنوز ادمینی تعریف نشده</p>
            <p className="text-xs text-[var(--color-text-muted)] dark:text-[var(--color-text-subtle)] mt-1 max-w-xs">
              اولین ادمین را بسازید و نقش و دسترسی‌هایش را مشخص کنید
            </p>
            <button
              type="button"
              onClick={openCreate}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-violet-700"
            >
              <Plus className="h-4 w-4" />
              ادمین جدید
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {admins.map((admin) => (
              <AdminRowCard
                key={admin.id}
                admin={admin}
                saving={saving}
                onEdit={() => openEdit(admin)}
                onToggleActive={() => toggleActive(admin)}
              />
            ))}
          </div>
        )}
      </div>

      {formMode ? (
        <AdminFormModal
          mode={formMode}
          form={form}
          saving={saving}
          assignableRoles={assignableRoles}
          permissionGroups={permissionGroups}
          roleTemplates={roleTemplates}
          onClose={() => !saving && setFormMode(null)}
          onSubmit={handleSubmit}
          onChange={patchForm}
          onRoleChange={applyRoleTemplate}
        />
      ) : null}
    </div>
  );
}
