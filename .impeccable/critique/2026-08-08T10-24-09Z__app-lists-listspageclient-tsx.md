---
target: /lists ListsPageClient
total_score: 24
max_score: 40
na_heuristics: 
p0_count: 2
p1_count: 3
timestamp: 2026-08-08T10-24-09Z
slug: app-lists-listspageclient-tsx
---
# Critique: `/lists` (ListsPageClient)

**Target:** `app/lists/ListsPageClient.tsx`  
**Mode:** Operate (catalog browse)  
**Method:** dual-agent

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|------:|-----------|
| 1 | Visibility of System Status | 3 | Context strip + sticky chips OK; orphan spinner under «پیشنهاد برای تو» |
| 2 | Match System / Real World | 3 | Lifestyle Persian labels land; «ترند» as mode + badge collides |
| 3 | User Control and Freedom | 3 | Modes/filters clear; guest Saved gate is abrupt |
| 4 | Consistency and Standards | 2 | Three card dialects (featured / grid / compact for-you); dual «همه» |
| 5 | Error Prevention | 2 | Duplicate title «فیلم‌هایی برای بقا» ×2 in first grid |
| 6 | Recognition Rather Than Recall | 3 | Sticky modes help; deep vibes still in sheet |
| 7 | Flexibility and Efficiency | 2 | Controls compete instead of accelerating one path |
| 8 | Aesthetic and Minimalist Design | 1 | First viewport dominated by chrome, not lists |
| 9 | Error Recovery | 3 | Empty/reset states present |
| 10 | Help and Documentation | 2 | No browse-vs-explore or mode meaning guidance |
| **Total** | | **24/40** | **Acceptable** |

## Design Specificity Verdict

**LLM assessment:** Recognizably Wibe (RTL, Vazirmatn, lifestyle photography, category shelves). The sticky control stack (sort + view + filter + category chips + meta) is still category-interchangeable marketplace chrome.

**Deterministic scan:** `detect.mjs --json` on ListsPageClient + ListsCategorySection + ListsFeaturedCarousel + ListsSimilarRow → **0 findings**. URL puppeteer scan unavailable (puppeteer not installed). Overlay injection skipped.

**Visual overlays:** No user-visible detector overlay. Fallback: MCP browser snapshot + user screenshots + live `/lists?mode=newest`.

## Overall Impression

The page already feels like a real catalog (منتخب + category shelves + expand). The biggest opportunity is **trust and focus**: cut first-viewport chrome, kill duplicate titles, and end the scroll with a confident cafe/for-you finish instead of an empty grid cell + loud badge + spinner.

## What's Working

1. **Job fit vs Explore** — category sections + «نمایش N لیست دیگر» is the right Operate model for browse.
2. **منتخب carousel** — editorial photography sells curated lists, not DB rows.
3. **State legibility** — sticky modes + `۳۶ لیست · جدید · همه دسته‌ها` keep filter state readable.

## Priority Issues

### [P0] Control overload before the catalog
- **What:** Search + globe + منتخب + 4 modes + view toggle + فیلتر + category chips consume the first viewport.
- **Why it matters:** Primary task (“pick a list”) starts too late; chrome wins over content.
- **Fix:** Collapse view+filter into one control; keep one sticky row (modes OR categories, not both equally loud); shrink or delay منتخب on repeat visits.
- **Suggested command:** `$impeccable distill`

### [P0] Duplicate titles in-grid («فیلم‌هایی برای بقا» ×2)
- **What:** Two different covers, same Persian title, same movie section (confirmed in a11y tree).
- **Why it matters:** Breaks curated trust; users cannot tell which link to open.
- **Fix:** Dedupe by normalized display title (or unique slug) within section; surface distinct subtitles if two lists must coexist.
- **Suggested command:** `$impeccable harden` (data/UX trust) + content fix

### [P1] Weak / noisy page ending
- **What:** Cafe 3-card grid leaves a dead cell; «پیشنهاد برای تو» uses compact cards + loud 🔥 ترند; spinner undercuts closure.
- **Why it matters:** Peak-end rule — last impression feels unfinished and cheap vs photography above.
- **Fix:** Odd-count layout (hero + stack, or span last card); quiet badge to caption style; hide spinner when section is complete / use end sentinel.
- **Suggested command:** `$impeccable layout` + `$impeccable quieter`

### [P1] Semantic collision: ترند / همه / منتخب
- **What:** Browse mode «ترند», card badge «ترند», featured «منتخب», category «همه», section «همه».
- **Why it matters:** Same words, different systems; users reverse-engineer the model.
- **Fix:** Rename section CTA («مشاهده دسته») vs chip «همه»; badge → quieter «داغ» or remove in for-you; keep mode label alone as «ترند».
- **Suggested command:** `$impeccable clarify`

### [P1] Featured + default path skews movie-only
- **What:** First screen is almost all فیلم even on «همه دسته‌ها»; books/cafes below fold.
- **Why it matters:** Lifestyle promise (کافه/کتاب) is invisible at entry; feels like a movie app.
- **Fix:** Interleave featured across categories, or pin a non-film shelf above fold when category=all.
- **Suggested command:** `$impeccable shape` (IA) or `$impeccable layout`

## Persona Red Flags

**Jordan (First-Timer / guest):** Hits dense chrome before any list; taps ذخیره‌شده → gate with little preview of value; duplicate titles read as “unfinished product.”

**Samir (active Persian lifestyle — cafe/book night):** Lands on منتخب + فیلم; کافه last and visually broken (odd grid); emoji-loud ترند on for-you feels cheap vs covers.

**Alex (Power User):** View toggle + modes + deep filter exist but compete; no fast path to “only cafes, newest” without sticky dual chip mental load.

## Minor Observations

- Featured `۱/۲` sits far from «منتخب» label.
- Section «همه» vs expand «نمایش N…» are two “more” paths with different outcomes.
- Some grid titles need stronger bottom scrim on bright covers.
- Live defaulted to `?mode=newest` (persistence) — changes entry mood vs trending default.

## Questions to Consider

1. If someone opens `/lists` for “چه کار کنم امشب؟”, should the first screen be a **filter cockpit** or a **confident editorial shelf** — and which job belongs to `/explore`?
2. Prefer **fewer uniquely titled lists** people trust, or a denser catalog that can show the same Persian title twice in one glance?
