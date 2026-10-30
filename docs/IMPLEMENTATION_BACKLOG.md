# Implementation backlog

Current status (October 26, 2026): M0 and scoped M1 are VERIFIED; M2.1 is IN PROGRESS: core implementation and automated checks are delivered; owner usability measurement and performance follow-up remain. M2.2/M2.3 and M3-M10 remain NOT STARTED. See M1_VALIDATION.md for executed evidence and limits. The earlier all-not-started planning state is historical. Work in bounded packages; do not treat the list as permission to enable live services.

## Progress rules

Use `not_started`, `in_progress`, `blocked`, `verified`, or `deferred_by_owner` per package. A completed implementation with unrun tests is not `verified`. Record dependency, acceptance IDs, commands/evidence, and remaining limitations. Gate IDs refer to `SECURITY_AND_IT.md`.

| Milestone | Dependencies | Scope and exit condition |
| --- | --- | --- |
| M0: repository/environment preflight | None; use approved development environment | Inspect repository and instructions, preserve edits, inventory tooling and unknown approvals. Record decisions and capabilities. No enterprise connection. |
| M1: first vertical slice | M0 | Running synthetic dashboard, persisted basic task, simulated next meeting/Join, in-app reminder demonstration, light/dark tokens, real validation scripts. |
| M2: tasks in staged packages | M1; package dependencies below | M2.1 delivers basic tasks and recovery first. M2.2/M2.3 retain advanced views, subtasks, parsing and recurrence for later increments. |
| M3: bounded widget layout | M1; consume M2 features when ready | 12/8/4 responsive grid, presets, edit mode, keyboard alternatives, independent saved profiles, shared task data. |
| M4: reminder domain | M2.1, not all of M2 | Durable schedules/history, snooze, revisions, cancellation, quiet hours, wake reconciliation, honest foreground behavior. |
| M5: clocks, appearance, Aster Hall launcher | M1/M3; M5.3 manual reminders additionally require M4 | Configurable clocks, uploads/presets/icons, accessible theme behavior, current Aster Hall external ordering link and manual reminder flow. |
| M6: authorized Outlook calendar | M1, calendar mock contract, G1/G2/G3 as applicable | Approved identity and read-only Graph access, real agenda/Join, expiry/throttle/failure tests. No mailbox writes. |
| M7: work-data persistence and notifications | M2.1/M4 plus G3/G4/G5 as applicable; later M2 features require adapter regression tests when added | Approved storage topology, backup/restore, auth/ownership, reminder delivery profile, recovery evidence. |
| M8: optional desktop quick access | M1/M3/M4 plus G1/G6 | Shared UI in approved shell, single instance, custom global shortcut, tray, focus/hide behavior, native lifecycle tests. |
| M9: optional food-provider API feasibility | M5 plus G7 and G3/G5 as applicable | Prove scope/channel/ownership/event behavior; implementation requires a separately accepted increment. F0 remains viable. |
| M10: work-ready release | M2.1/M3/M4/M5 and M6/M7 for included live capabilities; M2.2/M2.3/M8/M9 only if selected | Accessibility/security/performance/recovery audit, target-machine test, approved rollout and ownership, honest feature matrix. |

M6/M7 discovery may run earlier when the user supplies approvals. M8/M9 are not required to develop the core. A release that cannot provide live calendar or needed reminder reliability must disclose that gap and obtain an explicit scope decision rather than silently claiming all requirements are complete.

## Delivery order and acceptance ownership

Owner authorized development after the v1.4 review. M0/M1 are now verified for the local synthetic scope; demonstrate M1 before selecting the next increment. See DECISIONS D117-D119. Milestone numbers are stable identifiers, not a mandatory numeric execution order.

1. First development increment, after authorization: M0 -> M1, then demonstrate and stop for review.
2. First usable synthetic core: M2.1 -> M4, with M3 layout work available after M1; then M5. Keep the first dashboard fixed until M3 is ready. Basic export/restore belongs to M2.1, not the advanced task package.
3. Later task increments: M2.2 after M2.1/M4/M3; M2.3 after M2.2/M4. Advanced features remain committed roadmap scope, but do not block the core demonstration or an explicitly scoped pilot.
4. M6/M7 discovery can proceed when authorized; implementation follows its own dependencies and gates. M8/M9 remain optional. M10 records the exact included packages and deferred capabilities.

