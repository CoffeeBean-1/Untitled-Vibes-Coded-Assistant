# Current Aster Hall integration assessment

Checked October 27, 2026. Selected destination: https://asterhall.order.online/. Owner corrected the earlier Toast bookmark. The owner-approved external launcher and manual pickup companion are now implemented; the public observations below remain the prior feasibility evidence, not a live-status feed. Do not carry old Toast API assumptions into the new provider.

## Verified public observations

- The restaurant's [Food Hall page](https://asterhallchicago.com/food-hall) links its Order Now action to a pickup store on asterhall.order.online.
- The [linked consolidated store](https://asterhall.order.online/store/small-cheval-@-aster-hall-chicago-521893/?hideModal=true&pickup=true) lists multiple concepts, including Small Cheval, Fresko, Aster Sushi, Grateful Grains & Greens and Lost Lily's, and identifies DoorDash Commerce Platform. Its URL/title uses Small Cheval but its menu is broader. No account, cart, order or payment was used to inspect this public material.
- The generic root redirected to /business/-233961 in the web reader. Local read-only HEAD requests to the root and that business path both returned HTTP 403 security challenges with X-Frame-Options SAMEORIGIN. Those responses prevent cross-origin framing of the challenge. This does not establish normal menu/checkout response headers after a human session; full iframe/sign-in/cart/payment behavior is NOT RUN.

## Capability choices

1. **Launcher and companion view — feasible now.** Dashboard Aster Hall widget plus matching tab, Open ordering / Browse menu actions to the provider site, optional user-maintained favorites/notes. Checkout stays in the provider's normal tab. No merchant credentials or payment handling in CAi. DoorDash's [official website guidance](https://help.doordash.com/en-us/merchants/article/add-online-ordering) documents direct ordering links and buttons as the normal integration route.
2. **Embedded provider checkout — unverified.** A plain iframe can be blocked by provider X-Frame-Options or CSP frame-ancestors. Python vs React does not change browser enforcement. Even a loading frame cannot be assumed to support login, cookies, payment redirects or in-frame navigation. A supported merchant embed or explicit provider framing support would need its own proof, with a normal-tab fallback. Do not strip response headers, proxy checkout, disable browser protections or present a successful load event as proof of checkout support.
3. **Native menu/cart/status integration — separate provider project.** DoorDash [Marketplace APIs](https://developer.doordash.com/en-US/docs/marketplace/overview/) are limited-access partner APIs for store/menu/order systems. That does not establish access to this storefront or an API for a diner to inspect website orders. Merchant/provider participation and exact originating-channel/status/ownership/payment scope must be proven before implementation. Public menu visibility is not an API entitlement.

Browser references: [frame-ancestors](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/frame-ancestors), [X-Frame-Options](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/X-Frame-Options), [same-origin policy](https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Same-origin_policy). Cross-origin isolation also means CAi cannot inspect the ordering page to infer that an order was paid or is ready. A provider-supported integration message/API would be needed for verified status.

## Original feasibility recommendation (before implementation)

Bring forward the link-only Aster Hall widget/tab if food is the owner's next desired visible feature. Keep the user's corrected root URL configurable, with the restaurant's official site as fallback. Validate navigation with intercepted tests; no automated production order. Keep menus/prices/hours/availability owned by the provider rather than copying a stale catalog into CAi.

M4 reminder work remains the next foundation package. Build configurable schedules, snooze, quiet hours and cross-tab/wake correctness before the complete manual pickup-reminder flow. A user-entered reminder must say Check pickup, not Food ready. No automatic order confirmation or readiness follows from a click, timer or iframe. Tracking links remain sensitive and out of public exports/logs.

M3 layout follows the core reminder work, then remaining M5 clocks/appearance. Advanced tasks and optional desktop access retain their backlog dependencies. The supplied v1.6 corrected logo is integrated. No new application/API/CSP/storage behavior is enabled by this planning/configuration update.

## Implemented companion

Aster Hall now has a dashboard widget and full tab. Open ordering uses the approved root in a new tab with noopener/noreferrer; no iframe or API is used. Manual pickup checks use the shared foreground reminder system, support snooze/cancel/mark checked and store optional private tracking links locally. No tracking link enters portable exports. Current menu/availability/estimate information stays with the provider. Automated checkout navigation is intercepted; actual ordering and merchant-status API access remain untested/unimplemented. See REMINDERS_FOOD_VALIDATION.md.
