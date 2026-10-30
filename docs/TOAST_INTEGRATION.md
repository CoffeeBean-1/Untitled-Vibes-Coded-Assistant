# Historical Toast research — superseded destination

The owner corrected the active ordering destination on October 27, 2026 to https://asterhall.order.online/. Use [ASTER_HALL_INTEGRATION.md](ASTER_HALL_INTEGRATION.md) for current planning. The Toast API research below is retained as history and must not be applied to the current provider.

# Aster Hall / Toast integration plan

Decision update: October 26, 2026. Provider target is confirmed by the user's internal bookmark. API eligibility is NOT confirmed. This specification replaces earlier DoorDash-first assumptions.

## 1. Direct answer and selected destination

Toast provides restaurant integration APIs, so an authorized integration is technically possible. However, access is granted to restaurant/customer and partner integrations, not inferred from a diner's ability to use a public ordering page. Standard access cannot create orders; write capabilities need the appropriate custom/partner access. [S12](SOURCES.md#s12), [S13](SOURCES.md#s13), [S23](SOURCES.md#s23).

Default destination: `https://order.toasttab.com/online/aster-hall`.

The page identified Aster Hall Chicago and pickup ordering when checked on October 26, 2026. It also reported that online ordering was unavailable. Treat this as a point-in-time observation only. Confirm the active ordering channel with the merchant or user's office before production rollout. Do not infer permanent closure, silently change provider, or store that observation as a live availability indicator. [S11](SOURCES.md#s11).

## 2. Capability ladder

| Level | Product behavior | Dependency and boundary |
| --- | --- | --- |
| F0: launcher | Open the exact Toast bookmark; allow a manual pickup reminder and saved tracking link. | No Toast API credentials. Explicit user navigation only. No automatic proof of purchase or ready status. |
| F1: authorized read-only information | Show permitted menu or availability data; potentially a narrowly scoped merchant-mediated order-status view. | Merchant-controlled access and a reviewed backend. Standard access is read-only and does not itself establish which status data is available for a given user's order. |
| F2: authorized ordering channel | Build a cart, quote, explicitly submit an order, and use permitted payment handling. | Custom/partner scopes, merchant agreement, provider validation, and a separately approved payment design. Not first-release scope. |
| F3: verified fulfillment notifications | Notify only on authenticated, authorized provider status changes. | Confirm event category, originating channel, restaurant setup, user ownership, and actual readiness semantics. Cannot be inferred from F0 or F1. |

These levels are capabilities, not a promise that Toast will approve the application or that F1 automatically upgrades to F2/F3.

## 3. The important order-origin distinction