Acceptance evidence is profile-specific. Record PASS/FAIL/NOT RUN/BLOCKED plus explicit subcase applicability. Never mark a whole test passed when required subcases for the selected package are missing. A later feature reopens relevant regression checks. Features absent from an earlier increment are listed as not yet implemented, not certified by a broad test ID.

| Behavior | Owning package and acceptance |
| --- | --- |
| Bootstrap task creation/reload and simulated meeting | M1: AT-BOOT-01 through AT-BOOT-05, AT-CAL-01; shared full-view CRUD is M2.1 / AT-TASK-01. |
| Basic task/date/urgency/lifecycle, simple views, local text search and recovery | M2.1: AT-TASK-01 through AT-TASK-04, AT-TASK-12, AT-DATA-01 through AT-DATA-04, AT-DATA-07 and AT-DATA-08. Reminder integration is rechecked in M4. |
| Advanced views, subtasks, bulk actions and command palette | M2.2: AT-TASK-05 through AT-TASK-08, AT-NAV-01; AT-DASH-04 with multiple saved task views. |
| Parsing and recurrence | M2.3: AT-TASK-09 through AT-TASK-11; extend AT-DATA-02, AT-DATA-07 and AT-DATA-08 to series and children and rerun AT-REM-02. |
| Foreground reminders and pickup reminders | M4: AT-REM-01 through AT-REM-08 for the foreground profile; M5.3: AT-FOOD-01 through AT-FOOD-03 plus reminder lifecycle regression. Transport-specific push/native subcases stay unrun until their authorized packages. |
| Brand identity, truthful copy and joke toggle | M1 implements a minimal About/settings surface and all AT-BRAND-01 through AT-BRAND-05 for its surfaces; M2-M9 extend checks to newly added surfaces; M10 repeats all applicable brand tests. |
| Performance and usability | M2.1 introduces AT-PERF-03 and AT-UX-01 baseline measurements; M3-M7 repeat after relevant additions; M8 owns warm native reveal; M10 owns full applicable AT-PERF-01 through AT-PERF-03 and AT-UX-01. |

## M0 - preflight

M0.1 Read current instructions and inspect files, Git status, manifests, Node/package-manager availability, and permitted network/tooling. Do not install globally or change corporate controls.

M0.2 Record known user requirements and unresolved gates. Choose demo mode. Confirm any repository conventions before scaffolding. Keep operating system/browser unknown until observed or supplied.

M0.3 Verify current official dependency documentation and select compatible supported versions. Preserve an existing lockfile/package manager. Make no deployment or enterprise registration.

Exit: `AT-BOOT-01`, `AT-SEC-01`; status lists evidence and first code slice.

## M1 - bootstrap vertical slice

M1.1 Scaffold the proposed TypeScript/React/Vite application if the repository is empty. Establish real dev/build/typecheck/lint/test/test:e2e commands, test helpers, an injectable clock, demo namespace, and basic CI-ready checks. Do not create fake passing scripts.

M1.2 Implement the required neutral/green themes, dashboard navigation shell, stable synthetic next meeting, and intercepted demo Join. Add one dashboard task-entry/edit/complete flow with status, title, deadline, and priority backed by IndexedDB. A full Tasks view is not required until M2.1. Include a minimal About/settings surface, exact identity/tagline, truthful demo disclosures, and the optional-joke toggle.

M1.3 Demonstrate a persistent reminder record and foreground notification center entry. This is an in-app demonstration, not background delivery. Reload and prove task persistence. Add a short run guide based on commands actually run.

Exit: `AT-BOOT-01` through `AT-BOOT-05`, `AT-CAL-01`, and `AT-BRAND-01` through `AT-BRAND-05` for M1 surfaces. Full shared-view `AT-TASK-01` belongs to M2.1; widget-removal/coordinator lifecycle `AT-REM-01` belongs to M4. Stop here on the first bootstrap prompt. Explain limitations and the next package.

## M2 - foundation first, advanced workflows later

M2.1 Foundation and recovery (depends on M1): title, plain/limited-format description, status, priority, optional start/due dates, project/list, tags, lifecycle/revision fields, validation, explicit save errors, archive/trash/restore and undo. Provide shared dashboard/full Tasks CRUD, simple list views (Today, Upcoming, Overdue, Inbox, Waiting, All Tasks), text search, basic status/priority/date controls, and clear urgency labels. Use the domain transaction contract from ARCHITECTURE section 11. Implement versioned export/restore for the fields available now, including merge/replace, collision handling, remapping and reminder-disabled import. Full recurrence/subtask structures are added by their owning packages, not silently discarded by an older importer. Tests: AT-TASK-01 through AT-TASK-04, AT-TASK-12, AT-DATA-01 through AT-DATA-04, AT-DATA-07 and AT-DATA-08; baseline AT-PERF-03 and AT-UX-01. This package unblocks M4 independently of M2.2/M2.3.

