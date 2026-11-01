# ADR-005 — Vendors authenticate as a custom `vendor` actor type

- Status: accepted
- Date: 2026-10-22

## Context

Vendors must not share admin auth, and the storefront cannot assume an admin session. Medusa supports custom actor types through the Auth Module, registration/login routes (`/auth/vendor/emailpass`) and `authenticate("vendor", ...)` middleware.

## Decision

Use `vendor` as a first-class actor type. A `vendor_user` row stores the owner/staff identity and `auth_identity_id`; `setAuthAppMetadataStep({ actorType: "vendor", value: vendorUser.id })` links the auth identity. Vendor API routes resolve the vendor exclusively from the authenticated `vendor_user`, never from request input.

## Consequences

- Registration uses `/auth/vendor/emailpass/register`, then `POST /vendor/register` with the registration token; login uses `/auth/vendor/emailpass`.
- Cross-vendor reads return 404. Admin endpoints remain on the `user` actor type.
- The `app_metadata.vendor_id` key physically holds a `vendor_user` id (Medusa derives the key from the actor type), so code must resolve the user→vendor relation rather than treating it as a vendor id.
