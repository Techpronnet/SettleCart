# Frontend Screens — Phased Task Plan

Source: PRD v1.0 (Marketplace SRS v1.1). Market: Nigeria. Currency: NGN.
App Router: `frontend/src/app`. Existing: `/` landing only.

Guardrails (all phases):
- No `fixed inset-0` drawers/modals inside `backdrop-filter` parents — render overlays as siblings in `<>...</>`.
- No native OS emojis in UI. Use Font Awesome 4.7 (`fa fa-*`) or Lucide in badge containers (`w-7 h-7 rounded-md bg-stone-100 text-stone-600 flex items-center justify-center`).
- Every screen: loading skeleton, empty, error + Try Again, success/toast, confirm destructive actions, role/permission-aware actions only.
- Server is source of truth for tenant ownership, pricing, verification codes, ledger/settlement. Never trust frontend payment success — confirm via webhook/status endpoint.

Route-group convention going forward:
```
src/app/(public)/...  src/app/(auth)/...  src/app/(customer)/...
src/app/(vendor)/...  src/app/(dispatch)/...  src/app/(admin)/...
src/app/(finance)/... src/components/ui/...  src/lib/api/...
```

---

## Phase 0 — Foundation (done)

- [x] `components/ui/`: Button, Input, Card, Badge (+IconBadge), Skeleton/ListSkeleton, EmptyState/ErrorState, ConfirmDialog + Toast, Pagination, Tabs, BottomNav, AppHeader.
- [x] `lib/`: format (NGN), status maps + customer labels, auth roles (`lib/auth.ts`). API client already present (`lib/api/`).
- [x] Layouts: `(auth)`, `(customer)`, `(vendor)`, `(dispatch)`, `(admin)`, `(finance)` + shared `/notifications` shell.
- [x] Acceptance: `npm run lint` + `npm run build` pass.

## Phase 1 — Public + Auth (done)

