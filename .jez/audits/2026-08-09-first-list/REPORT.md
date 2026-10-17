═══════════════════════════════════════════════════════════
VERDICT: Fail

Persona: iranian-first-curated-list-creator
Surfaces audited: 4 / 4 routes (`/`, `/explore`, `/lists`, `/lists/[slug]`) + create path via `/profile`
Interaction Manifest: complete (typed search ×2, create form submit, list detail open, mood/search modals)

Hard Gates: console errors 0 (reportable), warnings 0, network 5xx 0, 403/404 auth 0, layout-collapse 1 (cold-start CSS), axe Critical 0, axe Serious 1   (CSS chunk 404 allowlisted: none — no audit-config)
Performance (on `/`, unthrottled): LCP n/a(0 buffered) / CLS 0.006 / INP n/a — loadComplete 402ms, TTFB 198ms — thresholds 4.0s / 0.25 / 500ms

Findings:
  Critical: 1    High: 10    Medium: 4    Low: 2

Self-critique pass (sub-agent): Drafted: 19  Kept: 13  Generic: 6  Duplicate: 0
(Hard-gate C1 + H6 retained despite GENERIC mark — gates cannot be dropped.)

Time per phase: Phase 3 ~9m / Total ~12m
Manifest plausibility: 18+ entries, median gap >2s, screenshots ≥2/route, console reads ≥1/route

TOP 5 (ranked by impact × ease, senior-designer pick):
  1. H1 Create CTA missing on home/explore/lists — first creator never finds the job
  2. H4 Post-create drops user on public filter with no next-step to add items
  3. H10 `isNewUser=!hasSaves` hides create onboarding for savers who never created
  4. H3 Search chips leak English scenario IDs (`staying_in` / `bored`)
  5. C1 Cold-start CSS 404 collapses home (absolute covers block all clicks)
═══════════════════════════════════════════════════════════

## Persona Lock

**Slug:** `iranian-first-curated-list-creator`

| Field | Value |
|---|---|
| Role | کاربر ایرانی که می‌خواهد اولین لیست کیوریتد خودش را بسازد |
| Tech comfort | متوسط — موبایل‌فرست، با وب اپ‌های ایرانی آشنا |
| Time pressure | متوسط — ۱۰–۱۵ دقیقه برای «یه لیست درست کنم» |
| Emotional state | کنجکاو + کمی مردد؛ دنبال الگو از لیست‌های دیگران |
| Device | Desktop 1440×900 + spot-check mobile 375 |

**Session note:** Browser was already logged in as `@admin` / رامتینیو (۴۷→۴۸ لیست). First-time-user lens still applied; create-onboarding gates that depend on `isNewUser` were evaluated from that bias.

**First-time-user lens:** mandatory on all four surfaces.

---

## Sitemap (audited)

| Route | Purpose |
|---|---|
| `/` | Home — featured list, mood rails, trending |
| `/explore` | Mood/time discovery + hot lists |
| `/lists` | Browse/search curated lists |
| `/lists/[slug]` | List detail — items, share, manage |
| `/profile` | (reached for create) My lists + ایجاد لیست |

---

## Threads

1. **Discover → open a list** (home hero / explore card → detail)
2. **Search for cafe vibe** (Cmd+K + `/lists` search)
3. **Create first curated list** (find CTA → form → land on editable list)

---

## INTERACTION MANIFEST