M2.2 Advanced interaction (depends on M2.1/M4/M3): inline editing refinements, side panel, saved filters/sorts/groups, table/board views, bulk actions, duplicate, manual ordering and one-level subtasks/checklists. Implement the command palette: keyboard/menu access, navigation, task search and create-task action; no runtime AI or external search. Tests: AT-TASK-05 through AT-TASK-08, AT-NAV-01, and multi-view AT-DASH-04 regression. Extend backup schema/migrations and relationship tests before persisting new record types.

M2.3 Parsing and recurrence (depends on M2.2/M4): deterministic quick-entry preview and the recurrence subset/behavior table in ARCHITECTURE. Implement each as a bounded change. Extend transactions, undo, export/restore and reminders to recurring occurrences and child templates. Tests: AT-TASK-09 through AT-TASK-11, AT-DATA-02 through AT-DATA-04, AT-DATA-07 and AT-DATA-08 and AT-REM-02. Avoid adding a generic Notion clone.

## M3 - layout and widget contracts

M3.1 Implement widget registry and approved size mapping using a small grid adapter. Integrate GridStack only after a prototype validates the desired React lifecycle and dimensions. Do not let the library mutate task/domain state.

M3.2 Add edit/save/cancel/undo/reset, locked positions, collision preview, keyboard moves, validated persistence by content-width breakpoint, and deterministic first-use fallbacks. Keep widgets stationary on data changes.

M3.3 Verify all presets with long content, constrained windows, 200% zoom, both themes, and shared basic task data. Multiple saved task views are added/tested in M2.2; do not block the initial layout on them. Tests: `AT-DASH-01` through `AT-DASH-07`, applicable `AT-A11Y` checks.

## M4 - reminder correctness before background delivery

M4.1 Depends on M2.1 only. Integrate task mutations with schedules through the shared transaction boundary; rerun AT-DATA-08 and AT-TASK-04. Implement schedules as records, schedule revisions, multiple reminders, snooze, cancel-on-completion/delete, and history. Reconcile at startup/wake/visibility changes; use fake time tests.

M4.2 Add quiet hours, private display defaults, missed-alert summary, permission state, and cross-tab coordinator/lease with stale-owner recovery. Disable delivery when the configured transport is unavailable rather than showing success.

M4.3 Document each runtime state and actual promise. Browser/native/server adapters can be built later; do not simulate closed-app delivery. Tests: `AT-REM-01` through `AT-REM-08`.

## M5 - lightweight personalization and food entry

M5.1 Initialize Chicago plus a valid detected device IANA zone, deduplicating identical zones; if detection fails, retain Chicago and offer manual selection. New York/London are optional suggestions only. Add digital/analog/comparison clocks with IANA zones, labels, 12/24-hour settings, working hours, shared ticks, and visibility pause.

M5.2 Add theme presets, token validation, background gradients/uploads, validated image processing, logos/favicon behavior, storage limits and recovery. Keep installed icons a separate capability.

M5.3 Depends on M4 for the complete manual pickup reminder flow. The link-only portion may be demonstrated earlier but does not complete this package. Implement the corrected Aster Hall order.online link, explicit external checkout action, user-entered tracking link and manual reminder. No API access or fake order state. Test navigation through intercepts only. Tests: `AT-CLOCK-01` through `AT-CLOCK-04`, `AT-THEME-01` through `AT-THEME-05`, `AT-FOOD-01` through `AT-FOOD-03`.

## M6 - live calendar gate

Before work: document mailbox hosting, consent and app registration, delegated scopes, origin/redirects, approved token storage and network. Choose browser-direct or backend-for-frontend deliberately; do not accidentally build both.

M6.1 Identity and adapter: Microsoft-supported auth library, explicit connect/disconnect, normalized occurrences, bounded/paginated calendarView fetch, separate account caches.

M6.2 Safe Join: structured/fallback extraction, provider allowlist, ambiguity chooser, protected-link handling, no HTML execution, explicit opener. Test using mocks; opening a real meeting requires specific user action.

