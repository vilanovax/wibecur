'use client';

import { Key, Database, Loader2 } from 'lucide-react';
import type { SettingsData } from '@/lib/admin/settings-types';
import SettingsSectionCard from './SettingsSectionCard';
import SecretInput from './SecretInput';
import SettingsSaveButton from './SettingsSaveButton';

export type IntegrationFormState = {
  openaiApiKey: string;
  tmdbApiKey: string;
  omdbApiKey: string;
  googleApiKey: string;
  googleSearchEngineId: string;
  liaraBucketName: string;
  liaraEndpoint: string;
  liaraAccessKey: string;
  liaraSecretKey: string;
};

type Props = {
  settings: SettingsData;
  form: IntegrationFormState;
  onFormChange: (patch: Partial<IntegrationFormState>) => void;
  testing: string | null;
  saving: boolean;
  onSave: () => void;
  onTestOpenai: () => void;
  onTestTmdb: () => void;
  onTestOmdb: () => void;
  onTestGoogle: () => void;
  onTestLiara: () => void;
};

function TestBtn({
  id,
  testing,
  current,
  onClick,
  disabled,
}: {
  id: string;
  testing: string | null;
  current: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={testing === id || disabled || !current.trim()}
      className="px-3 py-2 rounded-xl border border-[var(--color-border)] text-sm text-[var(--color-text)] hover:bg-[var(--color-bg)] disabled:opacity-50 shrink-0"
    >
      {testing === id ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        'تست'
      )}
    </button>
  );
}

export default function IntegrationsSettingsPanel({
  settings,
  form,
  onFormChange,
  testing,
  saving,
  onSave,
  onTestOpenai,
  onTestTmdb,
  onTestOmdb,
  onTestGoogle,
  onTestLiara,
}: Props) {
  const canTestOpenai = !!(form.openaiApiKey.trim() || settings.openaiApiKey);
  const canTestTmdb = !!(form.tmdbApiKey.trim() || settings.tmdbApiKey);
  const canTestOmdb = !!(form.omdbApiKey.trim() || settings.omdbApiKey);
  const canTestGoogle =
    !!(form.googleApiKey.trim() || settings.googleApiKey) &&
    !!(form.googleSearchEngineId.trim() || settings.googleSearchEngineId);
  const canTestLiara =
    !!(form.liaraEndpoint.trim() || settings.liaraEndpoint) &&
    !!(form.liaraBucketName.trim() || settings.liaraBucketName) &&
    !!(form.liaraAccessKey.trim() || settings.liaraAccessKey) &&
    !!(form.liaraSecretKey.trim() || settings.liaraSecretKey);

  return (
    <div className="space-y-4">
      <SettingsSectionCard
        title="کلیدهای API"
        description="هوش مصنوعی، متادیتای فیلم و جستجوی تصویر"
        icon={<Key className="w-5 h-5 text-[var(--primary)]" />}
      >
        <SecretInput
          label="OpenAI"
          value={form.openaiApiKey || ''}
          onChange={(v) => onFormChange({ openaiApiKey: v })}
          configured={!!settings.openaiApiKey}
          hint="تولید توضیحات با هوش مصنوعی"
          placeholder="sk-..."
          testButton={
            <TestBtn
              id="openai"
              testing={testing}
              current={canTestOpenai ? '1' : ''}
              onClick={onTestOpenai}
              disabled={!canTestOpenai}
            />
          }
        />
        <SecretInput
          label="TMDb"
          value={form.tmdbApiKey || ''}
          onChange={(v) => onFormChange({ tmdbApiKey: v })}
          configured={!!settings.tmdbApiKey}
          hint="تصاویر و اطلاعات فیلم/سریال"
          testButton={
            <TestBtn
              id="tmdb"
              testing={testing}
              current={canTestTmdb ? '1' : ''}
              onClick={onTestTmdb}
              disabled={!canTestTmdb}
            />
          }
        />
        <SecretInput
          label="OMDb"
          value={form.omdbApiKey || ''}
          onChange={(v) => onFormChange({ omdbApiKey: v })}
          configured={!!settings.omdbApiKey}
          hint="امتیاز IMDb"
          testButton={
            <TestBtn
              id="omdb"
              testing={testing}
              current={canTestOmdb ? '1' : ''}
              onClick={onTestOmdb}
              disabled={!canTestOmdb}
            />
          }
        />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-1 border-t border-[var(--color-border-muted)]">
          <SecretInput
            label="Google Custom Search API"
            value={form.googleApiKey || ''}
            onChange={(v) => onFormChange({ googleApiKey: v })}
            configured={!!settings.googleApiKey}
            hint="جستجوی تصویر در گوگل"
          />
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <label className="text-sm font-medium text-[var(--color-text)]">
                Google Search Engine ID
              </label>
              {(form.googleSearchEngineId.trim() ||
                settings.googleSearchEngineId) && (
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                  تنظیم شده
                </span>
              )}
            </div>
            <input
              type="text"
              value={form.googleSearchEngineId || ''}
              onChange={(e) =>
                onFormChange({ googleSearchEngineId: e.target.value })
              }
              className="w-full px-3 py-2 text-sm rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] focus:ring-2 focus:ring-[var(--primary)]/30"
              placeholder="Search Engine ID"
            />
            <p className="text-[11px] text-[var(--color-text-subtle)] mt-1">
              از programmablesearchengine.google.com
            </p>
          </div>
        </div>
        <div className="flex justify-end pt-1">
          <TestBtn
            id="google"
            testing={testing}
            current={canTestGoogle ? '1' : ''}
            onClick={onTestGoogle}
            disabled={!canTestGoogle}
          />
        </div>
      </SettingsSectionCard>

      <SettingsSectionCard
        title="Liara Object Storage"
        description="آپلود تصاویر روی سرور ایرانی"
        icon={<Database className="w-5 h-5 text-[var(--primary)]" />}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-[var(--color-text)] mb-1.5 block">
              نام Bucket
            </label>
            <input
              type="text"
              value={form.liaraBucketName || ''}
              onChange={(e) => onFormChange({ liaraBucketName: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)]"
              placeholder="my-bucket"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-[var(--color-text)] mb-1.5 block">
              Endpoint
            </label>
            <input
              type="text"
              value={form.liaraEndpoint || ''}
              onChange={(e) => onFormChange({ liaraEndpoint: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)]"
              placeholder="https://storage.iran.liara.space"
            />
          </div>
        </div>
        <SecretInput
          label="Access Key"
          value={form.liaraAccessKey || ''}
          onChange={(v) => onFormChange({ liaraAccessKey: v })}
          configured={!!settings.liaraAccessKey}
        />
        <SecretInput
          label="Secret Key"
          value={form.liaraSecretKey || ''}
          onChange={(v) => onFormChange({ liaraSecretKey: v })}
          configured={!!settings.liaraSecretKey}
        />
        <div className="flex justify-end pt-1">
          <TestBtn
            id="liara"
            testing={testing}
            current={canTestLiara ? '1' : ''}
            onClick={onTestLiara}
            disabled={!canTestLiara}
          />
        </div>
      </SettingsSectionCard>

      <div className="flex justify-end sticky bottom-4 z-10">
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/95 backdrop-blur px-3 py-2 shadow-lg">
          <SettingsSaveButton
            onClick={onSave}
            loading={saving}
            label="ذخیره یکپارچه‌سازی"
          />
        </div>
      </div>
    </div>
  );
}
