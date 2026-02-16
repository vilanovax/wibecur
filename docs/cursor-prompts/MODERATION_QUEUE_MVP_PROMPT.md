# 🤖 Cursor Prompt — Moderation Queue MVP (Component-based Implementation)

You are a senior fullstack + UI engineer.

Implement the Moderation Queue Admin page based on the following production-ready wireframe.

Stack:

* Next.js (App Router)
* Prisma + PostgreSQL
* TailwindCSS
* RBAC already implemented
* AuditLog exists
* Soft Delete exists

Goal:
Build a clean, data-first Moderation Queue with drawer-based detail view.

---

# 1️⃣ Route

Create page:

```
/admin/moderation
```

Server component wrapper.
Client components for interactive parts.

---

# 2️⃣ Component Breakdown

Create these components:

### 🔹 ModerationSummaryBar

Props:

* openCount
* inReviewCount
* highSeverityCount
* resolvedTodayCount

UI:

* 4 compact metric cards
* Clickable to filter
* Semantic colors
* rounded-2xl
* shadow-sm

---

### 🔹 ModerationFilters

Props:

* filters
* onChange

Controls:

* Type dropdown
* Entity dropdown
* Severity dropdown
* Status dropdown
* Assignee dropdown
* Date range picker
* Search input

Must sync with URL query params.

---

### 🔹 ModerationTable

Props:

* cases[]
* onRowClick

Columns:

* Time (relative + tooltip exact)
* Type badge
* Entity preview
* Reason (truncate)
* Severity badge
* Status badge
* Assignee (avatar + name or Unassigned)
* Actions (Assign to me + Open)

Sticky header.
Hover highlight.
Server-side pagination.

---

### 🔹 ModerationDrawer

Right-side sliding panel (max width 480px).

Sections:

SECTION A — EntityPreview

* Fetch entity via entityType + entityId
* Minimal preview:
  LIST → title, category, saveCount, S7, deleted?
  USER → name, role, status
  COMMENT → body, author

SECTION B — CaseInfo

* Case ID
* Type
* Severity
* Status
* ReportCount
* CreatedAt
* UpdatedAt

SECTION C — Notes

* List of notes
* Add note textarea
* Submit button

SECTION D — Actions
Buttons based on role + entityType:

Common:

* Assign to me
* Set In Review
* Resolve
* Ignore

LIST:

* Move to Trash
* Restore

USER:

* Suspend
* Unsuspend

COMMENT:

* Delete
* Approve

All actions:

* requirePermission enforced server-side
* optimistic UI update
* toast feedback
* audit log write

---

# 3️⃣ API Integration

Use these APIs:

GET /api/admin/moderation
POST /api/admin/moderation/:id/assign
POST /api/admin/moderation/:id/status
POST /api/admin/moderation/:id/note

And reuse existing:

* Trash/Restore list
* Suspend user

All API calls:

* enforce RBAC
* write audit logs

---

# 4️⃣ Role-aware Behavior

If user role is ANALYST:

* No action buttons
* Show ReadOnlyBanner at top of drawer

If MODERATOR:

* Full moderation actions
* No category hard delete

If ADMIN or SUPER_ADMIN:

* Full access

Use PermissionGate and usePermissions hook.

---

# 5️⃣ UI Rules

* Clean

* Minimal

* Data-first

* No heavy gradients

* Semantic badges:

  * severity 1 → gray
  * severity 2 → amber
  * severity 3 → red

* Status badges:
  OPEN → red border
  IN_REVIEW → amber
  RESOLVED → green
  IGNORED → gray

* Drawer animation 200ms ease-in-out

* Sticky filter bar

* Rounded-2xl cards

* shadow-sm default

* RTL Persian friendly

---

# 6️⃣ Pagination

Server-side pagination:

* page
* pageSize (default 20)
* show total count

---

# 7️⃣ Edge Cases

* If entity no longer exists → show "Entity not found" badge.
* If entity is soft-deleted → show "In Trash" badge.
* If case already resolved → disable destructive actions.

---

# 8️⃣ Performance

* Do NOT fetch full entity lists.
* Fetch preview only.
* Memoize filters.
* Avoid re-rendering full table when drawer opens.

---

# 9️⃣ Deliverables

* Page
* All components
* Role-aware UI
* Integrated API calls
* Clean Tailwind structure
* No unused code

End implementation.

---

# 🎯 بعد از اجرا چه اتفاقی می‌افتد؟

تو یک:

* Moderation Control Center
* قابل Assign
* قابل Resolve
* هماهنگ با Soft Delete
* هماهنگ با Audit

خواهی داشت.

---

اگر بخواهی، مرحله بعدی حرفه‌ای می‌تواند یکی از این‌ها باشد:

1️⃣ Auto-flagging system (بر اساس velocity / suspicious ratios)
2️⃣ Escalation logic (severity auto-upgrade)
3️⃣ SLA indicators (چند ساعت از Open گذشته)
4️⃣ Moderator performance analytics

کدام مسیر را می‌خواهی باز کنیم؟
