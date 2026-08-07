export type BookContentType = 'ebook' | 'audiobook';
export type BookContentFilter = 'all' | BookContentType;

export function matchesContentFilter(
  contentType: BookContentType | null | undefined,
  filter: BookContentFilter
): boolean {
  if (filter === 'all') return true;
  if (!contentType) return false;
  return contentType === filter;
}

export function inferFidiboContentType(item: {
  content_type?: string;
  format?: string;
}): BookContentType | null {
  const ct = (item.content_type ?? '').toLowerCase();
  const fmt = (item.format ?? '').toLowerCase();
  if (ct === 'audiobook' || fmt === 'mp3') return 'audiobook';
  if (ct === 'ebook' || fmt === 'epub' || fmt === 'pdf') return 'ebook';
  return null;
}

export function inferTaaghcheContentType(
  types?: { id?: number; name?: string }[]
): BookContentType | null {
  if (!Array.isArray(types)) return null;
  let hasEbook = false;
  for (const t of types) {
    if (t.id === 2) return 'audiobook';
    const name = (t.name ?? '').toLowerCase();
    if (name.includes('صوتی')) return 'audiobook';
    if (t.id === 1) hasEbook = true;
    if (name.includes('الکترون')) hasEbook = true;
  }
  return hasEbook ? 'ebook' : null;
}

export function inferKetabrahContentType(
  bookUrl: string,
  title?: string
): BookContentType | null {
  if (/\/audiobook\//i.test(bookUrl)) return 'audiobook';
  if (/\/book\//i.test(bookUrl)) return 'ebook';
  if (title && /کتاب صوتی/i.test(title)) return 'audiobook';
  return null;
}
