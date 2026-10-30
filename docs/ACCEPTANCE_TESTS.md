# Acceptance and failure-mode tests

This is a test specification, not a record of passing tests. Initial planning state was NOT RUN for every item. Current M0/M1 evidence is recorded in M1_VALIDATION.md and subsequent task/copy evidence in M2_VALIDATION.md; all other scenarios remain NOT RUN unless specifically recorded there. Use synthetic data and intercepted network calls unless live testing has separate approval. Record command, environment, expected/actual behavior, evidence path, and limitations for each executed group.

Package ownership and profile-specific applicability are recorded in IMPLEMENTATION_BACKLOG. Partial coverage is not a whole-test pass. New behavior cases below remain NOT RUN until implemented and executed.

## Bootstrap

| ID | Scenario and required result |
| --- | --- |
| AT-BOOT-01 | Starting from the actual repository, preserve unrelated files and report unknown approvals. No real credential/network integration appears merely by starting dev mode. |
| AT-BOOT-02 | Clean permitted install followed by typecheck/lint/tests/build runs real commands. Missing tools are reported as unrun, not passing. No secrets in generated assets. |
| AT-BOOT-03 | Create a synthetic task, reload, receive a demo in-app reminder, complete the task, reload again: state is consistent and no fake live data appears. |
| AT-BOOT-04 | Empty, loading, storage-error and offline states remain actionable. Data-source context remains accurate: the sample calendar is labeled where it is shown, and Local workspace remains visible. Repeated page-wide demo notices are not required (owner copy revision). |
| AT-BOOT-05 | In M1's dashboard, create/edit/complete the same persisted task and expose save failures. A persistent demo reminder appears in history; completion suppresses a still-pending alert after reload. This scoped test does not certify full task views, cross-tab coordination or removable widgets. |

## Tasks and date semantics

| ID | Scenario and required result |
| --- | --- |
| AT-TASK-01 | Create/edit/complete a task from dashboard and full view: both reflect one shared record. Failed persistence shows an error and never falsely reports saved. |
| AT-TASK-02 | A date-only deadline remains the chosen local date when viewed in another zone. A timed deadline retains its instant. Overdue starts according to the explicit domain rules. |
| AT-TASK-03 | At a fixed clock, test past, due-soon, due-today, future, undated, completed, archived and deleted tasks. Derived urgency never changes assigned priority. |
| AT-TASK-04 | Archive, trash, restore and undo preserve content/reminder consistency. No task is destroyed by removing a widget or saved view. |
| AT-TASK-05 | Inline rename/status/priority/deadline edits preserve list scroll/focus. A side panel closes back to the originating row. Keyboard-only operation works. |
| AT-TASK-06 | Saved filters/sorts/groups survive reload; multiple widgets use distinct views of shared records. Manual drag ordering is not offered as authoritative under automatic sort. |
| AT-TASK-07 | Board moves and bulk edits persist consistently; partial failure is visible and recoverable. Search handles long and non-ASCII titles without executing markup. |
| AT-TASK-08 | Subtasks cannot form a cycle or unsupported deep nesting. Parent completion with unfinished children asks for an explicit choice and does not erase them. |
| AT-TASK-09 | Quick entry previews parsed date/tag/priority; ambiguous numeric dates remain unparsed or require correction. No network/LLM call occurs. |
| AT-TASK-10 | Fixed vs completion-relative recurrence produces different correct next dates. Test month-end, DST gap/fold, missed intervals, duplicate completion and undo. No duplicate occurrences. |
| AT-TASK-11 | Exercise every recurrence behavior-table row: early/late completion, missed-slot summary, occurrence vs future edits, skip/stop/reopen, child/checklist reset, independent child preservation and retry/undo. Scheduled identity/anchor and history remain correct. |
| AT-TASK-12 | M2.1 simple list views (Today, Upcoming, Overdue, Inbox, Waiting, All Tasks), local title/description search and status/priority/date controls work on shared records. Include long/non-ASCII text and distinguish urgency from priority. No board/saved-filter claim is implied. |

## Navigation and usability

