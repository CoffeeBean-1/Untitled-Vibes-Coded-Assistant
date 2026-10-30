# Decision register

Prepared October 26, 2026. 'Confirmed' means supplied by the user, not proof of employer permission. 'Proposed' means a development default awaiting evidence or owner adjustment. Do not erase superseded decisions; append what changed and why.

## Confirmed product context

| ID | Status | Decision |
| --- | --- | --- |
| D001 | Confirmed | Use Codex in Visual Studio Code to develop the project. |
| D002 | Confirmed | Lightweight workplace productivity tool; browser-based JavaScript/TypeScript is preferred subject to restrictions. Original Goldman implementation is unknown. |
| D003 | Confirmed | Outlook agenda with one-button access to Zoom meeting links. |
| D004 | Confirmed | Customizable quick-access show/hide shortcut where the runtime permits it. |
| D005 | Confirmed | Capable Notion-style personal tasks with priority, urgency and due-date reminders. |
| D006 | Confirmed | Customizable lightweight clocks, themes, logos, favicons, photos/backgrounds and bounded movable/resizable widgets. |
| D007 | Confirmed | Primary brand #115B47; light/dark modes with VS Code-like neutral colors. |
| D008 | Confirmed | Aster Hall ordering and updates are desired; internal bookmark is https://order.toasttab.com/online/aster-hall. This supersedes the assistant's earlier DoorDash-first assumption. |
| D009 | Confirmed | Official product/marketing name is `Cursed Assistant-inator`; case-sensitive default wordmark is `CAi` (uppercase C/A, lowercase i). The intentionally faux-AI visual joke is not a functionality claim. See `BRANDING.md`. |
| D010 | Confirmed | Official tagline: `It knows your schedule. Unfortunately.` The brand satirizes intrusive big-tech data practices and poor corporate accountability, but actual privacy/security requirements remain strict and truthful. Satire is secondary to a capable work assistant. |

## Proposed defaults

| ID | Status | Decision and reason |
| --- | --- | --- |
| D101 | Proposed | React/TypeScript/Vite, single feature-modular app. Familiar web tooling with shared UI rather than two products. |
| D102 | Proposed | GridStack adapter, 12/8/4 columns and bounded presets; accessibility and persistence remain application responsibilities. |
| D103 | Proposed | Synthetic local prototype in IndexedDB; no work-data use until storage/runtime gates are approved. |
| D104 | Proposed | Read-only default calendar through delegated Graph permissions, body extraction only when approved. |
| D105 | Proposed | Optional small approved backend for durable tasks and reminder scheduling; employer-preferred database/hosting. No vendor chosen. |
| D106 | Proposed | Optional Tauri shell for global shortcut/tray; do not install before approval. Browser extension is an investigation fallback, not a parallel product. |
| D107 | Proposed | Toast external checkout in first release; API modes separately gated by merchant/provider authorization and channel/ownership proof. |
| D108 | Proposed | Personal tasks only; no collaboration, inbox processing, runtime AI, generic Notion editor or payment handling in baseline. |
| D109 | Proposed | Date-only/timed deadline union, explicit time zones, documented recurrence edge policies, schedule revisions and deduplicated deliveries. |
| D110 | Proposed | Localized display time defaults to detected device zone unless explicitly chosen. Office zone America/Chicago is separate. |
| D111 | Proposed | npm for a new repo; preserve an existing package manager. Verify compatible supported dependency versions at setup. |

## Unresolved consequential decisions

| ID | Question | Default while unresolved |
| --- | --- | --- |
| O01 | Permitted device/OS/browser/development environment? | Safe synthetic work only in an approved environment. |
| O02 | Exchange Online and Microsoft consent available? | Demo/disconnected calendar; no credentials requested as a prerequisite to core development. |
| O03 | Browser-direct Graph vs backend-for-frontend identity? | Define interfaces; choose one before live implementation. |
| O04 | Approved task store, backup, retention and offline rules? | Demo IndexedDB, clearly not production work-data storage. |
| O05 | Background notification requirements and allowed infrastructure? | Foreground in-app reminders with truthful limitations. |
| O06 | Native app or extension permitted? | Browser-first; no claimed global shortcut. |
| O07 | Toast merchant/API sponsorship and active storefront? | User-supplied external link; no order submission/status API. |
| O08 | Food order-origin/event access and payment architecture? | Separate feasibility; no inferred website-order tracking. |
| O09 | Release/support/update ownership? | No deployment or production-ready label. |

