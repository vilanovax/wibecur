---
target: lists page
total_score: 25
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 2
timestamp: 2026-08-10T12-48-31Z
slug: app-lists-listspageclient-tsx
---
# Critique — Lists catalog browse

**Target:** `app/lists/ListsPageClient.tsx` · Mode: Operate · 390×844

## Design Health Score
| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility | 3 | False «۲ فیلتر فعال» on default |
| 2 | Match System | 3 | ترند/منتخب/داغ collide |
| 3 | User Control | 3 | Modes/reset OK |
| 4 | Consistency | 2 | Dual همه; mood in Lists sheet |
| 5 | Error Prevention | 2 | Fake active filters |
| 6 | Recognition | 3 | Modes visible |
| 7 | Flexibility | 2 | Controls compete |
| 8 | Aesthetic Minimal | 2 | 56% chrome first viewport |
| 9 | Error Recovery | 3 | Empties have CTAs |
| 10 | Help | 2 | No Lists vs Explore cue |
| **Total** | | **25/40** | **Acceptable** |

## Priority Issues
### [P0] First-viewport control stack → `$impeccable distill`
### [P1] Filter sheet mood bleed + false active → distill + clarify
### [P1] Dual «همه» → clarify
### [P2] ترند/منتخب/داغ collision → quieter + clarify

## What's Working
Category shelves as catalog; منتخب editorial; sticky modes after scroll.
