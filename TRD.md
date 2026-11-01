# Libaas Kiraya — Technical Requirements Document (TRD)

| Field | Value |
|---|---|
| Document version | 1.0 (Draft for build) |
| Date | 21 October 2026 |
| Author | Saleh |
| Related docs | `PRD.md`, `Backend-Schema.md`, `Appflow.md`, `UI-UX-Design.md`, `ImplementationPlan.md` |

> API names for Medusa (module service factory, DML, workflows SDK, admin extensions) follow Medusa v2. Pin all `@medusajs/*` packages to one release line (target ≥ 2.15; latest observed 2.18) and re-check signatures against the official docs when upgrading.

---

## 1. Purpose and scope

This document defines the architecture, technology choices, module boundaries, workflows, concurrency strategy, APIs, security, testing and deployment for the Libaas Kiraya MVP described in `PRD.md`.

## 2. Architecture overview

```
┌────────────────────────┐        ┌─────────────────────────────────────────┐
│  Next.js storefront    │        │            Medusa v2 server             │
│  (customers + vendor   │  REST  │  ┌────────────── API routes ─────────┐  │
│   portal route group)  │◄──────►│  │ /store  /vendor  /admin  /hooks   │  │
└────────────────────────┘        │  └───────────────┬───────────────────┘  │
                                  │        Workflows (orchestration)        │
┌────────────────────────┐        │  ┌───────┬────────┬────────┬─────────┐  │
│  Medusa Admin          │◄──────►│  │Rental │ Vendor │ Ledger │ Review  │  │
│  (extended: widgets,   │        │  │module │ module │ module │ Measure │  │
│   custom pages)        │        │  └───┬───┴────┬───┴────┬───┴────┬────┘  │
└────────────────────────┘        │      │  Medusa core modules (product,  │
                                  │      │  cart, order, payment, customer,│
                                  │      │  fulfillment, notification…)    │
                                  └──────┼──────────────────────────────────┘
                                         │
         ┌───────────────┬───────────────┼──────────────┬──────────────────┐
         ▼               ▼               ▼              ▼                  ▼
   PostgreSQL        Redis           S3-compatible   Payment providers   Email / WhatsApp
 (btree_gist,      (event bus,       object storage  (Stripe test +      (provider
  exclusion        workflow engine,  (public + 
  constraints)     locking, cache)   private buckets) simulated wallet)   interface)
```

### 2.1 Key architectural decisions (ADRs)

| ADR | Decision | Rationale | Alternatives rejected |
|---|---|---|---|
| ADR-01 | Build rental as **custom Medusa modules**, not a plugin or a separate service. | Medusa's quantity-based inventory cannot model time; custom modules keep logic inside Medusa's DI, workflows and admin. | Separate booking microservice (extra deployment and consistency problems for a MVP). |
| ADR-02 | Enforce no-overlap with a **PostgreSQL exclusion constraint** on date ranges. | Only the database can guarantee correctness under concurrent writes across multiple app instances. | Application-level checks or Redis locks alone (race windows). |
| ADR-03 | One **physical unit** = one calendar. A variant's "stock" is its count of active units. | Matches reality (this exact lehnga, this exact day) and maps cleanly to the constraint. | Quantity counters per variant. |
| ADR-04 | Orchestrate every multi-step business operation with **Medusa workflows** with compensation. | Medusa workflows provide retries, rollback and traceability for hold→pay→confirm and settlement. | Controller-level service chaining. |
| ADR-05 | **Append-only ledger**; balances are derived. | Auditability, easy reconciliation, no silent edits. | Mutable balance column. |
| ADR-06 | Vendor portal is a **route group in the Next.js storefront** with a separate auth actor type (`vendor`). | Smaller scope than a second frontend; shared design system. | Separate vendor app; extending Medusa Admin for vendors. |
| ADR-07 | Platform operations use **Medusa Admin extensions** (widgets and custom pages). | Native look, no extra app to maintain. | Custom admin app. |
| ADR-08 | Search for MVP is a **Postgres query** (custom store endpoint) with an availability anti-join; Meilisearch is Phase 2. | Availability is date-dependent and must be exact; keep one source of truth first. | Search engine with indexed availability (staleness risk). |
| ADR-09 | Default deposit strategy is **charge-and-refund**; **hold** mode is enabled only if the provider supports holds long enough. | Authorization holds expire; local wallets do not support holds. | Hold-only (unsafe for long rentals). |
| ADR-10 | Dates are stored as `date` in the **Asia/Karachi** calendar; timestamps in UTC. | Availability is date-based; avoids timezone drift. | Timestamps for availability (ambiguity at midnight boundaries). |

