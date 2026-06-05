const SETTINGS_SECRET_KEYS = [
  'openaiApiKey',
  'tmdbApiKey',
  'omdbApiKey',
  'googleApiKey',
  'googleSearchEngineId',
  'liaraAccessKey',
  'liaraSecretKey',
] as const;

export function sanitizeSettingsRecord<T extends Record<string, unknown>>(row: T): T {
  const out = { ...row };
  for (const key of SETTINGS_SECRET_KEYS) {
    if (key in out && out[key] != null) {
      (out as Record<string, unknown>)[key] = null;
    }
  }
  return out;
}

export const BACKUP_SECRETS_EXCLUDED = [
  'users.password',
  ...SETTINGS_SECRET_KEYS.map((k) => `settings.${k}`),
];
