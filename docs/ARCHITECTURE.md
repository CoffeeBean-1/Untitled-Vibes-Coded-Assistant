# Architecture and domain contracts

Status: architecture contracts plus implementation notes. Consult STATUS.md for actual delivered scope; proposed future adapters are not implemented capabilities.

## 1. Start small, preserve boundaries

Use a single React/TypeScript/Vite application initially. Keep pure domain logic, provider adapters, and UI modules distinct. Do not create separate deployable services just to mirror feature names.

```text
src/
  app/                 routing, dependency composition, runtime capabilities
  domain/              tasks, reminders, recurrence, meeting selection, schemas
  features/
    dashboard/         layout adapter, widget registry, edit interactions
    tasks/             full views, inline editing, details panel
    calendar/          agenda, next meeting, link selection
    notifications/     history, permissions, delivery diagnostics
    clocks/            clock renderers and configuration
    appearance/        tokens, asset processing, presets
    food/              approved external links and manual pickup reminders
    quick-view/        compact shared-data view
  adapters/
    demo/              deterministic synthetic providers
    storage/           IndexedDB prototype and later approved repository client
    microsoft/         added only for authorized integration milestone
    browser/           foreground delivery, external navigation
    desktop/           added only after shell decision
  shared/              UI primitives, validation, logging, time abstraction
  styles/              tokens and global accessibility styles
  test/                fixtures and helpers
public/                original bundled icons and safe static assets
```

Add `server/` only if an approved backend is chosen. Add `src-tauri/` only if the desktop path is approved. Extract a shared package only when two actual consumers need it. Follow the existing repository's structure if it already provides equivalent boundaries.

