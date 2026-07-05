export function isAvatarStorageKey(key: string): boolean {
  return /(^|\/)avatars\//i.test(key.replace(/^\/+/, ''));
}

/** SVG سبک برای آواتارهای migrate‌نشده یا حذف‌شده — بدون 404 در مرورگر */
export function buildAvatarPlaceholderSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128" role="img" aria-label="Avatar">
  <rect width="128" height="128" rx="64" fill="#eef2ff"/>
  <circle cx="64" cy="52" r="22" fill="#c7d2fe"/>
  <path d="M24 112c6-22 24-34 40-34s34 12 40 34" fill="#c7d2fe"/>
</svg>`;
}

export function avatarPlaceholderResponse(): Response {
  const body = buildAvatarPlaceholderSvg();
  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600',
    },
  });
}