```
INTERACTION MANIFEST — wibe consumer (first curated list)
  Persona: iranian-first-curated-list-creator
  Viewport start: 1440×900

  [✓] 17:01:19 Navigated http://localhost:3000/ — capability screenshot
  [✓] 17:01:46 Desktop home screenshot; CSS initially broken (chunk 404)
  [✓] 17:02:51 Queried create CTAs on home → none
  [✓] 17:03:17 Search click intercepted by full-viewport absolute <img> (cold CSS)
  [✓] 17:04:11 /explore loaded with correct CSS; mood cards visible
  [✓] 17:05:34 Cmd+K opened search; chips showed staying_in/bored/weekend
  [✓] 17:05:59 Typed «کافه دنج تهران» into searchbox → «۰ نتیجه / نتیجه‌ای پیدا نشد»
  [✓] 17:06:26 Closed search; navigated /explore
  [✓] 17:06:xx Clicked mood «خسته‌ای؟» → focus only, no URL/filter change observed
  [✓] 17:07:35 /lists — typed «کافه» into page search
  [✓] 17:07:36 Empty flash «نتیجه‌ای برای کافه نیست» + link «ساخت لیست جدید»
  [✓] 17:08:05 Later: 11 item results, broken thumbs, wrong parent list labels
  [✓] 17:08:xx Wrong slug 404; real slug /lists/films-i-that-do-bar-baid-did
  [✓] 17:09:19 List detail — clapperboard grid, titles in aria only; screenshot
  [✓] 17:10:10 /profile — «ایجاد لیست» visible (only clear create CTA found)
  [✓] 17:10:16 Opened create sheet; typed «کافه‌های دنج برای کار ریموت»
  [✓] 17:10:xx Clicked ایجاد → «در حال ایجاد...» → count ۴۷→۴۸; modal closed
  [✓] 17:10:xx Verified: stayed on /profile public filter; new private list not in visible links
  [✓] 17:xx axe on / : Critical 0, Serious 1 (color-contrast «همه»)
  [✓] Console hook: 0 reportable warnings/errors after healthy CSS load
  [✓] Network: CSS 2knu6ws1k3n34.css → 404 (cold); 2ag8ggjee00b8.css → 200
```

---

## Hard-gate scorecard

| Gate | Result | Notes |
|---|---|---|
| Console errors | 0 | After healthy load |
| Console warnings | 0 | |
| Network 5xx | 0 | |
| Auth 403/404 | 0 | |
| Layout collapse | **1** | Cold-start CSS → absolute images cover viewport |
| axe Critical | 0 | |
| axe Serious | **1** | `color-contrast` on `/` «همه» |
| LCP / CLS / INP | CLS green; LCP/INP inconclusive (0 buffered) | loadComplete 402ms |

---

## Findings

### C1 — Cold-start main CSS 404 collapses home
- **Layer:** Architecture
- **Severity:** Critical
- **Surface:** `/` @ 1440×900, first paint after `npm run start`
- **Persona:** Blocks any first action (search, nav, create)
- **Reproduce:**
  1. Fresh `PORT=3000 npm run start`
  2. Open `/` once
  3. Observe `link[rel=stylesheet]` → `.../2knu6ws1k3n34.css`
  4. Network: that file 404; Tailwind utilities inert
  5. Hero `img.absolute.inset-0` paints 1440×900; clicks on search intercepted
  6. Hard reload → loads `2ag8ggjee00b8.css` and recovers
- **Observed:** Parent `<a class="… relative … overflow-hidden">` computed `position:static; overflow:visible`
- **Expected:** Main CSS always present; containing block clips hero
- **Evidence:** CDP probe + click intercept + `curl` 404 vs 200 on sibling chunk
- **Suspected location:** `.next` asset hash drift / `scripts/prepare-standalone.mjs` race with SSR HTML refs
- **Smallest possible patch:** Fail `prestart` if HTML-referenced CSS files missing from `.next/standalone/.next/static/chunks`; add smoke assert in CI

### H1 — Create-list CTA invisible on primary discovery surfaces
- **Layer:** Interaction / Architecture
- **Severity:** High
- **Surface:** `/`, `/explore`, `/lists` @ 1440
- **Persona:** Core job = create first list; cannot find entry point without Profile knowledge
- **Reproduce:**
  1. From home/explore/lists, inventory `a,button` for ساخت/ایجاد لیست
  2. Observe zero matches on those routes
  3. Only `/profile` shows «ایجاد لیست»
- **Observed:** `ExploreBottomCTA` exists (`لیست خودت رو بساز`) but is never imported
- **Expected:** Persistent create affordance on home + explore + lists for logged-in users
- **Evidence:** CDP createish=[], ExploreBottomCTA grep = definition only
- **Suspected location:** `components/mobile/curated/ExploreBottomCTA.tsx` (dead); wire from `CuratedLandingPageClient` / home desktop chrome
- **Smallest possible patch:** Import `ExploreBottomCTA` on explore + add header «+ لیست» linking `openHomeCreateSheet()` on `/` and `/lists`

### H2 — Meaningful Persian cafe search returns zero in global search
- **Layer:** Interaction
- **Severity:** High
- **Surface:** Search overlay from `/`
- **Reproduce:** Cmd+K → type `کافه دنج تهران` → see «۰ نتیجه»
- **Observed:** Explore shows «کافه‌های دنج برای مطالعه»
- **Expected:** Fuzzy/token match on title tokens دنج/کافه
- **Evidence:** a11y tree empty state vs explore card `e14`
- **Suspected location:** search API / client query for command palette
- **Smallest possible patch:** Tokenize Persian queries; match substring on list titles; show explore fallback row