## 3. Technology stack

| Layer | Choice | Notes |
|---|---|---|
| Runtime | Node.js LTS, TypeScript (strict) | Same language across stack. |
| Commerce core | Medusa v2 | Product, pricing, cart, order, payment, customer, fulfillment, notification, auth, API keys. |
| Database | PostgreSQL 15+ with `btree_gist` | Required for exclusion constraint on (`unit_id`, `daterange`). Verify the extension is available on the chosen host. |
| Cache / events / workflows | Redis | Medusa Redis event bus and Redis workflow engine so workflows and subscribers survive restarts. |
| Storefront | Next.js (App Router), React, Tailwind CSS, Radix primitives, `react-day-picker`, `react-hook-form` + `zod`, TanStack Query | Mobile-first. |
| Admin | Medusa Admin SDK extensions, Medusa UI | Widgets and custom routes. |
| File storage | S3-compatible bucket (public bucket for catalog images; private bucket for KYC, handover and inspection photos) | Signed URLs for private files. |
| Payments | Stripe (test mode) provider; custom `simulated-wallet` provider implementing the payment provider interface | Provider declares capability flags (`supportsHold`). |
| Fulfillment | Custom fulfillment provider `local-courier` (mock) plus manual `vendor-pickup` | Interface ready for PostEx/Leopards/TCS. |
| Notifications | Medusa Notification module with `email` provider and `whatsapp-stub` provider | Non-blocking. |
| Testing | Jest + Medusa test utils (integration), Playwright (E2E), `fast-check` (property tests for date logic) | Concurrency test is a first-class citizen. |
| CI/CD | GitHub Actions | Lint, typecheck, unit, integration (service containers), E2E, build images, deploy. |
| Containers | Docker, Docker Compose for local and demo | Backend, storefront, Postgres, Redis, MinIO (local S3). |
| Observability | Pino structured logging, request IDs, OpenTelemetry-ready hooks, Sentry (optional) | |

## 4. Repository layout

```
libaas-kiraya/
├─ apps/
│  ├─ backend/                     # Medusa project
│  │  ├─ src/
│  │  │  ├─ modules/
│  │  │  │  ├─ vendor/            # vendor, vendor_user
│  │  │  │  ├─ rental/            # listing, unit, booking, inspection, dispute, deposit
│  │  │  │  ├─ ledger/            # ledger_entry, payout
│  │  │  │  ├─ measurement/       # measurement_profile
│  │  │  │  ├─ review/            # review
│  │  │  │  └─ providers/         # payment-simulated-wallet, fulfillment-local-courier, notification-whatsapp-stub
│  │  │  ├─ links/                # product-vendor, product-listing, order-booking, customer-measurement, …
│  │  │  ├─ workflows/            # reserve-rental, add-rental-to-cart, confirm-rental, settle-deposit, …
│  │  │  ├─ api/                  # store/, vendor/, admin/, hooks/
│  │  │  ├─ subscribers/
│  │  │  ├─ jobs/
│  │  │  ├─ admin/                # widgets + routes
│  │  │  └─ scripts/seed.ts
│  │  └─ medusa-config.ts
│  └─ storefront/                  # Next.js
├─ docs/                           # PRD, TRD, etc.
├─ docker-compose.yml
└─ .github/workflows/
```

## 5. Module design

Each module has its own data models, service (generated CRUD plus domain methods) and migrations. Modules do **not** import each other; they communicate through **workflows** and **module links**.

| Module | Responsibility | Core models |
|---|---|---|
| `vendor` | Vendor profile, verification status, commission, staff. | `vendor`, `vendor_user` |
| `rental` | Listing rules, physical units, bookings, availability, inspections, disputes, deposits. | `rental_setting`, `rental_listing`, `rental_variant_spec`, `rental_unit`, `rental_booking`, `rental_booking_event`, `rental_block`, `rental_deposit`, `rental_inspection`, `rental_dispute` |
| `ledger` | Vendor earnings, deductions, payouts. | `ledger_entry`, `payout` |
| `measurement` | Customer measurement profiles and fit calculation helpers. | `measurement_profile` |
| `review` | Reviews and fit feedback aggregation. | `review` |