M6.3 Refresh/error behavior: cancelled/changed/tentative/conflicting meetings, 401/403/429/offline handling, stale markers, logout purge, and late-response rejection after logout/account switch (session generation check, even if request cancellation fails). Tests: `AT-CAL-02` through `AT-CAL-09`, `AT-SEC-02` through `AT-SEC-05`.

If blocked, leave a useful disconnected state and keep working on unrelated milestones.

## M7 - production persistence and delivery

M7.1 Record storage/auth topology, single-user vs multi-user deployment boundaries, backup owner, retention, and approved offline policy. Add migrations and repository adapter without replacing working domain logic.

M7.2 Enforce server-side ownership for any backend; test cross-account denial. Implement durable reminder jobs and idempotent delivery state if approved. Avoid private cloud accounts and unapproved third-party telemetry.

M7.3 Validate loss/recovery, failed writes, server retry, conflict handling, notification denied/sleep/reconnect cases. Closed-app push/native behavior is accepted only after target-platform testing. Tests: `AT-DATA-01` through `AT-DATA-08`, `AT-REM-01` through `AT-REM-08`, `AT-SEC-04` through `AT-SEC-07`.

A local-only work-ready profile requires explicit acceptance of backup and notification limits. No production-ready label based only on local prototype storage.

## M8 - optional native access

Evaluate Tauri against approved toolchain, webview, authentication, signing, update distribution, and runtime permissions. Do not install a desktop app or enable autostart as a side effect of development.

Implement shortcut registration conflict recovery, focus/hide toggle, one instance, tray access, dashboard/Quick View choice, visible-monitor recovery, and correct Hide/Minimize/Quit semantics. Tests: `AT-QUICK-01` through `AT-QUICK-05`. Keep browser support working.

## M9 - optional food-provider proof

Read `ASTER_HALL_INTEGRATION.md`. Resolve active storefront, merchant sponsor, access tier/scopes, order-origin coverage, user-to-order ownership, status event entitlement, test environment, and payment boundary.

Build no live ordering flow until a specific follow-on increment is accepted. Read-only or webhook access must not be mistaken for order-creation rights. Tests for an approved proof: `AT-FOOD-04` through `AT-FOOD-07`. An honest documented 'not available' result closes feasibility without blocking release.

## M10 - release checklist

Record the exact selected capability profile and all gaps. Run the full applicable test matrix, current dependency/security review, synthetic visual captures, target-device memory/CPU/start/reveal measurements, backup restore drill, and notification lifecycle tests. Document support/revocation/update ownership and rollback. Do not publish/sign/deploy without G8.

Tests: all applicable `AT-*`, including `AT-BRAND-01` through `AT-BRAND-05`, `AT-NAV-01` when M2.2 is included, `AT-UX-01`, and especially `AT-A11Y-01` through `AT-A11Y-04`, `AT-PERF-01` through `AT-PERF-03`, and `AT-SEC-01` through `AT-SEC-07`.

## M2.1 delivery update - October 26, 2026

Delivered shared full task views, local search/filtering, rich fields, lifecycle actions/undo, version-two migration with safety snapshots, portable backup preview/merge/replace, namespace remapping, duplicate-import protection, disabled imported reminders and recoverable snapshots. User requested the product-copy revision and confirmed calendar testing must not access email. Outlook remains not configured; no client ID or registration was supplied and no work account was accessed.

25 unit/component tests and 10 browser scenarios passed. Source/build/type/lint evidence and acceptance limits are in M2_VALIDATION.md. M2.1 is not marked fully verified: the owner-timed AT-UX-01 check is NOT RUN, the four-widget performance scenario is not implemented, and committed completion timing including automation/persistence exceeded the proposed feedback budget in a preliminary one-view 1,000-task baseline. No thresholds were silently changed. No extra approval gate is introduced; these are recorded verification limits for the continuing development scope.

## M6-ICS selected increment - October 27, 2026

Owner selected the existing published feed route ahead of Graph identity. Delivered: local same-origin reader, masked URL input, normalized next meeting/two-week compact agenda, explicit approved join/chooser/Outlook fallback, recurrence/time zones, refresh/error/throttle states, memory-only isolated sessions and disconnect/late-response guards. Scope: AT-ICS-01 through AT-ICS-08; relevant CAL behavior, without claiming Graph pagination/auth coverage.

