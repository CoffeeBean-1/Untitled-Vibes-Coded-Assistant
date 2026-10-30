# M2.1 core and copy validation

Date: October 26, 2026. Version: 0.2.0. Profile: local task workspace with sample calendar; no live account connection. User authorized proceeding and requested the product-copy changes and calendar-only Outlook scope.

## Executed checks

Commands ran in the project folder with Node 24.22.1 from the previously verified portable runtime on the process PATH. Dependency pins are unchanged.

```powershell
$env:PATH = '%TEMP%\cai-m1-work\node-v24.22.1-win-x64;' + $env:PATH
npm.cmd test
npm.cmd run build
npm.cmd run test:e2e
```

Results: 25 unit/component tests passed across six files. TypeScript and production build passed; JS 375.89 kB raw / 112.80 kB gzip, CSS 21.63 kB / 5.07 kB gzip. Ten Chrome browser scenarios passed in the final complete run (44.1 seconds). An ambiguous storage-status text selector failed in the first run and was corrected to target the actual header status; it was not hidden or skipped. No application dependency was added. A OneDrive source-file replacement temporarily failed; original/staged snapshots and hashes guarded the retry, with read-back after completion. Source/header/copy encoding remained UTF-8.

Final standalone typecheck, lint, source/doc consistency and saved-file read-back are recorded after the final documentation sync. Git diff --check is unavailable because the folder has no Git repository; no Git history or remote was created.

## Feature evidence

| Scope | Evidence and result |
| --- | --- |
| Shared Tasks/dashboard CRUD and views | PASS: browser task creation with description/project/tags/start/due, local description search, shared dashboard record and reload; pure view tests exercise Inbox/Waiting/Today/status/priority conditions. |
| Date semantics and validation | PASS: existing date-only/timed urgency tests retained; contradictory start/deadline and unsafe reference scheme rejected. Time precision can be selected in task details. Broader timezone/DST recurrence is not delivered. |
| Archive/trash/restore/undo | PASS: browser and domain tests preserve content, remove inactive records from active views, undo archive, restore trash, cancel pending reminders and avoid restoring expired/shown alerts. |
| Schema migration | PASS: actual IndexedDB version-one fixture upgrades to database/workspace v2; edited title/revision/preferences survive; a safety snapshot is available. Unsupported schema stays untouched. |
| Portable backup | PASS: strict JSON/version/size/duplicate/dangling/authorization-field rejection; structured meeting/tracking links excluded; descriptions optional; text acknowledgement required in UI. Free text is not claimed to be scrubbed. |
| Restore and recovery | PASS: namespace/task/reminder remapping, explicit same-source conflict handling, repeated-import identity check, disabled imported reminders, snapshot-before-replace and recovery of the pre-replacement workspace. Injected snapshot quota failure aborts restoration; stale preview revision is rejected. |
| Copy and brand | PASS: direct Tasks/Reminders/Add task labels; no repetitive demo/little phrasing in main UI; ordinary sample names; contextual Sample calendar label; truthful preview action; optional satire toggle persists. Exact CAi identity/tagline retained. |
| Keyboard/accessibility/layout | PASS for tested paths: dialog Escape/focus restoration, input errors, dashboard light/dark and Settings automated axe scans, full Tasks axe scan, responsive/zoom captures. This is supporting evidence, not full manual screen-reader/WCAG certification. |
| Outlook | NOT CONFIGURED: no client/tenant ID supplied, no registration created, no auth adapter enabled, no real event accessed. Settings and OUTLOOK_SETUP explain calendar-only read access, no emails. |

Applicable acceptance evidence supports AT-TASK-01 through AT-TASK-04, AT-TASK-12, AT-DATA-01 through AT-DATA-04, AT-DATA-07 and scoped AT-DATA-08, plus regression of M1's boot/preview/brand cases. Task/view removal, layout/recurrence/series round-trips and backend/offline ownership cases remain unimplemented/not applicable to the current core; do not mark the broad future cases complete. Owner-timed AT-UX-01 is NOT RUN. M2.1 remains IN PROGRESS for verification follow-up rather than a work-ready milestone claim.

## Performance baseline

The one-view fixture contains 1000 tasks with 50-row pagination, five warm-ups and 50 measured samples. Dashboard lists are bounded at six. Final observed search p95: **72.8 ms**. Committed completion p95: **169.2 ms**, including browser automation and waiting for persistence. Search is below the proposed 200 ms budget; this combined completion metric is above the proposed 100 ms feedback target. It is not a separate input-to-paint measurement, and does not certify that target. No threshold was changed. Profile input/render/IndexedDB costs separately before release. This is not the later four-widget benchmark; memory/CPU/native reveal and owner usability remain unmeasured. Details: ignored artifacts/m2-performance.json.

## Visual review and limits

Reviewed desktop dashboard and 390px full Tasks captures. Current captures are ignored artifacts/dashboard-1440-light.png, dashboard-1024-light.png, dashboard-390-light.png, dashboard-390-dark.png, dashboard-1440-dark.png, dashboard-200-percent.png and tasks-390-light.png. They contain test fixtures only. The long-title screenshot intentionally uses a testing string; newly seeded product records use ordinary titles.

Current limits: one most-recent task undo action, no permanent delete, labels rather than independently managed project/tag entities, 100 retained command receipts/history entries, no snapshot pruning, explicit-time foreground reminders, and no Outlook sign-in yet. Backup fields match only implemented core types; future unsupported records are rejected rather than dropped. Recovery snapshots stay in browser storage and are not a substitute for portable backups. Full time-zone edge coverage, advanced views/boards, recurrence, configurable layout, closed-app delivery and release operations remain later work.

## Final checks and read-back

PASS: standalone `npm.cmd run lint` and `npm.cmd run typecheck` exited 0 after the final source/test changes. Guarded read-back verified all 50 managed source/handoff files against recorded SHA-256 values; package/lock versions match 0.2.0, dependency pins match, integration gates remain unresolved, and the final whitespace/conflict/known-encoding scan passed. Local http://127.0.0.1:5173 and the updated WorkspaceApp module both returned HTTP 200. A final documentation-only sync read back the validation note and master-plan status. No application code changed after the complete ten-scenario browser run.
