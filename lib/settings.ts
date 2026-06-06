import { prisma } from './prisma';
import { encrypt, decrypt } from './encryption';

/**
 * Get or create settings (singleton)
 */
export async function getSettings() {
  let settings = await prisma.settings.findUnique({
    where: { id: 'settings' },
  });

  if (!settings) {
    settings = await prisma.settings.create({
      data: { 
        id: 'settings',
        updatedAt: new Date(),
      },
    });
  }

  return settings;
}

/**
 * Get decrypted API keys
 */
export async function getDecryptedSettings() {
  const settings = await getSettings();

  return {
    openaiApiKey: settings.openaiApiKey
      ? decrypt(settings.openaiApiKey) || null
      : null,
    openaiModel: settings.openaiModel ?? null,
    tmdbApiKey: settings.tmdbApiKey ? decrypt(settings.tmdbApiKey) || null : null,
    omdbApiKey: settings.omdbApiKey ? decrypt(settings.omdbApiKey) || null : null,
    googleApiKey: settings.googleApiKey ? decrypt(settings.googleApiKey) || null : null,
    googleSearchEngineId: settings.googleSearchEngineId || null,
    liaraBucketName: settings.liaraBucketName || null,
    liaraEndpoint: settings.liaraEndpoint || null,
    liaraAccessKey: settings.liaraAccessKey
      ? decrypt(settings.liaraAccessKey) || null
      : null,
    liaraSecretKey: settings.liaraSecretKey
      ? decrypt(settings.liaraSecretKey) || null
      : null,
    minItemsForPublicList: settings.minItemsForPublicList ?? 5,
  };
}

/**
 * Update settings with encryption
 */
export async function updateSettings(data: {
  openaiApiKey?: string;
  openaiModel?: string | null;
  tmdbApiKey?: string;
  omdbApiKey?: string;
  googleApiKey?: string;
  googleSearchEngineId?: string;
  liaraBucketName?: string;
  liaraEndpoint?: string;
  liaraAccessKey?: string;
  liaraSecretKey?: string;
  minItemsForPublicList?: number;
  maxPersonalLists?: number;
  personalListPublicInstructions?: string | null;
}) {
  const updateData: any = {};

  if (data.openaiApiKey !== undefined) {
    updateData.openaiApiKey = data.openaiApiKey
      ? encrypt(data.openaiApiKey)
      : null;
  }

  if (data.openaiModel !== undefined) {
    updateData.openaiModel = data.openaiModel?.trim() || null;
  }

  if (data.tmdbApiKey !== undefined) {
    updateData.tmdbApiKey = data.tmdbApiKey ? encrypt(data.tmdbApiKey) : null;
  }

  if (data.omdbApiKey !== undefined) {
    updateData.omdbApiKey = data.omdbApiKey ? encrypt(data.omdbApiKey) : null;
  }

  if (data.googleApiKey !== undefined) {
    updateData.googleApiKey = data.googleApiKey ? encrypt(data.googleApiKey) : null;
  }

  if (data.googleSearchEngineId !== undefined) {
    updateData.googleSearchEngineId = data.googleSearchEngineId || null;
  }

  if (data.liaraBucketName !== undefined) {
    updateData.liaraBucketName = data.liaraBucketName || null;
  }

  if (data.liaraEndpoint !== undefined) {
    updateData.liaraEndpoint = data.liaraEndpoint || null;
  }

  if (data.liaraAccessKey !== undefined) {
    updateData.liaraAccessKey = data.liaraAccessKey
      ? encrypt(data.liaraAccessKey)
      : null;
  }

  if (data.liaraSecretKey !== undefined) {
    updateData.liaraSecretKey = data.liaraSecretKey
      ? encrypt(data.liaraSecretKey)
      : null;
  }

  if (data.minItemsForPublicList !== undefined) {
    updateData.minItemsForPublicList = data.minItemsForPublicList;
  }

  if (data.maxPersonalLists !== undefined) {
    updateData.maxPersonalLists = data.maxPersonalLists;
  }

  if (data.personalListPublicInstructions !== undefined) {
    updateData.personalListPublicInstructions = data.personalListPublicInstructions || null;
  }

  return await prisma.settings.update({
    where: { id: 'settings' },
    data: updateData,
  });
}

/**
 * Get specific API key (decrypted)
 */
export async function getApiKey(
  key: 'openai' | 'tmdb'
): Promise<string | null> {
  const settings = await getDecryptedSettings();

  switch (key) {
    case 'openai':
      return settings.openaiApiKey;
    case 'tmdb':
      return settings.tmdbApiKey;
    default:
      return null;
  }
}

/**
 * Get Object Storage config (ParsPack) — decrypted
 * فیلدهای DB همان liara* هستند (سازگاری با schema)
 */
export async function getObjectStorageSettings() {
  const settings = await getDecryptedSettings();

  if (
    settings.liaraBucketName &&
    settings.liaraEndpoint &&
    settings.liaraAccessKey &&
    settings.liaraSecretKey
  ) {
    const { normalizeStorageEndpoint } = await import('./object-storage-config');
    return {
      bucketName: settings.liaraBucketName,
      endpoint: normalizeStorageEndpoint(settings.liaraEndpoint),
      accessKeyId: settings.liaraAccessKey,
      secretAccessKey: settings.liaraSecretKey,
    };
  }

  const { normalizeStorageEndpoint } = await import('./object-storage-config');
  const bucketName =
    process.env.PARSPACK_BUCKET_NAME?.trim() ||
    process.env.LIARA_BUCKET_NAME?.trim();
  const endpointRaw =
    process.env.PARSPACK_ENDPOINT?.trim() ||
    process.env.LIARA_ENDPOINT?.trim();
  const accessKeyId =
    process.env.PARSPACK_ACCESS_KEY?.trim() ||
    process.env.LIARA_ACCESS_KEY?.trim();
  const secretAccessKey =
    process.env.PARSPACK_SECRET_KEY?.trim() ||
    process.env.LIARA_SECRET_KEY?.trim();

  if (bucketName && endpointRaw && accessKeyId && secretAccessKey) {
    return {
      bucketName,
      endpoint: normalizeStorageEndpoint(endpointRaw),
      accessKeyId,
      secretAccessKey,
    };
  }

  return null;
}

/** @deprecated */
export async function getLiaraConfig() {
  return getObjectStorageSettings();
}
