═══════════════════════════════════════════════════════════
VERDICT: Fail

Persona: sara-new-user-onboarding (سارا تست آنبوردینگ — لاگین، ۰ ذخیره، موبایل‌اول)
Surfaces audited: `/` guest + new-user mobile 390×844 + desktop 1440×900 + `/login?source=bookmark_gate`
Interaction Manifest: complete (focused usability plan Tasks 1–8)

Hard Gates: console errors 0 observed · warnings 0 observed · network 5xx 0 · axe Critical 0 · axe Serious 0 · layout-collapse 0
Performance (on `/`): LCP not hard-measured this run (pragmatic gate deferred); CLS ~0

Findings:
  Critical: 0    High: 2    Medium: 4    Low: 2

Self-critique pass: Drafted: 9  Kept: 8  Generic: 1  Duplicate: 0

Time: Phase 3 ~25m / Total ~35m
Manifest plausibility: 18+ interactions, screenshots ≥13, gaps >0.5s

TOP 5:
  1. F-01 For You after interests is cafe-only — activation promise breaks
  2. F-02 Create CTA vanishes after first save; no BottomNav +
  3. F-03 «۳ تا انتخاب کن» با فقط ۳ چیپ — اجباری حس می‌شود
  4. F-04 Guest cold start (no strip / For You / soft-empty)
  5. F-05 For You tab hides personalization subtitle (embedded)
═══════════════════════════════════════════════════════════

# Usability walkthrough — آنبوردینگ هوم وایب

**Date:** 2026-08-09  
**URL:** http://localhost:3000  
**Method:** ux-audit skill × usability-test-plan (moderated think-aloud simulation, live app)  
**Account:** `09120000099` / سارا تست آنبوردینگ · localStorage cleared before Segment A  
**Screenshots:** `.impeccable/ux-audit/2026-08-09-onboarding-usability/screenshots/`

## Persona (locked)

سارا، کاربر تازه‌کار فارسی‌زبان، عصر جمعه، موبایل‌اول. تازه شنیده وایب جای لیست فیلم/کافه/کتاب است. حوصلهٔ اصطلاحات داخلی ندارد. می‌خواهد در ۲–۳ دقیقه بفهمد از کجا شروع کند، علاقه بزند، و اولین ارزش (ذخیره یا ساخت) را بگیرد.

همراه: first-time-user lens روی هر flow.

---

## Task scorecard (pilot n=1 agent-as-Sara)

| Task | Result | Time (approx) | SEQ (agent) | Notes / codes |
|------|--------|---------------|-------------|----------------|
| 1 First impression | **S** | <1m | 6 | نام می‌برد: انتخاب علاقه، ترند، ذخیره، ساخت — strip در first viewport |
| 2 Interest onboarding | **S** | <1m | 6 | ۳ چیپ → «ادامه با انتخاب‌ها» → نوار بسته؛ `interests` + `onboarding_done=1` |
| 3 For You personalization | **F** | <2m | 3 | تب پیدا شد + nudge ذخیره؛ ولی فقط کافه — `FORYOU_≠_TREND` |
| 4 First save | **S** | <1m | 6 | بوکمارک هیرو → `aria-pressed` / «حذف از ذخیره‌ها»؛ سکشن ذخیره‌شده‌ها بعد reload واقعی شد |
| 5 Create first list | **S*** | ~2m | 5 | از CTA نوار → sheet «وایـب جدید بساز» → دسته → فرم «لیست جدید». *بعد از اولین ذخیره CTA نوار غیب می‌شود* |
| 6 Guest save → login | **S** | <1m | 6 | «ورود برای ذخیره» → `/login?callbackUrl=/&source=bookmark_gate` |
| 7 Soft-empty saved | **S** | <1m | 6 | «ذخیره‌شده‌های تو» + badge پیشنهاد + اکشن ترندها |
| 8 Desktop mood + For You | **S** | <2m | 6 | «بر اساس حال‌وهوا» در سایدبار؛ Start strip دسکتاپ قابل کشف |

**Activation proxy (this session):** interest saved ✅ · first bookmark ✅ (سپس برای تست create پاک شد) · create sheet opened ✅ → ≥۸۰٪ هدف pilot

**Observational ticks**
- [x] Start strip seen in first viewport (logged-in new)
- [x] Understood max 3 interests (copy واضح؛ اما فقط ۳ گزینه)
- [ ] Distinguishes ترند vs برای تو *(محتوا بعد از علاقه متمایز نیست)*
- [x] Found save control without help
- [x] Create sheet from home (while strip visible)
- [x] Guest expected login / not unfair block

---

## INTERACTION MANIFEST — `/` onboarding

Persona: sara-new-user-onboarding · Device: 390×844 then 1440×900