- [x] Public `(public)/`: marketplace teaser, about, how-it-works, FAQ, waitlist (reuses `WaitlistSection` → `api/waitlist`). Landing left as-is (CTA = Join Waitlist, no fake stats/testimonials).
- [x] Auth `(auth)/`: login (invalid/locked/suspended/rate-limit/network states, role-aware redirect), register (shop/sell/deliver → customer/vendor/dispatch), verify shell (invalid/expired/resend), forgot/reset shells (success/expired/invalid copy).
- [x] Acceptance: `npm run lint` + `npm run build` pass. Verify/recovery are UI-complete; backend endpoints pending.
- [x] Nav fix: absolute links (Explore → /marketplace, anchors → /#…, vendor → /register?as=vendor), search → /marketplace, cart opens working drawer with live count. Register preselects intent from `?as=`.
- [x] Cart drawer (`ui/Dialog.tsx` + `CartProvider` in root layout): add/remove/qty, vendor grouping, subtotal, localStorage persistence, toast, handoff to /login for checkout (full checkout in Phase 2).

## Phase 2 — Customer Commerce Loop (done)

- [x] `/home` — search, category chips, live active orders, nearby live stores.
- [x] `/discover` + `/search?q=` — store + product results, city filter, sort, in-stock filter, pagination.
- [x] `/stores/[id]` — storefront, about card, store search, category chips, live products.
- [x] `/products/[id]` — image, price, stock, vendor link, qty, add-to-cart with real product UUID.
- [x] `/cart` — full page, vendor grouping, qty steppers, summary, clear with confirm.
- [x] `/checkout` — contact + address (address-book prefill), preview-item guard, createOrder to Paystack redirect. Revalidation errors surfaced.
- [x] `/payment/verify` — reference/trxref verification, success/failed states, track/retry CTAs.
- [x] `/orders/[id]?new=1` doubles as Order Confirmation (Track Order / Continue Shopping).
- [x] `/orders` — Active/Completed/Cancelled/Refunded tabs from live statuses.
- [x] `/orders/[id]` — customer-language timeline, vendor-grouped items, pay-again, track + code CTAs.
- [x] `/tracking/[orderId]` — live SSE refresh, task states, support card.
- [x] `/verification/[orderId]` — display-only 6-digit codes per delivery task, expiry, no-share copy.
- [x] `/profile` (view/edit, shortcuts, logout), `/addresses` (localStorage CRUD + default).
- [x] Shared: `RequireAuth` (+user context), `BackendProductCard`, `lib/addresses`, `listMyOrders`, `formatMoney`.

## Phase 3 — Vendor Operating System (done)

- [x] `/vendor` dashboard — today sales, actionable orders, ready-for-pickup, pending vs available, alerts, 4 primary CTAs.
- [x] `/vendor/onboarding` wizard (Business → KYC → Store → Catalogue → Publish) with progress + resume.
- [x] `/vendor/kyc` — mapped statuses, evidence panel, submit/resubmit.
- [x] `/vendor/business` — edit name/type/description/tax ID.
- [x] `/vendor/store` — details edit, publish/unpublish, storefront link.
- [x] `/vendor/products`, `/new`, `/[id]/edit` — full CRUD + duplicate + publish toggle (shared `ProductForm`).
- [x] `/vendor/categories` — CRUD with sort order.
- [x] `/vendor/inventory` — tracked-stock overview, steppers, low-stock flags.
- [x] `/vendor/orders`, `/[id]` — status tabs, accept/decline/prepare/ready with confirms; ready state notes dispatch handoff.
- [x] `/vendor/customers` — order stats + honest pending-backend note.
- [x] `/vendor/wallet` — pending vs available split with non-withdrawable warning.
- [x] `/vendor/transactions` — ledger explorer with type filter + pagination.
- [x] `/vendor/withdrawals` — NUBAN-validated request form + status history.
- [x] `/vendor/analytics` — revenue, orders, AOV, fulfillment rate, 7-day chart, top products.
- [x] `/vendor/settings` — section links, switch business, logout.
- [x] Shared: `domains/vendor` SDK, `lib/vendor` status maps, `lib/vendor-context` workspace resume, `VendorBits`.
- [x] Fix: vendor pages nested under `/vendor` segment (route groups don't prefix URLs).

## Phase 4 — Dispatch Logistics App (done, mobile-first)

- [x] `/dispatch` dashboard — Offline/Available/Busy/Paused toggle, active delivery card, available jobs, today stats.
- [x] `/dispatch/onboarding` — account → identity → vehicle → approval progress.
- [x] `/dispatch/verification` — approval state, vehicle summary.
- [x] `/dispatch/availability` — 4-state selector.
- [x] `/dispatch/jobs`, `/jobs/[id]` — pickup/drop-off, earnings, payout split, Accept/Decline (decline dismisses locally).
- [x] `/dispatch/pickup/[taskId]` — arrived-at-vendor gate, then confirm pickup.
- [x] `/dispatch/active/[taskId]` — route progress, start transit, code handoff CTA, problem reporting.
- [x] `/dispatch/verify/[taskId]` — rider code entry, backend-validated; invalid/expired/used blocked with messages.
- [x] `/dispatch/failed/[taskId]` — required reason + notes via `failTask`.
- [x] `/dispatch/earnings` — today/total stats, wallet balances, recent deliveries.
- [x] `/dispatch/withdrawals` — NUBAN-validated requests + history.
- [x] `/dispatch/profile` — rider info, settings links, logout.
- [x] Shared: `lib/dispatch` (availability, dismissed jobs, vehicle, task maps), `DispatchBits` (setup prompt, task cards).

## Phase 5 — Admin Operations Center (done)

- [x] `/admin` — live stats (users, businesses, stores, orders, products, pending KYC) + queue links.
- [x] `/admin/users`, `/[id]` — search, role filter, pagination, detail, create-user.
- [x] `/admin/vendors` — businesses with KYC badges.
- [x] `/admin/kyc` — pending queue, evidence, approve/reject with notes.
- [x] `/admin/stores` — publish states, storefront links.
- [x] `/admin/orders`, `/[id]` — status filter, money breakdown, per-order payments, manual settlement for delivered vendor orders.
- [x] `/admin/payments` — per-order transaction lookup.
- [x] `/admin/deliveries` — status filter, task inspect, assign rider by ID.
- [x] `/admin/riders` — rider directory with verification flags.
- [x] `/admin/withdrawals` — approve/reject by ID with escrow-safe semantics.
- [x] `/admin/refunds`, `/admin/disputes` — derived from order statuses (backend has no dedicated endpoints).
- [x] `/admin/audit-logs` — honest pending-backend state (no fake trail).
- [x] `/admin/settings` — admin account, workspace links, least-privilege note.
- [x] Shared: `domains/admin` SDK; layout guarded to admin/support.
- [x] Limits: no suspend/restore, withdrawal queue list, or audit endpoints exist in backend yet.

## Phase 6 — Finance Workspace (done)

- [x] `/finance` — GMV, platform fees, vendor volume, refunds, settled count, pending settlement, net to vendors.
- [x] `/finance/transactions` — order search + status explorer with fee splits.
- [x] `/finance/ledger` — per-order settlement trace (gross/fee/vendors/payments).
- [x] `/finance/settlement` — delivered-but-unsettled queue with one-tap settlement + posted entries.
- [x] `/finance/withdrawals` — approve/reject by ID (escrow-safe).
- [x] `/finance/refunds` — refund queues.
- [x] `/finance/reconciliation` — internal order-vs-payments matcher (matched/missing/mismatch) + provider note.
- [x] `/finance/reports` — CSV exports (transactions, settlements, refunds).
- [x] Shared: `lib/finance` (settlement scan, totals, CSV); layout allows finance + admin.
- [x] Backend: added `FINANCE` to `UserRole` (DB enum + code), granted finance least-privilege reads plus settle/review execution. KYC, user admin and rider assignment stay admin-only.

## Phase 7 — P1 Polish (done)

- [x] Reviews: eligible-order write (delivered/settled only) with star input, display on product/store pages, admin moderation queue page (pending backend service).
- [x] Disputes: customer report-a-problem per order with reasons; admin derived disputed-orders queue stays source of truth.
- [x] Vendor staff (`/vendor/staff`): local roster invites, permission toggles (finance/settings owner-locked), suspend/reactivate, remove with confirm.
- [x] Favorites: persistent wishlist hearts everywhere, `/saved` page with re-add to cart, profile shortcut.
- [x] Advanced notifications: live inbox (category tabs, unread, mark read/all-read) wired to backend; live unread badge on header bell.
- [x] Vendor analytics MVP: shipped in Phase 3 (revenue, orders, AOV, fulfillment, 7-day chart, top products).
- [x] Shared: `domains/notifications` SDK, `lib/reviews`, `lib/disputes`, `lib/staff`, `lib/favorites`.
- [ ] Deferred to P2: route optimization, multi-delivery batching, AI forecasting (never authoritative for money).

## Build Order Recommendation

```
0 Foundation → 1 Public/Auth → 2 Customer loop → 3 Vendor OS
  → 4 Dispatch → 5 Admin → 6 Finance → 7 P1
```

Each phase ends with `npm run lint && npm run build` + manual mobile check before next phase.