| ID | Scenario and required result |
| --- | --- |
| AT-NAV-01 | M2.2 command palette opens by menu and a documented nonconflicting in-app shortcut; keyboard navigation, Escape and focus restoration work. It navigates app views, searches local task titles/descriptions and opens task creation; it does not call AI/external search or hijack text entry. |
| AT-UX-01 | On synthetic fixtures with a fixed clock, have the owner independently locate the next meeting and its launch action, create a titled task with a deadline, and identify a high-priority future task versus an overdue normal-priority task. Record elapsed times, mistakes and assistance. Initial targets: <=10 seconds to locate the meeting, <=30 seconds to create the task, correct urgency/priority explanation without coaching. M2.1 is the formative baseline; release requires owner review of results and explicit acceptance of any remaining misses. No user session means NOT RUN, not an agent-inferred pass. |

## Dashboard

| ID | Scenario and required result |
| --- | --- |
| AT-DASH-01 | At usable content widths 799/800/1199/1200px, choose 4/8/8/12 columns respectively. Changing navigation width can change profile without screen-size assumptions. |
| AT-DASH-02 | Only widget-approved presets are selectable. Compact tasks summarize rather than shrinking text. Invalid sizes/bounds cannot persist. |
| AT-DASH-03 | Editing supports preview, no overlap, locked widgets, save/cancel/undo. Invalid locked-region drops are rejected or visibly remapped before commit. |
| AT-DASH-04 | Save distinct wide/medium/narrow layouts; resize repeatedly and reload. Each arrangement returns intact with stable widget identity/config. |
| AT-DASH-05 | Task completion, meeting refresh and clock updates do not move widgets. Optional tidy/reset requires deliberate action. |
| AT-DASH-06 | Keyboard moves/resizes provide equivalent functionality, readable state announcements, and correct focus. Touch does not drag during normal task use. |
| AT-DASH-07 | Corrupt/old layout records recover safely without deleting tasks/settings; resetting one profile leaves the others intact. |

## Calendar and launch

| ID | Scenario and required result |
| --- | --- |
| AT-CAL-01 | The sample calendar action (Preview meeting) is intercepted and visibly identified as a preview on action. It never opens a real meeting or fetches a provider URL. |
| AT-CAL-02 | With an approved adapter, fetch all pages of a bounded calendarView. Recurring exceptions and individual events normalize correctly; partial fetch is labeled incomplete. |
| AT-CAL-03 | Cancelled/declined events do not become Next Meeting; tentative is labeled; all-day appointments stay distinct; ongoing/overlapping events follow documented selection rules. |
| AT-CAL-04 | Structured link wins when valid; body/location extraction works only with approved data access; duplicate links collapse; multiple distinct links produce a chooser. |
| AT-CAL-05 | Reject lookalike hosts, executable schemes, credentials in URLs, IP literals, oversized/malformed links. Never execute invitation HTML or retrieve arbitrary URL previews. |
| AT-CAL-06 | Protected corporate links are not silently unwrapped to bypass controls. Unhandled wrappers fall back to opening Outlook safely. |
| AT-CAL-07 | Refresh cancellation/reschedule changes visible meeting and link. 401 requires reconnect; 403 explains access; 429 respects retry; offline shows last successful refresh. |
| AT-CAL-08 | Logout/account switch clears or isolates approved account caches and pending alerts. Resolve a delayed old-session response/page/error after logout and after account switch, including failed cancellation: generation/scope checks discard it before any cache/UI/reminder write. No old state reappears and no failing live data becomes unlabeled synthetic data. |
| AT-CAL-09 | Join is user-initiated and opens only the selected approved handler. External Zoom prompts are not represented as app failures or bypassed. Missing link offers Open in Outlook. |

## Reminder lifecycle

| ID | Scenario and required result |
| --- | --- |
| AT-REM-01 | A persistent reminder fires once in the active demo coordinator and appears in history. Removing a widget does not delete the reminder. |
| AT-REM-02 | Change due date, complete/delete target, or snooze while an old job is pending. Send-time revision/status validation suppresses obsolete delivery. |
| AT-REM-03 | Date-only reminder time uses its scheduling zone. Multiple reminders and quiet hours behave as documented; missed items are summarized on wake. |
| AT-REM-04 | Multiple tabs/windows or repeated transport events do not create uncontrolled duplicate notifications. Coordinator crash/lease expiry recovers without losing schedules. |
| AT-REM-05 | Permission denied/unsupported shows truthful capability. Request permission only after a user gesture; no endless prompt loop. |
| AT-REM-06 | Test foreground, hidden tab, closed tab, exited browser/process, network loss, device sleep and restart separately. UI documentation matches observed delivery limits. |
| AT-REM-07 | Private notifications hide task/meeting details by default. Actions operate only on the intended authorized target and cannot revive deleted tasks. |
| AT-REM-08 | A provider accepting push is recorded as accepted, not guaranteed displayed. Delivery retries expire; history separates intended time, sent time and acknowledgement. |