## Decision entry template

```text
ID/title:
Date/status:
Context and evidence:
Options considered:
Decision and rationale:
Permission scope/conditions (reference only):
Consequences and tradeoffs:
Affected files/tests:
Supersedes/revisit trigger:
```

## Review revision - October 26, 2026 (v1.4)

Owner direction: "make the suggested changes to the plan and come back to me." This accepts the review revisions as planning work only. It does not authorize implementation, resolve workplace/provider gates, or establish tested behavior. Existing decisions above remain historical context.

| ID | Status | Decision and consequences |
| --- | --- | --- |
| D112 | Accepted planning revision | Sequence M0/M1 demonstration, then M2.1 core tasks/recovery and M4 foreground reminders; M3/M5 complete the usable synthetic core. M2.2/M2.3 advanced tasks remain later roadmap increments. Supersedes the backlog's dependency on all of M2 before M4. |
| D113 | Accepted planning revision | Align package ownership and acceptance: scoped M1 task/reminder checks, M5.3 depends on M4, explicit command-palette/brand ownership, profile-specific evidence and later regression checks. |
| D114 | Proposed implementation default within accepted revision | Adopt the detailed recurrence action table, shared transaction boundary, idempotent command records, restore collision/remapping/activation rules and precise export exclusions in ARCHITECTURE. These fill review gaps with reviewable defaults; adjust deliberately before the affected package if owner feedback changes behavior. Refines D109; no application behavior is yet verified. |
| D115 | Proposed measurable budgets | Production-build p95 <=100ms edit/complete feedback and <=200ms filter/search with 1,000 tasks/four widgets, five warm-ups and 50 samples per action. Separate persistence timing. Owner usability check targets 10-second meeting discovery, 30-second task capture and correct urgency/priority explanation. Record measurements and explicit budget changes. |
| D116 | Accepted planning reconciliation | Initialize Chicago plus detected local IANA zone with deduplication; New York/London remain optional suggestions. Aligns config with CLOCK-02 and D110. Generate acceptance counts from the actual matrix. |

Affected documents: MASTER_PLAN, IMPLEMENTATION_BACKLOG, ARCHITECTURE, ACCEPTANCE_TESTS, DESIGN_SYSTEM, STATUS, EXPORT_VALIDATION, README, prompts and planning-defaults.json. Security/export wording is aligned in SECURITY_AND_IT. Revisit detailed defaults before their owning package; workplace gates retain their existing status.

## M0/M1 implementation - October 26, 2026

| ID | Status | Decision and evidence |
| --- | --- | --- |
| D117 | Owner authorized | The owner explicitly said "begin development" in the named project folder after receiving v1.4. This supersedes documentation-only authorization for M0/M1. It does not constitute workplace/provider consent or enable live services. |
| D118 | Implemented for M1 | React 19.3.1, Vite 8.3.5, TypeScript 6.0.3, Vitest 5.0.5, Playwright 1.64.1; exact versions and all resolved dependencies are in package.json/package-lock.json. Official guides and registry engine/peer metadata were checked. Latest TypeScript 7 was incompatible with typescript-eslint's <6.1 peer range, so 6.0.3 was selected. Node/npm were absent from PATH: verified the official Node 24.22.1 win-x64 ZIP SHA-256 against official SHASUMS256.txt and extracted it to temporary development tooling. No global install, permanent PATH edit or browser installation. |
| D119 | Scoped M1 implementation choice | One versioned IndexedDB workspace record makes current task/reminder/preferences changes atomic through WorkspaceRepository; pure commands enforce task revision checks. This is a small prototype adapter, not the complete production repository design. Retry IDs retain the last 100 commands, history retains 100 entries, and only five history entries are rendered. Absolute, explicitly scheduled demo reminders support M1; due-relative scheduling and complete lifecycle/coordination guarantees stay in M4. No overdue demo alert burst after wake. |
| D120 | Local development operation | Standard Start-CAi.cmd uses Node on PATH or the session's existing portable runtime. A PowerShell script launcher was blocked by local execution policy and was removed; no policy was changed. Vite binds only 127.0.0.1. Dev CSP permits the inline React-refresh preamble; production preview script-src remains self-only. Headers are development/preview configuration, not a deployed-server security claim. |

