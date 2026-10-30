# Sources and verification boundaries

Public documentation reviewed for this handoff on October 26, 2026. No enterprise account, Microsoft application registration, Toast API, webhook, payment or real order was tested. Re-verify access programs, scopes, endpoints, versions and active storefront behavior before implementation.

User requirements come from the conversation. Layout dimensions, data models, performance budgets, milestones and security defaults are proposed project decisions unless explicitly marked otherwise; they are not vendor promises. Public documentation establishes technical possibilities, not employer or merchant permission.

<a id="s01"></a>
## S01 - OpenAI - Codex repository instructions

Source: https://developers.openai.com/codex/guides/agents-md

Repository AGENTS.md discovery and instruction composition. Other plan filenames are project conventions, not automatically loaded instructions. The official URL redirected to the current ChatGPT Learn documentation when checked.

<a id="s02"></a>
## S02 - Microsoft Graph - calendarView v1.0

Source: https://learn.microsoft.com/en-us/graph/api/calendar-list-calendarview?view=graph-rest-1.0

Time-bounded occurrences, recurrence exceptions, single events, permissions and pagination. Use v1.0, not beta examples found in search.

<a id="s03"></a>
## S03 - Microsoft Graph - permissions reference

Source: https://learn.microsoft.com/en-us/graph/permissions-reference

Delegated calendar scope definitions; Calendars.ReadBasic excludes body, attachments and extensions. Actual tenant consent remains separate.

<a id="s04"></a>
## S04 - Microsoft identity - authorization-code flow

Source: https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-auth-code-flow

Supported authentication libraries, authorization code and PKCE. Review the flow appropriate to SPA, server or native deployment before implementation.

<a id="s05"></a>
## S05 - Microsoft Entra - user consent controls

Source: https://learn.microsoft.com/en-us/entra/identity/enterprise-apps/configure-user-consent

Organizational policies determine whether users may consent. This project does not authorize changing tenant policy.

<a id="s06"></a>
## S06 - Microsoft Graph - online meetings in Outlook

Source: https://learn.microsoft.com/en-us/graph/outlook-calendar-online-meetings

Structured online meeting information for supported Outlook providers. It is not evidence that every Zoom invitation contains a populated joinUrl field.

<a id="s07"></a>
## S07 - Microsoft Graph - deprecated Exchange hybrid REST support

Source: https://learn.microsoft.com/en-us/graph/hybrid-rest-support

The old hybrid on-premises REST integration ended in July 2023. Verify Exchange Online hosting rather than inferring it from the Outlook client.

<a id="s08"></a>
## S08 - MDN - offline and background PWA operation

Source: https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Offline_and_background_operation

Service-worker lifecycle and background/push mechanisms. Browser background scheduling is not a guaranteed exact alarm service.

<a id="s09"></a>
## S09 - Tauri - global shortcut plugin

Source: https://v2.tauri.app/plugin/global-shortcut/

Desktop shortcut registration and permissions. Workplace installation approval and complete window lifecycle behavior remain separate work.

<a id="s10"></a>
## S10 - GridStack - official project site

Source: https://gridstackjs.com/

Responsive draggable/resizable dashboard library and save/restore facilities. Recheck supported package versions and React integration at setup; do not copy a website version badge into the plan.

<a id="s11"></a>
## S11 - Aster Hall - user-supplied Toast storefront

Source: https://order.toasttab.com/online/aster-hall

Selected destination supplied by the user. Public page identified Aster Hall Chicago and pickup ordering, but reported online ordering unavailable during the October 26 check. Not a permanent availability conclusion or API grant.

<a id="s12"></a>
## S12 - Toast - standard API access overview

Source: https://doc.toasttab.com/doc/devguide/devApiAccessUserGuide.html

Standard access is read-only and excludes write access and sandbox access. Do not equate it with permission to create orders.

<a id="s13"></a>
## S13 - Toast - API overview and method/access matrix

Source: https://doc.toasttab.com/doc/devguide/apiOverview.html

Available API families and operation types by integration class. Actual custom/partner permissions are scoped to the approved use case.

<a id="s14"></a>
## S14 - Microsoft VS Code - Dark Modern theme source

Source: https://raw.githubusercontent.com/microsoft/vscode/main/extensions/theme-defaults/themes/dark_modern.json

Reference for dark neutrals. The project green and several accessibility/semantic tokens are our design choices, not copied VS Code defaults.

<a id="s15"></a>
## S15 - Microsoft VS Code - Light Modern theme source

Source: https://raw.githubusercontent.com/microsoft/vscode/main/extensions/theme-defaults/themes/light_modern.json

Reference for light neutrals. Verify actual UI composition and contrast independently.

<a id="s16"></a>
## S16 - MDN - Intl.DateTimeFormat

Source: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat

