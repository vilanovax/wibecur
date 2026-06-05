'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { User, KeyRound, ExternalLink, Eye, EyeOff } from 'lucide-react';
import SettingsSectionCard from './SettingsSectionCard';
import SettingsSaveButton from './SettingsSaveButton';
import UserAvatar from '@/components/shared/UserAvatar';
import Toast, { type ToastType } from '@/components/shared/Toast';

function PasswordField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <label className="text-sm font-medium text-[var(--color-text)] mb-1.5 block">
        {label}
      </label>
      <div className="relative">
        <input
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full pl-10 pr-3 py-2 text-sm rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] focus:ring-2 focus:ring-[var(--primary)]/30"
          placeholder={placeholder}
          autoComplete="off"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute left-2 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-[var(--color-border-muted)]"
        >
          {visible ? (
            <EyeOff className="w-4 h-4 text-[var(--color-text-muted)]" />
          ) : (
            <Eye className="w-4 h-4 text-[var(--color-text-muted)]" />
          )}
        </button>
      </div>
    </div>
  );
}

export default function AccountSettingsPanel() {
  const { data: session } = useSession();
  const user = session?.user;
  const name = user?.name || 'مدیر';
  const email = user?.email || '—';

  const [hasPassword, setHasPassword] = useState<boolean | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: ToastType; text: string } | null>(
    null
  );

  useEffect(() => {
    fetch('/api/admin/settings/password')
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setHasPassword(json.hasPassword);
        else setHasPassword(false);
      })
      .catch(() => setHasPassword(false));
  }, []);

  const handleChangePassword = useCallback(async () => {
    setSaving(true);
    setToast(null);
    try {
      const res = await fetch('/api/admin/settings/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'خطا در تغییر رمز');
      }
      setToast({ type: 'success', text: json.message || 'رمز تغییر کرد' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (e: unknown) {
      setToast({
        type: 'error',
        text: e instanceof Error ? e.message : 'خطا',
      });
    } finally {
      setSaving(false);
    }
  }, [currentPassword, newPassword, confirmPassword]);

  return (
    <div className="space-y-4">
      {toast && (
        <Toast
          message={toast.text}
          type={toast.type}
          duration={3500}
          onClose={() => setToast(null)}
        />
      )}

      <SettingsSectionCard
        title="پروفایل ادمین"
        description="اطلاعات حساب فعلی در پنل"
        icon={<User className="w-5 h-5 text-[var(--primary)]" />}
      >
        <div className="flex items-center gap-3">
          <UserAvatar
            src={user?.image ?? null}
            name={user?.name ?? null}
            email={email}
            size={48}
          />
          <div className="min-w-0">
            <p className="font-semibold text-[var(--color-text)]">{name}</p>
            <p className="text-sm text-[var(--color-text-muted)] truncate">
              {email}
            </p>
            {user?.role && (
              <p className="text-xs text-[var(--color-text-subtle)] mt-0.5">
                نقش: {user.role}
              </p>
            )}
          </div>
        </div>
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--primary)] font-medium hover:underline"
        >
          مدیریت کاربران
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </SettingsSectionCard>

      <SettingsSectionCard
        title="رمز عبور"
        description="تغییر رمز ورود به پنل (همان رمز صفحه login)"
        icon={<KeyRound className="w-5 h-5 text-amber-600" />}
        footer={
          hasPassword ? (
            <SettingsSaveButton
              onClick={handleChangePassword}
              loading={saving}
              label="تغییر رمز"
              loadingLabel="در حال ذخیره…"
            />
          ) : undefined
        }
      >
        {hasPassword === null ? (
          <p className="text-sm text-[var(--color-text-muted)] animate-pulse">
            در حال بررسی…
          </p>
        ) : hasPassword === false ? (
          <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
            برای این حساب رمز در سیستم ثبت نشده است. با مدیر اصلی تماس بگیرید یا از
            صفحه ورود برای تنظیم اولیه استفاده کنید.
          </p>
        ) : (
          <div className="space-y-3 max-w-md">
            <PasswordField
              label="رمز فعلی"
              value={currentPassword}
              onChange={setCurrentPassword}
            />
            <PasswordField
              label="رمز جدید"
              value={newPassword}
              onChange={setNewPassword}
              placeholder="حداقل ۶ کاراکتر"
            />
            <PasswordField
              label="تکرار رمز جدید"
              value={confirmPassword}
              onChange={setConfirmPassword}
            />
            <p className="text-[11px] text-[var(--color-text-subtle)]">
              پس از تغییر، با رمز جدید وارد شوید.
            </p>
          </div>
        )}
      </SettingsSectionCard>
    </div>
  );
}
