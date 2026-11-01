# Libaas Kiraya — Product Requirements Document (PRD)

| Field | Value |
|---|---|
| Product | Libaas Kiraya ("libaas" = clothing, "kiraya" = rent) |
| Tagline | Wear it once. Rent it right. |
| Document version | 1.0 (Draft for build) |
| Date | 21 October 2026 |
| Author | Saleh |
| Platform | Medusa v2 (Node.js / TypeScript) backend + Next.js storefront |
| Related docs | `TRD.md`, `UI-UX-Design.md`, `Appflow.md`, `Backend-Schema.md`, `ImplementationPlan.md` |

---

## 1. Executive summary

Libaas Kiraya is a multi-vendor **rental marketplace for occasion wear** (bridal and formal lehngas, sherwanis, kurta sets, jewelry, accessories) in Pakistan. Boutiques and individuals list garments; customers book them **for specific dates**, pay a rental fee plus a refundable deposit, receive the item, return it, and get the deposit back after an inspection.

Today this market runs on Instagram DMs and WhatsApp. Availability is checked by messaging, deposits are handed over in cash, damage disputes are settled by argument, and nobody can see whether the same outfit has been promised to two brides for the same weekend. Libaas Kiraya replaces that with date-aware booking, protected deposits, a structured return inspection, and automatic vendor payouts.

### Project context

This is a portfolio and freelance-showcase project built on Medusa JS v2. It is designed so the real product logic (date-range availability, deposit lifecycle, multi-vendor payout ledger) lives in **custom Medusa modules and workflows**, not in configuration. Third-party payment and courier integrations run against sandbox or simulated providers (see §10, Assumptions).

## 2. Problem statement

| Who | Pain today |
|---|---|
| Renter (bride, groom, guest) | Cannot tell if an outfit is free on her event date without messaging several boutiques. Unsure whether it will fit. Afraid of losing a deposit unfairly. |
| Boutique / individual lister | Double-bookings, no calendar, cash-only deposits, no proof of condition at handover, chasing late returns on WhatsApp. |
| Marketplace operator | No visibility into disputes, no standard policy, no trusted payout flow. |

Generic e-commerce platforms (Shopify, WooCommerce) sell **quantities**. Rental needs to sell **time**: one physical item can be booked many times, but never twice on overlapping dates, and each booking has a lifecycle after the sale (handover, return, inspection, deposit settlement).

## 3. Goals and non-goals

### 3.1 Goals

| ID | Goal |
|---|---|
| G1 | Make "is this outfit free on my date?" answerable in one tap, accurately, including under concurrent checkouts. |
| G2 | Guarantee **no double-booking** of a physical item (enforced at database level, not just in UI). |
| G3 | Protect both sides of the deposit: customer gets a transparent, time-boxed, evidence-based settlement; vendor gets proof of condition. |
| G4 | Give vendors a calendar, a booking queue and a trustworthy payout ledger. |
| G5 | Reduce fit anxiety using saved measurements and fit feedback from past renters. |
| G6 | Demonstrate production-quality Medusa v2 engineering: custom modules, workflows with compensation, module links, subscribers, scheduled jobs, admin extensions, tests, CI/CD. |

### 3.2 Non-goals (MVP)

- Selling garments (this is rental only; outright sale is out of scope).
- Real merchant accounts with JazzCash, Easypaisa or card acquirers (sandbox/simulated only).
- Cash on delivery for rentals (Phase 2).
- Native mobile apps (responsive web only).
- Urdu UI and right-to-left layout (Phase 2; design tokens already reserve for it).
- Tailoring/alteration marketplace, dry-cleaning logistics marketplace.
- Insurance products, credit scoring of renters.

## 4. Users and personas

