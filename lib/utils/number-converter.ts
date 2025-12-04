/**
 * Convert Persian/Farsi digits to English digits
 */
export function persianToEnglish(str: string): string {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  const englishDigits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

  let result = str;
  for (let i = 0; i < persianDigits.length; i++) {
    result = result.replace(new RegExp(persianDigits[i], 'g'), englishDigits[i]);
  }

  // Also handle Arabic-Indic digits
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  for (let i = 0; i < arabicDigits.length; i++) {
    result = result.replace(new RegExp(arabicDigits[i], 'g'), englishDigits[i]);
  }

  return result;
}

/**
 * Convert Persian/Jalali year to Gregorian year
 * Simple conversion: Jalali year + 621 (approximate, may vary by month)
 */
export function jalaliToGregorian(jalaliYear: number): number {
  // Jalali years are typically between 1300-1500
  // Add 621 to get approximate Gregorian year
  // More accurate: add 621 if before month 7, add 622 if month 7 or after
  // For simplicity, we'll use 621.5 average
  return Math.round(jalaliYear + 621);
}

/**
 * Check if a year is likely a Jalali year (between 1200-1500)
 * Also accept years between 1200-1300 as they might be early Jalali years
 */
export function isJalaliYear(year: number): boolean {
  return year >= 1200 && year < 1500;
}

/**
 * Parse and convert year input (handles Persian digits and Jalali years)
 */
export function parseYear(input: string): number | null {
  if (!input || !input.trim()) {
    return null;
  }

  // Convert Persian digits to English
  const englishInput = persianToEnglish(input.trim());

  // Remove any non-digit characters (except minus sign)
  const cleaned = englishInput.replace(/[^\d-]/g, '');

  if (!cleaned) {
    return null;
  }

  const year = parseInt(cleaned, 10);

  if (isNaN(year)) {
    return null;
  }

  // If it's a Jalali year (1200-1500), convert to Gregorian
  if (isJalaliYear(year)) {
    return jalaliToGregorian(year);
  }

  // Accept any year (no minimum restriction, as user requested)
  return year;
}

