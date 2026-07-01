/** مسیر پیش‌نمایش آیتم در اپ عمومی (مودال #item-{id} در صفحه لیست) */
export function buildListItemPreviewPath(listSlug: string, itemId: string): string {
  const slug = listSlug.trim();
  const id = itemId.trim();
  if (!slug || !id) return '';
  return `/lists/${slug}#item-${encodeURIComponent(id)}`;
}