| Persona | Description | Primary jobs |
|---|---|---|
| **Hira, the renter** (26, Rawalpindi) | Attending three weddings this season. Browses on her phone, trusts reviews with photos, worries about size and deposit. | Find outfits free on a date, check fit, pay safely, return easily, get deposit back. |
| **Saima, the boutique owner** (38, Islamabad) | Runs an Instagram boutique with ~120 pieces, one part-time assistant. Tracks bookings in a notebook. | List inventory once, see a calendar, get paid, handle returns and damage fairly. |
| **Bilal, the individual lister** (31, Lahore) | Owns a few high-value sherwanis worn once. | Earn from idle items with low effort and low risk. |
| **Ops admin** (platform) | Approves vendors, arbitrates disputes, releases payouts. | Keep the marketplace trustworthy; resolve edge cases quickly. |

Roles in the system: `customer`, `vendor_owner`, `vendor_staff`, `admin`.

## 5. Scope

### 5.1 MVP (v1.0)

Catalog and search by event date and city, listing detail with availability calendar, size and fit tools, rental cart and checkout with a time-limited hold, deposit handling, vendor portal (listings, units, calendar, bookings, inspections, earnings), return inspection and dispute flow, vendor payout ledger and batches, notifications (email plus WhatsApp-style stub), reviews with fit feedback, admin extensions (vendor approval, disputes, payouts, settings).

### 5.2 Phase 2 (v1.1)

"Notify me when free" date alerts, cash-on-delivery with confirmation, Urdu UI, Meilisearch-powered search, wishlists and lookbooks, alteration requests, courier API live integration.

### 5.3 Future

Try-on appointments, vendor subscriptions, rental insurance, outfit bundles (bride + groom coordinated sets), multi-city expansion tooling.

## 6. Functional requirements

Priority: **P0** = must ship in MVP, **P1** = should ship, **P2** = nice to have.

### 6.1 Discovery and search

| ID | Requirement | Pri |
|---|---|---|
| FR-101 | Customer can search by **event date** (or rental range), **city**, category and occasion; results contain only listings with at least one unit free for the blocked period. | P0 |
| FR-102 | Filters: size, price range (per-event), vendor, fulfillment mode (pickup/courier), "fits my measurements". | P0 |
| FR-103 | Each result card shows a 14-day **availability ribbon** from the selected date. | P1 |
| FR-104 | Sort by relevance, price, newest, rating. | P1 |
| FR-105 | Listing detail shows an availability calendar (month view) for the selected size. | P0 |

### 6.2 Measurements and fit

| ID | Requirement | Pri |
|---|---|---|
| FR-201 | Customer can save one or more **measurement profiles** (bust/chest, waist, hips, shoulder, height; inches or cm). | P0 |
| FR-202 | Each variant (size) stores garment measurements and whether it is alterable. | P0 |
| FR-203 | System shows a fit indicator (Fits / Snug / Check with boutique) comparing a profile to garment measurements within configurable tolerance. | P1 |
| FR-204 | After a completed booking, customer can submit fit feedback (ran small / true / ran large); aggregate shown on listing. | P1 |

### 6.3 Booking, cart and checkout

| ID | Requirement | Pri |
|---|---|---|
| FR-301 | Adding a rental to the cart creates a **hold** on one physical unit for 15 minutes (configurable). | P0 |
| FR-302 | The same unit can never be held or confirmed for overlapping blocked periods, even under simultaneous requests (database-enforced). | P0 |
| FR-303 | Price is computed from listing rules: base package, extra days, cleaning fee, deposit; shown as an itemized breakdown before payment. | P0 |
| FR-304 | A visible countdown shows hold expiry; expired holds release automatically. | P0 |
| FR-305 | Checkout collects delivery details and selects fulfillment mode (vendor pickup or courier both ways) where the listing allows. | P0 |
| FR-306 | On payment success the booking becomes `confirmed`; on failure the hold is released and the customer is informed (compensating workflow). | P0 |
| FR-307 | A customer may have at most 3 active holds at once (abuse control). | P1 |
| FR-308 | Order confirmation email with booking reference, dates, vendor contact, return instructions and cancellation terms. | P0 |

### 6.4 Deposit management

