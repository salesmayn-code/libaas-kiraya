# ADR-002 — Local S3 storage uses RustFS instead of MinIO

- Status: accepted
- Date: 2026-10-22

## Context

The TRD calls for MinIO in Docker Compose. During the build, the community MinIO images were no longer pullable from Docker Hub/Quay (access denied / no manifest), and LocalStack's community image now requires a license token to start.

## Decision

Use RustFS (`rustfs/rustfs`) as the local S3-compatible store. An `amazon/aws-cli` init container creates `libaas-public` and `libaas-private` and applies a public-read policy to the catalog bucket. The backend still uses the standard `@medusajs/medusa/file-s3` provider with `forcePathStyle`.

## Consequences

- Same S3 API, presigned URLs and path-style behavior as the planned MinIO setup.
- Production/staging can use AWS S3, Cloudflare R2 or any S3-compatible service without code changes.
- The seeded catalog uses local SVG placeholders; vendor uploads go to RustFS.