## Quick access

| ID | Scenario and required result |
| --- | --- |
| AT-QUICK-01 | Browser mode shows in-app shortcut support, never a claim of global show/hide. Typing fields retain normal input and browser shortcuts. |
| AT-QUICK-02 | Approved desktop: hidden -> show/focus, visible-unfocused -> focus, focused -> hide. Repeat key events do not cause rapid toggles. |
| AT-QUICK-03 | A conflicting replacement binding produces a clear error and preserves the previous working binding. Tray remains a recovery route. |
| AT-QUICK-04 | Launch a second instance; it activates the existing app. Unplug a monitor; restored window is visible and usable. |
| AT-QUICK-05 | Hide/Minimize/Quit have distinct tested effects. Quick View and dashboard share tasks, calendar and scheduler. No automatic startup registration without approval. |

## Clocks and appearance

| ID | Scenario and required result |
| --- | --- |
| AT-CLOCK-01 | User-selected IANA zones show correct dates/times, including non-hour offsets and previous/next-day indicators. Chicago office time is not forced as user display time. First run adds Chicago plus a valid detected local zone, with identical zones deduplicated; failed detection retains Chicago and offers manual selection. New York/London are suggestions, not compulsory defaults. |
| AT-CLOCK-02 | Test DST transition and regions with different transition dates. Invalid zones fail validation with an actionable message. |
| AT-CLOCK-03 | Digital/analog/comparison styles honor 12/24-hour, label, seconds and working-hours settings. Styles use shared time state. |
| AT-CLOCK-04 | No visible seconds -> no per-second tick. Hidden app pauses unnecessary display work and catches up on focus. |
| AT-THEME-01 | Default brand is exactly #115B47 in both modes. Dark links use a readable tint. Main text/focus/control contrast is tested, including selected/error states. |
| AT-THEME-02 | Solid, gradient, image and reset choices persist. Uploaded busy photos do not reduce text contrast; cards remain readable. |
| AT-THEME-03 | Reject corrupt/animated/vector/oversized images. Re-encode accepted rasters, validate output metadata/dimensions/size, and release temporary object URLs. |
| AT-THEME-04 | Quota failure is recoverable without deleting tasks. Removing an image cleans only unused asset records. No arbitrary remote image fetches. |
| AT-THEME-05 | Favicon and in-app logo update as supported. PWA/native icons are tested and documented separately, never falsely claimed updated. |

## Aster Hall food feature

| ID | Scenario and required result |
| --- | --- |
| AT-FOOD-01 | Initial action targets the owner-corrected https://asterhall.order.online/ destination. No automatic order, embedded credentials or cross-origin scraping. |
| AT-FOOD-02 | Opening checkout does not create a confirmed order record. Manual reminders say 'Check pickup', not 'Food ready'; tracking links remain private. |
| AT-FOOD-03 | A paused/unavailable storefront is not shown as open based on hard-coded hours. Public page observation is dated, not treated as current API status. |
| AT-FOOD-04 | Unapproved or read-only credentials cannot enable order creation. API secrets never reach browser/native assets or logs. |
| AT-FOOD-05 | An order placed on the provider's own checkout is not assumed readable by our channel client. Ownership and originating channel are checked before exposing any record. |
| AT-FOOD-06 | For approved webhooks, reject invalid signatures/unowned restaurants/orders; dedupe replay; handle out-of-order/reopened statuses. An estimate cannot trigger verified-ready messaging. |
| AT-FOOD-07 | For a separately approved ordering increment, price/availability changes and timeout ambiguity require reconciliation. No duplicate POST purchases; payment and live tests require their own approvals. |

## Data, security and release