| ID | Requirement | Pri |
|---|---|---|
| FR-401 | Deposit amount is set per listing and shown separately from the rental fee. | P0 |
| FR-402 | Two deposit modes are supported by the platform: **hold** (authorize now, capture or void later) and **charge-and-refund** (capture now, refund remainder). Mode is chosen by the payment provider capability. | P0 |
| FR-403 | After inspection settlement, the system releases or captures the deposit and records the result on the booking. | P0 |
| FR-404 | If the vendor does not file an inspection within 48 hours of the return being recorded, the full deposit is released automatically. | P0 |
| FR-405 | Deductions above 50% of the deposit require admin review before capture. | P1 |

### 6.5 Fulfillment, return and inspection

| ID | Requirement | Pri |
|---|---|---|
| FR-501 | Vendor can mark a booking **dispatched / handed over** (status `with_customer`), optionally attaching condition photos. | P0 |
| FR-502 | Vendor can mark a booking **returned** (status `returned`). Return due date is the end of the rental period. | P0 |
| FR-503 | Vendor files an **inspection**: outcome (clean, minor damage, major damage, loss), deduction amount, notes, photos (min. 3 photos for major damage or loss). | P0 |
| FR-504 | Late returns automatically add a late fee (days late × listing late fee), included in the settlement. | P1 |
| FR-505 | System alerts vendor, customer and admin when a return is overdue and flags the next booking on that unit as **at risk**. | P1 |
| FR-506 | Customer has a 72-hour window to **accept or dispute** an inspection; silence means acceptance. | P0 |
| FR-507 | Admin arbitrates disputes with access to handover photos, inspection photos and customer evidence, and records a resolution (customer, vendor, or split). | P0 |

### 6.6 Cancellation and changes

| ID | Requirement | Pri |
|---|---|---|
| FR-601 | Customer cancellation refunds the rental fee according to the vendor's cancellation policy tier (see §7.3). Deposit is always fully released. | P0 |
| FR-602 | Vendor cancellation refunds 100% to the customer, applies a configurable vendor penalty and counts toward an auto-pause threshold (3 cancellations in 90 days). | P1 |
| FR-603 | Customer can request a date change; allowed only if the unit is free for the new period; otherwise treated as a new booking. | P2 |

### 6.7 Vendor portal

| ID | Requirement | Pri |
|---|---|---|
| FR-701 | Vendor registration with business details and verification documents; admin approval required before listings go live. | P0 |
| FR-702 | Create/edit listings: photos, category, description, variants with measurements, pricing rules, deposit, buffers, fulfillment modes, cancellation policy. | P0 |
| FR-703 | Manage **physical units** per variant (tag code, condition grade, status). | P0 |
| FR-704 | Calendar showing bookings and manual **blocks** (maintenance, offline rentals) per unit. | P0 |
| FR-705 | Booking queue with next actions (prepare, hand over, expect return, inspect). | P0 |
| FR-706 | Earnings page: pending, available and paid balances, per-booking breakdown, payout history. | P0 |
| FR-707 | Staff accounts with limited permissions (no payout details). | P2 |

### 6.8 Payouts and ledger

| ID | Requirement | Pri |
|---|---|---|
| FR-801 | On booking confirmation, create **pending** ledger entries: rental earning (net of commission) and cleaning fee. | P0 |
| FR-802 | Earnings become **available** only after the booking reaches `completed` (deposit settled). | P0 |
| FR-803 | Admin generates payout batches per vendor for available balances above a minimum threshold; marks paid with a reference. | P0 |
| FR-804 | Ledger is append-only; corrections are made by adjustment entries. Balance is derived, never edited. | P0 |

### 6.9 Reviews

| ID | Requirement | Pri |
|---|---|---|
| FR-901 | Only customers with a `completed` booking can review the listing/vendor (rating 1–5, text, optional photos, fit feedback). | P1 |
| FR-902 | Admin can hide abusive reviews. | P1 |

### 6.10 Notifications