Evidence: docs/M1_VALIDATION.md, source tests, synthetic artifacts and executed build/type/lint checks. No Git repository existed and none was initialized; the lockfile is ready for a future initial commit. No real user content or credentials were used in the prototype tests. Direct runtime dependencies are React/React DOM (MIT), Zod (MIT), idb and Lucide React (ISC); test/build dependencies stay in devDependencies. Full release dependency/license review remains an M10 requirement.

## M2 task workspace and copy revision - October 26, 2026

| ID | Status | Decision and evidence |
| --- | --- | --- |
| D121 | Owner direction, implemented | Proceed with the next task slice; remove repetitive demo language and "little" phrasing. Use normal sample titles, direct functional labels, one contextual Sample calendar label, and sparse optional corporate satire. Source preview remains truthful and never opens a provider. Supersedes the pervasive M1 demo copy in D119, not its data boundary. |
| D122 | Owner preference; connection not configured | Owner is open to testing their Outlook calendar and explicitly requires no email access. Explain the public client ID and Microsoft app-registration prerequisite. Begin future calendar connection with delegated Calendars.ReadBasic where adequate; body extraction would require a separately explained calendar-scope change. Never request Mail.Read or calendar writes. No app/client ID was supplied and no registration, token, real event or account was accessed in this slice. |
| D123 | Implemented, scoped core | Workspace schema v2 adds task metadata/lifecycle, single-action undo, import receipts/mapping and migration recovery. Project/tag strings are normalized values for the core rather than separately managed entities. Full Tasks is paginated at 50 rows; dashboard bounds each list at six. Broader saved-view/board/recurrence work stays later. |
| D124 | Implemented and tested | Portable backups require text preview acknowledgement, strip structured meeting/tracking links, optionally omit descriptions, enforce 5 MiB, validate strict schema/references, preview merge/replace/conflicts, deduplicate imports and leave imported reminders disabled. Verified snapshots are in the same storage transaction; snapshot/quota failure aborts changes. Existing M1 data is preserved by an actual version-one database migration test. |
| D125 | Measurement and follow-up | The preliminary 1,000-task benchmark uses one task view and browser automation, not the later four-widget production criterion. Search passed its nominal 200 ms target; committed completion including persistence/automation exceeded the proposed 100 ms feedback target. Retain that target and profile the separate input/render/persistence costs before release. Do not call the full performance or owner-usability tests passed. |

Evidence: M2_VALIDATION.md; 25 unit/component tests and 10 browser scenarios. No runtime dependency was added. Only package version advanced to 0.2.0; dependency pins remain unchanged.

## ICS connection - October 27, 2026

| ID | Status | Decision and evidence |
| --- | --- | --- |
| D126 | Owner-directed increment | Owner requested Outlook connectivity by pasted calendar link and confirmed an ICS link is available. Implement a local read-only ICS subscription, with no email access. This selects an alternative to D122's Graph prerequisite; no Microsoft app registration is required for ICS. Owner enters the URL locally; agent tests use synthetic fixtures only. This is development/personal testing authorization, not an inferred enterprise release approval. |
| D127 | Implemented local architecture | Same-origin Vite middleware in dev/preview handles the ICS fetch because browser CORS may prevent direct fetching. Bound to loopback; exact Outlook HTTPS host allowlist, public DNS validation/pinning, TLS validation, redirect/byte/time bounds, same-origin request checks and random HttpOnly SameSite session cookies. No generic URL proxy or hosted service. |
| D128 | Implemented retention and refresh | URL/email, validators and events remain in memory, separate from IndexedDB and task backups; erase on disconnect/replacement and expire after eight idle hours/process restart. One flight per session, generation guards, conditional reads and stable day windows, visible-tab polling and provider retry limits. A failed live refresh retains stale data with a warning; never falls back to sample meetings. |
| D129 | Dependencies and capability limits | Add ical.js 2.2.1 (MPL-2.0), @js-temporal/polyfill 0.5.1 (ISC), ipaddr.js 2.5.0 (MIT), pinned with lockfile. Official registry/source/API checked; npm install audit reported zero vulnerabilities. ICAL parsing runs in isolated bounded workers, not the browser. Published feed detail, attendee response omissions and provider delay limit capability; Graph remains optional later. Full release license/security review remains M10. |

