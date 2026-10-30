# Master product and implementation plan

Version 1.4 | October 26, 2026 | Owner: project user | Implementation status: M1 verified; M2.1 core delivered with verification follow-up

## 1. Product definition

Create a personal workplace productivity application that provides immediate access to the next meeting, actionable tasks, relevant time zones, and food ordering. The main interface is a configurable dashboard; full task/calendar views support deeper work. It should feel polished, predictable, and lightweight rather than like a collection of embedded websites.
**Confirmed naming and brand:** **Cursed Assistant-inator**, with exact case-sensitive **CAi** logo/wordmark. Official tagline: **Productivity is our job. Your data is our passion.** The faux-AI styling and composed institutional satire are jokes, not statements of real capabilities or privacy practices. Usability, honest disclosures, and strong data protection take priority over comedy. See `BRANDING.md` for naming, tone, and acceptance criteria.


The user previously found an internal assistant at Goldman useful. That is product inspiration only: the original source code and architecture are unknown. Recreate useful behaviors independently, not proprietary implementation or branding.

The development environment is Codex in VS Code. A browser-first JavaScript/TypeScript application is preferred, but workplace restrictions determine deployment. A shared web UI with an optional desktop shell is the proposed route, not a confirmed permission.

### Requirement classification

**Confirmed user requirements:** Outlook calendar and one-button Zoom launch; customizable quick-access shortcut where possible; capable Notion-style tasks with urgency/priority/reminders; configurable lightweight world clocks; customizable favicon/logo/background/theme; default `#115B47` with VS Code-like light/dark neutrals; movable/resizable dashboard widgets with bounded presets; Aster Hall Chicago ordering and notifications where feasible, using the user-corrected Aster Hall order.online link as the default ordering destination.

**Proposed implementation defaults:** React/TypeScript/Vite; GridStack behind a layout adapter; a 12/8/4-column grid; synthetic local prototype first; read-only calendar; external food checkout initially; optional approved backend and desktop shell. These are changeable through a recorded decision, not claims of user approval.

**Unknowns:** supported OS/browser, whether development tools/PWAs/extensions/native apps are allowed, Exchange Online versus on-premises hosting, Entra application consent, approved hosting/storage, notification endpoints, and restaurant integration access.

### Non-goals for the first product

No conversational AI, voice assistant, inbox management, meeting transcription, autonomous calendar writes, automatic meeting joining, team collaboration, arbitrary Notion-style pages/databases, third-party plugin marketplace, payment processing, or copied employer-internal code. Do not add unrelated modules merely because the dashboard can host widgets.

## 2. Release profiles and honest capability boundaries

| Profile | Capabilities | What it must not imply |
| --- | --- | --- |
| Synthetic local prototype | Working tasks, layout, themes, clocks, demo calendar, in-app reminders; development data only. | Approved work-data handling, real meetings, real order status, or production readiness. |
| Approved browser/PWA pilot | Core features plus permitted live calendar, approved task storage, foreground notifications; optional approved push infrastructure. | A desktop-wide keyboard shortcut, permanent background execution, or guaranteed closed-app delivery. |
| Approved desktop-enhanced pilot | Same UI with shell-specific show/hide, tray, and native integration after target-machine tests. | Notifications while the process is fully exited, automatic permission, or unrestricted native access. |
| Approved food integration | Only the specific ordering/status operations the provider and employer authorize. | General API access simply because a public checkout page exists. |

