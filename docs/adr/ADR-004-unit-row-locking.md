# ADR-004 — Holds are serialized on the unit row; the database remains the final guard

- Status: accepted
- Date: 2026-10-22

## Context

The exclusion constraint prevents overlapping bookings for one unit, but it cannot prevent a booking overlapping a manual `rental_block` because they are different tables. A naive read-check-insert leaves a race window.

## Decision

Every reserve attempt runs inside a transaction that locks the candidate `rental_unit` row (`SELECT ... FOR UPDATE`), re-checks both bookings and blocks, then inserts. If PostgreSQL raises `23P01` (a concurrent booking slipped in), the step retries the next candidate. Hold creation also takes a per-customer advisory lock so the 3-hold limit is enforced under concurrency.

## Consequences

- Booking-vs-booking and booking-vs-block races are closed; the exclusion constraints stay as the last line of defence.
- Candidate selection is slightly more serialized per unit, which is acceptable: one physical garment is the contention point.
- The 50-parallel probe is part of the repo (`src/scripts/concurrency-check.ts`) and CI.