| ID | Scenario and required result |
| --- | --- |
| AT-DATA-01 | Schema migration preserves data; failure offers safe recovery and does not silently reset storage. |
| AT-DATA-02 | Export/restore round trip preserves supported permitted tasks/settings/recurrence/layout with explicit merge/replace and documented redactions. Verify recovery snapshot before replacement. Imported reminders are disabled and imported series paused pending explicit activation; unchanged records retain their settings. |
| AT-DATA-03 | Reject malformed, oversized, future-version or executable-content imports. Restore never installs code or overwrites authorization gates. |
| AT-DATA-04 | Default exports omit tokens, calendar caches/bodies, structured meeting join links (including task references) and tracking links. Text/generic references require preview and sensitive-content acknowledgement or omission. Flag recognized embedded links; never claim arbitrary text is fully scrubbed. Manifest lists omissions and tests verify excluded values are not duplicated in alternate fields. |
| AT-DATA-05 | Approved backend enforces per-user ownership independent of client-supplied IDs. Two-user test cannot read/update/subscribe to another user's records. |
| AT-DATA-06 | Backup restore drill succeeds; network retries are idempotent. Approved offline conflicts preserve both edits and show resolution instead of losing content. |
| AT-DATA-07 | Restore same-ID identical/different content and cross-namespace collisions; require conflict choices and consistent relationship remapping. Reimport an identical bundle after acknowledgement loss: no duplicate records, successors or schedules. Reject unsupported features/dangling mandatory references. Failed replacement keeps the old namespace; other scopes remain untouched. |
| AT-DATA-08 | Inject interruption before/during a compound task/series/reminder transaction and after commit before acknowledgement. Abort leaves all related stores unchanged; retry returns the committed result exactly once logically. Stale revisions conflict visibly. Only committed current-revision intents may dispatch; do not claim exactly-once OS display. |
| AT-SEC-01 | Synthetic mode performs no unapproved enterprise calls, telemetry, email access, provider registration or public deployment. |
| AT-SEC-02 | Build artifact/log scan finds no secrets, tokens, real invitation text or sensitive URL query strings. |
| AT-SEC-03 | Malicious imported/task/invitation text cannot execute scripts or change agent/application instructions. |
| AT-SEC-04 | Auth/session/token cache follows the selected reviewed flow; logout clears scope; CSRF/origin controls are tested where cookie sessions exist. |
| AT-SEC-05 | Service-worker caches contain only approved shell assets, not authenticated work/provider responses by default. |
| AT-SEC-06 | Dependency/licenses/security review is recorded. Native permissions, URL openers and filesystem access are narrowly scoped. |
| AT-SEC-07 | Approved release has storage, retention, deployment/update/rollback, incident and revocation owners. Secret rotation does not require a public client rebuild. |
| AT-A11Y-01 | Every essential action is usable by keyboard with visible focus and no trap; dialogs restore focus. |
| AT-A11Y-02 | Screen-reader labels, status announcements, headings, form errors, checkbox states and drag alternatives are meaningful. |
| AT-A11Y-03 | 200% zoom and narrow viewport show all essential actions without clipped text or avoidable horizontal scrolling. |
| AT-A11Y-04 | Contrast, reduced motion and non-color-only urgency/priority pass checks; automated audits are supplemented with manual review. |
| AT-PERF-01 | Measure first-route compressed JavaScript against proposed 500 KiB target; list chunks and exceptions. Uploaded backgrounds are not bundled. |
| AT-PERF-02 | On target hardware, measure warmed quick-view reveal against proposed p95 <300ms. Record memory and idle CPU rather than asserting a framework guarantees them. |
| AT-PERF-03 | With 1,000 synthetic tasks and four dashboard widgets on a recorded target machine/browser using a production build, measure 50 repetitions per action after five warm-ups: edit/complete input to visible update p95 <=100ms; apply filter/search to rendered results p95 <=200ms, including deliberate debounce. Report persistence acknowledgement separately and never equate optimistic rendering with saved state. Record cold startup, memory and idle CPU; verify no duplicate polling loops, leaked listeners or avoidable hidden animations. Targets are proposed budgets, not measured promises; deviations require a recorded decision, not silent threshold changes. |

## Evidence template

```text
Acceptance IDs:
Build/commit:
Date and environment:
Synthetic fixture and clock:
Command or manual procedure:
Expected:
Actual:
Result: PASS / FAIL / NOT RUN / BLOCKED
Evidence path (redacted):
Known limits and follow-up:
```

