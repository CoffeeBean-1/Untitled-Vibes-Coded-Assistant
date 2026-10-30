# Aster Hall and foreground reminders - October 27, 2026

Implemented scope: M4 foreground reminder domain and M5.3 external Aster Hall checkout/manual pickup companion. No ordering API, iframe, payment flow, browser/OS notification adapter, closed-app scheduler or desktop installation is added. M3 layout and the remaining M5 clocks/appearance are still later work.

## Product behavior

- Aster Hall has a dashboard widget and full navigation tab. Open ordering targets the owner-approved https://asterhall.order.online/ in an isolated new tab; the restaurant site is a fallback. The provider owns menus, prices, availability, hours and estimates. CAi does not scrape, load an iframe, infer an order from a click or report verified readiness.
- Pickup checks are independent manual records with a label, chosen time and optional private HTTPS tracking link. Their delivered message is Check pickup: <label>. Mark checked cancels pending reminders. Tracking links are never fetched by CAi and are removed from portable backups; local recovery snapshots retain local data within the existing boundary.
- Tasks accept multiple reminder records. Quick creation offers 5/15/30/60 minutes; task editing and the Reminders tab support chosen local times and saved-deadline-relative schedules. Date-only reminders explicitly show their selected time (initially 09:00) and use the task zone. Timed deadlines use elapsed minutes before their instant.
- Chosen-time reminders stay independent of deadline changes. Relative reminders recalculate with the saved deadline and receive a new schedule revision; removing the deadline cancels those reminders. Completion/archive/trash cancels all pending task schedules atomically. Reopen/restore does not silently reactivate them.
- Snooze uses the same reminder identity with a new revision. The quick action is 15 minutes; Change time supports a chosen time. Snoozing converts the reminder to an independent chosen time. Imported rules remain off, with explicit future-time review/activation. History snapshots preserve intended time, recorded-in-CAi time, schedule revision, target title and acknowledgement time independently of later edits.
- Quiet hours have an explicit IANA zone and same-day/overnight interval. They preserve intended times, defer alerts and summarize deferred/missed reminders once. Priority never overrides quiet hours. Private previews are on by default and hide target names in dashboard alerts; full Reminders details remain available on deliberate navigation.
- A single foreground coordinator is elected through an IndexedDB lease. Claim/renew/send-time domain reconciliation share one transaction. The lease expires after 10 seconds, renews when fewer than 6 seconds remain and releases on visibility loss/unmount where observable. Other visible windows read committed state; BroadcastChannel carries only a change signal. A stale/frozen owner cannot retain an expired lease. No exactly-once OS-display claim is made.

