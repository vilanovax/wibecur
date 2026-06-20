'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import Toast, { type ToastType } from '@/components/shared/Toast';
import SettingsPageHeader from '@/components/admin/settings/SettingsPageHeader';
import SettingsTabs from '@/components/admin/settings/SettingsTabs';
import SettingsStatusStrip from '@/components/admin/settings/SettingsStatusStrip';
import IntegrationsSettingsPanel from '@/components/admin/settings/IntegrationsSettingsPanel';
import CommentSettingsPanel from '@/components/admin/settings/CommentSettingsPanel';
import ListSettingsPanel from '@/components/admin/settings/ListSettingsPanel';
import BrandingSettingsPanel from '@/components/admin/settings/BrandingSettingsPanel';
import MaintenanceModePanel from '@/components/admin/settings/MaintenanceModePanel';
import AccountSettingsPanel from '@/components/admin/settings/AccountSettingsPanel';
import {
  parseSettingsTab,
  type SettingsData,
  type CommentSettingsState,
  type SettingsTab,
} from '@/lib/admin/settings-types';
import {
  DEFAULT_MAINTENANCE_ACCENT,
  DEFAULT_MAINTENANCE_MESSAGE,
  DEFAULT_MAINTENANCE_TITLE,
  type MaintenanceModeSettings,
} from '@/lib/maintenance-mode-types';
import { DEFAULT_OPENAI_MODEL, resolveOpenAIModel } from '@/lib/openai-models';

type SectionToast = {
  section: SettingsTab;
  type: ToastType;
  text: string;
};

const emptyIntegrationForm = () => ({
  openaiApiKey: '',
  openaiModel: DEFAULT_OPENAI_MODEL,
  tmdbApiKey: '',
  omdbApiKey: '',
  googleApiKey: '',
  googleSearchEngineId: '',
  liaraBucketName: '',
  liaraEndpoint: '',
  liaraAccessKey: '',
  liaraSecretKey: '',
});

