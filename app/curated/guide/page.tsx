import Header from '@/components/mobile/layout/Header';
import BottomNav from '@/components/mobile/layout/BottomNav';

export default function CuratedGuidePage() {
  return (
    <div className="bg-background">
      <Header title="چگونه کیوریتور شویم؟" showBack />
      <div className="mx-auto max-w-md p-4">
        <h1 className="font-bold wibe-caption text-foreground mb-4">
          چگونه کیوریتور شویم؟
        </h1>
        <p className="wibe-caption text-muted-foreground leading-relaxed">
          کیوریتور بودن یعنی لیست‌هایی با سلیقه و تخصص بسازی که دیگران از آن‌ها
          لذت ببرند. برای شروع:
        </p>
        <ul className="mt-4 space-y-2 wibe-caption text-muted-foreground">
          <li className="flex gap-2">
            <span className="text-brand">۱.</span>
            لیست‌های موضوعی و حرفه‌ای بساز
          </li>
          <li className="flex gap-2">
            <span className="text-brand">۲.</span>
            توضیحات واضح و جذاب بنویس
          </li>
          <li className="flex gap-2">
            <span className="text-brand">۳.</span>
            با مخاطبانت تعامل کن
          </li>
        </ul>
        <p className="mt-6 wibe-small text-muted-foreground">
          به زودی راهنمای کامل کیوریتورها اینجا قرار می‌گیرد.
        </p>
      </div>
      <BottomNav />
    </div>
  );
}