### 5.1 Module links

| Link | Cardinality |
|---|---|
| `product` ↔ `vendor` | many-to-one |
| `product` ↔ `rental_listing` | one-to-one |
| `product_variant` ↔ `rental_variant_spec` | one-to-one |
| `order` (line item) ↔ `rental_booking` | one-to-one (booking stores `order_id`, `line_item_id`) |
| `customer` ↔ `measurement_profile` | one-to-many |
| `vendor` ↔ `ledger_entry` / `payout` | one-to-many |

Where hot queries need a column for filtering (for example `vendor_id` on `rental_unit` and `rental_booking`), the id is also stored as an opaque text reference without a foreign key; integrity is validated inside workflows and asserted in tests.

### 5.2 Availability engine (core design)

**Blocked period** for a booking:

```
blocked_start = rental_start − lead_buffer_days
blocked_end   = rental_end   + return_buffer_days          (inclusive dates)
```

**Statuses that occupy the calendar:** `held`, `confirmed`, `with_customer`, `returned`, `settling`, `disputed`. Non-occupying: `completed`, `cancelled`, `expired`. Manual vendor blocks live in `rental_block` and use the same constraint.

**Database guarantee (added by a custom SQL statement in the module migration):**

```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- blocked_during is a GENERATED STORED daterange derived from blocked_start/blocked_end
-- (full DDL in Backend-Schema.md §5.1)
ALTER TABLE rental_booking
  ADD CONSTRAINT rental_booking_no_overlap
  EXCLUDE USING gist (unit_id WITH =, blocked_during WITH &&)
  WHERE (status IN ('held','confirmed','with_customer','returned','settling','disputed')
         AND deleted_at IS NULL);
```

Calendar dates are stored as `dateTime` at 00:00:00Z of the Asia/Karachi calendar date (DML has no pure `date` type); the generated `blocked_during` column converts them with an immutable expression so it can be indexed. An equivalent constraint protects `rental_block`. Cross-table overlap (booking vs. block) is checked in the reserve step inside the same transaction using `SELECT … FOR UPDATE` on the unit row, then a second check query; the booking constraint remains the final guard.

**Reserve algorithm (`reserveUnit` step):**

1. Validate dates (not in the past, within `min_days`/`max_days`, lead time satisfied).
2. Begin transaction; expire stale holds for candidate units (`status='held' AND hold_expires_at < now()`).
3. Find candidate units for the variant that are active and have no overlapping occupying booking or block.
4. Pick one (least recently booked, to spread wear).
5. Insert booking `held` with `hold_expires_at = now() + hold_ttl`.
6. If the insert raises an exclusion violation (`23P01`), retry with the next candidate; if none remain return `UNAVAILABLE`.
7. Commit.

**Hold expiry:** a scheduled job runs every minute to set expired holds to `expired`; the reserve step also expires stale holds opportunistically so availability never lags.

**Availability query (search and calendar):**

```sql
SELECT l.id
FROM rental_listing l
WHERE l.status = 'active' AND l.city = :city
  AND EXISTS (
    SELECT 1 FROM rental_unit u
    WHERE u.listing_id = l.id AND u.status = 'active'
      AND NOT EXISTS (
        SELECT 1 FROM rental_booking b
        WHERE b.unit_id = u.id
          AND b.status IN ('held','confirmed','with_customer','returned','settling','disputed')
          AND b.deleted_at IS NULL
          AND b.blocked_during && daterange(:from, :to, '[]'))
      AND NOT EXISTS (
        SELECT 1 FROM rental_block k
        WHERE k.unit_id = u.id
          AND k.deleted_at IS NULL
          AND k.blocked_during && daterange(:from, :to, '[]'))
  );
```

In the real query `:from`/`:to` are the requested rental dates expanded by each listing's own buffers (`l.lead_buffer_days`, `l.return_buffer_days`), computed in SQL so listings with different buffers are compared correctly. The exclusion constraint's backing GiST index serves this predicate; `EXPLAIN` plans are checked in CI on seeded data.

## 6. Workflows

All workflows use Medusa's workflows SDK (`createWorkflow`, `createStep` with compensation functions) and run on the Redis workflow engine.

