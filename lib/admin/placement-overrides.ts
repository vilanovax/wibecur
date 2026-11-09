/**
 * پرچم‌های override جایگاه — وقتی ادمین عنوان/تصویر/توضیح/نکته را
 * فقط برای یک لیست عوض می‌کند، sync کاتالوگ آن فیلد را بازنویسی نمی‌کند.
 */

export type PlacementOverrideField = 'title' | 'imageUrl' | 'description' | 'tip';

export type PlacementOverrides = Partial<Record<PlacementOverrideField, true>>;

const OVERRIDE_KEY = 'listOverrides';

export function readPlacementOverrides(metadata: unknown): PlacementOverrides {
  if (metadata == null || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return {};
  }
  const raw = (metadata as Record<string, unknown>)[OVERRIDE_KEY];
  if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const out: PlacementOverrides = {};
  for (const key of ['title', 'imageUrl', 'description', 'tip'] as const) {
    if ((raw as Record<string, unknown>)[key] === true) out[key] = true;
  }
  return out;
}

export function withPlacementOverrides(
  metadata: Record<string, unknown>,
  fields: PlacementOverrideField[]
): Record<string, unknown> {
  const current = readPlacementOverrides(metadata);
  for (const field of fields) current[field] = true;
  return {
    ...metadata,
    [OVERRIDE_KEY]: current,
  };
}

export function mergeCatalogIntoPlacement(opts: {
  catalog: {
    title: string;
    description: string | null;
    imageUrl: string | null;
    externalUrl: string | null;
    metadata: unknown;
  };
  placement: {
    title: string;
    description: string | null;
    imageUrl: string | null;
    externalUrl: string | null;
    metadata: unknown;
  };
  catalogRefMetadata: (
    catalog: { metadata?: unknown },
    existing?: unknown
  ) => Record<string, unknown>;
}): {
  title: string;
  description: string | null;
  imageUrl: string | null;
  externalUrl: string | null;
  metadata: Record<string, unknown>;
} {
  const overrides = readPlacementOverrides(opts.placement.metadata);
  const placementMeta =
    opts.placement.metadata != null &&
    typeof opts.placement.metadata === 'object' &&
    !Array.isArray(opts.placement.metadata)
      ? (opts.placement.metadata as Record<string, unknown>)
      : {};

  const mergedMeta = opts.catalogRefMetadata(opts.catalog, {
    ...placementMeta,
    ...(overrides.tip && typeof placementMeta.tip === 'string'
      ? { tip: placementMeta.tip }
      : {}),
    listOverrides: overrides,
  });

  return {
    title: overrides.title ? opts.placement.title : opts.catalog.title,
    description: overrides.description
      ? opts.placement.description
      : opts.catalog.description,
    imageUrl: overrides.imageUrl ? opts.placement.imageUrl : opts.catalog.imageUrl,
    externalUrl: opts.catalog.externalUrl,
    metadata: mergedMeta,
  };
}
