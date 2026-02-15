import Header from '@/components/mobile/layout/Header';
import BottomNav from '@/components/mobile/layout/BottomNav';

export default function CuratedGuidePage() {
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header title="چگونه کیوریتور شویم؟" showBack />
      <div className="p-4 max-w-[428px] mx-auto">
        <h1 className="font-bold text-[18px] text-gray-900 mb-4">
          چگونه کیوریتور شویم؟
        </h1>
        <p className="text-[14px] text-gray-600 leading-relaxed">
          کیوریتور بودن یعنی لیست‌هایی با سلیقه و تخصص بسازی که دیگران از آن‌ها
          لذت ببرند. برای شروع:
        </p>
        <ul className="mt-4 space-y-2 text-[14px] text-gray-600">
          <li className="flex gap-2">
            <span className="text-primary">۱.</span>
            لیست‌های موضوعی و حرفه‌ای بساز
          </li>
          <li className="flex gap-2">
            <span className="text-primary">۲.</span>
            توضیحات واضح و جذاب بنویس
          </li>
          <li className="flex gap-2">
            <span className="text-primary">۳.</span>
            با مخاطبانت تعامل کن
          </li>
        </ul>
        <p className="mt-6 text-[13px] text-gray-500">
          به زودی راهنمای کامل کیوریتورها اینجا قرار می‌گیرد.
        </p>
      </div>
      <BottomNav />
    </div>
  );
}