| Workflow | Steps (summary) | Compensation |
|---|---|---|
| `reserve-rental` | validate → reserve unit (hold) → compute quote | Cancel the hold. |
| `add-rental-to-cart` | `reserve-rental` → add line item with custom unit price (`booking_id` in metadata) | Remove line item; cancel hold. |
| `confirm-rental` (hooked into cart completion) | verify hold still valid and extend by a short grace → mark `confirmed` → create deposit record → create pending ledger entries → emit `rental.booking.confirmed` | Revert status to `held` or cancel; void/refund deposit; reverse ledger entries. |
| `mark-dispatched` | validate actor and state → store handover photos → status `with_customer` | Revert status. |
| `mark-returned` | validate → status `returned`; set inspection deadline (+48 h) | Revert status. |
| `submit-inspection` | validate → compute deduction (damage + late fee, capped) → admin-review gate if > 50% → create inspection → status `settling` → schedule auto-accept | Delete inspection; revert status. |
| `settle-deposit` | resolve final deduction → capture/refund via payment module → ledger entries (deduction earning, release pending earnings to available) → status `completed` → emit event | Reverse payment action where supported; reverse ledger entries; mark `settlement_failed` for manual action. |
| `open-dispute` / `resolve-dispute` | validate window → status `disputed` / apply resolution → run `settle-deposit` | Revert status. |
| `cancel-rental` | compute refund by policy → refund payment → release deposit → free the dates (status `cancelled`) → ledger reversal | Mark `cancel_failed` and alert. |
| `create-payout-batch` | collect available entries per vendor → create payout `draft` → admin approve → mark paid → ledger `payout` entries | Reverse entries; payout `failed`. |
| `onboard-vendor` | create auth identity (`vendor` actor) → create vendor `pending` → notify admin | Delete identity and vendor. |

Workflow **hooks** (e.g. cart completion validation) are used to ensure a cart containing rental items cannot complete if any hold has expired or been released.

## 7. Events and scheduled jobs

### 7.1 Domain events (emitted via Medusa event bus)

`rental.booking.held`, `rental.booking.confirmed`, `rental.booking.dispatched`, `rental.booking.returned`, `rental.booking.cancelled`, `rental.inspection.submitted`, `rental.dispute.opened`, `rental.dispute.resolved`, `rental.booking.completed`, `ledger.payout.paid`.

Subscribers: notifications, calendar refresh (cache invalidation), review invitations, at-risk flagging.

### 7.2 Scheduled jobs

| Job | Schedule | Purpose |
|---|---|---|
| `expire-stale-holds` | every minute | Release expired holds. |
| `inspection-deadline` | hourly | Auto-release deposit when the 48 h inspection window lapses. |
| `auto-accept-inspections` | hourly | Accept inspections after the 72 h dispute window. |
| `pickup-reminders` | daily 09:00 PKT | Remind customer and vendor the day before handover. |
| `return-reminders` | daily 09:00 PKT | Remind on due date; mark overdue next day. |
| `overdue-detector` | daily 10:00 PKT | Flag overdue returns and next bookings at risk. |
| `deposit-hold-renewal` | daily | Re-authorize holds nearing expiry (hold mode only). |
| `payout-candidates` | weekly | Prepare draft payout batches for admin review. |

All jobs are idempotent and safe to run twice.

## 8. API design

REST, JSON, versionless under Medusa's conventions. Validation with `zod` via Medusa middlewares. Standard error shape `{ type, code, message, details? }`.

### 8.1 Store API (customer)

| Method | Path | Purpose |
|---|---|---|
| GET | `/store/rentals/search` | Search with `event_date`/`from`/`to`, `city`, filters, pagination. |
| GET | `/store/rentals/listings/:id` | Listing detail with variants, rules, vendor, rating and fit summary. |
| GET | `/store/rentals/listings/:id/availability` | Month calendar for a variant (`variant_id`, `month`). |
| POST | `/store/rentals/quote` | Price breakdown for a variant and dates (no hold). |
| POST | `/store/carts/:id/rentals` | `add-rental-to-cart` (creates hold). |
| DELETE | `/store/carts/:id/rentals/:booking_id` | Release hold and remove line. |
| GET | `/store/me/bookings` / `/store/me/bookings/:id` | Customer bookings and detail with timeline. |
| POST | `/store/me/bookings/:id/cancel` | `cancel-rental`. |
| POST | `/store/me/bookings/:id/inspection/accept` | Accept inspection. |
| POST | `/store/me/bookings/:id/dispute` | Open dispute with evidence uploads. |
| GET/POST/PUT/DELETE | `/store/me/measurements` | Measurement profiles. |
| POST | `/store/me/bookings/:id/review` | Review and fit feedback. |

