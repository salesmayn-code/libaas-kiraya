# ADR-001 — Pin Medusa 2.22 and Next.js 16

- Status: accepted
- Date: 2026-10-22

## Context

The planning documents target Medusa 2.15+ and note 2.18 as the newest release when written. The registry now ships 2.22.0, and the Next.js scaffold produced by `create-next-app` is Next 16.4.2 / React 19.

## Decision

Pin all `@medusajs/*` packages to `2.22.0` and use Next.js 16.4.2 with React 19. Treat the skills/docs as guidance and verify APIs against the installed version.

## Consequences

- We get the current auth, workflow and admin APIs (including the custom actor-type flow used for vendors).
- The TRD's "latest observed 2.18" is stale; this ADR records the deliberate upgrade.
- Upgrades happen in dedicated branches with the full test/build suite.
