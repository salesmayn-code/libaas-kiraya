# ADR-003 — Payments start on Medusa's simulated system provider

- Status: accepted (implemented)
- Date: 2026-10-22

## Context

The PRD asks for a custom `simulated-wallet` provider plus optional Stripe test mode. The project must stay zero-cost and runnable without keys. Medusa ships `pp_system_default`, a simulated provider that authorizes, captures and refunds without an external service.

## Decision

Implement a custom `simulated-wallet` provider behind Medusa's payment module, keep `pp_system_default` available as a fallback, and verify the whole money path against the custom provider. The provider declares `supportsHold: false`, so deposits stay charge-and-refund.

## Consequences

- Checkout, deposit capture/refund and cancellation refunds are verified with the custom provider today.
- Deposits default to charge-and-refund, as the PRD recommends when holds are unavailable.
- Stripe test mode or a local wallet can be added as another provider; only configuration and storefront provider choice change.
