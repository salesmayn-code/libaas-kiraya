# Libaas Kiraya — case study

## Problem

Occasion-wear rental in Pakistan runs through Instagram DMs and WhatsApp. Availability is a guess, deposits are cash, damage is argued over, and nobody can prove an outfit was not promised to two brides on the same weekend. Standard ecommerce is a poor fit: rental sells **time**, not quantity, and the sale does not end at checkout.

## Approach

Built a multi-vendor rental marketplace on Medusa v2 with the rental domain in custom modules and workflows rather than a separate service.

- **One physical unit = one calendar.** Listings have variants (sizes) with measurements; each variant has physical units with tag codes.
- **Time is enforced by PostgreSQL.** Every booking stores a generated `blocked_during` range. A GiST exclusion constraint on `(unit_id, blocked_during)` makes overlapping active bookings impossible, even across application instances. Manual blocks use the same guard.
- **Reserve is race-safe.** The reserve step locks the candidate unit row, re-checks bookings and blocks, inserts the hold, and retries another unit on `23P01`. A 50-parallel probe produces exactly one winner.
- **Every multi-step mutation is a workflow** with compensation: hold → cart line → payment capture → confirmed booking → deposit record → ledger entries; return → inspection → accept/dispute → deposit refund → payout.
- **Vendor isolation is structural.** Vendors are a custom `vendor` auth actor; routes resolve the vendor from the session and return 404 for cross-vendor resources.
- **Money is append-only.** Ledger entries are immutable facts; balances are derived. Payout batches mark included entries paid with a transfer reference.

## Proof

- 50 parallel reserves on one unit → exactly 1 success (repo script + CI gate).
- Integration test asserts the exclusion constraint rejects overlap.
- 12 pricing/property tests cover base days, extra days, buffers, cancellation tiers, caps and date arithmetic.
- Full API lifecycle exercised locally: search → reserve → cart → simulated-wallet payment → capture → dispatch → return → inspection → refund → ledger → payout.
- Playwright smoke and axe checks pass at mobile and desktop widths; Lighthouse assertions pass on home, search and listing pages.

## Tradeoffs

- Payments default to a custom simulated wallet; Stripe/local gateways are a provider swap, with charge-and-refund as the deposit fallback when holds are unavailable.
- Search is Postgres availability anti-joins, not an external search engine; correct first, fast enough for the catalog size.
- Photo evidence and KYC are stored privately with signed URLs; production still needs bucket policies, backups and a hosted environment.

## Stack

Medusa v2.22, Next.js 16 / React 19, PostgreSQL 16 + `btree_gist`, Redis, RustFS S3, Tailwind v4, TanStack Query, Jest/fast-check, Playwright, axe, Lighthouse.