## Brand personality and trust

| ID | Scenario and required result |
| --- | --- |
| AT-BRAND-01 | App title/About uses `Cursed Assistant-inator`; compact wordmark remains exactly `CAi`; tagline is exactly `Productivity is our job. Your data is our passion.` |
| AT-BRAND-02 | Turning satirical copy off removes both tagline lines and optional jokes but does not alter functional labels, errors, permissions, onboarding requirements or security controls. |
| AT-BRAND-03 | Real account, calendar, reminder, order, data export/deletion, consent and notification interactions never use misleading privacy/security parody language. |
| AT-BRAND-04 | No telemetry, real data sales, third-party ad network, manufactured breach, or fake consent/data sharing is introduced in the name of satire. Real storage and privacy disclosures remain accurate. |
| AT-BRAND-05 | Long satirical phrases do not obscure actions or break mobile, dark/light, screen-reader or keyboard layouts. |

## Local ICS profile

| ID | Scenario and required result |
| --- | --- |
| AT-ICS-01 | Paste a published Outlook ICS URL in local Settings; explicit connect/read-only state replaces sample data. No app ID, mailbox access or URL in task backups/logs. |
| AT-ICS-02 | Normalize recurring instances, moved/cancelled exceptions, duplicate revisions, EXDATE/RDATE, floating/IANA/embedded time zones and exclusive all-day dates. Unsupported data or expansion caps are incomplete, never silently complete. |
| AT-ICS-03 | Restrict HTTPS feed hosts/redirects, credentials/ports, DNS public addresses and pinned destination; reject cross-site/foreign-host API requests and invalid JSON without leaking the link. Bound body, parser and request work. |
| AT-ICS-04 | Refresh preserves stale data/timestamp on failure, honors Retry-After, deduplicates in-flight work, reuses valid conditional cache only within its range, and requests new data on day rollover. |
| AT-ICS-05 | Disconnect/replacement/expiry isolate and clear sessions; a late old response cannot restore events even if abort is ignored. Reload retains only the running session; restart requires reconnect. |
| AT-ICS-06 | Meeting links require a user click, approved host and scheme; preserve passcodes and Safe Links wrapper, deduplicate candidates and offer chooser for ambiguity. Never render invitation HTML. |
| AT-ICS-07 | Next timed meeting selection, tentative/conflict markers, missing-link Outlook fallback, incomplete/empty/loading/stale states and compact all-day agenda remain usable in light/dark/mobile and by keyboard. |
| AT-ICS-08 | Owner locally compares real feed times/titles/recurrence/available links with Outlook and assesses feed lag/detail level. No private URL, actual meeting content, screenshot or production meeting launch in automated tests. |

## Dashboard/full-view hierarchy

| ID | Scenario and required result |
| --- | --- |
| AT-UI-01 | A meeting 1,378 minutes away tomorrow shows Tomorrow at its local time, without an urgent marker/countdown. Imminent threshold is 15 minutes; ongoing has its own label. Calendar-day labels hold across midnight, DST and year rollover. |
| AT-UI-02 | Calendar tab and dashboard consume one connection/snapshot. Full view groups days, filters ranges, searches title/location, supports selection/details, safe link chooser and missing-link Outlook fallback. Navigation starts no additional calendar status/poll coordinator. All-day exclusive dates remain correct. |
| AT-UI-03 | Every current widget opens its matching Tasks/Calendar/Reminders destination; future widgets require this at delivery. Reminder schedules/history and task editor use shared records. Light/dark, narrow layout, keyboard focus and screen-reader labels remain usable. |

## Meeting list and display density

| ID | Scenario and required result |
| --- | --- |
| AT-UI-04 | Dashboard shows grouped Today/Tomorrow upcoming timed meetings, with three preview rows/day and explicit overflow with title/day/time and minute (<1h), hour, day or in-progress relative time. Click a row to open that event's Calendar details. Join uses separate, individually focusable phone/video icon buttons when a supported link exists; preserve original destination/passcode/chooser and do not claim enforced audio/video mode. |
| AT-UI-05 | Appearance density Compact/Default/Comfortable changes actual row/card spacing, retains font size/control access, persists across reload and round-trips in backups. Existing records/backups without density render Default; invalid values fail safely. Verify default/compact/comfortable and narrow/light/dark accessibility. |

