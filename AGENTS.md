# Libaas Kiraya - project rules

## Current state

- The repository is now a built pnpm monorepo: `apps/backend` (Medusa 2.22), `apps/storefront` (Next.js 16), Docker Compose, tests and CI. See `README.md` for commands and current scope.
- Do not invent scripts or claim checks passed; run the repository scripts and report actual results.
- Source of truth: `PRD.md`, `TRD.md`, `Backend-Schema.md`, `Appflow.md`, `UI-UX-Design.md`, `ImplementationPlan.md`. If they conflict, ask; do not silently choose.

## Target stack

- Medusa v2 backend plus a Next.js App Router storefront, TypeScript strict, pnpm workspace.
- Target the Medusa 2.15 release line; latest observed is 2.18. Before using an API, verify the installed `@medusajs/*` version and current docs at docs.medusajs.com. Never invent Medusa APIs.
- Keep the project zero-cost: open-source Medusa v2, local PostgreSQL/Redis/MinIO, and sandbox or simulated payment/courier providers. Do not add paid services or Medusa Cloud dependencies.
- PostgreSQL 15+ with `btree_gist`, Redis, S3-compatible storage; Jest plus Medusa test utils, Playwright, and fast-check.

## Medusa backend rules

- Rental logic belongs in custom modules and workflows, not controllers or configuration.
- Modules do not import each other. Use workflows and module links; cross-module IDs are opaque text.
- Use DML models and generated migrations; review any raw SQL additions. Calendar dates are 00:00:00Z of the Asia/Karachi date, money uses `bigNumber`, and IDs are prefixed ULIDs.
- Preserve the database-level no-overlap guarantee (exclusion constraint on `unit_id` plus `daterange`). Do not replace it with application-only checks.
- Every multi-step mutation is a workflow with compensation. Subscribers and jobs are for side effects, not primary writes.
- API routes: validate with zod imported from `@medusajs/framework/zod` (Zod v4 on Medusa >= 2.14), authenticate every route, scope vendor routes to the owning vendor, and return 404 for cross-vendor access.
- Auth actor types are `customer`, `user` (admin), and `vendor`. Do not reuse admin auth for vendors.
- Never log or commit secrets. Private uploads use signed URLs; validate MIME type and size.

## Storefront versus admin

- Do not apply Next.js/storefront patterns to the Medusa backend or backend patterns to the storefront.
- Storefront: Next.js App Router, Tailwind, Radix, TanStack Query, zod, react-hook-form.
- Admin: Medusa Admin SDK and UI extensions; do not build a separate admin app.

## Workflow

- Plans live in `docs/`. For multi-step work, restate the slice and its verification before editing.
- For a new ecommerce project, product line, or scope change, use the `ecom-project-start` skill first; do not default to writing more documents.
- Work in vertical slices; keep each change demonstrable end to end.
- Read the relevant Medusa skill reference before implementing:
  - `.opencode/skills/building-with-medusa/reference/`
  - `.opencode/skills/building-admin-dashboard-customizations/references/`
  - `.opencode/skills/building-storefronts/references/`
- Follow the existing implementation and conventions before introducing a new pattern.
- Record hard-to-reverse decisions as ADRs in `docs/`.

## Testing and verification

- Target at least 80% coverage for `modules/` and `workflows/`.
- Every workflow ships with a compensation test; every endpoint with an authorization test.
- Keep the concurrency test (50 parallel holds on one unit) green on every PR.
- Run the repository's lint, typecheck, unit/integration, E2E, and build commands when they exist. Never invent command names.
- If a check cannot run (no code, missing DB/Redis, and so on), report it as unverified.

## Skill precedence

1. Medusa skills for Medusa APIs, modules, workflows, admin, and storefront integration.
2. ECC `postgres-patterns` and `database-migrations` for raw SQL and migrations; ECC backend, API, security, and testing skills for generic TypeScript concerns.
3. Matt Pocock skills for planning, TDD, diagnosis, and two-axis review. Use Matt's `tdd` for test-first slices and `to-spec`/`to-tickets`/`implement` for planned work; use ECC `tdd-workflow` or `blueprint` only when explicitly requested.
4. Ponytail only for trimming unnecessary code. It must not override Medusa's required module/workflow structure, validation, auth, or the database constraint. A `ponytail:` comment is allowed when it records a deliberate shortcut with its ceiling and upgrade path.

## Safety

- Ask before database migrate/reset/drop, destructive deletes, force-push/reset, dependency installs, or changes to deployment and secrets.
- Do not weaken the exclusion constraint, auth checks, or validation to make a test pass.
- Keep generated migrations and schema documentation in sync.
