export const PERSONA_FIRST_NAMES = [
  'رامین', 'سارا', 'علی', 'مینا', 'حسین', 'نیلوفر', 'امیر', 'پریسا',
  'محمد', 'شادی', 'رضا', 'مریم', 'دانیال', 'یاسمین', 'کامران', 'الهام',
  'پویا', 'نازنین', 'مهدی', 'زهرا', 'آرش', 'سمیرا', 'بهرام', 'لیلا',
  'کیان', 'مهسا', 'فرهاد', 'نرگس', 'سینا', 'آیدا', 'امیرحسین', 'ترانه',
  'بابک', 'گلناز', 'پیمان', 'شیما', 'آرمان', 'هانیه', 'سهیل', 'مبینا',
  'کاوه', 'رؤیا', 'نیما', 'پگاه', 'سروش', 'نیلو', 'آرین', 'مونا',
  'پارسا', 'الناز', 'حامد', 'فاطمه', 'مجید', 'سمیه', 'جواد', 'مژگان',
  'امید', 'شیرین', 'وحید', 'نسرین', 'سعید', 'مینو', 'حسام', 'آتوسا',
] as const;

export const PERSONA_SURNAMES = [
  'احمدی', 'محمدی', 'حسینی', 'رضایی', 'کریمی', 'موسوی', 'جعفری', 'نوری',
  'صادقی', 'اکبری', 'رحیمی', 'قاسمی', 'ملکی', 'زارعی', 'باقری', 'شریفی',
  'توکلی', 'فرهادی', 'نظری', 'امینی', 'حیدری', 'علی‌پور', 'میرزایی', 'کاظمی',
  'سلطانی', 'یزدانی', 'فلاح', 'پورمحمدی', 'نجفی', 'خانی', 'رستمی', 'غلامی',
  'شاهینی', 'عباسی', 'مرادی', 'طاهری', 'بهرامی', 'اسدی', 'جمشیدی', 'لواسانی',
] as const;

const USERNAME_STYLES = ['dot', 'underscore', 'short'] as const;

function shuffle<T>(arr: readonly T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

function transliterateFirstChar(name: string): string {
  const map: Record<string, string> = {
    ا: 'a', آ: 'a', ب: 'b', پ: 'p', ت: 't', ث: 's', ج: 'j', چ: 'ch',
    ح: 'h', خ: 'kh', د: 'd', ذ: 'z', ر: 'r', ز: 'z', ژ: 'zh', س: 's',
    ش: 'sh', ص: 's', ض: 'z', ط: 't', ظ: 'z', ع: 'a', غ: 'gh', ف: 'f',
    ق: 'gh', ک: 'k', گ: 'g', ل: 'l', م: 'm', ن: 'n', و: 'v', ه: 'h',
    ی: 'y', ء: '',
  };
  const ch = name.charAt(0);
  return map[ch] ?? 'u';
}

export function buildPersonaDisplayName(index: number, firstNames?: string[], surnames?: string[]): string {
  const fn = firstNames ?? [...PERSONA_FIRST_NAMES];
  const sn = surnames ?? [...PERSONA_SURNAMES];
  const firstName = fn[index % fn.length]!;
  const surname = sn[(index * 7 + 3) % sn.length]!;
  return `${firstName} ${surname}`;
}

export function buildPersonaUsername(firstName: string, surname: string, suffix: string): string {
  const style = USERNAME_STYLES[Math.floor(Math.random() * USERNAME_STYLES.length)]!;
  const latinFirst = transliterateFirstChar(firstName);
  const latinSur = transliterateFirstChar(surname);
  if (style === 'dot') return `${latinFirst}${latinSur}.${suffix}`.slice(0, 30);
  if (style === 'underscore') return `${latinFirst}_${suffix}`.slice(0, 30);
  return `user_${suffix}`.slice(0, 30);
}

export function getPersonaAvatarUrl(displayName: string, seed: number): string {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random&color=fff&size=128&bold=true&format=png&seed=${seed}`;
}

export function generatePersonaNameBatch(count: number): { displayName: string; firstName: string; surname: string }[] {
  const firstNames = shuffle(PERSONA_FIRST_NAMES);
  const surnames = shuffle(PERSONA_SURNAMES);
  const result: { displayName: string; firstName: string; surname: string }[] = [];
  for (let i = 0; i < count; i++) {
    const firstName = firstNames[i % firstNames.length]!;
    const surname = surnames[(i * 11 + 5) % surnames.length]!;
    result.push({ displayName: `${firstName} ${surname}`, firstName, surname });
  }
  return result;
}
