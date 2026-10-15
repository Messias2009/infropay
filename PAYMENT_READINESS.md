# InfroPay — Automatic payment readiness

Status: design only; these additions have not been migrated or connected to a provider. Existing placeholder webhooks fail closed. Manual order approval remains separate.

## Additive database structure

- `payment_attempts`: UUID, sale_id, provider, merchant account identifier, unique provider payment reference, unique checkout idempotency key, expected amount in integer minor units, currency, state, created_at, expires_at, confirmed_at. Multiple attempts may belong to one sale; a new attempt cannot silently create a second wallet credit.
- `payment_events`: UUID, provider, unique (provider, event_id), payment_attempt_id, verified_at, processing state, processed_at, redacted provider payload, safe error code and retry metadata. Preserve failed events for reconciliation; never log card data, credentials or buyer access tokens.
- `payment_ledger`: immutable UUID, sale_id, payment_attempt_id, operation kind, integer amount, currency, unique accounting operation key and created_at. Keep credits, fees, affiliate commissions and reversals attributable to one confirmed payment.
- `notification_outbox`: UUID, sale/withdrawal event identifier, recipient UUID, channel, template key, state, attempt count and created_at. Unique (event, recipient, channel) prevents duplicate alerts. The managed email queue remains responsible for actual email sending, not a custom sender.

All new tables need explicit grants followed by RLS. Provider events and the ledger are service-role only; owners can read only safe projections of their own attempts. No client may confirm payment or alter balances.

## Atomic confirmation contract

1. Checkout computes price, discounts, shipping and commissions on the server from saved product data, not browser totals. Create a pending sale and payment attempt before calling the provider.
2. Send a stable idempotency key when creating provider charges. Store the returned provider reference; never use the buyer access token as a provider identifier.
3. Verify the signature against the raw webhook body, enforce the provider replay window and validate the documented payload schema. The real Multicaixa provider and its signing protocol are still unknown.
4. Query the provider for authoritative payment state where its protocol requires it. Match merchant account, payment reference, expected amount and currency. A checkout completion event alone is not necessarily paid.
5. A service-only database transaction locks the attempt and sale, claims the unique event, applies only allowed state transitions, records unique ledger entries, updates the sale and inserts notification-outbox entries together. On error, roll back all changes so a retry cannot be discarded as a completed duplicate.
6. Credit producer/affiliate balances exactly once through the existing accounting mechanism after reviewing its triggers. Never credit from both a new RPC and an existing trigger.
7. Do not turn a paid/refunded sale into cancelled when a delayed failure event arrives. Refunds/chargebacks use explicit reversing entries and unique provider refund references.
8. Reply success only after the transaction commits. Duplicates of committed events are acknowledged without additional accounting. Transient failures return a retryable status.

## Recovery and launch verification

- Reconcile pending/uncertain attempts against the provider on a bounded schedule with checkpoints, concurrency control and an authenticated scheduled endpoint.
- Test bad/missing signatures, mismatched amounts/currency, duplicate callbacks, concurrent callbacks, delayed/out-of-order events, paid-after-browser-close, transaction rollback/retry, refunds, chargebacks and provider timeouts.
- Check buyer order polling reads back the confirmed sale and delivery URLs only for paid orders. In-app realtime alerts and emails must be tied to the same committed event.
- Browser notifications currently require an open app and permission. Background web push needs separate subscription/worker delivery; it is not provided by the current `Notification` call.
- Email is blocked until an owned sending domain is configured and verified. Use managed app-email infrastructure, event-based idempotency keys and individually expected sale/withdrawal messages.
- Remaining security audit: review callable privileged functions and grants flagged by the live database linter, order creation policies, storage delivery permissions, withdrawal concurrency and role assignment before launch.

Provider documentation, sandbox credentials and a successful end-to-end paid-order test are required before enabling automatic confirmation. No live-payment reliability guarantee is made.