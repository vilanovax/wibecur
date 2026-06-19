const INTERESTS_KEY = 'wibe_home_interests';
const ONBOARDING_DONE_KEY = 'wibe_home_onboarding_done';

export function getHomeInterests(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(INTERESTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((s): s is string => typeof s === 'string' && s.length > 0);
  } catch {
    return [];
  }
}

export function setHomeInterests(slugs: string[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(INTERESTS_KEY, JSON.stringify(slugs.slice(0, 3)));
}

export function isHomeOnboardingDone(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(ONBOARDING_DONE_KEY) === '1';
}

export function markHomeOnboardingDone(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ONBOARDING_DONE_KEY, '1');
}

export function clearHomeOnboardingForDev(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(INTERESTS_KEY);
  localStorage.removeItem(ONBOARDING_DONE_KEY);
}