## Dashboard and feature views - October 27, 2026

| ID | Status | Decision and evidence |
| --- | --- | --- |
| D130 | Owner-reported connectivity | Owner says their ICS link connected successfully. This is evidence of the owner's successful initial connection, not an agent-observed event/time/recurrence validation. No actual URL or meeting content was read or captured for this UI work. |
| D131 | Owner-directed, implemented | A dashboard widget is a compact feature overview; every widget also has a dedicated navigation destination and a direct open action. Existing Tasks remains; Calendar and Reminders are added now. Apply this rule when future clock/food widgets are built, without exposing unfinished pages. Satirical decoration is not a feature widget. |
| D132 | Implemented time hierarchy | Use calendar-day/time labels outside the next 15 minutes, with local Today/Tomorrow/day labels robust to DST/midnight. Urgent marker and prominent launch are reserved for imminent/ongoing meetings. Dashboard retains title, duration/end, location, status/conflict and explicit launch. Remove its embedded long agenda; fuller date/attendee/zone details belong to Calendar. |
| D133 | Implemented shared views | Calendar consumes the existing root useCalendar snapshot/poller, with day groups, Upcoming/Today/Next 7 days/All loaded ranges, local title/location search, 50-row pages and a selected meeting detail pane. Shared launch component preserves allowed destinations/chooser/Safe Links and no HTML rendering. Reminders displays existing schedules/history and opens the shared task editor; no new scheduler or calendar-derived reminder store. No server/config/dependency changes or live-feed inspection. |

## Meeting list and density - October 27, 2026

| ID | Status | Decision and evidence |
| --- | --- | --- |
| D134 | Owner-directed, implemented | Replace the single detailed meeting card with a quiet list of up to four upcoming timed meetings. Each row shows title, local day/start time, whole minutes below one hour, then whole hours/days (plus less-than-a-minute/in-progress states). Select a row to open that event in Calendar. Remove location/duration/conflict badges/large launch from dashboard. Supersedes D132's dashboard hierarchy; full Calendar keeps details. |
| D135 | Implemented join representation | A small paired phone/video icon control indicates an available online meeting and opens its original approved link/chooser. A quiet provider label replaces exposed URLs. Both icons represent the same provider join action: audio/camera are selected in Zoom or the meeting app. Do not claim separate audio-only/video-mode control, construct undocumented Zoom parameters, unwrap protected destinations, or infer a telephone dial-in number. Official Zoom joining guidance confirms users check audio/video after opening the link. |
| D136 | Implemented density | Appearance settings offer Compact, Default, Comfortable, saved through existing preference commands. Density changes row/card spacing across dashboard/calendar/tasks/reminders while retaining text size and controls. Default calendar spacing is slightly tighter than the previous layout. An optional validated density preference preserves existing version-two records/backups without a destructive migration or database-version change. Backups round-trip the preference; no calendar data enters storage. |

## Today/Tomorrow and supplied brand v1.5 - October 27, 2026

| ID | Status | Decision and evidence |
| --- | --- | --- |
| D137 | Owner-directed, implemented | Dashboard meetings are limited to Today and Tomorrow in the device zone, with separate headings/dates. Exclude ended timed and all-day entries; an overnight ongoing meeting stays in Today. Preview three per day, with a more link to the first hidden event's full Calendar details. The full Calendar retains its wider window. Supersedes D134's ungrouped four-row horizon. |
| D138 | Owner-directed, implemented | Complete/ready Today empty state: No more meetings today. Optional secondary line from the provided copy bank: Enjoy your time before it becomes availability. Tomorrow empty state stays literal. Satire off removes the quip. Stale/error/incomplete calendars use No meetings shown rather than a false all-clear; loading/disconnected/error surfaces remain actionable. |
| D139 | Owner-supplied identity, implemented | Merge brand v1.5 from sibling Cursed Assistant-inator ha/branding/digital-assistant-codex-handoff-v1.5 into the existing running project. Use supplied second-board concept-10 orbital artwork byte-for-byte, exact CAi case, new official two-line tagline and institutional voice. This supersedes old branding/tagline requirements only; existing tasks, theme/density/satire, integration/privacy and feature scope remain. |
| D140 | Implemented bounded asset integration | Copy eight selected local runtime assets (light/dark marks/wordmarks, ICO, 16/32 PNG icons and Apple touch icon), plus the supplied mono SVG at the legacy favicon path. Brand JSON/copy/lock/inventory remain outside public. Generated runtime identity is checked against canonical JSON; no external fonts/assets, image regeneration, logo edits, manifest identity, CSP change or hosted share card. App description reflects implemented meetings/tasks/reminders. |

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