Proposed tools: Vitest and Testing Library for domain/components, Playwright for browser flows, a schema validator for untrusted inputs, and GridStack behind a small layout boundary. GridStack documents responsive draggable/resizable layouts and save/restore, but app-specific presets and keyboard interaction remain our responsibility. [S10](SOURCES.md#s10).

Do not install every possible future dependency on day one. Lazy-load board/calendar/settings detail views if measurements warrant it. Use one query/cache strategy; do not duplicate state in a global store, query library, widget state, and browser storage.

## 2. Application composition and capability registry

The root chooses adapters based on approved deployment configuration and actual platform detection. A configuration switch is not authorization. The registry should expose states such as `unsupported`, `blocked_by_policy`, `not_configured`, `permission_required`, `ready`, and `degraded`, plus a safe explanatory message.

Capabilities include live calendar, invitation-body access, global shortcut, native tray, foreground notifications, closed-app push, durable task storage, approved offline work-data cache, and provider-verified food status.

Demo and live modes must have separate data namespaces and visible identity. An unavailable live adapter returns a typed unavailable/error result; it never swaps in demo data automatically.

### Adapter responsibilities

| Boundary | Responsibilities |
| --- | --- |
| `CalendarProvider` | Fetch normalized occurrences for a bounded range; return freshness and errors; sign-in state is explicit. |
| `TaskRepository` | Query, save, delete/restore, revisions, transactions, migration, export/import. |
| `ReminderRepository` | Durable reminder schedules, revisions, claim/cancel/snooze, delivery history. |
| `NotificationTransport` | Capability/permission, request permission on gesture, deliver, cancel where supported; report only observable results. |
| `MeetingLauncher` | Validate candidate selection, launch via approved handler; demo adapter only simulates. |
| `DashboardRepository` | Versioned layout and widget config by breakpoint/device profile. |
| `AssetRepository` | Validated blobs and metadata; no arbitrary paths or executable uploads. |
| `ShellAdapter` | Optional show/focus/hide/tray/global-shortcut actions; browser adapter explicitly lacks native operations. |
| `FoodProvider` | External Aster Hall order.online navigation; menu/API/verified-status capabilities remain separate. See `ASTER_HALL_INTEGRATION.md`. |
| `Clock` | `now()` and scheduling hooks injectable in tests. |

Use typed results with error classes such as authentication-required, permission-denied, unavailable, offline, rate-limited, validation-error, conflict, and storage-failed. User-facing errors must not include raw provider payloads or secrets.

## 3. Core data model

All persisted records have stable IDs, schema versions where relevant, creation/update timestamps, and a revision used for concurrency. Account identifiers are scoped to the approved identity, not inferred from untrusted client fields. Demo records have an explicit synthetic namespace.

### Task and deadline semantics

```ts
type TaskStatus = 'todo' | 'in_progress' | 'waiting' | 'done';
type Priority = 'critical' | 'high' | 'normal' | 'low';
type Deadline =
  | { kind: 'none' }
  | { kind: 'date'; date: string; timeZone: string }
  | { kind: 'instant'; instantUtc: string; timeZone: string };
```

The strings above are validated domain values, not arbitrary text: date is `YYYY-MM-DD`, instant includes UTC offset/`Z`, and timeZone is an accepted IANA identifier. Do not rely on the TypeScript compiler for runtime validation.

A Task contains `id`, `ownerScope`, `title`, a limited-format description, `status`, `priority`, `projectId`, `tagIds`, `start`, `due`, `parentTaskId`, ordered checklist items, reference links, optional recurrence-series association, manual order key, completion timestamp, archive/delete timestamps, and revision. Start uses the same explicit date/instant distinction. Reject contradictory start/due ranges or request explicit correction.

Project/list and tag records are lightweight entities. SavedView contains a versioned structured filter/sort/group configuration, not executable expressions. One-level subtasks must not form cycles. Bulk operations are atomic where supported, or report per-record failure and reconcile visibly.

### Urgency precedence

Compute urgency from a single reference clock:

1. Ignore done/archived/deleted tasks in active urgency views.
2. A timed task is overdue after its due instant. A date-only task becomes overdue at the start of the following local date in its stored scheduling zone.
3. An unexpired timed task within the configurable 'due soon' interval is Due soon, even across midnight. Initial interval: 60 minutes.
4. Other tasks due on the current local date in their task zone are Due today.
5. Other dated tasks are Upcoming; undated tasks are No deadline.

Urgency never overwrites priority. The Today view includes overdue tasks in a labeled section plus tasks due today; a proposed optional 'Starting today' section may include start dates without mislabeling them due. Time-zone changes to display preferences must not silently change due instants or the task's stored scheduling zone.

### Recurrence

Use a RecurrenceSeries with a stable series ID, rule version, mode (`fixed_schedule` or `after_completion`), local anchor date/time, zone, supported rule subset, and missed-occurrence policy. Occurrences have unique `(seriesId, scheduledOccurrenceKey)` identities. Persist skipped as a separate occurrence outcome rather than adding a task workflow status; retain the original scheduled key on an edited occurrence, and include the rule version in newly generated slot keys after re-anchoring. A unique constraint/idempotency check prevents duplicate creation on repeated completion/retry.

Fixed schedules retain their original cadence and materialize at most one open occurrence per series. Reconcile on start/wake without auto-completing overdue work. The following v1.4 planning defaults make catch-up and edits deterministic; they are product choices, not provider behavior.

| Action or condition | Required behavior |
| --- | --- |
| Outstanding fixed occurrence is overdue | Keep it actionable. Summarize intervening scheduled slots as missed; do not create one task per missed slot. Preserve a compact missed-slot range/count in series history. |
| Complete fixed occurrence early/on time/late | Set completion time and create one successor at the first anchor slot strictly after both the completed occurrence's scheduled slot and the actual completion instant. Record skipped intervening slots. Date-only slots compare local calendar dates; the successor is after both dates. Example: a daily 09:00 occurrence completed at 08:00 still advances to the following day, not today's 09:00 again. |
| Repeat after completion | Create one successor relative to completion in the stored zone. Initial intervals are positive whole calendar days/weeks, preserving local time for timed tasks and local date for date-only tasks; do not substitute fixed 24-hour durations across DST. |
| Edit this occurrence | Update only its content/deadline/reminders. Preserve its scheduledOccurrenceKey and the series anchor; no implicit future-template change. |
| Edit this and future occurrences | Preview and atomically update the current open occurrence plus the series template/rule version. Past history is immutable. Validate the revised anchor and show the next computed date before saving. |
| Skip this occurrence | Record a skipped lifecycle outcome, cancel its reminders, and generate the next slot using the same fixed/completion-relative advancement rule with skip time as the action time. Skipping is not completion. |
| Stop series / trash or archive recurring task | Ask explicitly whether to skip only this occurrence or stop the series. Stop disables future generation and cancels pending series reminders; preserve history and the current record under the selected lifecycle action. Reopening does not restart recurrence without a deliberate choice. |
| Child/checklist templates | Successors copy only the series template's child/checklist definitions, with fresh IDs, todo/unchecked state and cleared completion timestamps. One-off additions/edits stay on the current occurrence unless explicitly applied to future instances. Child templates in this subset have no independent recurrence, due dates or reminders; occurrence-specific child deadlines/reminders remain allowed and are not copied. Preserve unfinished children on the old occurrence after explicit parent completion. |
| Retry and undo | Repeated operation IDs return the original result. Undo follows section 10; it never silently deletes an edited successor or history. |

Display this behavior in recurrence settings. Enabling recurrence for a task with child deadlines/reminders requires a preview explaining which occurrence-specific values will not repeat. A request for child-relative recurring deadlines is a later extension, not an inferred feature.

Proposed defaults: a monthly day 31 recurrence uses the month's last valid day when necessary; an invalid spring-forward local time advances by the DST gap; an ambiguous fall-back time chooses the earlier occurrence. Show and document these choices, test them, and keep them configurable later. Use a supported, tested zone-aware date library or available standard facility for arithmetic; `Intl` is for formatting, not a recurrence engine. Do not assume Temporal support on all target browsers.

### CalendarOccurrence

Store a normalized provider key scoped to account/calendar, event/occurrence identity, original-series reference where available, title, start/end instant or all-day local date range, provider time-zone metadata, response/cancellation state, safe location text, candidates for launch, Outlook link, fetched timestamp, and source version when available.

Fetch UTC times where practical and preserve all-day semantics explicitly; never convert an all-day date range into a timed midnight appointment. Test provider zone mappings when necessary. Do not persist invitation bodies by default; extract minimal link metadata in memory. Graph fetching and normalized field availability must be verified against current v1.0 documentation. [S02](SOURCES.md#s02).

### Reminder and delivery

A Reminder contains target type/id, optional occurrence key, scheduling zone, either an absolute instant or task-relative rule, next fire instant, enabled state, schedule revision, snooze state, and cancelled reason. For date-only task reminders, store the selected local notification time separately from due date; the proposed initial time is 09:00 in the task scheduling zone, shown to the user before enabling the reminder.

A Delivery record contains reminder ID, occurrence/schedule revision, intended channel/device, idempotency key, attempted timestamp, provider receipt where safe, observable status, acknowledgement if received, and sanitized failure reason. Do not equate push acceptance with display. History remains separate from pending scheduling records.

### Layout, appearance, and food

DashboardLayout has version, breakpoint/profile, ordered placements (`widgetId`, x/y/w/h, preset, locked), and revision. WidgetInstance holds type and validated per-widget config. Appearance stores tokens/mode/background kind/asset IDs, not raw image bytes. ClockConfig stores zone/style/label/work hours/seconds preference.

FoodShortcut holds label and approved URL. ManualPickupReminder is explicitly user-entered and may reference a sensitive tracking link. ProviderOrder, if ever implemented, is a separate authorized data model with source/timestamps; do not populate it based on link clicks.

## 4. Storage, synchronization, and recovery

### Prototype

Use IndexedDB through a narrow repository implementation for synthetic tasks, reminders, layouts, and assets. Reserve localStorage for tiny non-sensitive boot preferences if necessary. Never use localStorage as the only task store. Browser data can be removed by policy, user action, or storage pressure; label the prototype accordingly and demonstrate export/restore.

Use transactionally stored schema versions and tested migrations. Create a migration backup where feasible; do not reset the database automatically when validation fails. Provide safe recovery with a readable error and export of recoverable data. Namespace and delete demo/live data separately.

### Work-ready choice

Record an explicit decision before enabling real tasks. Preferred when approved: a small same-origin TypeScript backend with the employer's supported database and managed backup. PostgreSQL is a candidate, not a mandate. A local-only approved alternative is valid only with documented backup, availability, and notification limits. Do not call a local prototype 'cloud synced'.

If network persistence is chosen, begin online-first with visible pending/failed state. Offline edits require separate approval for work-data caching; do not add them implicitly. When approved, use an outbox with idempotent operation IDs and server revisions. On conflicts, retain both edits and request resolution for overlapping fields; do not silently last-write-win task content.

Backend endpoints must authorize ownership server-side. An `ownerId` sent by the client is not authorization. Validate all input and rate-limit writes/imports. Export bundles are versioned and validated. Exclude auth material, calendar bodies, structured meeting join links (including task references classified as meeting links), and tracking links. Plain task text and generic reference links may still be sensitive; preview and warn rather than claiming automatic recognition of every embedded URL. See section 12 for precise restore/export rules. Background assets can be an explicit export option. Restore must preview and choose merge versus replace, with a backup before replacement.

## 5. Microsoft integration and authentication

Choose one approved authentication topology; do not accidentally implement both.

**Browser-direct pilot:** supported MSAL browser/React libraries, authorization code with PKCE, tenant-approved app registration and redirect URI, delegated scopes, and an explicitly reviewed token-cache choice. A SPA is a public client and contains no client secret. [S04](SOURCES.md#s04), [S05](SOURCES.md#s05).

**Backend-for-frontend pilot:** approved server-managed identity/token storage and secure, HttpOnly, SameSite cookies for the browser session, with CSRF/origin controls and server-side authorization. This can reduce browser token exposure but adds hosting and session operations. Use a supported identity library and review the exact flow before implementation.

Native shell authentication is a distinct security decision: use an approved system-browser/native redirect flow, not an assumption that embedding a web login grants SSO. Keep privileges narrow. Do not reuse tokens across browser/native origins without a supported reviewed design.

Proposed calendar refresh: focus refresh if stale for at least 30 seconds, visible polling every 120 seconds, one request coordinator per account, cancellation of obsolete ranges, and pause when hidden. These are product defaults, not Graph rate guarantees. Honor `Retry-After` on 429 and exponential backoff with jitter for retryable failures. [S19](SOURCES.md#s19).

Each calendar request captures the authenticated account scope and a monotonically changing session generation. Logout/account switch increments that generation before clearing caches and cancels requests where supported. Before any cache/UI/reminder write, verify that both scope and generation still match. Discard late pages, responses and errors from the old session even if cancellation failed; they must not restore cleared state or replace the new account's status. Test a deferred response resolving after logout and after a switch.

With an approved backend, Graph change notifications can later reduce polling. Subscriptions need renewal, endpoint validation, authentication, reconciliation, and recovery from missed notifications; do not enable webhooks as a shortcut before those exist. [S20](SOURCES.md#s20).

## 6. Safe meeting-link resolution

Use URL parsing, not substring matching. Permit HTTPS provider domains only after exact-host or dot-boundary suffix validation against reviewed policy. `zoom.us.attacker.example`, credential-bearing URLs, IP literals, executable schemes, and malformed/unreasonably long URLs must fail validation. Do not allow every host containing the word 'zoom'. Review genuine enterprise Zoom domains and allowed paths before supporting them; keep policies configurable by an authorized administrator.

Extract HTML anchor URLs using a non-rendering parser and normalize entities without executing HTML. Include raw-text candidates only after the same validation. Deduplicate identical normalized candidates without stripping required passcodes or provider parameters. Preserve approved corporate Safe Links wrappers rather than bypassing the organization's protection; ambiguous wrappers go to Open in Outlook unless reviewed handling exists.

Do not fetch URL previews, follow arbitrary redirects server-side, or send meeting links to logs. Use an approved opener with no arbitrary shell-command execution. Launch new browser contexts with appropriate opener isolation. The demo launcher intercepts every candidate and returns a visible simulation result.

## 7. Reminder scheduling

Prototype scheduling is a single foreground coordinator backed by persistent reminder records. It reconciles on start, visibility change, task edits, and wake. It may use a short timer to wake itself while active, but the timer is not the source of truth.

A production backend uses a durable due-job store and one authoritative scheduler, transactionally updates schedule revisions, claims jobs with a lease, and records deliveries. At send time, recheck target status and reminder revision. Stale jobs are cancelled. Use idempotency keys, bounded retries, expiration, and redacted diagnostics. Never claim perfect exactly-once OS presentation; duplicate transport events must be handled safely.

Web push requires an approved service worker, subscription storage, backend credentials, approved network endpoints, permission, and platform testing. Push payloads should be minimal and private by default. A service worker is not a permanent local scheduler. [S08](SOURCES.md#s08).

Desktop mode may use an approved background process or native scheduling facilities. Hiding a window, exiting its process, sleeping a machine, and denying notifications are four separate states that must be tested and documented. Do not duplicate browser and native deliveries for the same active device. One coordinator owns delivery per chosen runtime/profile.

Quiet hours defer eligible alerts to the next allowed time while preserving the original due time. Summarize multiple deferred/missed reminders. User-configured urgent overrides must be explicit; a priority label alone must not override privacy or quiet-hour settings.

## 8. Operational boundaries

Service-worker caches, if added, use a strict app-shell allowlist; authentication, Graph responses, order tracking, and task API responses are not cached by default. Updates must not erase pending edits or strand users on incompatible schemas. Provide a controlled refresh prompt and recovery path.

Log only operational metadata necessary for support: sanitized error class, local correlation identifier, duration, and build/version. Do not send telemetry off-device without approval. Health views should reveal storage/auth/notification status without exposing tokens or invitation text.

Document deployment origin, TLS, signing/update requirements, dependency versions, licenses, recovery owner, and tested target machines before the work-ready milestone. Performance targets are measured requirements, not guarantees provided by a framework choice.

## 9. Historical Toast boundary (superseded provider)

The default food adapter is an external-link launcher, not an API client. Keep manual reminders and provider orders as different records. Add an authenticated backend adapter only after the Toast gate is approved. The browser and desktop bundle must never contain merchant client secrets. Webhook ingestion, order ownership checks, normalization, deduplication, and notification fan-out belong on that backend. Never expose restaurant-wide payloads to individual employees.

Model capability flags independently: `externalCheckout`, `menuRead`, `orderCreate`, `orderRead`, and `verifiedFulfillmentEvents`. One true flag does not imply the others. A saved tracking URL does not create an order authorization grant. Read the dedicated Toast specification before expanding beyond the launcher.

## 10. Recurrence undo and foreground coordination

Completing a recurring occurrence and creating its successor must be one atomic/idempotent domain operation. Undo may remove an untouched generated successor; if it was independently edited or completed, preserve that work and show a conflict-resolution choice. Do not delete a successor silently.

For multiple browser tabs, elect one foreground reminder coordinator using a supported lock/lease mechanism and a persisted owner/expiry record, with heartbeat and stale-owner recovery. Broadcast state changes without duplicating schedules. A frozen or terminated tab must not permanently hold delivery ownership. This improves foreground behavior; it does not promise exact closed-app notifications.

## 11. Domain transactions and interruption recovery

Repository interfaces share a unit-of-work boundary; they do not independently commit a compound domain command. Commands such as complete/undo, reschedule, archive/delete, snooze, recurring advancement and restore carry a stable operation ID and expected revisions. Validate the entire command before committing. A successful commit includes task/child mutations, series/successor state where applicable, reminder cancellation/rescheduling, and an operation-result record. Return the prior result for an identical retry; reject reuse of the operation ID with a different payload.

For IndexedDB, use one read-write transaction over all affected object stores, with no network calls inside it. Revision checks happen inside the transaction. An aborted transaction leaves none of the command's changes visible; do not acknowledge a save before commit. If the commit succeeds but the acknowledgement is lost, retry resolves from the operation-result record rather than creating a second successor or reminder.

For a backend, use the equivalent database transaction plus a transactional outbox for external delivery intents. Dispatch happens after commit; retries are idempotent and recheck target status/schedule revision. External transport cannot join a database transaction, and a notification already handed to an OS may not be retractable. Do not claim rollback of external display. A deployment without atomic storage must document a durable command journal and tested reconciliation before supporting these compound actions; it must not silently perform unrelated repository saves.

Test failure before commit, between proposed writes, and after commit/before acknowledgement, plus concurrent stale-revision edits. Assert unchanged state on abort, exactly one logical successor/schedule on retry, and no delivery from an uncommitted or stale intent. Export/restore also pauses claims during the atomic namespace swap, invalidates old schedule revisions, then reconciles safely.

## 12. Backup merge, replacement and link handling

Backups declare schema version, bundle ID, source namespace ID and record IDs/types. Treat all identifiers/ownership fields as untrusted; the destination authenticated or synthetic scope supplies ownership. Schema support is explicit: reject unsupported record types/features and future versions with an explanation, rather than dropping their data. M2.1 supports its core record types; later packages extend schemas and migrations before export is enabled for new types.

| Restore case | Required behavior |
| --- | --- |
| Preflight | Parse/validate a bounded bundle, then stage it without writes to the active namespace. Check references, cycles, permitted types, duplicates and size limits; show counts, conflicts, exclusions and reminder impact. Reject dangling mandatory references; an intentionally omitted optional sensitive link is not a dangling entity. |
| Matching source namespace and ID | Identical content is a no-op. Differing content requires explicit keep-current or replace-from-backup choice; never infer ordering from timestamps alone. Preserve both versions in the recovery snapshot until the restore is accepted. |
| Different source namespace | Allocate new local IDs and persist a mapping keyed by source namespace/type/source ID. Remap projects, tags, parents, series, reminders, saved-view filters, widget/view references and asset references consistently. A textual ID collision alone must not merge unrelated records. |
| Repeat import | Reuse the mapping and committed bundle ledger. Reimporting an identical bundle is a no-op, including after an interrupted acknowledgement. A newer bundle from the same source reuses IDs and previews conflicting content; do not duplicate recurrence or reminders. |
| Replace | Create and verify a recoverable snapshot before replacement; abort if this cannot be done. Replace only the selected destination namespace through a transaction or validated staging/swap. Preserve other accounts and demo/live separation. Failed validation/commit leaves the previous namespace active. |
| Reminder and recurrence activation | Preserve rules for review but disable imported reminders and pause imported series by default, including replaced records. Unchanged local records retain their settings. Explicit activation previews future deliveries; past alerts remain history/missed summaries and are never replayed as a burst. Recalculate from the committed target state. |

The default backup excludes tokens, permission/approval state, provider calendar caches/bodies/join URLs, structured meeting-link references and food tracking links. Classify structured reference links as generic, meeting or tracking at entry/import; recognized provider URLs are classified conservatively, with no remote fetching. Remove excluded link values rather than leaving them hidden in an alternate field. Preserve a safe omitted-reference marker when needed to explain the omission.

Task title/description text and generic URLs are included only after a sensitive-content preview/acknowledgement. Recognized meeting/tracking URLs in those fields should be flagged for removal, but arbitrary embedded URLs cannot be guaranteed detectable. The export UI must state this limitation and permit field omission; it must not label a text-containing bundle as fully scrubbed. Redactions intentionally limit round-trip fidelity and must be listed in the manifest. A restricted internal recovery snapshot may retain the original data only within the approved storage boundary; it is not the portable export and never includes auth secrets. Tests use synthetic URLs only.

## M2.1 implementation notes

Persisted workspace schema is version 2, with a tested migration from the original M1 shape. The IndexedDB database remains named cai-synthetic-v1 to preserve existing origin-scoped data, but its database version is 2 and adds a recovery store. Migration saves the original record before committing the upgraded record in the same transaction. Unsupported data remains untouched.

Core tasks store project/list and tag names as normalized labels, rather than separate entities at this stage. This is an explicit small-app implementation choice; backup maps task/reminder identities across namespaces while project/tag strings remain values. Stable project/tag entities and migration are needed before introducing independent rename/management or saved-filter entity references. Unknown future fields/record types are rejected by portable restore.

Complete/archive/trash/restore/edit support a single most-recent task undo record with revision conflict checks. Trash is recoverable; no permanent deletion is implemented. Restoring from archive/trash does not revive old reminders. Undo restores only future schedules that have not been shown. Date-only/timed start and due fields, descriptions and classified HTTPS references are supported.

Portable backups have a separate strict schema, 5 MiB encoded limit, namespace and bundle IDs, and explicit text-content acknowledgement. Structured meeting/tracking links and calendar data are excluded; descriptions can be omitted. Recognized links in free text are flagged, without a promise of complete automatic scrubbing. Restore previews counts, conflict policy and merge/replace scope. Foreign task IDs are remapped and remembered. Bundle SHA-256 receipts make repeated identical imports no-ops. Imported reminders are disabled; current unchanged reminders remain unchanged. Every non-no-op import and recovery stores a verified local safety snapshot before switching state. Snapshots remain on the device and can be restored in Settings. There is no automatic pruning yet; quota failure aborts the operation.

Full Tasks lists render 50 records per page; dashboard lists show the six most recently created records in the selected active/completed set. Filtering still considers all records. This bounds DOM work without adding a virtualization dependency. Performance evidence and remaining limits are in M2_VALIDATION.md.

## Local ICS reader (D126-D129, implemented)

`server/calendar/plugin.ts` attaches /api/calendar/status, connect, refresh and disconnect to Vite dev/preview only. Frontend `useCalendar` shares one state/polling coordinator; CalendarSettings and CalendarPanel consume it. The API accepts same-origin loopback requests with a custom header and random memory-session cookie. No calendar content is written into the task database or backup schema.

`fetch.ts` restricts HTTPS feed hosts and redirects, rejects any nonpublic resolved address, pins the selected public IP while retaining provider SNI/Host and certificate validation, and bounds input at 5 MiB/15 seconds/three redirects. `parse-worker.ts` isolates ICAL timezone globals with a 128 MiB old-generation heap limit and ten-second deadline. Parser bounds: 5,000 source events, 20,000 recurrence steps, 1,000 normalized occurrences; unsupported data marks results incomplete. HTML is never rendered or fetched for previews. Only display fields and approved join links return to the browser, not descriptions/attendee emails.

Service state is scoped by cookie, capped at 20 sessions and eight idle hours. One active fetch per session; generation checks discard delayed replaced/disconnected results even when abort is ignored. A stable UTC date window permits conditional responses within a day; a changed window forces a new body. A 304 without a valid same-window cache fails safely. Polling is visible-tab only; stale timestamps and throttle deadlines are explicit. Process restart clears all sessions; an old cookie yields disconnected rather than sample data. No persistent/offline calendar cache, Graph identity or calendar-derived reminder storage is added.

The Calendar tab shows a day-grouped agenda in 50-event pages; the dashboard is a compact next-meeting overview. All-day end dates are exclusive and preserved. Optional owner-email matching excludes declined events where attendee data exists. Published detail and feed latency cannot be repaired by CAi. Safe Links wrappers are preserved when their inner destination is an approved meeting host; ambiguity requires explicit choice. Open Outlook is a calendar fallback, not a claimed event deep link.

## Shared widget/full-view UI (D131-D133)

WorkspaceApp keeps useCalendar mounted across Dashboard/Calendar/Settings navigation; CalendarView does not create a second fetch or polling loop. CalendarPanel, CalendarView and shared MeetingActions/CalendarFeedback consume the same normalized snapshot. Pure presentation helpers handle calendar-day labels, 15-minute urgency, duration, conflicts and range/search filtering. Detail selection is derived from currently visible results, so refresh/filter changes cannot leave an invisible old selection. Meeting link validation remains in the shared domain boundary and immediately before opening.

RemindersView reads the same workspace reminders/history/tasks as the dashboard and opens the existing task editor. It does not persist separate state or implement M4 scheduler features. This UI-only increment leaves the running reader, cookie scope, memory retention, API, database and backup schemas unchanged. No new dependencies or dev-server configuration changes are needed.

## List selection and density (D134-D136)

Dashboard rows pass the selected event ID to WorkspaceApp, then CalendarView initializes selection and the corresponding 50-event page from the same snapshot. No extra calendar fetch/poll coordinator is created. Relative-time formatting is pure, with actual minute/hour/day thresholds; existing foreground clock updates it. Shared MeetingActions has a compact paired-icon variant and retains approved URL validation/passcodes/wrappers/ambiguity handling. The pair opens one provider join flow and cannot dictate mic/camera state.

Workspace preferences add optional enum density (compact/default/comfortable). Old records and backups without it remain valid and resolve to Default in the UI; malformed values fail validation. Existing preference commands, IndexedDB save/revision handling and portable preference restore carry the field. No database/schema-version bump, task migration or calendar persistence is needed. CSS variables scoped to the app control spacing in density.css; source/reader/API/session lifetime are unchanged.

## Day groups and brand defaults (D137-D140)

dashboardMeetingDays derives Today/Tomorrow from local calendar date keys rather than adding 24 hours to now, avoiding DST drift. It retains only unended timed meetings; overnight ongoing events belong to Today. CalendarPanel renders three rows/day plus an explicit selected-event overflow link, using the existing clock and snapshot. Empty-state satire requires a complete successful view; error/incomplete snapshots avoid an all-clear. The full Calendar provider/range is unchanged.

src/branding/identity.ts is generated from the supplied branding/brand.json and selected copy.json roles, validated for equality. Brand.tsx receives resolved theme and the existing satire preference, so it introduces no provider/store. Runtime marks/wordmarks/icons are copied unchanged into public/branding/cai; reference boards, source crops, previews and original handoff remain outside the runtime tree. The existing root favicon.svg is an unchanged supplied utility silhouette; the primary head uses full-color ICO/PNG. No manifest or service worker exists in this app, and none was added. Metadata uses the canonical document title plus an implemented-feature description.

## M4/M5.3 implementation update

Workspace schema/IndexedDB version 3 adds typed pickup targets, reminder rule/zone/revision/deferred fields, immutable delivery snapshots and reminder settings. The existing single-record workspace transaction remains the unit of work. A separate coordination store holds a 10-second foreground lease, preventing heartbeat writes from invalidating restore previews. Reconciliation validates the current target inside that transaction; no per-widget timers or external transport are introduced. BroadcastChannel carries only a change signal. Portable backup v2 adds supported records and reads v1 with compatible fingerprints; tracking links are stripped. See REMINDERS_FOOD_VALIDATION.md for exact semantics, evidence and limits.
