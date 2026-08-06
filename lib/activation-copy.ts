/**
 * Copy واحد مسیر فعال‌سازی Consumer:
 * StartStrip (علاقه‌مندی) → empty «برای تو» / ذخیره → اکسپلور / لیست‌ها
 */

export const ACTIVATION = {
  startStrip: {
    eyebrow: 'شروع سریع',
    title: '۳ تا از علاقه‌مندی‌ات را انتخاب کن',
    description: 'فید «برای تو» بر اساس انتخاب‌هایت پر می‌شود',
    continueWith: 'ادامه با انتخاب‌ها',
    continueWithout: 'ادامه بدون انتخاب',
    skip: 'رد کردن',
    createList: 'اولین لیستت را بساز',
  },
  forYouEmpty: {
    guestTitle: 'برای شروع کاوش کن',
    userTitle: 'چند لیست انتخاب کن',
    guestDescription:
      'لیست‌های کیوریتد را ببین و بعد از ورود، ذخیره کن تا پیشنهاد شخصی بگیری.',
    userDescription:
      'چند لیست ذخیره کن تا پیشنهادات دقیق‌تر بر اساس سلیقه‌ات ببینی.',
    primary: 'مشاهده همه لیست‌ها',
    primaryHref: '/lists',
    guestSecondary: 'ورود',
    userSecondary: 'ساخت اولین لیست',
  },
  savedEmpty: {
    title: 'هنوز چیزی ذخیره نکردی',
    description:
      'از همین لیست‌های محبوب شروع کن — با یک ذخیره، فیدت شخصی‌تر می‌شود.',
    primary: 'دیدن لیست‌های ترند',
    primaryHref: '/lists?mode=trending',
    guestSecondary: 'ورود برای ذخیره',
    userSecondary: 'اولین لیستت را بساز',
    footer: 'ذخیره‌ها در پروفایلت هم قابل دسترسی‌اند',
  },
  exploreTeaser: {
    title: 'امروز دنبال چه وایبی هستی؟',
    description: 'کشف بر اساس حال‌وهوا در اکسپلور',
    href: '/explore',
  },
} as const;