```
[✓] Guest: open / — no Start strip, no For You tabs, save = login gate
[✓] Screenshot 02-guest-home-no-start-strip.png
[✓] Click «ورود برای ذخیره لیست» → /login?callbackUrl=/&source=bookmark_gate
[✓] Screenshot 03-guest-save-login-gate.png
[✓] Login 09120000099 → callback /
[✓] clear localStorage onboarding keys + reload
[✓] Screenshot 04-newuser-home-start-strip.png — strip + Create CTA + soft-empty
[✓] Select فیلم / کتاب / کافه — CTA flips to «ادامه با انتخاب‌ها»
[✓] Click continue — strip dismisses; LS done=1 interests=[movies,bookspodcast,cafe]
[✓] Tab «پیشنهاد برای تو» — nudge + cafe-only cards
[✓] Screenshot 06-for-you-after-interests.png
[✓] API GET /api/lists/home/for-you?interests=movies,bookspodcast,cafe → 8/8 cafe
[✓] Save featured list — control → «حذف از ذخیره‌ها»
[✓] Screenshot 08-saved-section-after-save.png — real saved row
[✓] Reset LS + 0 bookmarks → strip returns → «اولین لیستت را بساز»
[✓] Create sheet → category chips → form «عنوان لیست *»
[✓] Screenshots 10–11 create flow
[✓] Desktop 1440: mood sidebar + Start strip
[✓] Screenshot 13-desktop-home-mood.png
[✓] axe.run: Critical 0, Serious 0
```

---

## Research answers

1. **Interest strip:** بله برای لاگینِ بدون‌ذخیره — واضح، قابل تکمیل. کپی «۳ تا» با فقط ۳ چیپ از API مشکل اعتماد می‌سازد.
2. **For You personalization:** تب پیدا می‌شود؛ حس شخصی‌سازی **نه** — خروجی عملاً ترند/کافه است حتی با ۳ علاقه.
3. **First save:** از هیرو/ترند واضح است؛ کنترل bookmark در first viewport.
4. **Create CTA:** وقتی strip هست کشف‌پذیر است و فرم گیج‌کننده نیست. بعد از اولین ذخیره مسیر هوم برای create **دفن** می‌شود (BottomNav بدون +).
5. **Guest:** نبود strip + گیت لاگین شفاف است (فریب نیست) ولی صفحه «شروع» ندارد → ریسک ترک/اسکرول بی‌هدف (`STRIP_MISSED` برای مهمان).

---

## Findings

### High

#### F-01 — For You بعد از انتخاب علاقه فقط کافه می‌آید
- **Layer:** Interaction / Feedback  
- **Surface:** `/` · تب برای تو · 390×844  
- **Persona:** سارا  
- **Reproduce:**  
  1. لاگین کاربر ۰-bookmark، LS clear  
  2. هر ۳ علاقه را انتخاب کن و ادامه بده  
  3. تب «برای تو» را باز کن  
  4. `GET /api/lists/home/for-you?interests=movies,bookspodcast,cafe`  
- **Observed:** ۸/۸ لیست `cat=cafe`؛ هیچ فیلم/کتابی در فید.  
- **Expected:** ترکیب علاقه‌ها یا حداقل یک لیست از هر slug انتخاب‌شده.  
- **Evidence:** `06-for-you-after-interests.png` · API sample cafe-only  
- **Suspected location:** `lib/home-recommendations.ts` (+ `app/api/lists/home/for-you/route.ts`)  
- **Smallest patch:** در `getHomeRecommendationsForUser` برای هر interest slug سهم سقف‌دار (round-robin) بگیر؛ اگر slug خالی بود از trending همان دسته پر کن.

#### F-02 — CTA ساخت بعد از اولین ذخیره غیب می‌شود
- **Layer:** Architecture / Interaction  
- **Surface:** `/` mobile · بعد از bookmark>0  
- **Reproduce:** ذخیره یک لیست → strip برنمی‌گردد حتی با clear کردن `wibe_home_onboarding_done` چون `isNewUser = !hasSaves`. BottomNav هم دکمه + ندارد.  
- **Observed:** تنها مسیر create از هوم = Start strip برای کاربر بدون ذخیره.  
- **Expected:** مسیر پایدار create از هوم (strip ثانویه یا + در nav) بعد از activation.  
- **Evidence:** `08-saved-section-after-save.png` بدون create CTA؛ `BottomNav.tsx` فقط ۴ لینک  
- **Suspected location:** `HomeStartStrip.tsx` (`isNewUser` gate) · `components/mobile/layout/BottomNav.tsx`  
- **Smallest patch:** CTA «لیست بساز» پایدار در soft-empty/saved header یا دکمه مرکزی BottomNav که `openHomeCreateSheet` را صدا بزند.

### Medium

#### F-03 — کپی «۳ تا انتخاب کن» با ۳ چیپ کل کاتالوگ
- **Layer:** Feedback  
- **Evidence:** `/api/categories` → ۳ آیتم؛ strip همان ۳ را نشان می‌دهد  
- **Suspected:** seed/categories + `ACTIVATION.startStrip.title`  
- **Patch:** یا چیپ‌های ریزتر (≥۶) یا کپی «تا ۳ علاقه انتخاب کن».