export default function SettingsPageClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeTab = parseSettingsTab(searchParams.get('tab'));

  const [settings, setSettings] = useState<SettingsData>({
    openaiApiKey: null,
    openaiModel: DEFAULT_OPENAI_MODEL,
    tmdbApiKey: null,
    omdbApiKey: null,
    googleApiKey: null,
    googleSearchEngineId: null,
    liaraBucketName: null,
    liaraEndpoint: null,
    liaraAccessKey: null,
    liaraSecretKey: null,
    minItemsForPublicList: 5,
    maxPersonalLists: 3,
    personalListPublicInstructions: null,
    siteLogoUrl: null,
  });

  const [integrationForm, setIntegrationForm] = useState(emptyIntegrationForm);
  const [listForm, setListForm] = useState({
    minItemsForPublicList: 5,
    maxPersonalLists: 3,
    personalListPublicInstructions: '',
  });
  const [brandingForm, setBrandingForm] = useState({ siteLogoUrl: '' });
  const [maintenanceForm, setMaintenanceForm] = useState<MaintenanceModeSettings>({
    enabled: false,
    title: DEFAULT_MAINTENANCE_TITLE,
    subtitle: '',
    message: DEFAULT_MAINTENANCE_MESSAGE,
    showLogo: true,
    accentColor: DEFAULT_MAINTENANCE_ACCENT,
    allowAdminBrowse: true,
  });

  const [commentSettings, setCommentSettings] = useState<CommentSettingsState>({
    defaultMaxComments: null,
    defaultCommentsEnabled: true,
    maxCommentLength: null,
    rateLimitMinutes: 5,
    globalRateLimitMinutes: null,
    penaltyWarnThreshold: 5,
    penaltyRestrictThreshold: 10,
    penaltyBanThreshold: 15,
    penaltyRestrictDays: 7,
  });

  const [loading, setLoading] = useState(true);
  const [savingIntegrations, setSavingIntegrations] = useState(false);
  const [savingLists, setSavingLists] = useState(false);
  const [savingBranding, setSavingBranding] = useState(false);
  const [savingMaintenance, setSavingMaintenance] = useState(false);
  const [commentSettingsLoading, setCommentSettingsLoading] = useState(false);
  const [sectionToast, setSectionToast] = useState<SectionToast | null>(null);
  const [testingConnection, setTestingConnection] = useState<string | null>(null);

  const showSectionToast = useCallback(
    (section: SettingsTab, type: ToastType, text: string) => {
      setSectionToast({ section, type, text });
    },
    []
  );

  const fetchCommentSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/settings/comment-settings');
      const json = await res.json();
      if (!res.ok || !json.success) return;
      if (json.data) {
        setCommentSettings({
          defaultMaxComments: json.data.defaultMaxComments ?? null,
          defaultCommentsEnabled: json.data.defaultCommentsEnabled ?? true,
          maxCommentLength: json.data.maxCommentLength ?? null,
          rateLimitMinutes: json.data.rateLimitMinutes ?? 5,
          globalRateLimitMinutes: json.data.globalRateLimitMinutes ?? null,
          penaltyWarnThreshold: json.data.penaltyWarnThreshold ?? 5,
          penaltyRestrictThreshold: json.data.penaltyRestrictThreshold ?? 10,
          penaltyBanThreshold: json.data.penaltyBanThreshold ?? 15,
          penaltyRestrictDays: json.data.penaltyRestrictDays ?? 7,
        });
      }
    } catch {
      /* defaults */
    }
  }, []);

  const fetchMaintenanceSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/settings/maintenance-mode');
      const json = await res.json();
      if (!res.ok || !json.success || !json.data) return;
      setMaintenanceForm(json.data);
    } catch {
      /* defaults */
    }
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/settings');
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'خطا در دریافت تنظیمات');

      const data: SettingsData = json.data ?? json;
      setSettings(data);

      setIntegrationForm({
        ...emptyIntegrationForm(),
        openaiModel: resolveOpenAIModel(data.openaiModel),
        googleSearchEngineId: data.googleSearchEngineId || '',
        liaraBucketName: data.liaraBucketName || '',
        liaraEndpoint: data.liaraEndpoint || '',
      });
      setListForm({
        minItemsForPublicList: data.minItemsForPublicList || 5,
        maxPersonalLists: data.maxPersonalLists || 3,
        personalListPublicInstructions: data.personalListPublicInstructions || '',
      });
      setBrandingForm({
        siteLogoUrl: data.siteLogoUrl || '',
      });
    } catch (error: unknown) {
      showSectionToast(
        'integrations',
        'error',
        error instanceof Error ? error.message : 'خطا'
      );
    } finally {
      setLoading(false);
    }
  }, [showSectionToast]);

  useEffect(() => {
    fetchSettings();
    fetchCommentSettings();
    fetchMaintenanceSettings();
  }, [fetchSettings, fetchCommentSettings, fetchMaintenanceSettings]);

  const handleSaveIntegrations = async () => {
    try {
      setSavingIntegrations(true);
      setSectionToast(null);

      const dataToSend: Record<string, unknown> = {
        openaiModel: resolveOpenAIModel(integrationForm.openaiModel),
      };
      if (integrationForm.openaiApiKey?.trim())
        dataToSend.openaiApiKey = integrationForm.openaiApiKey;
      if (integrationForm.tmdbApiKey?.trim())
        dataToSend.tmdbApiKey = integrationForm.tmdbApiKey;
      if (integrationForm.omdbApiKey?.trim())
        dataToSend.omdbApiKey = integrationForm.omdbApiKey;
      if (integrationForm.googleApiKey?.trim())
        dataToSend.googleApiKey = integrationForm.googleApiKey;
      dataToSend.googleSearchEngineId =
        integrationForm.googleSearchEngineId.trim() || null;
      dataToSend.liaraBucketName = integrationForm.liaraBucketName.trim() || null;
      dataToSend.liaraEndpoint = integrationForm.liaraEndpoint.trim() || null;
      if (integrationForm.liaraAccessKey?.trim())
        dataToSend.liaraAccessKey = integrationForm.liaraAccessKey;
      if (integrationForm.liaraSecretKey?.trim())
        dataToSend.liaraSecretKey = integrationForm.liaraSecretKey;

      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'خطا در ذخیره');

      showSectionToast('integrations', 'success', 'یکپارچه‌سازی ذخیره شد');
      await fetchSettings();
      setIntegrationForm((prev) => ({
        ...prev,
        openaiApiKey: '',
        tmdbApiKey: '',
        omdbApiKey: '',
        googleApiKey: '',
        liaraAccessKey: '',
        liaraSecretKey: '',
      }));
    } catch (error: unknown) {
      showSectionToast(
        'integrations',
        'error',
        error instanceof Error ? error.message : 'خطا'
      );
    } finally {
      setSavingIntegrations(false);
    }
  };

  const handleSaveLists = async () => {
    try {
      setSavingLists(true);
      setSectionToast(null);

      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          minItemsForPublicList: listForm.minItemsForPublicList,
          maxPersonalLists: listForm.maxPersonalLists,
          personalListPublicInstructions:
            listForm.personalListPublicInstructions.trim() || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'خطا در ذخیره');

      showSectionToast('lists', 'success', 'تنظیمات لیست ذخیره شد');
      await fetchSettings();
    } catch (error: unknown) {
      showSectionToast(
        'lists',
        'error',
        error instanceof Error ? error.message : 'خطا'
      );
    } finally {
      setSavingLists(false);
    }
  };

  const handleSaveBranding = async () => {
    try {
      setSavingBranding(true);
      setSectionToast(null);

      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteLogoUrl: brandingForm.siteLogoUrl.trim() || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'خطا در ذخیره');

      showSectionToast('branding', 'success', 'لوگوی سایت ذخیره شد');
      await fetchSettings();
      router.refresh();
    } catch (error: unknown) {
      showSectionToast(
        'branding',
        'error',
        error instanceof Error ? error.message : 'خطا'
      );
    } finally {
      setSavingBranding(false);
    }
  };

  const handleSaveMaintenance = async () => {
    try {
      setSavingMaintenance(true);
      setSectionToast(null);

      const res = await fetch('/api/admin/settings/maintenance-mode', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(maintenanceForm),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'خطا در ذخیره');
      }

      showSectionToast(
        'emergency',
        'success',
        json.message ||
          (maintenanceForm.enabled
            ? 'حالت اضطراری فعال شد'
            : 'تنظیمات حالت اضطراری ذخیره شد')
      );
      await fetchMaintenanceSettings();
    } catch (error: unknown) {
      showSectionToast(
        'emergency',
        'error',
        error instanceof Error ? error.message : 'خطا'
      );
    } finally {
      setSavingMaintenance(false);
    }
  };

  const handleSaveCommentSettings = async () => {
    try {
      setCommentSettingsLoading(true);
      setSectionToast(null);

      const res = await fetch('/api/admin/settings/comment-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(commentSettings),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'خطا در ذخیره تنظیمات کامنت');
      }
      showSectionToast('comments', 'success', 'تنظیمات کامنت ذخیره شد');
    } catch (error: unknown) {
      showSectionToast(
        'comments',
        'error',
        error instanceof Error ? error.message : 'خطا'
      );
    } finally {
      setCommentSettingsLoading(false);
    }
  };

  const postIntegrationTest = async (
    url: string,
    id: string,
    body: Record<string, string | undefined>
  ) => {
    try {
      setTestingConnection(id);
      setSectionToast(null);
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'تست ناموفق بود');
      }
      showSectionToast(
        'integrations',
        'success',
        json.message || 'اتصال برقرار شد'
      );
    } catch (error: unknown) {
      showSectionToast(
        'integrations',
        'error',
        error instanceof Error ? error.message : 'خطا'
      );
    } finally {
      setTestingConnection(null);
    }
  };

  const testOpenAI = () =>
    postIntegrationTest('/api/admin/settings/test-openai', 'openai', {
      openaiApiKey: integrationForm.openaiApiKey.trim() || undefined,
      openaiModel: resolveOpenAIModel(integrationForm.openaiModel),
    });

  const testGoogle = () =>
    postIntegrationTest('/api/admin/settings/test-google', 'google', {
      googleApiKey: integrationForm.googleApiKey.trim() || undefined,
      googleSearchEngineId:
        integrationForm.googleSearchEngineId.trim() || undefined,
    });

  const testLiara = () =>
    postIntegrationTest('/api/admin/settings/test-liara', 'liara', {
      liaraEndpoint: integrationForm.liaraEndpoint.trim() || undefined,
      liaraBucketName: integrationForm.liaraBucketName.trim() || undefined,
      liaraAccessKey: integrationForm.liaraAccessKey.trim() || undefined,
      liaraSecretKey: integrationForm.liaraSecretKey.trim() || undefined,
    });

  const testTMDb = () =>
    postIntegrationTest('/api/admin/settings/test-tmdb', 'tmdb', {
      tmdbApiKey: integrationForm.tmdbApiKey.trim() || undefined,
    });

  const testOMDb = () =>
    postIntegrationTest('/api/admin/settings/test-omdb', 'omdb', {
      omdbApiKey: integrationForm.omdbApiKey.trim() || undefined,
    });

  if (loading) {
    return (
      <div
        className="flex items-center justify-center min-h-[320px]"
        dir="rtl"
      >
        <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  const toastVisible =
    sectionToast && sectionToast.section === activeTab ? sectionToast : null;

  return (
    <div className="max-w-3xl pb-8" dir="rtl">
      <SettingsPageHeader />
      <SettingsTabs active={activeTab} />

      {toastVisible && (
        <Toast
          message={toastVisible.text}
          type={toastVisible.type}
          duration={3500}
          onClose={() => setSectionToast(null)}
        />
      )}

      {activeTab === 'integrations' && (
        <>
          <SettingsStatusStrip settings={settings} />
          <IntegrationsSettingsPanel
            settings={settings}
            form={integrationForm}
            onFormChange={(patch) =>
              setIntegrationForm((prev) => ({ ...prev, ...patch }))
            }
            testing={testingConnection}
            saving={savingIntegrations}
            onSave={handleSaveIntegrations}
            onTestOpenai={testOpenAI}
            onTestTmdb={testTMDb}
            onTestOmdb={testOMDb}
            onTestGoogle={testGoogle}
            onTestLiara={testLiara}
          />
        </>
      )}

      {activeTab === 'branding' && (
        <BrandingSettingsPanel
          siteLogoUrl={brandingForm.siteLogoUrl}
          onChange={(url) => setBrandingForm({ siteLogoUrl: url })}
          saving={savingBranding}
          onSave={handleSaveBranding}
        />
      )}

      {activeTab === 'emergency' && (
        <MaintenanceModePanel
          value={maintenanceForm}
          siteLogoUrl={settings.siteLogoUrl}
          onChange={(patch) =>
            setMaintenanceForm((prev) => ({ ...prev, ...patch }))
          }
          saving={savingMaintenance}
          onSave={handleSaveMaintenance}
        />
      )}

      {activeTab === 'comments' && (
        <CommentSettingsPanel
          value={commentSettings}
          onChange={(patch) =>
            setCommentSettings((prev) => ({ ...prev, ...patch }))
          }
          saving={commentSettingsLoading}
          onSave={handleSaveCommentSettings}
        />
      )}

      {activeTab === 'lists' && (
        <ListSettingsPanel
          minItemsForPublicList={listForm.minItemsForPublicList}
          maxPersonalLists={listForm.maxPersonalLists}
          personalListPublicInstructions={listForm.personalListPublicInstructions}
          onChange={(patch) => setListForm((prev) => ({ ...prev, ...patch }))}
          saving={savingLists}
          onSave={handleSaveLists}
        />
      )}

      {activeTab === 'account' && <AccountSettingsPanel />}
    </div>
  );
}