### H3 — Search chips leak English scenario IDs
- **Layer:** Delight / Interaction (first-time lens)
- **Severity:** High
- **Surface:** Search overlay chips
- **Reproduce:** Open search → read chips `[دستیار] شروع:staying_in|bored|weekend`
- **Expected:** Persian labels from `GUIDED_SCENARIOS` copy (مثل «خونه موندن»)
- **Evidence:** screenshot + snapshot refs e130–e132
- **Suspected location:** search chip renderer + `lib/discovery/guided-intent.ts`
- **Smallest possible patch:** Map scenario id → Persian label before render

### H4 — Create success does not surface the new list or next step
- **Layer:** Feedback / Interaction
- **Severity:** High
- **Surface:** `/profile` create sheet
- **Reproduce:**
  1. Profile → ایجاد لیست
  2. Title `کافه‌های دنج برای کار ریموت` → ایجاد
  3. Modal closes; stay on public filter; link to new list not in DOM
  4. Counts bump ۴۷→۴۸ / شخصی ۱→۲ only
- **Expected:** Switch to «شخصی», scroll to new list, or `router.push` to `/user-lists/[id]` with empty-state «اولین آیتم را اضافه کن»
- **Evidence:** CDP after create; `MyListsTab` `onSuccess` only `refetch()`
- **Suspected location:** `components/mobile/profile/tabs/MyListsTab.tsx:556-558`, `CreateListForm.tsx:112-115`
- **Smallest possible patch:** `onSuccess` → set visibilityFilter personal + navigate to new list id from API response

### H5 — List detail item grid is poster-less / title-less
- **Layer:** Visual
- **Severity:** High
- **Surface:** `/lists/films-i-that-do-bar-baid-did`
- **Reproduce:** Open featured list → item cards show only clapperboard + rank badge
- **Observed:** aria-labels have full bilingual titles; visuals do not
- **Expected:** Poster + title visible on each card
- **Evidence:** screenshot page-2026-08-09T13-39-19-959Z.png
- **Suspected location:** list detail item card / image resolver for movies
- **Smallest possible patch:** Render `title` under poster; fix broken image src fallback to show title text

### H6 — axe Serious color-contrast on home «همه»
- **Layer:** Visual / a11y
- **Severity:** High (hard gate)
- **Surface:** `/`
- **Reproduce:** axe.run() → `color-contrast` on `<a href="/lists?mode=trending">همه</a>`
- **Expected:** WCAG AA contrast
- **Evidence:** axe output serious:1
- **Suspected location:** trending section «همه» link classes `text-primary` on light surface
- **Smallest possible patch:** Darken link token or add underline + darker shade

### H9 — `/lists?q=کافه` empty-flash then item-heavy results
- **Layer:** Feedback
- **Severity:** High
- **Surface:** `/lists`
- **Reproduce:** Type کافه → first paint empty + «ساخت لیست جدید» → then items with broken images
- **Expected:** Stable skeleton; default tab favoring matching **lists**; working thumbs
- **Evidence:** sequential snapshots 17:07:35–17:08:05
- **Suspected location:** `app/lists/ListsPageClient.tsx` search state machine
- **Smallest possible patch:** Keep previous results until fetch settles; default to lists tab when list hits > 0

### H10 — Create onboarding gated on saves, not list ownership
- **Layer:** Architecture
- **Severity:** High
- **Surface:** `/` HomeStartStrip
- **Reproduce:** Read `isNewUser = isLoggedIn && !hasSaves`
- **Expected:** Show create strip until user has created ≥1 list (or explicit dismiss)
- **Evidence:** `hooks/useHomeUserState.ts:36`; strip null for saver-with-no-creates
- **Suspected location:** `hooks/useHomeUserState.ts`, `HomeStartStrip.tsx:43`
- **Smallest possible patch:** `isNewUser = isLoggedIn && createdListCount === 0`

### H11 — Home hero CTA click did not navigate
- **Layer:** Interaction
- **Severity:** High
- **Surface:** `/` hero «مشاهده لیست…»
- **Reproduce:** Click e17 → URL stays `/`, link focused only; direct nav to href works
- **Expected:** Client navigation to `/lists/films-i-that-do-bar-baid-did`
- **Evidence:** snapshot after click still on `/`
- **Suspected location:** `HomeHeroBannerLink` click handlers / overlay intercept
- **Smallest possible patch:** Ensure banner link is topmost hit target; remove competing pointer handlers

