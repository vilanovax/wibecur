import { slugFromTitle } from '@/lib/admin/list-slug';

export async function resolveAvailableListSlug(
  baseSlug: string,
  excludeId?: string
): Promise<string> {
  const slug = baseSlug.trim().toLowerCase();
  if (!slug) return 'list';

  const params = new URLSearchParams({ slug });
  if (excludeId) params.set('excludeId', excludeId);

  const res = await fetch(`/api/admin/lists/check-slug?${params}`);
  const data = await res.json();

  if (res.ok && data.available) return slug;
  if (data.suggestion) return data.suggestion as string;
  return slug;
}

export function buildSlugFromListTitle(title: string): string {
  const slug = slugFromTitle(title);
  return slug || 'list';
}

export async function generateListDescriptionWithAi(input: {
  title: string;
  categorySlug?: string;
  categoryName?: string;
}): Promise<string> {
  const res = await fetch('/api/admin/lists/generate-description', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'خطا در تولید توضیحات');
  return data.description as string;
}
