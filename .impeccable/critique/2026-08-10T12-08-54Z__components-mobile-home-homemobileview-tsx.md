---
target: home page / HomeMobileView
total_score: 30
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 0
p2_count: 2
timestamp: 2026-08-10T12-08-54Z
slug: components-mobile-home-homemobileview-tsx
---
# Critique — Wibe mobile home (post harden/quieter/clarify/animate)

**Target:** `components/mobile/home/HomeMobileView.tsx`  
**Mode:** Operate · logged-in · ~390×844 · `http://localhost:3003/`

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Personal stack resolves; brief pulse OK |
| 2 | Match System / Real World | 3 | Lifestyle voice; کاتالوگ clearer |
| 3 | User Control and Freedom | 3 | Bookmark + nav |
| 4 | Consistency and Standards | 3 | Save solid; see-all labels mix slightly |
| 5 | Error Prevention | 3 | Guest save gated |
| 6 | Recognition Rather Than Recall | 3 | Covers, reasons, labeled nav |
| 7 | Flexibility and Efficiency | 3 | Returner Saved→For You live |
| 8 | Aesthetic and Minimalist Design | 3 | Quieter hero; residual doors |
| 9 | Error Recovery | 3 | Optimistic save + toast |
| 10 | Help and Documentation | 3 | Explore mapped in feed subtitle |
| **Total** | | **30/40** | **Good (~75%)** |

## Design Specificity Verdict

**LLM:** Authored for Wibe. Spotlight → ترند → ذخیره‌شده‌ها → برای تو → chips. Mood via Explore subtitle.

**Deterministic scan:** CLI `detect.mjs` → **0 findings**. Browser overlay: 69 runtime hits (mostly image-hover-transform / nested-cards / low-contrast FP on photo underlays).

**Visual overlays:** Injected via `:8401`; server stopped. Many FP likely.

## Overall Impression

P1 personal-stack hole closed. Score **27 → 30 (Good)**. Remaining pressure is residual catalog doors and first-viewport density (P2).

## What's Working

1. Eager Saved + For You resolve with real content
2. Quieter hero (clamp-1, meta off mobile)
3. Clarify: کاتالوگ ترند + حال‌وهوا در اکسپلور

## Priority Issues

### [P2] Residual catalog doors
کاتالوگ ترند + لیست‌ها + اکسپلور + chips + همه×2 → `$impeccable distill` / `clarify`

### [P2] First-viewport density
Search + hero + trend before calm → `$impeccable quieter` / `layout`

### [P3] Dual tree a11y · Saved single-card echo
→ `$impeccable audit` / `polish`

## Prior P1 Closure

| Prior P1 | Status |
|----------|--------|
| Discovery pile-up | **CLOSED** |
| Save invisible | **CLOSED** |
| Trend/ForYou/Explore split | **mostly CLOSED** |
| Personal stack hole | **CLOSED** |

## Persona Red Flags

Casey: path works; one Saved card can feel thin.  
Jordan: clearer mood→Explore; may still confuse exits.  
Sam: dual trees remain.

## Minor Observations

For You «همه» → `/lists` vs کاتالوگ → `/lists?mode=trending` slight drift.

## Questions to Consider

1. One catalog exit on Home only?
2. One-item Saved enough for returner peak?
3. When Saved === hero, hide Saved and lead For You?