## Logo hold and corrected food destination - October 27, 2026

| ID | Status | Decision and evidence |
| --- | --- | --- |
| D141 | Owner-directed deferral | Further logo adjustment is on hold while the owner generates a replacement transparent PNG. Preserve current files until supplied. |
| D142 | Owner correction, verified public link | Replace the Toast ordering target with https://asterhall.order.online/. The official Aster Hall Food Hall page links to that domain; its linked store includes multiple food concepts and identifies DoorDash Commerce Platform. Supersedes the prior Toast-specific destination assumption, not security/payment boundaries. |
| D143 | Feasibility recommendation, implementation pending | Aster Hall dashboard widget plus full tab with explicit external menu/ordering navigation is a small independent M5 slice. Existing roadmap next foundation is M4, then M3. Header probes reached a 403 security challenge with X-Frame-Options SAMEORIGIN, so do not promise iframe checkout. This is not proof that every normal authenticated page forbids framing. Public storefront access is not native cart/status API approval. No order or account interaction was performed. |

## Corrected logo assets - October 27, 2026

| ID | Status | Decision and evidence |
| --- | --- | --- |
| D144 | Owner-supplied, implemented | Replace the deployed transparent mark with the exact v1.6 repaired export. This lifts D141 and supersedes the old byte lock only for the explicitly supplied artwork release. Keep the same concept, live text, wordmarks, copy and theme treatment; favicon exports are unchanged. Archive the prior inventory/lock and lock the installed subset to v1.6; all 47 supplied exports are inventoried outside public. No source-pack edit, image generation, data migration or dependency change. |

## Aster Hall and reminder implementation - October 27, 2026

| ID | Status | Decision and evidence |
| --- | --- | --- |
| D145 | Owner-authorized, implemented | Deliver M5.3 as Aster Hall widget/full tab and explicit external https://asterhall.order.online/ navigation with manual Check pickup reminders. No iframe, scraped menu, checkout proxy, provider order record or verified-ready claim. Tracking URLs stay local and out of portable exports. |
| D146 | Owner-authorized, implemented | Deliver the M4 foreground domain: multiple chosen/relative schedules, revision-checked snooze/cancel, cancellation on inactive targets, quiet hours/private previews, immutable intended/recorded/acknowledged history and missed summaries. A transactional IndexedDB lease selects one visible coordinator, with expiry/release and cross-window change signals. Runtime delivery is in-app only; browser/native/push transports are not enabled. |
| D147 | Implemented data compatibility | Retain database name, upgrade workspace/DB to 3 with atomic pre-upgrade recovery snapshot, and export portable schema 2 with old-backup parsing/fingerprint compatibility. Foreign IDs are mapped; imported rules stay off until explicit future-time review. Preserve independently edited schedules during task undo. Evidence: REMINDERS_FOOD_VALIDATION.md, 71 unit/component tests and 24 Chrome scenarios. Platform sleep/exit, live checkout and full performance/release acceptance remain open. |

## Dashboard quick task entry - October 27, 2026

| ID | Status | Decision and evidence |
| --- | --- | --- |
| D148 | Owner-directed, implemented | Replace the dashboard's full creation form with a single title/Add row and Enter submission. Advanced creation lives in Tasks; Add details in Tasks transfers the unsaved title there without creating a record. Cancel keeps the quick draft in memory; commit clears it. Quick tasks use To do/Normal/no deadline/no reminder. Existing shared editor, task commands, storage and reminders remain available; no data migration. |

## Separate meeting controls - October 28, 2026

| ID | Status | Decision and evidence |
| --- | --- | --- |
| D149 | Owner-directed, implemented | Split the dashboard's combined phone/video target into two independently operable buttons, grouped by event with distinct audio/video labels and hover/focus states. Supersedes D135's single paired target. Existing links supply the same provider join screen; do not invent audio-only/video launch parameters or claim mode enforcement. Preserve validation, passcodes, protected wrappers, chooser and sample interception. |
