/** زیرعنوان قابل‌نمایش برای کارت لیست در browse */
export function isDisplayableDescription(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length < 4) return false;

  const persianLetters = (trimmed.match(/[\u0600-\u06FF]/g) || []).length;
  const latinLetters = (trimmed.match(/[a-zA-Z]/g) || []).length;
  const letterCount = persianLetters + latinLetters;

  if (letterCount < trimmed.length * 0.35) return false;

  // توضیح کاملاً انگلیسی در UI فارسی — در browse نشان نده
  if (latinLetters >= 8 && persianLetters < 3) return false;

  return true;
}

export function getListCardSubtitle(list: {
  description?: string | null;
  subtitle?: string | null;
  categories?: { name: string; icon?: string | null } | null;
  category?: { name: string; icon?: string | null } | null;
}): string | null {
  const desc = list.description?.trim() ?? list.subtitle?.trim();
  if (desc && isDisplayableDescription(desc)) return desc;

  const cat = list.categories ?? list.category;
  if (cat?.name) {
    return `${cat.icon ? `${cat.icon} ` : ''}${cat.name}`;
  }

  return null;
}
