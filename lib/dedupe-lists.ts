/** حذف تکرار لیست‌ها بر اساس id — حفظ اولین occurrence */
export function dedupeListsById<T extends { id: string }>(lists: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const list of lists) {
    if (seen.has(list.id)) continue;
    seen.add(list.id);
    out.push(list);
  }
  return out;
}