| ID | Requirement | Pri |
|---|---|---|
| FR-1001 | Email for: booking confirmed, pickup/delivery reminder (day before), return reminder, inspection submitted, dispute opened/resolved, payout paid. | P0 |
| FR-1002 | WhatsApp-style message channel behind a provider interface (stub in MVP). | P1 |

### 6.11 Admin

| ID | Requirement | Pri |
|---|---|---|
| FR-1101 | Approve/reject/suspend vendors; set per-vendor commission within platform bounds. | P0 |
| FR-1102 | Dispute queue with resolution actions. | P0 |
| FR-1103 | Payout batch management. | P0 |
| FR-1104 | Platform settings: hold duration, dispute window, default buffers, late-fee defaults, minimum payout. | P1 |
| FR-1105 | Operations dashboard: bookings today, overdue returns, open disputes, GMV, take rate. | P1 |

## 7. Business rules

### 7.1 Time model

- Dates are **calendar dates in Pakistan Standard Time (Asia/Karachi)**; there is no time-of-day in availability.
- A booking has `event_date`, `rental_start` (handover/delivery date) and `rental_end` (return due date).
- Default package is **3 days**: day before the event, event day, day after. Customers may choose a custom range between the listing's `min_days` and `max_days`.
- The unit is blocked for `rental_start − lead_buffer_days` to `rental_end + return_buffer_days` (inclusive). Defaults: lead buffer 1 day, return buffer 2 days (cleaning, pressing, repair).

### 7.2 Pricing

- `rental_fee = base_amount + max(0, days − base_days) × extra_day_amount`
- `cleaning_fee` is optional per listing and charged once.
- `deposit` is per listing and separate from the fee.
- Currency is PKR. Money is stored with Medusa's decimal-safe `bigNumber` type.
- Platform commission defaults to **12%** of the rental fee (not the deposit, not the cleaning fee). Admin can override per vendor.

### 7.3 Cancellation policies (vendor picks one of three presets)

| Policy | 100% fee refund | 50% fee refund | No refund |
|---|---|---|---|
| Flexible | ≥ 3 days before `rental_start` | 1–2 days before | < 1 day |
| Standard | ≥ 7 days before | 3–6 days before | < 3 days |
| Strict | ≥ 14 days before | 7–13 days before | < 7 days |

Deposit is always fully released on cancellation. Cleaning fee is refunded in full before handover.

### 7.4 Inspection and deposit settlement

1. Vendor records **returned**; the 48-hour inspection clock starts.
2. Vendor files an inspection, or the system auto-releases the deposit at 48 hours.
3. Deduction = damage deduction + late fees, capped at the deposit amount.
4. The customer has 72 hours to accept or dispute. No response = accepted.
5. Accepted: capture deduction, release remainder, mark booking `completed`.
6. Disputed: booking is `disputed` until an admin resolves; then settle with the resolution amount.
7. Deductions go to the vendor in full; the platform takes no commission on deductions.

### 7.5 Vendor quality rules

- 3 vendor-initiated cancellations in 90 days auto-pauses the vendor's listings pending admin review.
- Listings need at least 3 photos and one variant with measurements to be published.

## 8. Non-functional requirements

| Area | Requirement |
|---|---|
| Correctness | Zero double-bookings under concurrency (verified by a 50-parallel-request test on one unit/date). |
| Performance | Search p95 < 800 ms at 10k listings / 100k bookings. Reserve (hold) p95 < 400 ms. Storefront LCP < 2.5 s on mid-range mobile over 4G. |
| Availability | 99.5% monthly for the demo deployment. Graceful degradation if notifications fail (non-blocking). |
| Security | Role-based access with vendor data isolation; signed, expiring URLs for private files; payment webhooks signature-verified; rate limiting on hold and auth endpoints. |
| Privacy | Collect minimum PII; vendor identity documents stored in private storage, never in the database; retention rules in `TRD.md`. |
| Accessibility | WCAG 2.1 AA for storefront and vendor portal. |
| Observability | Structured logs, request IDs, workflow execution traces, alerts on failed workflows and stuck holds. |
| Maintainability | Typed end-to-end, ≥ 80% coverage on custom modules and workflows, documented ADRs. |
| Localization | English at launch; copy and layout prepared for Urdu RTL in Phase 2. |

