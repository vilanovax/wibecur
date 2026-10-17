---
target: admin dashboard
total_score: 22
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
timestamp: 2026-08-08T11-27-53Z
slug: app-admin-dashboard-page-tsx
---
# Admin Dashboard Critique — `/admin/dashboard`

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Period chips say no activity while رادار ترند looks busy |
| 2 | Match System / Real World | 3 | Strong curator Persian; امتیاز ترکیبی / دیباگ ترند leak eng |
| 3 | User Control and Freedom | 3 | Filters OK; search destination surprises |
| 4 | Consistency and Standards | 2 | Many moderation doors; activity filter ≠ fed data |
| 5 | Error Prevention | 2 | Misleading search; conflicting time windows |
| 6 | Recognition Rather Than Recall | 3 | Labels good; some hover-only actions |
| 7 | Flexibility and Efficiency | 2 | Radar power tools; no dashboard accelerators |
| 8 | Aesthetic and Minimalist Design | 1 | Equal-weight module wallpaper |
| 9 | Error Recovery | 2 | Empty states OK; little error UX |
| 10 | Help and Documentation | 1 | Score Info only; no “what to do today” guidance |
| **Total** | | **22/40** | Acceptable — needs focus |

## Design Specificity Verdict

**LLM assessment:** Partially Wibe, mostly generic Operate SaaS. Domain shows in `مرکز اقدام`, `رادار ترند`, category chips, list titles. Visual system is interchangeable admin chrome (indigo/purple cards, KPI tiles, score bars). Missed chance: a “today for the catalog” briefing, not a metric wall.

**Deterministic scan:** 11 advisory `design-system-font-size` findings (10–22px off DESIGN.md ramp) in ActivityStream, AdminTopBar, DashboardPeriodChips, KpiCard, SystemPulseBar, TopContentPanels, TrendingRadar. Browser CDP confirmed ≥65 nodes &lt;12px. Likely intentional dense-admin meta; treat as soft signal not P0.

**Visual overlays:** Not injected; browser screenshots + CDP used as fallback.

## Overall Impression

Action Center is the real craft. Everything below it fights for equal attention. Biggest opportunity: one job for the first viewport — triage — then one intelligence slice; park the rest in پالس/KPI.

## What's Working

1. **DashboardActionCenter** — collapses when clear, empty queues as chips, severity rings: real triage.
2. **TrendingRadar** — sort, filter, score breakdown, category styling: sharpest ops tool on the page.
3. **RTL ops polish** — `fa-IR`, Persian section titles, domain list names feel like Wibe catalog work.

## Priority Issues

### [P1] No single job for the page
**What:** Triage + catalog census + analytics table + rankings + feed all at full volume.
**Why it matters:** Curator can’t answer “what should I do next?” in 3 seconds.
**Fix:** First viewport = Action Center + one intelligence slice; link out to پالس وایب / داشبورد رشد for the rest.
**Suggested command:** `$impeccable distill`

### [P1] Contradictory status signals
**What:** «فعالیتی در این بازه ثبت نشده» beside populated رادار ترند / وضعیت محتوا.
**Why it matters:** Breaks trust in period filters and “today” narrative.
**Fix:** Align windows or label lifetime vs period explicitly on every strip.
**Suggested command:** `$impeccable clarify`

### [P1] TopBar action sprawl + search mismatch
**What:** Four peer CTAs (ایجاد لیست / افزودن آیتم / نظارت کامنت / صف بررسی); search promises کاربر/لیست/آیتم but routes elsewhere.
**Why it matters:** Dilutes primary create path; search becomes a lie.
**Fix:** One primary + overflow; make search match placeholder or change copy/destination.
**Suggested command:** `$impeccable distill`

### [P2] Duplicate rankings
**What:** رادار ترند ≈ برترین لیست‌ها; عملکرد دسته‌ها ≈ دسته‌های پرلیست.
**Why it matters:** Scroll tax with no new decision.
**Fix:** Keep one list ranker + one category story; drop or collapse the twin.
**Suggested command:** `$impeccable distill`

### [P2] Dead emotional end (Activity Stream)
**What:** Stale feed («۲۴ روز قبل») with filter options for types never shown.
**Why it matters:** Weak last impression; filter overpromises.
**Fix:** Live feed or remove section; shrink filter to real event types.
**Suggested command:** `$impeccable quieter`

## Persona Red Flags

**Alex (Power curator):** Needs one queue + keyboard path; gets metric wallpaper and four moderation entry points (sidebar کامنت‌ها، نظارت کامنت، صف بررسی، داشبورد کامنت‌ها).

**Sam (A11y-minded):** Hover-only links in ActivityStream / TopContentPanels; trend/score partly color-only; dense table without a plain-language “next list” lead.

**Admin curator (Wibe):** “What should I curate/fix today?” buried under census tiles (۳ دسته / ۴۹ لیست / ۱٬۶۱۰ آیتم).

## Minor Observations

- Chevron rotation on «همه» feels LTR-ish.
- CategoryIntelligenceGrid bar width from `|growth|+10` is decorative.
- Activity select offers ریپورت/کیوریتور/کاربر that never appear after DashboardContent filter.
- Sub-12px meta labels (period chips, badges) hurt glanceability on large displays.
- Purple FAB competes with primary blue TopBar CTAs.

## Questions to Consider

1. If this page could only answer one question, is it “what’s on fire?” or “what’s trending?” — why both at full volume?
2. Why do پالس وایب and داشبورد رشد exist if home still tries to be both?
3. Would a curator trust «امروز» if رادار ترند always looks “full”?
4. What would deleting برترین لیست‌ها + جریان فعالیت do to daily ops speed?
5. Does `دیباگ ترند` belong on the home dashboard or one click deeper?