### 8.2 Vendor API (`actor_type = vendor`)

| Method | Path | Purpose |
|---|---|---|
| POST | `/vendor/register` | Start onboarding. |
| GET/POST/PUT | `/vendor/listings` … | Listing and variant management. |
| GET/POST/PUT | `/vendor/units` … | Physical unit management. |
| GET/POST/DELETE | `/vendor/blocks` | Manual calendar blocks. |
| GET | `/vendor/calendar` | Units × dates view. |
| GET | `/vendor/bookings` / `:id` | Queue and detail. |
| POST | `/vendor/bookings/:id/dispatch` | Mark handed over. |
| POST | `/vendor/bookings/:id/return` | Mark returned. |
| POST | `/vendor/bookings/:id/inspection` | File inspection. |
| GET | `/vendor/earnings`, `/vendor/payouts` | Ledger summary and history. |
| POST | `/vendor/uploads/sign` | Signed upload URLs for photos. |

Every vendor route scopes queries by the authenticated vendor id in middleware; handlers never accept a `vendor_id` from the client.

### 8.3 Admin API

| Method | Path | Purpose |
|---|---|---|
| GET/POST | `/admin/vendors` `/:id/approve` `/:id/suspend` | Vendor lifecycle and commission. |
| GET/POST | `/admin/disputes` `/:id/resolve` | Dispute queue and resolution. |
| GET/POST | `/admin/payouts` `/:id/approve` `/:id/mark-paid` | Payout batches. |
| GET/PUT | `/admin/rental-settings` | Platform settings. |
| GET | `/admin/rental-metrics` | Dashboard data. |

### 8.4 Webhooks

`POST /hooks/payment/:provider` — signature-verified, idempotent by event id, never trusts client-side payment status.

## 9. Payments, deposits and fulfillment

- Rental fee and cleaning fee are captured at checkout.
- **Deposit strategy** is provider-driven: the payment provider exposes `supportsHold`. If true and the rental window is shorter than the authorization lifetime, the deposit is authorized and later captured (partially) or voided; otherwise it is captured and refunded after settlement.
- Refunds and partial captures are executed only inside `settle-deposit` and `cancel-rental` workflows, never from controllers.
- All money fields use decimal-safe `bigNumber`; arithmetic is done with Medusa's `MathBN` helpers, never floating point.
- Fulfillment: `vendor-pickup` (no carrier) and `local-courier` (mock: generates tracking ids and status callbacks). Return legs are modeled as a second shipment tied to the booking.

## 10. Security

| Area | Control |
|---|---|
| Authentication | Medusa auth with actor types `customer`, `user` (admin), `vendor`. Short-lived JWT access tokens; secure, HTTP-only cookies for the storefront session. |
| Authorization | Middleware scopes by actor; vendor routes constrained to own resources; admin routes behind Medusa admin auth. Unit tests assert cross-vendor access returns 404. |
| Input validation | `zod` schemas on every route; reject unknown fields. |
| Rate limiting | Per-IP and per-customer limits on auth, quote and hold endpoints; max 3 active holds per customer. |
| File uploads | Signed, expiring upload URLs; MIME and size validation; images re-encoded server-side; private bucket for KYC and evidence. |
| Secrets | Environment variables via the host's secret manager; no secrets in the repository. |
| Webhooks | Signature verification and replay protection. |
| Transport | HTTPS only; HSTS; CORS restricted to storefront origins. |
| Privacy | Vendor identity documents stored only as private object keys; retention: KYC documents for the vendor's active period plus 12 months; evidence photos 12 months after booking completion. |
| Audit | `rental_booking_event` logs every state transition with actor and metadata. |

## 11. Performance and scalability