Browser service workers and background scheduling have lifecycle limits. Closed-app notification design needs an approved push or native delivery path and must document actual platform behavior. [S08](SOURCES.md#s08). Tauri offers a desktop global-shortcut plugin; an extension route has its own API and restrictions and is only a fallback investigation, not a second initial implementation. [S09](SOURCES.md#s09), [S18](SOURCES.md#s18).

A blocked optional capability must not prevent core development. A pilot lacking live calendar or reliable reminders must explicitly state the compromise; do not silently redefine the full requested product as complete.

### Increment boundaries (v1.4 review revision)

The first development increment was M0/M1 only: synthetic dashboard, basic persisted task flow, simulated meeting launch, in-app reminder demonstration and validation scripts. Demonstrate it before expanding scope. The owner subsequently authorized development; M0/M1 have been delivered for review. This does not resolve workplace/provider gates or expand the first increment.

The first usable synthetic core then adds M2.1 basic task management/recovery, M4 reliable foreground reminders, M3 layout and M5 clocks/appearance/external Aster Hall checkout. M4 depends on M2.1 rather than the full task feature set; M5 manual pickup reminders depend on M4. M2.2 boards/saved filters/bulk actions/subtasks/command palette and M2.3 parsing/recurrence remain later increments. Keep these desired features in the roadmap and list them as unavailable until delivered. A scoped work-ready pilot may defer them only through an explicit release profile; it is not completion of the full product.

## 3. Application surfaces

### Dashboard

Header: product mark, quick task creation, application search/command palette (M2.2; ordinary navigation and task entry serve earlier increments), notification center, settings, and a clear demo/live/offline indicator. Use a restrained navigation rail for Dashboard, Tasks, Calendar, and Settings. Food and clocks may be accessed through widgets and settings without additional heavyweight pages.

Default wide arrangement: Today Tasks occupies eight columns on the left; Next Meeting, World Clocks, and Aster Hall occupy a four-column stack on the right. The layout rules and exact initial positions live in `DESIGN_SYSTEM.md` and `config/planning-defaults.json`.

### Quick View

A compact surface shows the next meeting, a small actionable list of urgent tasks, and one-line task creation. It reads the same data as the full dashboard. Browser mode may expose this as an in-app panel; native mode may expose it as a small persistent window. Do not duplicate caches or create separate tasks for quick view.

### Full views

Tasks provides list/table and board views, saved filters, and a details side panel. Calendar initially provides an agenda, not a complex editable calendar. Settings contains appearance, dashboard behavior, time zones, task/reminder defaults, integrations, storage/backup, privacy, and runtime capability information.

## 4. Feature requirements

### CAL - Outlook calendar and meeting launch

**CAL-01** Display next meeting, today/upcoming agenda, title, start/end, countdown or 'In progress', location/provider, join state, and Open in Outlook. Distinguish all-day events and ordinary appointments from joinable meetings.

**CAL-02** Begin with the signed-in user's default calendar, read-only. Use Microsoft Graph v1.0 calendarView over a bounded window to obtain instances and recurrence exceptions; follow pagination before claiming a complete result. Proposed initial range: yesterday through the next 14 days, extending only on deliberate navigation. [S02](SOURCES.md#s02).

**CAL-03** Proposed 'next meeting' algorithm: exclude cancelled and declined events; prioritize an ongoing timed meeting, otherwise the earliest upcoming timed meeting; display conflicts when multiple meetings overlap. Keep all-day items in the agenda rather than occupying the next-meeting card. Tentative invitations remain visible with a badge. A meeting without a link still appears with Open in Outlook.

**CAL-04** Resolve a valid structured join URL first; otherwise extract candidate links from location/body without rendering invitation HTML. Microsoft documents structured online-meeting information for supported providers, but that does not guarantee a Zoom invitation populates it. [S06](SOURCES.md#s06). If multiple distinct valid candidates remain, show a chooser and persist any user choice only for that event occurrence/version.

**CAL-05** Body extraction normally requires delegated `Calendars.Read`; `Calendars.ReadBasic` excludes event bodies. Start with the least scope meeting the approved feature requirement. If only Basic is authorized, show reduced link-resolution capability instead of expanding permissions silently. Do not request inbox read, calendar write, or tenant-wide application permissions. [S03](SOURCES.md#s03).

**CAL-06** Join occurs only on explicit user action. Validate the URL using an allowlisted provider-host policy, reject executable schemes and lookalike hosts, and preserve approved link-protection wrappers. Do not auto-dereference arbitrary invitation URLs from a backend. Keep join URLs out of logs, analytics, exports, and notifications. See architecture for the resolver rules.

**CAL-07** Clicking Join delegates to the approved browser/OS handler; it is not a Zoom meeting-management API integration. Do not promise bypass of external authentication, prompts, waiting rooms, or other provider controls. Opening provider UI is success for this feature; joining a call automatically is out of scope.

**CAL-08** Show last successful refresh and stale/error state. Refresh on focus with debouncing and while visible on a restrained schedule. Centralize refresh across widgets. Honor throttling and backoff; no uncontrolled retries. [S19](SOURCES.md#s19). If a meeting changes, refresh its join candidate and reminders; never keep a cancelled meeting labeled 'next'.

**CAL-09** Never present synthetic data as live when sign-in expires. Retain only approved cached fields, label them stale, and offer reconnect. Logout clears account-scoped caches and pending account notifications. Optional calendar-based reminders remain off by default to avoid duplicating Outlook notifications.

**CAL-10** Confirm mailbox hosting. Microsoft ended the old REST hybrid path for on-premises mailboxes; the fact that Outlook is installed is not enough to establish Graph availability. [S07](SOURCES.md#s07).

### QUICK - Customizable access shortcut

**QUICK-01** In desktop-enabled mode, shortcut when hidden reveals and focuses the existing assistant. When visible but not focused, it focuses it. When already focused, it hides it. A second instance must forward to the existing window, not create a duplicate.

**QUICK-02** Allow a configurable binding and choose full dashboard or Quick View as the target. Do not invent a universally safe default binding. Detect registration conflicts and show a usable fallback. Keep the previous working binding if a new registration fails.

**QUICK-03** Remember valid window size/position. Recover onto a visible display when monitors change. Distinguish Hide, Minimize, and Quit. Explain whether reminders continue in each state. A tray action must reopen the app even if the hotkey fails.

**QUICK-04** Browser mode has in-app shortcuts only. Do not intercept standard browser/OS shortcuts or single-letter shortcuts while a text field is active. Show unavailable global binding settings with an explanation, not a nonfunctional switch.

### TASK - Capable personal task management

**TASK-01** Task fields: title, limited-format description, project/list, status, priority, tags, optional start date, optional due date/time, subtasks/checklist, reminders, recurrence, and optional reference/meeting link. One user owns their tasks; collaborative assignments are not initial scope.

**TASK-02** Initial statuses: To do, In progress, Waiting, Done. Inbox is a view of tasks without a project/list, not an extra status. Archive and trash are separate lifecycle states. A task removed from one saved view remains in the underlying database.

**TASK-03** Priority is user-set: Critical, High, Normal, Low. Urgency is derived: Overdue, Due soon, Due today, Upcoming, No deadline. Completing/archiving/deleting a task removes it from active urgency lists. No task is automatically deleted when overdue.

**TASK-04** Include Today, Upcoming, Overdue, Inbox, Waiting, and All Tasks saved views. Support list/table and board layouts, filter/sort/group, title/description search, bulk status/priority/date actions, duplicate, archive, trash/restore, and a details side panel. A board groups by status initially; a generic database editor is not required.

**TASK-05** Fast operations must be inline: create, rename, complete, change priority/status/due date. Use optimistic UI only with visible saving/error state and rollback/retry on failure. Provide undo for deletion, completion, and bulk operations. A successful-looking UI must not hide a failed save.

**TASK-06** Support ordered subtasks with progress and optional independent due dates, plus simple checklist items. Limit nesting to one task/subtask level initially. A parent may be completed with unfinished children only after an explicit choice; never silently discard child work. Subtasks are first-class records, not duplicate entries in a separate store.

**TASK-07** Deterministic quick-entry parsing may recognize phrases such as 'tomorrow 2pm', tags, and priority. Show interpreted chips before save, allow correction, and leave ambiguous text unparsed. Do not send tasks to an LLM or silently guess ambiguous dates such as 03/04. Keyboard entry must remain usable without the parser.

**TASK-08** Recurrence supports fixed schedules and repeat-after-completion as distinct modes. Implement a documented initial subset: daily, selected weekdays, weekly, monthly, and an interval after completion. Preserve history and avoid duplicate next occurrences. ARCHITECTURE section 3 defines explicit occurrence/future edits, skip/stop, missed-slot advancement, child templates, DST and month-end behavior; section 11 defines their transaction boundary. Recurrence is M2.3, not a prerequisite for core foreground reminders.

**TASK-09** Save reusable task filters. Multiple dashboard task widgets can reference distinct saved views of the same records. Filters may use status, priority, tags, project, due range, and urgency. Manual ordering applies only when a view is explicitly in manual sort; do not fight an active automatic sort.

**TASK-10** Provide validated versioned task/settings export and restore for approved data. Distinguish backup from cloud sync. Basic recovery ships in M2.1; later record types extend its schema. Apply ARCHITECTURE section 12 for merge collisions, relationship remapping, replacement safety, disabled imported reminders/paused series and structured sensitive-link exclusions. Free-text preview is required; automatic complete URL scrubbing is not promised. Avoid attachments beyond lightweight text/reference links in the first release; personal backgrounds are handled by the appearance asset system.

### REM - Reminders and notification center

**REM-01** Reminders are persistent domain records, never owned by a widget mount. Support multiple reminders per task, snooze, quiet hours, in-app history, and open/complete actions when the delivery channel supports them. A notification may fall back to opening the task if rich actions are unavailable.

**REM-02** Date-only due dates use a configurable reminder time, proposed 09:00 in the task's scheduling zone. Timed due dates default to a configurable lead time, proposed 15 minutes. Do not retroactively create alerts for imported tasks without user choice. Optional quiet hours are initially off and are user-configured.

**REM-03** Editing a task reschedules its pending reminders. Completing/deleting/archiving it cancels them. Reopening offers to restore or create reminders, rather than replaying stale alerts automatically. Snooze is a new scheduled delivery, not a change to task priority or due date.

**REM-04** Deduplicate by reminder occurrence and channel/device policy; multiple tabs must not create duplicate banners. For multi-device support, define a preferred notification device before enabling it; do not imply perfect cross-device exactly-once delivery.

**REM-05** Distinguish scheduled, attempted, shown/acknowledged when observable, snoozed, cancelled, expired, and failed. A push service accepting a message is not proof the user saw it. Reconcile on focus/restart/wake and show a missed-reminder summary instead of a burst of old notifications.

**REM-06** Settings show actual delivery capability, permission, and a test notification. A browser-only local prototype explicitly states 'Reminders require this app to be open and may be delayed in the background.' Closed-app delivery requires separate approval and testing. No timers-only production promise. [S08](SOURCES.md#s08).

### CLOCK - Lightweight world clocks

**CLOCK-01** Three styles: compact digital, minimal analog, and comparison rows. Allow custom labels, reordering, IANA time zone, 12/24-hour format, optional seconds, working-hours shading, and previous/next-day indicators.

**CLOCK-02** Use a Chicago office clock (`America/Chicago`) and a detected user-local clock as initial suggestions. Do not assume Chicago and the user's preferred time zone are identical. Let the user add other locations and avoid redundant clocks when zones match.

**CLOCK-03** Use built-in `Intl.DateTimeFormat` for display and named zones rather than stored fixed offsets. [S16](SOURCES.md#s16). Use one shared clock tick; minute updates by default, seconds only when requested and visible, no continuous sweep animation by default. Recompute immediately on wake/visibility change.

### THEME - Personalization without weight

**THEME-01** Preserve `#115B47` as the default primary color. Provide Light, Dark, and System modes with VS Code-inspired neutral surfaces. The exact token table is in the design specification. Derived accessible colors may differ for dark-mode link text or focus rings.

**THEME-02** Allow preset themes, controlled custom accent selection, solid backgrounds, gradients, uploaded raster backgrounds, cropping/focal point, dimming, logo replacement, and favicon replacement. The default mark should be an original, simple geometric/letter mark, not copied employer branding.

**THEME-03** Process images locally before storage: validate format and dimensions, reject animated/vector uploads initially, decode/re-encode supported JPEG/PNG/WebP, remove original metadata, resize, and apply byte/pixel limits. Store blobs separately from preferences. Do not keep large base64 strings in localStorage or every task record.

**THEME-04** Keep card surfaces readable over any background. Custom themes must meet the design's contrast checks or receive corrected tokens and an explanation. No arbitrary user CSS, JavaScript, HTML, remote image URLs, video backgrounds, or downloadable theme code.

**THEME-05** Treat favicon, in-app logo, PWA manifest icons, and native application icons as separate assets. Do not imply an uploaded favicon changes an already-installed OS icon; document the supported behavior after platform tests. [S22](SOURCES.md#s22).

### DASH - Constrained dashboard customization

**DASH-01** Use 12, 8, and 4 columns based on usable container width, not monitor size. Only widget-approved size presets are allowed. Full rules, mappings, and heights are in `DESIGN_SYSTEM.md`.

**DASH-02** Move/resize only in Edit dashboard mode. Provide drag preview, no overlap, locked widgets, keyboard alternatives, undo, and cancel/save. Persist independent wide/medium/narrow layouts. Shrinking a window must not overwrite the wide layout.

**DASH-03** Within a preset, adapt information density rather than shrinking text. A compact task widget shows a few tasks and an open-view action, not a tiny board. Content changes must never move other widgets or silently change widget size.

**DASH-04** Layout, widget configuration, and application data are separate. Removing a widget does not delete tasks, meetings, reminders, or clocks from their underlying configuration. Invalid/old layout data must migrate or recover to defaults without losing user data.

**DASH-05** Each widget includes loading, empty, stale/offline, error, and permission-unavailable states. One failed provider must not crash unrelated widgets. A widget registry defines type, allowed presets, config schema, renderer, and capability requirements.

### FOOD - Aster Hall Chicago / order.online

**FOOD-01** Use the owner's corrected destination `https://asterhall.order.online/`. The restaurant's official Food Hall Order Now action points to this domain; the linked store includes multiple Aster Hall concepts and is powered by DoorDash Commerce Platform. This supersedes the October 26 Toast bookmark decision. A public menu is not API access. See ASTER_HALL_INTEGRATION.md for dated evidence.

**FOOD-02** Initial checkout opens externally in the approved browser, on user action. Do not embed checkout as the default, read cross-origin content, store payment credentials, replay website sessions, or place an order automatically. Browser isolation remains in force. [S21](SOURCES.md#s21).

**FOOD-03** Users may save a tracking link and manually set a pickup reminder. Mark these as user-entered. Do not infer a placed order, payment, ETA, or food readiness from opening a page. Tracking links may be sensitive and must not enter logs or public exports.

**FOOD-04** Native menu/cart/order/status APIs require a separately accepted merchant/provider integration and a suitable payment/ownership design. DoorDash Marketplace APIs are partner-access systems, not established diner-account permissions; their compatibility with this Direct Ordering storefront is not proven. See ASTER_HALL_INTEGRATION.md.

**FOOD-05** Keep the ordering link configurable and retain an official-site fallback. Do not hard-code menus, prices, hours or availability. The earlier Toast availability observation is historical, not evidence of the new storefront state.

**FOOD-06** Do not infer order/payment/readiness from launching or embedding provider checkout. Cross-origin content remains isolated; any future status bridge must establish channel coverage, ownership and actual status semantics. A provider-supported embed does not itself grant an order-status API.

**FOOD-07** Leave API checkout and provider-verified notifications off until the integration proof passes. See `ASTER_HALL_INTEGRATION.md` for the current capability ladder, embedding findings and boundaries. Food API availability must not block the task/calendar product.

## 5. Nonfunctional requirements

Accessibility: semantic structure, complete keyboard paths, visible focus, readable type, meaningful labels, non-color-only statuses, reduced motion, and contrast checks. Dragging must have an equivalent menu/button interaction. Target WCAG 2.2 AA, with evidence rather than an untested certification claim. [S17](SOURCES.md#s17).

Performance targets are proposals, not measurements: initial compressed first-route JavaScript at or below about 500 KiB; already-running quick-view reveal at p95 under 300 ms on the target machine; no continuous background animation; no per-widget network polling. For 1,000 tasks/four widgets, proposed warm interaction budgets are p95 <=100ms for edit/complete to visible update and <=200ms for filter/search to rendered results, including debounce. AT-PERF-03 specifies the production-build sampling protocol and separate persistence timing. Measure startup, idle CPU and memory with a documented environment and adjust targets through a decision if needed. AT-UX-01 adds owner-observed meeting discovery, task capture and urgency/priority comprehension; these are unmeasured targets, not guarantees.

Reliability: visible save state, versioned schemas, deterministic test fixtures, bounded retry, stale-data labeling, backup/restore, and graceful failure when authentication, storage quota, network, or notifications fail. Do not silently clear data to repair an error.

Privacy: approved storage only, minimized calendar data, no remote analytics by default, private notification text by default, no secrets in frontend code/logs/exports, and account-isolated caches. Synthetic demo data and live data must occupy different storage namespaces.

## 6. Definition of full first-release success

The smaller synthetic increments above have their own exit criteria and must not be described as the full first release. For the full first-release profile, the user can open the assistant, identify and launch the next meeting through one application action, create and organize tasks quickly, understand urgency separately from priority, receive reminders according to the declared runtime capabilities, customize the dashboard without losing layout, read chosen time zones, personalize appearance, and reach Aster Hall ordering conveniently.

A work-ready pilot requires passing the relevant acceptance matrix, approved handling of actual work data, target-machine validation, tested recovery, and a recorded list of unavailable/deferred features. External checkout is an intentional initial limitation, not completion of the aspirational in-app ordering/status integration.

## Owner continuation and copy direction - October 26, 2026

The owner approved proceeding beyond M1 and requested a productivity-first interface with restrained optional satire: ordinary sample records, direct labels, no repeated "little" phrasing or pervasive demo banners. Source context stays in the sample calendar card; actual connection/storage/reminder limitations remain accurate in context. M2.1 core is delivered; current evidence and remaining verification are in STATUS.md and M2_VALIDATION.md. Read-only calendar testing is of interest, explicitly without email access; no client ID/registration has been supplied, so Outlook remains not configured. See D121-D125 and OUTLOOK_SETUP.md.

## Selected calendar transport update - October 27, 2026

Owner selected a pasted published ICS URL for the first connection (D126-D129). This implements a local read-only alternative to CAL-02's proposed Graph calendarView transport. No client ID, email permission or calendar write is required. CAL-03 through CAL-09 apply where the published fields permit them; provider delay/detail omissions and optional declined-attendee matching are explicit limits. Graph pagination/authentication acceptance remains unimplemented, not passed through ICS. OUTLOOK_SETUP.md and ICS_VALIDATION.md define the current profile and evidence. M6 is partial; no work-ready release follows from this increment.

## Dashboard and full-view contract - October 27, 2026

Owner confirms each feature widget also needs a dedicated tab. The dashboard provides a polished quick overview with essential information and its primary action; full views support inspection and deeper work. Tasks, Calendar and Reminders now follow this pattern. Future World Clocks and Aster Hall widgets must include their feature destinations when delivered. Keep the dashboard concise, with a clear Open/View action; do not add unfinished navigation placeholders. The Next Meeting card uses Today/Tomorrow/day-and-time outside its 15-minute imminent window. D131-D133 specify the implemented hierarchy and shared data boundary.

## Owner list/density refinement - October 27, 2026

The dashboard calendar widget is a short meeting list, not a large invitation card. Name, when, relative time and a small paired call control are sufficient; click into Calendar for full details. Use minutes under an hour and then coarse hours/days. Join URLs are secondary, not the visual focal point. Display density is a shared Appearance preference: Compact / Default / Comfortable, retaining font size and accessibility. D134-D136 supersede the preceding single-meeting dashboard details where they conflict. Every widget still has its feature tab.

## Today/Tomorrow and branding v1.5

Owner now requires the dashboard meeting list to show only Today and Tomorrow with explicit day groups and a light satirical empty state. D137-D138 define remaining/ongoing meetings and truthful unavailable states. Day previews are bounded at three rows each with an explicit more link; the full Calendar remains the detailed wider agenda. D139-D140 merge the supplied new orbital identity and canonical two-line tagline without redesigning the product or changing data permissions.

## Aster Hall and foreground reminders - October 27, 2026

Delivered the owner-approved Aster Hall dashboard widget and full tab, external order.online checkout, manual pickup checks/private tracking links, multiple task schedules, chosen-time/deadline-relative reminders, snooze/cancel/acknowledgement, quiet hours/private previews and cross-window coordinator recovery. The existing task transaction owns cancellation and relative rescheduling. Workspace/DB schema 3 upgrades retain a recovery snapshot; portable backup v2 retains rules disabled on import and reads old backups without losing prior import receipts.

71 unit/component tests, 24 Chrome scenarios, build/typecheck and lint passed. Mobile/light/dark and accessibility views were reviewed; the browser checkout was intercepted. See REMINDERS_FOOD_VALIDATION.md for exact coverage and unrun runtime cases. M4 foreground behavior and M5.3 companion flow are delivered; browser/native closed-app delivery, provider API/status, live checkout and broad release/platform acceptance remain outside this increment. Next major UI package: M3 layout. No reader restart, private-calendar inspection, new dependency or order/payment occurred.