Built-in locale/time-zone formatting. This is not a recurrence or time-zone arithmetic engine.

<a id="s17"></a>
## S17 - W3C - WCAG 2.2

Source: https://www.w3.org/TR/WCAG22/

Accessibility reference for the proposed AA target. Also consult https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html for text contrast. No conformance claim exists until assessed.

<a id="s18"></a>
## S18 - Chrome - extension commands API

Source: https://developer.chrome.com/docs/extensions/reference/api/commands

Extension shortcut capabilities are distinct from ordinary web-page keyboard handling. Browser/OS support and enterprise policy require verification.

<a id="s19"></a>
## S19 - Microsoft Graph - throttling guidance

Source: https://learn.microsoft.com/en-us/graph/throttling

429 handling and Retry-After guidance. The proposed polling interval is an application default, not a published quota or guarantee.

<a id="s20"></a>
## S20 - Microsoft Graph - Outlook change notifications

Source: https://learn.microsoft.com/en-us/graph/outlook-change-notifications-overview

Subscription lifecycle and notification mechanics for a possible approved backend. Renewal and reconciliation are required design work.

<a id="s21"></a>
## S21 - MDN - same-origin policy

Source: https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Same-origin_policy

Cross-origin browser isolation. An iframe or new tab is not an API for reading provider checkout results.

<a id="s22"></a>
## S22 - MDN - PWA app icons

Source: https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/How_to/Define_app_icons

Manifest/install icon definitions. Installed icon update behavior must be tested separately from favicon changes.

<a id="s23"></a>
## S23 - Toast - integration types

Source: https://doc.toasttab.com/doc/devguide/apiIntegrationTypes.html

Standard, custom, partner and analytics access are different routes. API capability is not established by a public diner account.

<a id="s24"></a>
## S24 - Toast - orders API overview

Source: https://doc.toasttab.com/doc/devguide/portalOrdersApiOverview.html

Ordering-channel clients have origin-limited order access. The integration must also handle service-time/menu/inventory eligibility and documented payment limitations.

<a id="s25"></a>
## S25 - Toast - guest order fulfillment webhook

Source: https://doc.toasttab.com/doc/devguide/apiGuestOrderFulfillmentStatusWebhook.html

Guest fulfillment updates are sent to the originating third-party ordering channel. Ready status depends on provider/restaurant workflow; orders can be reopened.

<a id="s26"></a>
## S26 - Toast - standard-access webhook subscriptions

Source: https://doc.toasttab.com/doc/devguide/devApiAccessWebhookSubscriptions.html

Merchant standard access can manage specified webhook categories, subject to permissions, linked locations and product entitlement. This is not a diner notification API.

<a id="s27"></a>
## S27 - Toast - webhook message signing

Source: https://doc.toasttab.com/doc/devguide/apiMessageSigning.html

Toast-Signature authentication uses the documented message body, timestamp and subscription secret. Implement and verify the current algorithm, with application replay/deduplication defenses.

<a id="s28"></a>
## S28 - Toast - creating orders

Source: https://doc.toasttab.com/doc/devguide/apiCreatingOrders.html

Provider price calculation before submission and application-managed cart state. Do not assume a hosted-checkout creation endpoint.

<a id="s29"></a>
## S29 - Toast - orders webhook

Source: https://doc.toasttab.com/doc/devguide/devOrdersWebhookRef.html

Orders event payloads and omitted fields. Distinguish general order updates from the dedicated guest-fulfillment webhook; prove ownership/status meaning for the permitted route.

<a id="s30"></a>
## S30 - Toast - custom integration overview

Source: https://doc.toasttab.com/doc/devguide/apiCustomIntegrationOverview.html

Restaurant customers and their development teams request tailored access through the Toast account representative. Access for this project has not been requested or granted.

<a id="s31"></a>
## S31 - Toast - online ordering integration checklist

Source: https://doc.toasttab.com/doc/cookbook/apiIntegrationChecklistOrdering.html

Official ordering implementation checklist covering scopes, menu/configuration, stock, pricing, payments and operational behavior. It is a reference, not authorization to implement payment handling.


## M0 dependency verification - October 26, 2026

Implementation checked the official [Vite guide](https://vite.dev/guide/), [React build guide](https://react.dev/learn/build-a-react-app-from-scratch), [Vitest guide](https://vitest.dev/guide/), [Playwright installation guide](https://playwright.dev/docs/intro) and [Node downloads](https://nodejs.org/en/download). npm registry metadata supplied exact current versions, Node engines, peer dependencies and SPDX license identifiers. Actual installation and build/tests established compatibility for the selected versions; the plan's old version-free defaults were not treated as tested dependencies. Node archive SHA-256 matched the official versioned SHASUMS256.txt. No live Microsoft or Toast behavior was retested in M1.