- Indexes defined in `Backend-Schema.md`; availability uses the GiST index created by the exclusion constraint.
- Search results paginated with keyset pagination; image URLs use CDN-friendly sizes.
- Calendar and quote responses cached in Redis for 30 seconds and invalidated by booking events; **hold and confirm always hit the database** (never the cache).
- Horizontal scaling: Medusa server and worker modes can run separately (`server` / `worker` mode) with Redis-backed workflows.
- Load test target: 200 requests/second on search, 50 concurrent holds on 10 hot units with zero double-bookings.

## 12. Observability and operations

- Structured JSON logs with request id, actor id, booking id.
- Workflow execution traces retained via the workflow engine; alert if a workflow is stuck > 10 minutes or fails compensation.
- Health endpoints: `/health` (process), `/health/ready` (DB, Redis).
- Dashboards: holds created/expired, confirm rate, overdue returns, open disputes, ledger totals.
- Backups: daily Postgres backups with a tested restore; object storage versioning on the private bucket.

## 13. Testing strategy

| Level | Scope | Tools |
|---|---|---|
| Unit | Pricing, cancellation tiers, deduction caps, fit calculation, date logic (property-based). | Jest, `fast-check` |
| Module/integration | Services, constraints, workflows with compensation, subscribers, jobs. | Medusa integration test runner, real Postgres and Redis |
| Concurrency | 50 parallel `reserve-rental` calls for the same unit and overlapping dates → exactly one success; no overlap rows remain. Run on every PR. | Jest + `Promise.all` |
| API contract | Request/response schemas, authorization boundaries. | Jest + supertest-style helpers |
| E2E | Search → hold → pay → handover → return → inspect → settle → payout. | Playwright |
| Accessibility / performance | Axe checks; Lighthouse CI budgets. | Playwright + axe, Lighthouse CI |
| Security | Dependency audit, secret scan, authorization negative tests. | `npm audit`, gitleaks |

Coverage target: ≥ 80% for `modules/` and `workflows/`.

## 14. Environments and deployment

| Environment | Purpose | Notes |
|---|---|---|
| Local | Development | Docker Compose: Postgres, Redis, MinIO, Mailpit. |
| CI | Automated tests | GitHub Actions service containers. |
| Staging / demo | Public demo | Containers on a small VPS or PaaS; managed Postgres with `btree_gist`; Redis; S3-compatible storage; storefront on a serverless host. |
| Production | Not in MVP | Same topology with separate server and worker processes. |

**CI/CD pipeline:** lint → typecheck → unit → integration (with services) → concurrency test → build Docker images → deploy to staging on `main` → run smoke E2E. Database migrations run as a release step (`medusa db:migrate`); backward-compatible migrations only.

Configuration is via environment variables (`DATABASE_URL`, `REDIS_URL`, `STORE_CORS`, `ADMIN_CORS`, `VENDOR_CORS`, `JWT_SECRET`, `COOKIE_SECRET`, provider keys, bucket settings, `HOLD_TTL_MINUTES`).

## 15. Data management

- Migrations generated by Medusa for DML models; the exclusion constraints and `btree_gist` extension are added as raw SQL in the same migration file and reviewed in PR.
- Seed script creates: regions (PKR, Pakistan), 3 cities, 6 vendors, ~60 listings, ~150 units, sample bookings across statuses, one disputed booking, one overdue return, ledger entries.
- Soft delete (`deleted_at`) for vendor-facing entities; bookings are never deleted.

## 16. Technical risks

| Risk | Mitigation |
|---|---|
| DML does not model `date`, `daterange` or exclusion constraints directly. | Store calendar dates as UTC-midnight `dateTime`; add the generated `blocked_during` column and exclusion constraints via raw SQL in migrations; integration tests assert the constraints exist and reject overlaps. |
| Cart completion bypasses rental validations. | Use workflow hooks on cart completion and add an integration test completing a cart with an expired hold. |
| Medusa API changes between minor versions. | Pin versions; isolate Medusa-specific code behind thin adapters; upgrade in a dedicated branch with the full test suite. |
| Provider webhooks arrive out of order. | Idempotent handlers keyed by event id; state machine transitions validate the current state. |
| Redis outage stalls workflows. | Health checks, retries, alerts; workflow engine resumes pending executions after recovery. |

## 17. Definition of done (engineering)

- Code typed, linted, reviewed; no `any` in domain code.
- Workflows have compensation tests.
- New endpoints have authorization tests.
- Migrations reversible or documented as one-way.
- Docs updated (README, diagrams, this TRD where decisions change).