### H12 — Explore mood selection appears inert
- **Layer:** Interaction
- **Severity:** High
- **Surface:** `/explore` mood «خسته‌ای؟»
- **Reproduce:** Click mood → `active/focused` only; hot list titles unchanged; URL unchanged
- **Expected:** aria-pressed + filtered rows or guided results
- **Evidence:** CDP after click
- **Suspected location:** explore mood button handler in curated landing client
- **Smallest possible patch:** Wire click to guided scenario query + visual selected state

### M1 — English «view» in Persian list title
- **Layer:** Delight
- **Severity:** Medium
- **Surface:** explore/home cards «کافه‌های با view زیبا»
- **Smallest possible patch:** Rename to «کافه‌های با ویوی زیبا» or «چشم‌انداز زیبا»
- **Suspected location:** list seed/content title in DB

### M2 — Missing covers on `/lists` grid
- **Layer:** Visual
- **Severity:** Medium
- **Evidence:** featured + grid gray gradients
- **Smallest possible patch:** Ensure cover resolver fallback + regenerate missing assets

### M3 — Private-default create without clear publish path
- **Layer:** Feedback
- **Severity:** Medium
- **Surface:** create sheet copy «لیست خصوصی ساخته می‌شود…»
- **Expected:** One checkbox «عمومی بعد از افزودن ۳ آیتم» or step-2 publish CTA after create
- **Suspected location:** `CreateListForm.tsx:186`

### M4 — Item results show wrong parent list names
- **Layer:** Feedback
- **Severity:** Medium
- **Surface:** `/lists?q=کافه` item rows
- **Observed:** «کافه بوتیک» under «رستوران‌های دریایی و ماهی»
- **Smallest possible patch:** Join item→list correctly in search serializer

### L1 / L2 — axe minor/moderate
- image-redundant-alt (13), landmark nesting / duplicate main, page-has-heading-one on home
- **Smallest possible patch:** Single `main`; home `h1` visually hidden or brand; dedupe alt

---

## Scenario battery (condensed)

| # | Scenario | Result |
|---|---|---|
| 1 | First Contact | Fail — create path not discoverable on main surfaces |
| 2 | Interrupted Workflow | Partial — create form not draft-persisted (not fully tested) |
| 3 | Wrong Turn | 404 page recovery CTAs OK |
| 4 | Returning User | N/A for first-create persona |
| 5 | Keyboard | Cmd+K works; hero click unreliable |
| 6 | Heavy Data | Not seeded to 500 |
| 7 | Destructive | Not run (no delete) |
| 8 | Second User | Session was admin — incomplete for restricted role |
| 9 | Lifecycle | isNewUser gate fails saver-without-creates |
| 10 | Round-trip | Create → profile counts update; list not visible without filter change |
| 11 | Data Seasoning | Not run |

---

## Perfection Roadmap

### Quick Wins (24–48h)
- Wire Persian labels for search scenario chips (H3)
- Fix «همه» contrast (H6)
- Document title dedupe on `/lists` (H7)
- Show create `+` in desktop top nav
- Post-create navigate to new list (H4)

### Structural (1–2 weeks)
- CSS asset integrity check in `prepare-standalone` (C1)
- Search relevance for Persian tokens (H2/H9)
- List detail poster pipeline (H5)
- Dual mobile/desktop DOM strategy (H8)
- `isNewUser` definition fix (H10)

### Advanced Polish
- First-create checklist (title → 3 items → publish)
- Mood explorer live feedback (H12)
- Empty-state coaching on new private lists

---

## Hold this in your hands

As a physical object, Wibe’s discovery side feels like a well-printed magazine of Tehran vibes — warm Persian copy, mood cards, a cinematic featured list. But the moment you try to *make* something, the object turns into a locked display case: the create button is taped to the back (Profile), search sometimes shrugs at «کافه دنج», and after you finally scribble a private list title the page pretends nothing happened. I’d want to hold the magazine. I wouldn’t trust it yet as a notebook.

---

## Fix-and-verify offer

Found **1 Critical** and **10 High** issues (plus axe Serious hard-gate). Fix the Top 5 now and re-verify the create thread?