Automated fixture verification and local reader checks are recorded in ICS_VALIDATION.md. Next executable step: owner pastes the URL in Settings and compares a few titles/times/links with Outlook, without recording private content. Actual provider connectivity and feed completeness remain NOT RUN. If publishing latency/detail is inadequate, evaluate Graph calendar-only sign-in separately. M2.1 usability/performance follow-up and M3/M4 remain on the roadmap; ICS does not close their acceptance.

## Widget full-view increment - October 27, 2026

Delivered per owner direction: quiet date-aware Next Meeting overview; full Calendar tab with day groups, range filters/search, paged results and selected-event details; Reminders tab with existing schedules/history and shared task editor. All current dashboard widgets link to their full views. Future feature widgets require a corresponding tab at delivery. No M3 grid or M4 scheduler completion is implied. AT-UI-01 through AT-UI-03 and relevant CAL/ICS/brand/responsive regressions are covered in WIDGET_VIEWS_VALIDATION.md.

Owner reports successful ICS connection. Detailed real-feed comparison remains the owner's local follow-up; agent tests use fixtures and never inspect/capture the connected calendar. Continue with owner usability feedback, M3/M4 or later feature packages without redesigning the working reader.

## Calendar list / density refinement - October 27, 2026

Delivered within the existing widget/full-view package: four-row upcoming timed meeting list, minute/hour/day relative time, per-row selected-event navigation, quiet paired call icons/approved link chooser, and persistent shared display density. Calendar default row spacing is tighter; Compact and Comfortable adjust spacing without shrinking text. Acceptance: AT-UI-04/05, existing calendar source/launch/privacy and task/backup regressions. No new connection, dial-in extraction, Zoom SDK or automatic audio/video device control. See LIST_DENSITY_VALIDATION.md for executed checks.

## Today/Tomorrow / brand v1.5 increment

Delivered: local-calendar-day grouping, three-row per-day previews/overflow, remaining-today empty state and satire toggle, supplied orbital logo and favicon assets, equal-weight About tagline, local light/dark brand component and functional metadata. Scope: AT-UI-06 and applicable AT-BRAND-01 through 23, plus existing task/calendar/density regressions. TODAY_BRAND_VALIDATION.md records coverage and unrun platform subcases. No Graph, reminder-domain, custom-background, installed/native icon or release completion is implied.

## Owner empty-state copy revision - October 27, 2026

Heading: **No more meetings today!** Use one of the four owner-supplied ready lines, stable for the local calendar day:

- Go touch some grass before it's too late.
- Don't get too comfortable.
- Hopefully it stays this way <3
- Would be a shame if you were added to another meeting.

The Click here to get added to another meeting variant is retained as pending copy with no destination. Do not render an unfinished link or invent an external redirect. Satire off hides the secondary line. The existing complete-calendar requirement remains. This explicit owner wording supersedes the earlier empty-calendar candidate; no random selection, private-data interpolation or AI service is added.

Owner copy restoration - October 27, 2026: “Your work, management's success story.” returns as a quiet dashboard note below Reminders, controlled by the existing satire preference. This explicit owner request permits this line alongside the approved empty-calendar copy; functional messages and privacy text are unchanged.

## Owner company-voice revision - October 27, 2026

The owner explicitly requested the About heading **THE COMPANY**, without a Satire suffix, and a fully committed fictional AI-company narrative aimed at fictional investors. About adds Our dedication to AI, AI is the future positioning, deterministic intelligence, inference-free narrative scaling and investor-ready implementation deferral. This owner direction supersedes the earlier requirement to label this particular company panel Satire. The existing satire preference hides the hype/tagline while leaving the company heading and factual privacy information visible. No actual AI feature, model/API dependency, runtime inference, tracking or investor communication is added. Actual privacy/data-handling copy remains literal and states that the app has no AI processing.

## Owner light-mode logo refinement - October 27, 2026

Use the existing transparent cai-mark-128.png in both sidebar and About, with the dark-lettering wordmark in light mode. This replaces the earlier solid dark app-icon badge on white surfaces. Dark mode and the full-color favicon/app icons keep their existing treatment. The approved artwork files remain byte-identical: no redraw, recolor, image edit or new asset dependency. The owner request supersedes the initial handoff's badge-placement default for these app surfaces.

## Current planning update - October 27, 2026

Owner deferred further logo work while generating a replacement transparent PNG. Leave current artwork as-is until supplied. Next major foundation package remains M4 reminders (multiple/chosen-time schedules, snooze, quiet hours and cross-tab/wake correctness), followed by M3 movable/resizable layouts. M5 clocks/food/appearance follows those dependencies; its link-only Aster Hall widget/tab may be brought forward independently, while complete manual pickup reminders depend on M4.

