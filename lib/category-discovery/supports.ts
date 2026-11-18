/** موضوعات کشف v1 فقط برای کافه/رستوران */
export function supportsCategoryDiscovery(slug: string): boolean {
  const s = slug.toLowerCase();
  return (
    s.includes('cafe') ||
    s.includes('restaurant') ||
    s.includes('food') ||
    s.includes('کافه') ||
    s.includes('رستوران')
  );
}
