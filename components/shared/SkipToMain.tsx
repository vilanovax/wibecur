'use client';

/**
 * لینک پرش به محتوا — بعد از فعال‌سازی، فوکوس را روی `#main` می‌برد
 * (نه فقط اسکرول؛ مشکل کیبورد: فوکوس روی BODY می‌ماند).
 */
export default function SkipToMain() {
  return (
    <a
      href="#main"
      className="skip-link"
      onClick={(event) => {
        event.preventDefault();
        const main = document.getElementById('main');
        if (!main) return;
        if (!main.hasAttribute('tabindex')) {
          main.tabIndex = -1;
        }
        main.focus({ preventScroll: false });
        main.scrollIntoView({ block: 'start' });
      }}
    >
      رفتن به محتوای اصلی
    </a>
  );
}
