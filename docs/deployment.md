# Deployment notes

The repository ships local Docker Compose and two production Dockerfiles. The local stack is verified; the production images and a hosted staging environment have not been deployed from this machine.

## Containers

```bash
docker build -f Dockerfile.backend -t libaas-backend .
docker build -f Dockerfile.storefront \
  --build-arg NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://api.example.com \
  --build-arg NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_live_or_test \
  --build-arg NEXT_PUBLIC_SITE_URL=https://example.com \
  -t libaas-storefront .
```

The storefront bakes `NEXT_PUBLIC_*` values at build time. Rebuild it when the backend URL or publishable key changes.

## Required services

- PostgreSQL 15+ with `btree_gist` (run `CREATE EXTENSION IF NOT EXISTS btree_gist` before migrations; the rental migration also does this).
- Redis (cache, event bus, workflow engine).
- S3-compatible storage for catalog and private evidence/KYC files.
- SMTP for email (Mailpit locally, any provider in staging).
- Payment provider: `pp_simulated-wallet_simulated-wallet` by default; Stripe can be added as a second provider without changing booking logic.
- At least one long random `JWT_SECRET` and `COOKIE_SECRET`.
- `HOLD_TTL_MINUTES`, `SMTP_*`, `S3_*`, `SIMULATED_WALLET_WEBHOOK_SECRET`.

## Release sequence

```bash
pnpm install --frozen-lockfile
pnpm --filter backend db:migrate
pnpm --filter backend seed        # optional; prints the publishable key
pnpm --filter backend build
pnpm --filter storefront build
```

Run `medusa start` for the API and `next start` for the storefront. For scale, run the Medusa server and worker as separate processes; both need the same Redis URL.

## Health

- Backend: `GET /health` (process) and `GET /health/ready` (DB/Redis).
- Storefront: `GET /api/health`.

## Backups and restore

Use `infra/scripts/backup.sh` and `infra/scripts/restore.sh` locally. For staging, schedule `pg_dump --format=custom`, retain at least 7 daily + 4 weekly copies, store them outside the database host, and test a restore monthly. Private evidence/KYC objects need bucket versioning and an object-storage lifecycle policy.

## Security checklist before staging

- Rotate every secret from `.env.example`; never reuse the local values.
- Restrict CORS to the real storefront/admin origins.
- Put the API behind HTTPS and a rate limiter; the app also rate-limits search, quote and hold routes in Redis.
- Keep KYC/evidence buckets private; only serve signed URLs.
- Verify webhook signatures for any real payment provider.
- Confirm the host supports `btree_gist` before creating the database.