#### F-04 — مهمان: بدون Start strip / For You / soft-empty
- **Layer:** Architecture  
- **Evidence:** `02-guest-home-no-start-strip.png` · DOM: `startStrip:false`, `tabs:[]`, `savedHeader:false`  
- **Suspected:** `HomeStartStrip` + `HomeFeedTabs` guest gating · `HomeMobileView` hides saved for guest  
- **Patch:** guest teaser strip (بدون persist) یا sticky «شروع با انتخاب حال‌وهوا / ورود برای برایِ تو».

#### F-05 — زیرعنوان شخصی‌سازی در تب موبایل دیده نمی‌شود
- **Layer:** Feedback  
- **Observed:** در `ForYouSection` وقتی `embedded` است `HomeSectionTitle` رندر نمی‌شود → سارا فقط nudge ذخیره می‌بیند.  
- **Suspected:** `components/mobile/home/ForYouSection.tsx` (~L76–85)  
- **Patch:** یک خط subtitle داخل تب embedded وقتی `interests.length > 0`.

#### F-06 — Create sheet: «اضافه کردن آیتم» کنار «ساخت لیست»
- **Layer:** Interaction  
- **Evidence:** `10-create-sheet-open.png`  
- **Risk:** قاطی شدن با Task 5 fail mode پلن  
- **Patch:** برای new-user از CTA نوار مستقیم به wizard لیست برو (skip hub سه گزینه‌ای) یا «افزودن آیتم» را secondary کن.

### Low

#### F-07 — Badge «شروع» روی ترند
- کمک راهبری یا نویز؟ در pilot کمک کرد ترند را به‌عنوان نقطه شروع ببینیم؛ نگه دارید مگر heatmaps بگوید نادیده گرفته می‌شود.

#### F-08 — Session drop هنگام پرش viewport guest/desktop
- یک بار بعد از resize/navigate هدر «ورود» نشان داد (احتمالاً hydration/auth flicker — مرتبط با F-07 audit قبلی). مانیتور کنید.

---

## Hard-gate scorecard

| Gate | Result |
|------|--------|
| Console errors | Pass (0 observed) |
| Console warnings | Pass (0 observed) |
| Network 5xx | Pass |
| axe Critical / Serious | Pass (0 / 0) |
| Layout collapse @390 | Pass |
| Manifest complete | Pass (focused) |
| LCP < 4s | Not scored this run |

---

## Perfection roadmap

### Quick wins (24–48h)
1. کپی strip: «تا ۳ علاقه» + شمارنده `n/3`  
2. Subtitle داخل تب For You وقتی interest هست  
3. Create hub: برای منبع `start_strip` مستقیم به category → form  

### Structural (1–2 weeks)
1. **Fix For You mixing** across interest slugs (F-01)  
2. **Persistent create entry** پس از activation (F-02)  
3. Guest activation teaser (F-04)  
4. Categories seed ≥۶–۸ برای onboarding chips  

### Advanced
- Personalization reason chips روی کارت For You (`getForYouReasonLabel` را در UI نشان بده)  
- Soft-empty → real-saved transition animation بدون نیاز به full reload  

---

## Executive (۱ صفحه)

مسیر لاگینِ تازه‌کار **تا انتخاب علاقه و اولین ذخیره کار می‌کند**؛ گیت مهمان هم صادقانه است. شکست اصلی activation این است که وعدهٔ «برای تو بر اساس انتخاب‌هایت» در API/فید **عملاً فقط کافه** برمی‌گردد — سارا حس شخصی‌سازی نمی‌گیرد. دوم اینکه بعد از اولین ذخیره، CTA ساخت از هوم ناپدید می‌شود و BottomNav مسیر create ندارد. این دو را برای اسپرینت بعدی اولویت دهید؛ بقیه polish است.

**Hold this in your hands:** صفحهٔ هوم برای سارا مثل یک ویترین خوب است که یک راهنما بالای در ایستاده («۳ علاقه انتخاب کن») و یک قفسهٔ «پیشنهاد» برای ذخیره‌خالی دارد — اما وقتی علاقه می‌زند قفسهٔ «برای تو» همان ویترین کافه را تکرار می‌کند، و بعد از اولین بوکمارک راهنمای ساخت لیست غیب می‌شود. محصول را نگه می‌داری؛ به آن اعتماد کامل برای «این مخصوص منه» هنوز نه.

---

## Next

> Found **2 High** (F-01, F-02) and **4 Medium**. Fix them now and re-verify?

اگر بگویی بله، اول F-01 (for-you mix) و F-02 (create entry پایدار) را پچ می‌کنم و همان تسک‌های ۲–۵ را دوباره walk می‌کنم.