## 9. Success metrics

| Metric | Target for demo / pilot |
|---|---|
| Double-bookings | 0 |
| Search-to-hold conversion | ≥ 8% |
| Hold-to-confirmed conversion | ≥ 60% |
| Inspections filed within 48 h | ≥ 85% |
| Disputes per 100 bookings | ≤ 5, median resolution ≤ 3 days |
| Vendor payout accuracy (ledger vs. manual audit) | 100% |
| Portfolio criteria | Public repo, live demo, 2-minute walkthrough video, README with architecture and workflow diagrams |

## 10. Assumptions and dependencies

- Payment providers: Stripe in test mode and a simulated wallet provider that mimics JazzCash/Easypaisa behavior. Real merchant onboarding is outside this project.
- True authorization holds are a card capability and expire (typically within days), so MVP defaults to charge-and-refund unless the provider supports holds for the full rental window.
- Courier integration is a provider interface with a mock implementation; live PostEx/Leopards/TCS adapters are Phase 2.
- Email through a transactional provider (sandbox); WhatsApp channel stubbed.
- Image storage via an S3-compatible bucket (private and public buckets).
- Launch geography for seed data: Rawalpindi, Islamabad, Lahore.

## 11. Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Authorization holds expire before return | Deposit unprotected | Default to charge-and-refund; renewal job for hold mode; provider capability flag. |
| Double-booking under race conditions | Trust loss | Postgres exclusion constraint on date ranges; concurrency test in CI. |
| Late returns break the next booking | Bad customer experience | Buffers, overdue detection, at-risk flag, late fee, vendor substitute-unit option. |
| Subjective damage disputes | Support load | Mandatory photos for major damage, handover photos, 72-hour window, admin arbitration with evidence. |
| Cold-start (few vendors, few items) | Weak demo | Seed realistic data; pitch as vendor tooling first. |
| Scope too large for the timeline | Delay | Defined cut line in `ImplementationPlan.md`. |
| Medusa upgrade churn | Rework | Pin `@medusajs/*` versions to one release line; upgrade in a dedicated branch. |

## 12. Release criteria (MVP)

1. All P0 requirements implemented and demonstrated end to end (browse → hold → pay → handover → return → inspect → settle → payout).
2. Concurrency test passes in CI (no double-booking across 50 parallel attempts).
3. Compensation paths tested (payment failure releases hold; failed settlement does not lose ledger consistency).
4. WCAG AA checks pass on core screens; Lighthouse performance ≥ 85 mobile on listing and search.
5. Seed script produces a demo-ready dataset in under 2 minutes.
6. README, architecture diagram, workflow diagrams, and demo video published.

## 13. Open questions

| # | Question | Owner | Needed by |
|---|---|---|---|
| 1 | Should the platform take commission on cleaning fees? (Current rule: no.) | Product | Week 2 |
| 2 | Should vendors be allowed custom cancellation rules beyond the three presets? | Product | v1.1 |
| 3 | Is a customer-side service fee preferable to vendor-side commission for the real market? | Product | Post-MVP |
| 4 | Which courier will be the first live integration? | Engineering | v1.1 |

## 14. Glossary

| Term | Meaning |
|---|---|
| Listing | A product offered for rent by a vendor, with pricing and rental rules. |
| Variant | A size of a listing. |
| Unit | A physical garment instance of a variant, with its own calendar. |
| Hold | A temporary reservation on a unit during checkout. |
| Blocked period | Rental period plus buffers; the range that makes a unit unavailable. |
| Deposit | Refundable amount protecting the vendor against damage, loss or lateness. |
| Inspection | Vendor's structured assessment of the item after return. |
| Ledger | Append-only record of vendor earnings, deductions and payouts. |
