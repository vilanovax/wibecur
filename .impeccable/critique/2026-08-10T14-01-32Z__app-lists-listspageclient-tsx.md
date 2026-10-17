---
target: lists
total_score: 29
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 0
p2_count: 2
timestamp: 2026-08-10T14-01-32Z
slug: app-lists-listspageclient-tsx
---
Method: dual-agent (A: cdccf5ea-d481-489e-97e6-3f57f63b8642 · B: 2bb14fb8-b109-4344-98cc-5f37e96d1688)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Context + modes OK; advanced status mostly in sheet |
| 2 | Match System / Real World | 4 | «حداقل ذخیره» honest floors; no star lie |
| 3 | User Control and Freedom | 3 | Reset OK; no light undo after Apply |
| 4 | Consistency and Standards | 3 | Sort dual ownership fixed; aria still says مرتب‌سازی |
| 5 | Error Prevention | 3 | onApply locks sort; stars gone |
| 6 | Recognition Rather Than Recall | 3 | Modes labeled; saves buried under categories accordion |
| 7 | Flexibility and Efficiency | 2 | View mode still in 85vh sheet |
| 8 | Aesthetic and Minimalist Design | 3 | Sheet lighter; chrome ~31% |
| 9 | Error Recovery | 3 | Empty CTAs OK |
| 10 | Help and Documentation | 2 | سراسری vs search unexplained |
| **Total** | | **29/40** | **Needs Work → approaching Good** |

## Design Specificity Verdict

**LLM:** Catalog JOB grounded; P1s verified live (ذخیره chips, no sort section, no mood). Residual: kitchen-sink sheet + chrome density.

**Deterministic scan:** CLI `[]` clean. Browser verified حداقل ذخیره + no امتیاز control + no مرتب‌سازی accordion.

## What's Working

1. Modes own sort; sheet sort removed; onApply locks vibes/sort
2. Honest «حداقل ذخیره» with ≥۵/۱۰/۲۰/۵۰ + disclaimer
3. Mood stays off Lists

## Priority Issues

### [P2] Filter sheet kitchen sink
- Move نمایش to toolbar; demote creator/itemCount; avoid duplicating categories
- `$impeccable distill`

### [P2] First-viewport chrome ~31%
- Tighten sticky stack; shrink/defer منتخب
- `$impeccable layout`

### [P3] Filter aria still «فیلتر نمایش و مرتب‌سازی»
- `$impeccable clarify`

### [P3] سراسری vs in-page search
- `$impeccable clarify`

## Persona Red Flags

Jordan: aria promises sort. Alex: view buried. Sam: horizontal systems + sticky Apply.

## Questions

- Should نمایش leave the sheet for chrome next to فیلتر?
- Drop مرتب‌سازی from filter aria immediately?