## Supplied brand integration checks

| ID | Scenario and required result |
| --- | --- |
| AT-BRAND-06 | Source visual matches #10 from the SECOND AI-startup board, not first-board #10; no substituted icon or unapproved redesign. |
| AT-BRAND-07 | Dark/light variants preserve proportions; light app surfaces use the unchanged transparent mark and dark wordmark, without the app-icon badge. No unsupported claim that color SVG is all-vector. |
| AT-BRAND-08 | Local logo/favicon/manifest assets resolve under root and actual subpath deployment. No source boards or obsolete tagline images in runtime bundles/caches. |
| AT-BRAND-09 | No remote fonts, analytics, third-party icon scripts or external brand-image requests are introduced. Strict CSP works without weakening policy. |
| AT-BRAND-10 | Existing custom logos, favicons, backgrounds and chosen themes survive migration; reset-to-CAi requires explicit user action. |
| AT-BRAND-11 | Navigation logo has an appropriate accessible name once; decorative graphics are not announced repeatedly; tagline is not read on every home-link focus. |
| AT-BRAND-12 | 320px viewport, 200% zoom, forced-colors mode and keyboard use preserve readable text, visible focus and all functional actions. |
| AT-BRAND-13 | Manifest name/short_name use CAi identity; existing id/scope/start_url remain unchanged; maskable icons retain safe padding and opaque background. |
| AT-BRAND-14 | Tiny 16/32 favicons and authorized installed/native icons are visually checked separately; no claim of instant installed-icon replacement without evidence. |
| AT-BRAND-15 | The official tagline appears exactly where enabled; retired names/taglines exist only in migration/history or excluded source references. |
| AT-BRAND-16 | The application keeps #115B47 and existing neutral tokens; logo highlights do not turn the dashboard into a new neon theme. No animation by default. |
| AT-BRAND-17 | Shared runtime identity data drives title/About/brand component. References/templates use the same canonical values, with no CAI/Cai case drift. |
| AT-BRAND-18 | Satire remains sparse and institutional; real permission, privacy, security, meeting/task/reminder and order flows remain literal and accurate. |
| AT-BRAND-19 | The main line is exactly `Productivity is our job. Your data is our passion.`; both periods and sentence order are preserved. Preferred two-line presentation has equal size, weight and color; each sentence may wrap naturally on narrow screens. |
| AT-BRAND-20 | Every installed logo/icon/wordmark matches its owner-supplied v1.6 hash in `branding/logo-lock.json`. The v1.6 transparency repair supersedes the previous mask; the old v1.4/v1.5 lock remains historical. No local redraw/recolor/retrace or icon rebuild occurs. |
| AT-BRAND-21 | Public-facing primary copy uses `job`; `obligation` appears only in explicitly fictional internal corporate copy, never real product obligations or permission/security/status copy. |
| AT-BRAND-22 | About wording is optional fictional brand description; `You work faster. We sell faster.` is optional secondary copy only with explicit fictional data-brokerage context and never replaces the canonical line. |
| AT-BRAND-23 | Satire off hides both sentences and optional internal/campaign/About satire together while keeping CAi/logo and factual productivity description. No campaign feature, AI service, data collection or brokerage is implemented for the joke. |

## Local day scope

| ID | Scenario and required result |
| --- | --- |
| AT-UI-06 | Dashboard shows only remaining Today/Tomorrow timed meetings in separate date groups. Test ended/all-day/later exclusion, overnight ongoing events, DST/year rollover, per-day overflow/selection, complete empty Today with optional satire, and incomplete/error states without a false all-clear. Full Calendar retains the wider loaded window. |

## Slim task-entry refinement

| ID | Acceptance |
| --- | --- |
| AT-UI-07 | Dashboard creation is a compact title/Add row (Enter supported), without advanced fields. Header plus focuses it. Quick tasks use safe basic defaults and retain draft text on failed persistence. Add details in Tasks navigates to the full creation form with the unsaved title; cancelling creates nothing and keeps the quick draft, while a successful save creates exactly one shared record and clears it. Keyboard focus, narrow/light/dark/200% zoom and accessibility remain usable. |