An approved ordering-channel integration normally reads the orders it submitted. Toast's dedicated guest-fulfillment webhook sends updates to the third-party ordering channel through which the order originated. Therefore, launching Toast's own checkout and later querying our hypothetical channel API is not a demonstrated end-to-end design. [S24](SOURCES.md#s24), [S25](SOURCES.md#s25).

Toast also documents merchant-side standard-access webhooks, including an orders category. That is a different possible route, not a universal diner subscription mechanism. Aster Hall would need to participate, access would need to be appropriate, and the precise fields/status semantics would need testing. Broad restaurant payloads must not be exposed to this personal dashboard. [S26](SOURCES.md#s26), [S29](SOURCES.md#s29).

No status-by-email matching, order-number guessing, scraping, browser-cookie reuse, network-panel endpoint replay, or mailbox/SMS reading is part of this plan. An order identifier is not proof that the requesting employee owns the order.

## 4. F0 implementation contract

Use an ordinary user-initiated external browser action to the configured HTTPS destination. Name the action 'Order on Toast' or 'Open Aster Hall ordering'; do not name it 'Place order' when the app only navigates elsewhere.

The widget can provide user-maintained favorite notes, a sensitive tracking-link bookmark, and 'Remind me to check pickup' at a chosen time. Distinguish these from a provider-sourced menu, cart, order, or ETA. Never show 'Order received' after a link click or 'Ready' when a countdown reaches zero.

There is no reliable automatic completion signal just from opening a new tab. Do not rely on cross-origin iframe inspection, a desktop webview, or a proxy that strips security headers. A future provider-supported embed may be evaluated separately, with payment/cookie/security review. [S21](SOURCES.md#s21).

## 5. Questions for the restaurant / Toast representative

The project owner can send this draft; the agent must not send it or contact anyone without a separate instruction:

> We are planning an internal employee productivity dashboard for an office in 900 N Michigan Avenue. Our internal Aster Hall ordering bookmark uses Toast. Initially we will link to your existing checkout. We would like to understand whether an authorized integration could show menus, place pickup orders, or deliver order-ready updates. Is this Toast storefront the active ordering channel? Can Aster Hall sponsor a limited custom integration through its Toast representative, or is a certified partner required? Which locations, scopes, event types, and commercial requirements would apply? Specifically, can an approved integration receive status updates for orders placed on your existing Toast Online Ordering site, or only for orders created by that integration? What supported checkout/payment and test-environment options are available?

Request access through the merchant's approved process; do not ask staff to email shared administrative credentials. Record scope and restaurant identifiers without committing secrets. Standard access does not include a sandbox, so do not assume every credential has a safe test environment. [S12](SOURCES.md#s12), [S30](SOURCES.md#s30).

## 6. Backend design only after approval

Proposed flow: authenticated app -> employer-approved backend -> scoped Toast client -> authorized restaurant. Webhooks terminate at the approved backend and are transformed into minimal per-user status events. Do not place merchant secrets in browser code, local desktop bundles, public build variables, or configuration exports.

Requirements for any status backend:

- Maintain a server-side mapping of authenticated user, permitted restaurant, provider order identifier, originating channel, and ownership evidence. Reject requests without that mapping.
- Validate provider signatures using the current Toast algorithm and exact body/header requirements. Use replay protection that accommodates documented provider retries, event-ID deduplication, durable queueing, and secret rotation. Follow current signing documentation rather than inventing a JWT or signature scheme. [S27](SOURCES.md#s27).
- Make processing idempotent and resilient to delayed/out-of-order events. Compare provider timestamps/versions when available. Allow legitimate reopening of an order instead of assuming status always moves forward.
- Minimize payload retention; discard unrelated orders without exposing or logging their customer details. Redact tracking URLs and PII. Enforce ownership on subscriptions and every status fetch.
- Show source, last-update time, and a stale/disconnected state. An accepted push request is not proof that an OS notification was displayed.

These are proposed application requirements, not a claim that hosting or Toast access has been approved.

## 7. Full ordering is a separately approved project increment

The app would need its own cart, valid menu/modifier selections, current availability, provider-computed prices, and explicit final confirmation. Toast documents a price calculation step before order submission, and its orders API does not itself supply shopping-cart storage. [S28](SOURCES.md#s28).

The provider also places availability-checking responsibilities on the integration. Do not treat a successful create endpoint as proof that the requested ordering time/menu was valid. [S24](SOURCES.md#s24).

Prefer staying out of card-data handling. Do not assume a hosted-checkout creation API or reusable consumer payment token exists. If Toast confirms a supported hosted payment path for this integration, evaluate it. Otherwise make payment architecture, compliance review, refunds, duplicate-order prevention, and operational support a new gate. No payment or ordering code is authorized by this planning export alone. Review the official ordering integration checklist before any such scope expansion. [S31](SOURCES.md#s31).

On timeout, reconcile a stable client order identity through documented provider behavior before retrying. Never use blind repeated POSTs that could charge or order twice. No real purchases during tests without separate specific authorization.

## 8. Feasibility exit checklist

Record evidence for: active storefront; merchant sponsor; employer approval; permitted integration type; exact scopes and restaurant IDs; test environment; order-origin coverage; user ownership mechanism; verified readiness fields/events; webhook entitlement; payment boundary; backend/network approval; rate limits and timeout recovery; support and revocation owner.

Until this proof is complete, ship F0 and keep API flags disabled. A failure to gain access is an acceptable explicit decision, not a reason to block the rest of the assistant.
