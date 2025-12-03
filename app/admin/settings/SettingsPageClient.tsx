'use client';

import { useState, useEffect } from 'react';
import { Settings, Key, Database, CheckCircle, XCircle, Loader2, MessageSquare } from 'lucide-react';

interface SettingsData {
  openaiApiKey: string | null;
  tmdbApiKey: string | null;
  omdbApiKey: string | null;
  googleApiKey: string | null;
  googleSearchEngineId: string | null;
  liaraBucketName: string | null;
  liaraEndpoint: string | null;
  liaraAccessKey: string | null;
  liaraSecretKey: string | null;
}

export default function SettingsPageClient() {
  const [settings, setSettings] = useState<SettingsData>({
    openaiApiKey: null,
    tmdbApiKey: null,
    omdbApiKey: null,
    googleApiKey: null,
    googleSearchEngineId: null,
    liaraBucketName: null,
    liaraEndpoint: null,
    liaraAccessKey: null,
    liaraSecretKey: null,
  });

  const [formData, setFormData] = useState<SettingsData>({
    openaiApiKey: '',
    tmdbApiKey: '',
    omdbApiKey: '',
    googleApiKey: '',
    googleSearchEngineId: '',
    liaraBucketName: '',
    liaraEndpoint: '',
    liaraAccessKey: '',
    liaraSecretKey: '',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [testingConnection, setTestingConnection] = useState<string | null>(null);

  // Comment settings state
  const [commentSettings, setCommentSettings] = useState({
    defaultMaxComments: null as number | null,
    defaultCommentsEnabled: true,
    maxCommentLength: null as number | null,
    rateLimitMinutes: 5,
    globalRateLimitMinutes: null as number | null,
  });
  const [commentSettingsLoading, setCommentSettingsLoading] = useState(false);

  // Load current settings
  useEffect(() => {
    fetchSettings();
    fetchCommentSettings();
  }, []);

  const fetchCommentSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings/comment-settings');
      const data = await res.json();
      
      if (!res.ok) {
        const errorMsg = data.error || 'خطا در دریافت تنظیمات کامنت';
        console.error('Error fetching comment settings:', errorMsg);
        // Don't show error message to user, just use defaults
        return;
      }

      if (data.success && data.data) {
        setCommentSettings({
          defaultMaxComments: data.data.defaultMaxComments ?? null,
          defaultCommentsEnabled: data.data.defaultCommentsEnabled ?? true,
          maxCommentLength: data.data.maxCommentLength ?? null,
          rateLimitMinutes: data.data.rateLimitMinutes ?? 5,
          globalRateLimitMinutes: data.data.globalRateLimitMinutes ?? null,
        });
      }
    } catch (error: any) {
      console.error('Error fetching comment settings:', error);
      // Don't show error message to user, just use defaults
    }
  };

  const handleSaveCommentSettings = async () => {
    try {
      setCommentSettingsLoading(true);
      setMessage(null);

      const res = await fetch('/api/admin/settings/comment-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(commentSettings),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'خطا در ذخیره تنظیمات کامنت');
      }

      setMessage({ type: 'success', text: 'تنظیمات کامنت با موفقیت ذخیره شد' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setCommentSettingsLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/settings');
      if (!res.ok) throw new Error('خطا در دریافت تنظیمات');

      const data = await res.json();
      setSettings(data);

      // Initialize form with masked values (don't overwrite user input)
      setFormData({
        openaiApiKey: '',
        tmdbApiKey: '',
        omdbApiKey: '',
        googleApiKey: '',
        googleSearchEngineId: data.googleSearchEngineId || '',
        liaraBucketName: data.liaraBucketName || '',
        liaraEndpoint: data.liaraEndpoint || '',
        liaraAccessKey: '',
        liaraSecretKey: '',
      });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage(null);

      // Only send non-empty values
      const dataToSend: any = {};

      if (formData.openaiApiKey?.trim()) dataToSend.openaiApiKey = formData.openaiApiKey;
      if (formData.tmdbApiKey?.trim()) dataToSend.tmdbApiKey = formData.tmdbApiKey;
      if (formData.omdbApiKey?.trim()) dataToSend.omdbApiKey = formData.omdbApiKey;
      if (formData.googleApiKey?.trim()) dataToSend.googleApiKey = formData.googleApiKey;
      if (formData.googleSearchEngineId?.trim()) dataToSend.googleSearchEngineId = formData.googleSearchEngineId;
      if (formData.liaraBucketName?.trim()) dataToSend.liaraBucketName = formData.liaraBucketName;
      if (formData.liaraEndpoint?.trim()) dataToSend.liaraEndpoint = formData.liaraEndpoint;
      if (formData.liaraAccessKey?.trim()) dataToSend.liaraAccessKey = formData.liaraAccessKey;
      if (formData.liaraSecretKey?.trim()) dataToSend.liaraSecretKey = formData.liaraSecretKey;

      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend),
      });

      if (!res.ok) throw new Error('خطا در ذخیره تنظیمات');

      setMessage({ type: 'success', text: 'تنظیمات با موفقیت ذخیره شد' });

      // Reload settings to show masked values
      await fetchSettings();

      // Clear sensitive fields
      setFormData((prev) => ({
        ...prev,
        openaiApiKey: '',
        tmdbApiKey: '',
        omdbApiKey: '',
        googleApiKey: '',
        liaraAccessKey: '',
        liaraSecretKey: '',
      }));
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setSaving(false);
    }
  };

  const testOpenAIConnection = async () => {
    if (!formData.openaiApiKey?.trim()) {
      setMessage({ type: 'error', text: 'لطفاً ابتدا کلید OpenAI را وارد کنید' });
      return;
    }

    try {
      setTestingConnection('openai');
      setMessage(null);

      // Simple test: check if key format is valid
      if (!formData.openaiApiKey.startsWith('sk-')) {
        throw new Error('فرمت کلید OpenAI نامعتبر است (باید با sk- شروع شود)');
      }

      setMessage({ type: 'success', text: 'فرمت کلید OpenAI صحیح است' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setTestingConnection(null);
    }
  };

  const testTMDbConnection = async () => {
    if (!formData.tmdbApiKey?.trim()) {
      setMessage({ type: 'error', text: 'لطفاً ابتدا کلید TMDb را وارد کنید' });
      return;
    }

    try {
      setTestingConnection('tmdb');
      setMessage(null);

      // Test TMDb API
      const res = await fetch(`https://api.themoviedb.org/3/configuration?api_key=${formData.tmdbApiKey}`);

      if (!res.ok) throw new Error('کلید TMDb نامعتبر است');

      setMessage({ type: 'success', text: 'اتصال به TMDb با موفقیت برقرار شد' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setTestingConnection(null);
    }
  };

  const testOMDbConnection = async () => {
    if (!formData.omdbApiKey?.trim()) {
      setMessage({ type: 'error', text: 'لطفاً ابتدا کلید OMDb را وارد کنید' });
      return;
    }

    try {
      setTestingConnection('omdb');
      setMessage(null);

      // Test OMDb API
      const res = await fetch(`https://www.omdbapi.com/?apikey=${formData.omdbApiKey}&t=test`);
      const data = await res.json();

      if (data.Error === 'Invalid API key!') {
        throw new Error('کلید OMDb نامعتبر است');
      }

      setMessage({ type: 'success', text: 'اتصال به OMDb با موفقیت برقرار شد' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setTestingConnection(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="w-8 h-8 text-primary" />
        <h1 className="text-3xl font-bold text-gray-900">تنظیمات</h1>
      </div>

      {message && (
        <div
          className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <XCircle className="w-5 h-5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <div className="space-y-6">
        {/* API Keys Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <Key className="w-5 h-5 text-gray-700" />
            <h2 className="text-xl font-semibold text-gray-900">کلیدهای API</h2>
          </div>

          <div className="space-y-4">
            {/* OpenAI API Key */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                کلید OpenAI
                {settings.openaiApiKey && (
                  <span className="text-green-600 text-xs mr-2">✓ ذخیره شده</span>
                )}
              </label>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={formData.openaiApiKey || ''}
                  onChange={(e) => setFormData({ ...formData, openaiApiKey: e.target.value })}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder={settings.openaiApiKey ? `فعلی: ${settings.openaiApiKey}` : "sk-..."}
                />
                <button
                  onClick={testOpenAIConnection}
                  disabled={testingConnection === 'openai' || !formData.openaiApiKey?.trim()}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {testingConnection === 'openai' ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    'تست'
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                برای تولید توضیحات با هوش مصنوعی استفاده می‌شود
              </p>
            </div>

            {/* TMDb API Key */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                کلید TMDb
                {settings.tmdbApiKey && (
                  <span className="text-green-600 text-xs mr-2">✓ ذخیره شده</span>
                )}
              </label>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={formData.tmdbApiKey || ''}
                  onChange={(e) => setFormData({ ...formData, tmdbApiKey: e.target.value })}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder={settings.tmdbApiKey ? `فعلی: ${settings.tmdbApiKey}` : "کلید TMDb"}
                />
                <button
                  onClick={testTMDbConnection}
                  disabled={testingConnection === 'tmdb' || !formData.tmdbApiKey?.trim()}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {testingConnection === 'tmdb' ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    'تست'
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                برای دریافت تصاویر و اطلاعات فیلم‌ها استفاده می‌شود
              </p>
            </div>

            {/* OMDb API Key */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                کلید OMDb
                {settings.omdbApiKey && (
                  <span className="text-green-600 text-xs mr-2">✓ ذخیره شده</span>
                )}
              </label>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={formData.omdbApiKey || ''}
                  onChange={(e) => setFormData({ ...formData, omdbApiKey: e.target.value })}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder={settings.omdbApiKey ? `فعلی: ${settings.omdbApiKey}` : "کلید OMDb"}
                />
                <button
                  onClick={testOMDbConnection}
                  disabled={testingConnection === 'omdb' || !formData.omdbApiKey?.trim()}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {testingConnection === 'omdb' ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    'تست'
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                برای دریافت امتیاز IMDb استفاده می‌شود
              </p>
            </div>

            {/* Google API Key */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                کلید Google Custom Search API
                {settings.googleApiKey && (
                  <span className="text-green-600 text-xs mr-2">✓ ذخیره شده</span>
                )}
              </label>
              <input
                type="password"
                value={formData.googleApiKey || ''}
                onChange={(e) => setFormData({ ...formData, googleApiKey: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder={settings.googleApiKey ? `فعلی: ${settings.googleApiKey}` : "Google API Key"}
              />
              <p className="text-xs text-gray-500 mt-1">
                برای جستجوی تصاویر در Google استفاده می‌شود
              </p>
            </div>

            {/* Google Search Engine ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Google Search Engine ID
              </label>
              <input
                type="text"
                value={formData.googleSearchEngineId || ''}
                onChange={(e) => setFormData({ ...formData, googleSearchEngineId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Search Engine ID"
              />
              <p className="text-xs text-gray-500 mt-1">
                شناسه موتور جستجوی سفارشی Google (از programmablesearchengine.google.com دریافت کنید)
              </p>
            </div>
          </div>
        </div>

        {/* Liara Object Storage Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <Database className="w-5 h-5 text-gray-700" />
            <h2 className="text-xl font-semibold text-gray-900">Liara Object Storage</h2>
          </div>

          <div className="space-y-4">
            {/* Bucket Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                نام Bucket
              </label>
              <input
                type="text"
                value={formData.liaraBucketName || ''}
                onChange={(e) => setFormData({ ...formData, liaraBucketName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="my-bucket"
              />
            </div>

            {/* Endpoint */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Endpoint
              </label>
              <input
                type="text"
                value={formData.liaraEndpoint || ''}
                onChange={(e) => setFormData({ ...formData, liaraEndpoint: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="https://storage.iran.liara.space"
              />
            </div>

            {/* Access Key */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Access Key
                {settings.liaraAccessKey && (
                  <span className="text-green-600 text-xs mr-2">✓ ذخیره شده</span>
                )}
              </label>
              <input
                type="password"
                value={formData.liaraAccessKey || ''}
                onChange={(e) => setFormData({ ...formData, liaraAccessKey: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder={settings.liaraAccessKey ? `فعلی: ${settings.liaraAccessKey}` : "Access Key"}
              />
            </div>

            {/* Secret Key */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Secret Key
                {settings.liaraSecretKey && (
                  <span className="text-green-600 text-xs mr-2">✓ ذخیره شده</span>
                )}
              </label>
              <input
                type="password"
                value={formData.liaraSecretKey || ''}
                onChange={(e) => setFormData({ ...formData, liaraSecretKey: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder={settings.liaraSecretKey ? `فعلی: ${settings.liaraSecretKey}` : "Secret Key"}
              />
            </div>

            <p className="text-xs text-gray-500">
              برای آپلود تصاویر فیلم‌ها و سریال‌ها در سرورهای ایرانی استفاده می‌شود
            </p>
          </div>
        </div>

        {/* Comment Settings Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="w-5 h-5 text-gray-700" />
            <h2 className="text-xl font-semibold text-gray-900">تنظیمات کامنت‌ها</h2>
          </div>

          <div className="space-y-4">
            {/* Default Comments Enabled */}
            <div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={commentSettings.defaultCommentsEnabled}
                  onChange={(e) =>
                    setCommentSettings({
                      ...commentSettings,
                      defaultCommentsEnabled: e.target.checked,
                    })
                  }
                  className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <span className="text-sm font-medium text-gray-700">
                  فعال بودن کامنت‌ها به صورت پیش‌فرض
                </span>
              </label>
              <p className="text-xs text-gray-500 mt-1 mr-8">
                این تنظیم برای آیتم‌های جدید اعمال می‌شود
              </p>
            </div>

            {/* Max Comment Length */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                حداکثر تعداد کاراکتر کامنت
              </label>
              <input
                type="number"
                min="1"
                value={commentSettings.maxCommentLength ?? ''}
                onChange={(e) =>
                  setCommentSettings({
                    ...commentSettings,
                    maxCommentLength: e.target.value
                      ? parseInt(e.target.value)
                      : null,
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="بدون محدودیت (خالی بگذارید)"
              />
              <p className="text-xs text-gray-500 mt-1">
                اگر خالی بگذارید، محدودیتی وجود نخواهد داشت
              </p>
            </div>

            {/* Default Max Comments */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                حداکثر تعداد کامنت پیش‌فرض برای هر آیتم
              </label>
              <input
                type="number"
                min="1"
                value={commentSettings.defaultMaxComments ?? ''}
                onChange={(e) =>
                  setCommentSettings({
                    ...commentSettings,
                    defaultMaxComments: e.target.value
                      ? parseInt(e.target.value)
                      : null,
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="بدون محدودیت (خالی بگذارید)"
              />
              <p className="text-xs text-gray-500 mt-1">
                این تنظیم برای آیتم‌های جدید اعمال می‌شود
              </p>
            </div>

            {/* Rate Limit Minutes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                حداقل فاصله زمانی بین کامنت‌ها (دقیقه)
              </label>
              <input
                type="number"
                min="1"
                value={commentSettings.rateLimitMinutes}
                onChange={(e) =>
                  setCommentSettings({
                    ...commentSettings,
                    rateLimitMinutes: parseInt(e.target.value) || 5,
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                حداقل فاصله زمانی که کاربر باید بین کامنت‌های خود در یک آیتم رعایت کند
              </p>
            </div>

            {/* Global Rate Limit Minutes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                حداقل فاصله زمانی سراسری بین کامنت‌ها (دقیقه)
              </label>
              <input
                type="number"
                min="1"
                value={commentSettings.globalRateLimitMinutes ?? ''}
                onChange={(e) =>
                  setCommentSettings({
                    ...commentSettings,
                    globalRateLimitMinutes: e.target.value
                      ? parseInt(e.target.value)
                      : null,
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="غیرفعال (خالی بگذارید)"
              />
              <p className="text-xs text-gray-500 mt-1">
                حداقل فاصله زمانی که کاربر باید بین تمام کامنت‌های خود در همه آیتم‌ها رعایت کند (اگر خالی بگذارید، غیرفعال است)
              </p>
            </div>

            {/* Save Comment Settings Button */}
            <div className="flex justify-end pt-4 border-t border-gray-200">
              <button
                onClick={handleSaveCommentSettings}
                disabled={commentSettingsLoading}
                className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {commentSettingsLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    در حال ذخیره...
                  </>
                ) : (
                  'ذخیره تنظیمات کامنت'
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                در حال ذخیره...
              </>
            ) : (
              'ذخیره تنظیمات'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
