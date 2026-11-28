import { CAFE_DISCOVERY_TOPICS } from '@/lib/category-discovery/cafe-catalog';
import { normalizeDiscoveryText, textIncludesPhrase } from '@/lib/category-discovery/normalize';

const AREA_LABELS = CAFE_DISCOVERY_TOPICS.filter((t) => t.dimension === 'area').map(
  (t) => t.label
);

const EXTRA_NEIGHBORHOODS = [
  'سعادت‌آباد',
  'ونک',
  'جردن',
  'پاسداران',
  'تجریش',
  'نیاوران',
  'فرمانیه',
  'اندرزگو',
  'ولیعصر',
  'ستارخان',
  'گاندی',
  'اقدسیه',
  'قیطریه',
  'شهرک غرب',
  'بام‌لند',
  'بلوار دریا',
  'امیرآباد',
  'مطهری',
  'میرداماد',
  'آرژانتین',
  'فردوسی',
  'کریمخان',
  'هفت‌تیر',
  'امیراتابک',
  'مجیدیه',
  'والفجر',
  'کاوه',
  'یوسف‌آباد',
  'زعفرانیه',
  'شریعتی',
  'الهیه',
  'پونک',
  'تهرانپارس',
  'نارمک',
  'مرزداران',
];

/** نگاشت رسمی محله → پهنه (برای بات و بک‌فیل) */
export const AREA_TO_REGION: Record<string, string> = {
  نیاوران: 'شمال تهران',
  تجریش: 'شمال تهران',
  زعفرانیه: 'شمال تهران',
  الهیه: 'شمال تهران',
  فرمانیه: 'شمال تهران',
  اقدسیه: 'شمال تهران',
  قیطریه: 'شمال تهران',
  اندرزگو: 'شمال تهران',
  پاسداران: 'شمال تهران',
  جردن: 'شمال تهران',
  میرداماد: 'شمال تهران',
  ونک: 'شمال تهران',
  لواسان: 'شمال تهران',
  شریعتی: 'شمال تهران',
  کاوه: 'شمال تهران',
  سعادت‌آباد: 'غرب تهران',
  'شهرک غرب': 'غرب تهران',
  پونک: 'غرب تهران',
  ستارخان: 'غرب تهران',
  مرزداران: 'غرب تهران',
  'بلوار دریا': 'غرب تهران',
  'بام‌لند': 'غرب تهران',
  تهرانپارس: 'شرق تهران',
  نارمک: 'شرق تهران',
  مجیدیه: 'شرق تهران',
  والفجر: 'شرق تهران',
  امیراتابک: 'شرق تهران',
  فردوسی: 'مرکز تهران',
  کریمخان: 'مرکز تهران',
  'هفت‌تیر': 'مرکز تهران',
  آرژانتین: 'مرکز تهران',
  گاندی: 'مرکز تهران',
  مطهری: 'مرکز تهران',
  امیرآباد: 'مرکز تهران',
  ولیعصر: 'مرکز تهران',
  'یوسف‌آباد': 'مرکز تهران',
};

const ALL_AREA_CANDIDATES = [...new Set([...AREA_LABELS, ...EXTRA_NEIGHBORHOODS])];

/** استخراج محله/پهنه برای فیلتر نتایج */
export function extractPlaceAreaLabel(input: {
  title?: string | null;
  area?: string | null;
  region?: string | null;
  address?: string | null;
}): string | null {
  const area = input.area?.trim();
  if (area) return area;
  const region = input.region?.trim();
  if (region && !/^تهران$|^شیراز$|^مشهد$|^اصفهان$|^تبریز$/i.test(region)) {
    return region;
  }

  const blob = [input.title, input.address, input.region].filter(Boolean).join(' ');
  if (!blob.trim()) return null;

  // اول عبارات طولانی‌تر (غرب تهران قبل از غرب)
  const sorted = [...ALL_AREA_CANDIDATES].sort((a, b) => b.length - a.length);
  for (const label of sorted) {
    if (textIncludesPhrase(blob, label)) return label;
  }

  // پرانتز انتهای عنوان: «مین چیک (سعادت‌آباد)»
  const paren = input.title?.match(/[(\u060C]([^)\u060D]+)[)\u060D]\s*$/);
  if (paren?.[1]?.trim() && paren[1].trim().length <= 24) {
    return paren[1].trim();
  }

  return null;
}

export type AreaFacet = { label: string; count: number };

export function buildAreaFacets(
  places: Array<{ areaLabel: string | null | undefined }>,
  max = 8
): AreaFacet[] {
  const counts = new Map<string, number>();
  for (const p of places) {
    const label = p.areaLabel?.trim();
    if (!label) continue;
    const key = normalizeDiscoveryText(label);
    if (!key) continue;
    // canonical display: first seen label with same normalized key
    const existing = [...counts.keys()].find((k) => normalizeDiscoveryText(k) === key);
    if (existing) counts.set(existing, (counts.get(existing) ?? 0) + 1);
    else counts.set(label, 1);
  }
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'fa'))
    .slice(0, max);
}
