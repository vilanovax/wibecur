/**
 * نقشه با سقف ثابت. خواندن، کلید را تازه می‌کند و نوشتنِ اضافه قدیمی‌ترین را حذف می‌کند.
 */
export function createBoundedCache<K, V>(maxEntries: number) {
  const entries = new Map<K, V>();
  const cap = Math.max(1, maxEntries);

  function touch(key: K, value: V) {
    entries.delete(key);
    entries.set(key, value);
  }

  return {
    get(key: K): V | undefined {
      if (!entries.has(key)) return undefined;
      const value = entries.get(key) as V;
      touch(key, value);
      return value;
    },
    set(key: K, value: V) {
      touch(key, value);
      while (entries.size > cap) {
        const oldest = entries.keys().next().value;
        if (oldest === undefined) break;
        entries.delete(oldest);
      }
    },
    get size() {
      return entries.size;
    },
  };
}