The owner corrected Aster Hall ordering to https://asterhall.order.online/, supported by the restaurant's official site. Planning defaults, active requirements and instructions now use that destination. Public menu research and header checks are recorded in ASTER_HALL_INTEGRATION.md. A launcher is feasible; iframe checkout is not yet validated, and native API/status capabilities remain separate. This turn updates plans/configuration only; no ordering widget, checkout, order, sign-in, iframe or payment interaction was implemented/performed.

## Corrected logo assets v1.6 - October 27, 2026

The owner supplied CAi-corrected-logo-assets-v1.6, lifting the previous logo hold. The installed transparent cai-mark-128.png now uses the repaired exterior/central-opening mask in the shared sidebar and About component, in both themes. The remaining seven installed icons/wordmarks are identical to the supplied v1.6 pack and to their previous bytes; installed/favicons are intentionally unchanged by this release. Copy, tagline, spacing, theme preferences, task/calendar data and dependencies are preserved. Active artwork locks/inventory now reference v1.6; prior source records are archived, and the complete supplied asset inventory remains outside public. No image regeneration or source-pack modification. See LOGO_V16_VALIDATION.md for checks.

V1.6 verification: build/typecheck, lint, both focused Brand component tests and the Chrome brand/theme/responsive/accessibility scenario passed. Light desktop and dark mobile screenshots were reviewed. All eight deployed and built assets match the supplied bytes, and all 47 source hashes were rechecked. No unrelated full-suite rerun is claimed.

## Aster Hall and foreground reminders - October 27, 2026

Delivered the owner-approved Aster Hall dashboard widget and full tab, external order.online checkout, manual pickup checks/private tracking links, multiple task schedules, chosen-time/deadline-relative reminders, snooze/cancel/acknowledgement, quiet hours/private previews and cross-window coordinator recovery. The existing task transaction owns cancellation and relative rescheduling. Workspace/DB schema 3 upgrades retain a recovery snapshot; portable backup v2 retains rules disabled on import and reads old backups without losing prior import receipts.

71 unit/component tests, 24 Chrome scenarios, build/typecheck and lint passed. Mobile/light/dark and accessibility views were reviewed; the browser checkout was intercepted. See REMINDERS_FOOD_VALIDATION.md for exact coverage and unrun runtime cases. M4 foreground behavior and M5.3 companion flow are delivered; browser/native closed-app delivery, provider API/status, live checkout and broad release/platform acceptance remain outside this increment. Next major UI package: M3 layout. No reader restart, private-calendar inspection, new dependency or order/payment occurred.

## Slim dashboard task creation - October 27, 2026

The dashboard task widget now uses one title field and an Add button; Enter submits. Quick tasks start To do, Normal priority, without a deadline/reminder. Add details in Tasks opens the existing full creation form in the Tasks tab and carries the typed title. Cancelling retains the quick draft for this running session; saving clears it after a committed create. Header plus focuses the quick entry. The full form keeps due/start dates, priority/status, reminders, project/tags, description and links. Task editing and the shared command/storage path remain intact. No schema/dependency change or reader restart.

Build/typecheck, lint, three focused App component tests and 25 functional Chrome scenarios passed. Screenshots were reviewed in desktop light/mobile dark; compact entry height, keyboard/focus, draft handoff, cancellation, failed-save retention and accessibility were checked. The unrelated 1,000-task timing benchmark and full domain suite were not rerun for this UI-only slice. Their prior limits remain open. See QUICK_TASK_VALIDATION.md.

## Separate meeting buttons - October 28, 2026

Phone and video icons in the dashboard Meetings list are separate buttons with distinct accessible labels, hover states and keyboard stops. Each button retains approved link validation and the link chooser. Both open the supplied provider join screen; the meeting app controls audio/camera settings. Sample actions remain intercepted, and events without a supported link show neither button. Desktop targets are 36px; narrow-screen targets are 44px. Full Calendar join controls and provider URLs are unchanged. See MEETING_BUTTONS_VALIDATION.md for evidence.

Meeting-button verification: build/typecheck, lint, 6 focused component tests and 12 Chrome calendar/dashboard scenarios passed. Both independent buttons, keyboard order, protected/multiple links, preview interception, mobile target sizes and accessibility were checked. Light/dark captures were visually reviewed.
