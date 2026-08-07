/**
 * سریال‌سازی امن JSON-LD برای تزریق داخل <script type="application/ld+json">.
 *
 * JSON.stringify کاراکترهای `<`, `>`, `&` و جداکننده‌های خط U+2028/U+2029 را escape نمی‌کند.
 * داخل یک عنصر <script> پارسر HTML با دیدن دنبالهٔ `</script` بلاک اسکریپت را می‌بندد،
 * پس مقادیر کاربرپسند (مثل name/bio پروفایل) می‌توانند منجر به XSS ذخیره‌شده شوند.
 * این تابع آن کاراکترها را به معادل یونی‌کدِ امن تبدیل می‌کند (JSON همچنان معتبر می‌ماند).
 */
const UNSAFE_JSON_LD = new RegExp('[<>&\\u2028\\u2029]', 'g');

export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(UNSAFE_JSON_LD, (ch) => {
    const code = ch.charCodeAt(0).toString(16).padStart(4, '0');
    return `\\u${code}`;
  });
}
