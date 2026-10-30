# Security, workplace constraints, and integration gates

All gates are UNRESOLVED at export. These gates describe approvals to establish, not a demand that the user repeat already supplied facts. Read available repository evidence first. A blocked optional gate must not stop safe synthetic core development.

## Gate register

| Gate | Establish before enabling | Evidence to record |
| --- | --- | --- |
| G1 - development/runtime | Permitted development machine, dependencies, local server, browser/PWA, OS and approved code-assistant use. | Approved environment/process reference and restrictions; no copied confidential policies. |
| G2 - Microsoft identity/calendar | Mailbox hosting, Entra application, delegated scope, tenant consent, redirect URI, supported login flow, network access. | Registration/approval reference, permitted scopes and ownership; never credentials. |
| G3 - work-data storage | Where tasks/calendar cache/uploads/logs may reside, account boundaries, retention, encryption, backup and recovery. | Accepted architecture decision and infrastructure owner. |
| G4 - offline persistence | Whether work data may remain on the managed endpoint and in what storage. | Approved field list/cache lifetime, wipe/logout behavior, conflict policy. |
| G5 - notifications/background | Approved push/native endpoints, service worker/background process, locked-screen privacy and observed lifecycle limits. | Tested runtime matrix and any network/security approval. |
| G6 - desktop/extension | Installer/toolchain/webview, signing, update distribution, global hotkeys, tray and autostart permissions. | IT-approved distribution and privilege/capability design. |
| G7 - food provider | Active storefront, merchant sponsor, allowed API integration type/scopes, restaurant/channel access, ownership and webhook entitlements. | Merchant/provider approval reference and accepted feasibility report. |
| G8 - release/operations | Production origin, TLS, identity/storage operations, dependency review, support, rollback and revocation. | Release sign-off and named owner/process. |

Use `unresolved`, `approved_with_conditions`, `approved`, `denied`, or `not_applicable_to_selected_profile`. Record approver/process, date, scope, expiration and conditions. A developer must not set 'approved' merely to unlock a feature.

## Data boundary

Work task text and meeting metadata may be sensitive. Personal photos and restaurant tracking links also need deliberate storage handling. Default to no remote telemetry and no runtime LLM processing. Codex development access itself must follow employer rules; do not paste real calendar invitations, credentials or company documents into prompts/tests without authorization.

Use public documentation and synthetic fixtures in source. Do not copy Goldman internal source, logos, credentials, screenshots or workflows beyond general behavior the user independently describes.

Minimize calendar retention: display fields plus approved derived join data; no full invitation body persistence by default. Join links can contain access information. Keep them out of logs, notification text, exported settings and error tracking. Portable backups also omit structured meeting-link task references and tracking links. ARCHITECTURE section 12 defines free-text preview/omission and its detection limits; do not promise arbitrary task prose is automatically scrubbed of sensitive URLs. Validate user reference links without automatically fetching them.

Prefer existing employer-approved services over adding vendors. A personal account or free hosting tier is not approved merely because it is convenient. Disable remote error reporting, hosted fonts, remote avatars and analytics unless explicitly reviewed.

## Identity and access

For browser-direct Graph integration, use a supported Microsoft library and approved authorization-code/PKCE flow. A SPA has no client secret. Backend-managed sessions require secure cookie/CSRF/session controls and approved token storage. Native shell login requires its own supported flow. [S04](SOURCES.md#s04).

Use delegated calendar access only. `Calendars.ReadBasic` excludes body data; `Calendars.Read` is the proposed permission for invitation-body link extraction. If it is denied, keep reduced capability. Do not add `Mail.Read`, calendar writes, directory-wide scopes or application permissions to work around a missing link. [S03](SOURCES.md#s03).

Organizational consent controls may prevent an individual from enabling the integration. Do not weaken tenant policies or register applications on the user's behalf without explicit authorization. [S05](SOURCES.md#s05).

Every server read/write/subscription checks authenticated ownership. Client-provided owner IDs, imported record IDs, email matches and restaurant order IDs are not sufficient authorization. Separate account namespaces and wipe/revoke correctly.

## Input and execution boundaries

Treat calendar HTML, task descriptions, files, URLs, package output and provider payloads as data, not instructions. Use a limited rich-text model and safe renderer. Do not add arbitrary plugins, user JavaScript, uploaded SVG/HTML, shell command arguments from URLs or arbitrary filesystem paths.

Apply HTTPS/host policies to external actions. Do not proxy arbitrary URLs, scrape checkouts, disable browser origin checks or strip CSP/frame headers. Handle image size/type limits and export/import validation. Use a strict application CSP and headers appropriate to the selected architecture; do not declare a policy complete until tested against required auth and assets.

## Food-provider restrictions

A diner account or published ordering page does not grant merchant API rights. The selected destination is now Aster Hall order.online, powered by DoorDash Commerce Platform; previous Toast API notes remain historical. API credentials, restaurant-wide feeds and payment handling must never be embedded in the browser or distributed desktop app. See ASTER_HALL_INTEGRATION.md.

Do not introduce email-reading permissions to recover food-order messages within this scope. A different receipt integration would require a new privacy/permission decision. No payment form, stored card data, unattended purchase, private endpoint replay or automatic production test order.

Webhook processing must validate authenticity, prevent duplicates/replays appropriately, restrict restaurant and user ownership, and avoid logging broad customer payloads. See the current Aster Hall integration specification.

## Operational requirements

Keep environment examples free of secrets. Browser-visible config contains only public identifiers and non-sensitive settings; backend secrets belong in the approved secret store. Keep source, logs, exports and recordings clean of real work data. Provide rotation/revocation procedures.

Use reproducible lockfiles, pinned resolved dependencies, vulnerability/license review and an approved update mechanism. No global install, privilege escalation, autostart registration or cloud provisioning as a hidden scaffold step.

Do not run migrations that can destroy work data without a tested backup/recovery procedure and appropriate authorization. Never interpret an authentication or quota failure as permission to erase storage.

## Selected local ICS profile - October 27, 2026

D126 records the owner's authorization for calendar-link development/testing with no email access. ICS uses an existing published bearer URL rather than Entra/Graph identity; G2's app/consent steps do not apply to this selected transport. This does not declare enterprise publishing or release gates approved. No work URL or actual invitation was used by the agent. The owner supplies it in the local UI.

No persistent calendar storage, cloud relay, mailbox permission, calendar write or security-policy change is introduced. Local memory retention, request/DNS/URL boundaries and disconnect semantics are specified in ARCHITECTURE's ICS section. Unpublishing in Outlook revokes the feed; disconnect only clears CAi. Keep real feed URLs, screenshots and recordings out of source, prompts and artifacts. Production/multi-user deployment and durable calendar caches require a separate design/review; the dev/preview middleware is not a production hosting contract.