Time arithmetic uses the already-installed Temporal polyfill. Custom local times use compatible disambiguation (spring gap forward, earlier overlap); a quiet-hours end uses the later overlap so it does not finish early. The quiet interval is compared using actual instants, including the period between repeated end times, so the first occurrence cannot release alerts early. These choices follow the [Temporal ZonedDateTime API](https://tc39.es/proposal-temporal/docs/zoneddatetime.html) and are tested with Chicago transitions. Domain/storage code uses [IndexedDB read-write transactions](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB), without network calls inside a transaction.

## Data compatibility

Workspace schema and IndexedDB version are now 3. The database name remains cai-synthetic-v1, preserving existing origin data. Version-one/two workspaces are upgraded through validated parsing, with the untouched pre-upgrade record saved to recovery in the same transaction. Unsupported/corrupt data is not reset. Existing IDs, due times, theme/density/satire preferences and schedules remain intact; old explicit schedules become absolute rules.

Portable export is version 2 and includes pickup labels, reminder rules/zones and reminder settings. It excludes tracking URLs, calendar data, authorization/permission state and notification history. Version-one backups remain readable, and their canonical fingerprint bytes are preserved so old committed imports are still recognized. Foreign task/pickup/reminder IDs are consistently mapped; repeated bundles are no-ops. Imported reminders stay disabled. Replacing/restoring state and cancelling related reminders remains atomic; safety snapshot failure aborts the restore. Undo preserves independent reminder edits by comparing saved schedule revisions.

## Executed verification

Existing portable Node 24.22.1 / npm 11.19.1, installed Chrome, isolated synthetic data at 127.0.0.1:4173:

- npm.cmd run typecheck: PASS during implementation; final npm.cmd run build repeats tsc --noEmit and passes.
- npm.cmd run lint: PASS.
- npm.cmd test: 71 tests PASS across 12 files (existing 52 plus 19 new reminder/storage tests).
- npm.cmd run build: PASS. Final JS bundle approximately 594.21 kB / 174.13 kB gzip. Vite reports its 500 kB chunk warning, primarily after bringing the existing Temporal polyfill into browser scheduling. No warning threshold was raised, dependency added or security setting changed. Bundle splitting/startup profiling remains a performance follow-up.
- npm.cmd run test:e2e: all 24 Chrome scenarios PASS, including six new food/reminder scenarios and existing task/calendar/backup/brand regressions.
- The new browser scenarios exercise intercepted checkout/opener isolation, pickup persistence/private preview/snooze/check cancellation, multiple task reminders/relative deadline edits/completion, quiet hours/acknowledgement, return after all tabs close, actual two-window state sharing/lease handover, light/dark layouts, widths 1280/768/390/320 and 200% zoom.
- Axe scans of the new views pass with zero violations. Initial label mismatches were corrected; final mobile screenshots were inspected after fixing cramped row actions. Reviewed artifacts/aster-hall-light.png, artifacts/aster-hall-mobile-dark.png, artifacts/reminders-mobile-dark.png and dashboard-1440-light.png.
- Repository tests cover lease expiry, owner-checked release, no workspace revision churn from heartbeats, simultaneous completion/reconciliation, abort after a proposed write, lost-ack retry and actual v2 database migration with its original recovery snapshot.
- Latest one-view 1,000-task baseline: 50 measured samples after 5 warmups, search P95 111.4 ms, committed completion P95 147.3 ms. Earlier runs in this increment measured approximately 28.7-30.8 ms search and 75.4-85 ms committed completion. Results vary; the final committed-feedback result exceeds the proposed 100 ms budget, so performance acceptance remains open. The functional performance scenario passes its bounded-list/correctness checks; it does not enforce the timing target. See artifacts/m2-performance.json. This does not close the separate four-widget/startup/memory/owner-usability acceptance.

No owner calendar, ICS URL, invitation, email, real tracking link or production checkout was accessed. The running development reader was not restarted. Checkout tests substitute local fixture HTML; no live order, sign-in, cart or payment is performed. Source logos remain unchanged. No Git repository is present, so git diff --check is unavailable; guarded synchronization verifies saved-file hashes.

## Acceptance and runtime limits

| Coverage | Result |
| --- | --- |
| AT-FOOD-01/02/03 | External target/navigation, manual semantics, private tracking export and provider-owned availability covered. Live checkout and store status not exercised. |
| AT-REM-01/02/03/04/07 | Persistent/revision/quiet-hours/multiple/window/privacy paths covered. Widget removal awaits M3; actual OS suspend is not claimed. |
| AT-REM-05 | In-app capability is truthful; no permission request. Browser/native delivery remains unsupported. Denied permission is not exercised for an absent transport. |
| AT-REM-06 | Visible app, reload, all-tabs-closed/return and two-window handover tested. Actual hidden-tab throttling, device sleep, exited browser/process, OS restart and reminder-specific offline lifecycle still require target-device testing. |
| AT-REM-08 | Intended/recorded/acknowledged times are separate. In-app recorded means persisted to history, not seen by the user. Push acceptance/display/retry expiry are not applicable to this transport. |
| AT-DATA-08 / AT-TASK-04 | Compound cancellation/rescheduling, aborted write, retry, stale revision and undo behavior covered. Recurrence/successor behavior awaits M2.3. |

Keep a CAi window visible for timely in-app reminders. Hidden/closed/frozen windows cannot promise scheduled delivery; on return, schedules more than 60 seconds late are summarized instead of replayed as individual alerts. No native/browser permission or push-service promise is introduced. M4 foreground implementation is delivered; broad platform/release acceptance remains open. The next major UI package is M3 movable/resizable widgets, with remaining M5 clocks/appearance and M2.1 owner/performance follow-up still available.
