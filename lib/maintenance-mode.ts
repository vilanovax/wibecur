import { unstable_cache, revalidateTag } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { toAbsoluteImageUrl } from '@/lib/seo';
import { syncMaintenanceRuntimeFlag } from '@/lib/maintenance-runtime';
import {
  DEFAULT_MAINTENANCE_ACCENT,
  DEFAULT_MAINTENANCE_MESSAGE,
  DEFAULT_MAINTENANCE_TITLE,
  normalizeAccentColor,
  type MaintenanceModeSettings,
  type MaintenancePageConfig,
} from '@/lib/maintenance-mode-types';

export const MAINTENANCE_CACHE_TAG = 'maintenance-mode';

export type { MaintenanceModeSettings, MaintenancePageConfig } from '@/lib/maintenance-mode-types';
export {
  DEFAULT_MAINTENANCE_ACCENT,
  DEFAULT_MAINTENANCE_MESSAGE,
  DEFAULT_MAINTENANCE_TITLE,
  isAdminRole,
  isMaintenanceBypassPath,
  normalizeAccentColor,
} from '@/lib/maintenance-mode-types';

async function loadMaintenancePageConfig(): Promise<MaintenancePageConfig> {
  const settings = await prisma.settings.findUnique({
    where: { id: 'settings' },
    select: {
      maintenanceModeEnabled: true,
      maintenanceTitle: true,
      maintenanceSubtitle: true,
      maintenanceMessage: true,
      maintenanceShowLogo: true,
      maintenanceAccentColor: true,
      maintenanceAllowAdminBrowse: true,
      siteLogoUrl: true,
    },
  });

  const showLogo = settings?.maintenanceShowLogo ?? true;
  const rawLogo = settings?.siteLogoUrl?.trim();
  const logoUrl =
    showLogo && rawLogo ? toAbsoluteImageUrl(rawLogo) ?? rawLogo : null;

  return {
    enabled: settings?.maintenanceModeEnabled ?? false,
    title: settings?.maintenanceTitle?.trim() || DEFAULT_MAINTENANCE_TITLE,
    subtitle: settings?.maintenanceSubtitle?.trim() || null,
    message: settings?.maintenanceMessage?.trim() || DEFAULT_MAINTENANCE_MESSAGE,
    showLogo,
    accentColor: normalizeAccentColor(settings?.maintenanceAccentColor),
    allowAdminBrowse: settings?.maintenanceAllowAdminBrowse ?? true,
    logoUrl,
  };
}

export const getMaintenancePageConfig = unstable_cache(
  loadMaintenancePageConfig,
  ['maintenance-page-config'],
  { revalidate: 15, tags: [MAINTENANCE_CACHE_TAG] }
);

export async function getMaintenanceModeSettings(): Promise<MaintenanceModeSettings> {
  const settings = await prisma.settings.findUnique({
    where: { id: 'settings' },
    select: {
      maintenanceModeEnabled: true,
      maintenanceTitle: true,
      maintenanceSubtitle: true,
      maintenanceMessage: true,
      maintenanceShowLogo: true,
      maintenanceAccentColor: true,
      maintenanceAllowAdminBrowse: true,
    },
  });

  const result = {
    enabled: settings?.maintenanceModeEnabled ?? false,
    title: settings?.maintenanceTitle?.trim() || DEFAULT_MAINTENANCE_TITLE,
    subtitle: settings?.maintenanceSubtitle?.trim() || '',
    message: settings?.maintenanceMessage?.trim() || DEFAULT_MAINTENANCE_MESSAGE,
    showLogo: settings?.maintenanceShowLogo ?? true,
    accentColor: normalizeAccentColor(settings?.maintenanceAccentColor),
    allowAdminBrowse: settings?.maintenanceAllowAdminBrowse ?? true,
  };

  await ensureMaintenanceRuntimeSynced(result);
  return result;
}

async function ensureMaintenanceRuntimeSynced(
  settings: MaintenanceModeSettings
): Promise<void> {
  await syncMaintenanceRuntimeFlag({
    enabled: settings.enabled,
    allowAdminBrowse: settings.allowAdminBrowse,
  });
}

export async function updateMaintenanceModeSettings(
  data: MaintenanceModeSettings
): Promise<MaintenanceModeSettings> {
  const title = data.title.trim() || DEFAULT_MAINTENANCE_TITLE;
  const message = data.message.trim() || DEFAULT_MAINTENANCE_MESSAGE;

  await prisma.settings.upsert({
    where: { id: 'settings' },
    create: {
      id: 'settings',
      updatedAt: new Date(),
      maintenanceModeEnabled: data.enabled,
      maintenanceTitle: title,
      maintenanceSubtitle: data.subtitle.trim() || null,
      maintenanceMessage: message,
      maintenanceShowLogo: data.showLogo,
      maintenanceAccentColor: normalizeAccentColor(data.accentColor),
      maintenanceAllowAdminBrowse: data.allowAdminBrowse,
    },
    update: {
      updatedAt: new Date(),
      maintenanceModeEnabled: data.enabled,
      maintenanceTitle: title,
      maintenanceSubtitle: data.subtitle.trim() || null,
      maintenanceMessage: message,
      maintenanceShowLogo: data.showLogo,
      maintenanceAccentColor: normalizeAccentColor(data.accentColor),
      maintenanceAllowAdminBrowse: data.allowAdminBrowse,
    },
  });

  invalidateMaintenanceModeCache();
  await syncMaintenanceRuntimeFlag({
    enabled: data.enabled,
    allowAdminBrowse: data.allowAdminBrowse,
  });

  return {
    enabled: data.enabled,
    title,
    subtitle: data.subtitle.trim(),
    message,
    showLogo: data.showLogo,
    accentColor: normalizeAccentColor(data.accentColor),
    allowAdminBrowse: data.allowAdminBrowse,
  };
}

export function invalidateMaintenanceModeCache(): void {
  revalidateTag(MAINTENANCE_CACHE_TAG, 'max');
}
