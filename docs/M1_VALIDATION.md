# M0/M1 validation and handoff

Date: October 26, 2026. Scope: local synthetic prototype only. Owner authorized development after the v1.4 review. No live workplace/provider approval is asserted.

## Environment and setup

Observed Windows x64; PowerShell; no Node/npm on the original PATH; no Git repository, manifest, existing application or tests at preflight. Downloaded portable Node v24.22.1 from nodejs.org, verified its archive SHA-256 against the official versioned SHASUMS256.txt, and extracted it under `%LOCALAPPDATA%\Temp\cai-m1-work`. Used npm 11.19.1 with process-local PATH only. Installed dependencies into this project with npm.cmd install; package-lock.json was generated and retained. No global install or browser install. Playwright uses installed Chrome through `channel: chrome`, one worker. Initial parallel Chrome startup attempts exited; sequential browser execution completed successfully. No system security settings were changed.

Versions: React/React DOM 19.3.1; Vite 8.3.5; TypeScript 6.0.3; Vitest 5.0.5; Playwright 1.64.1; idb 8.0.4; Zod 4.6.7; Lucide React 1.61.0. Package manifest and lockfile are authoritative for the complete installed set.

## Executed commands and results

Commands ran in the project folder with the portable runtime prepended to the current process PATH:

```powershell
$env:PATH = '%TEMP%\cai-m1-work\node-v24.22.1-win-x64;' + $env:PATH
npm.cmd install
npm.cmd run typecheck
npm.cmd run lint
npm.cmd test
npm.cmd run build
npm.cmd run test:e2e
```

| Check | Actual result |
| --- | --- |
| Fresh npm install | PASS; 240 packages added, 241 audited; zero known vulnerabilities reported at install time. A point-in-time audit is not a guarantee. |
| Typecheck | PASS through standalone script and build's tsc --noEmit. |
| Lint | PASS; real ESLint/TypeScript/hook checks. |
| Unit/component tests | PASS; 14 tests across three files. |
| Production build | PASS; JS 347.08 kB uncompressed / 105.77 kB gzip; CSS 17.45 kB / 4.34 kB gzip. JS is about 103.3 KiB gzip, below proposed 500 KiB. |
| Chrome E2E | PASS; six scenarios, final run 12.5 seconds. Runs on production preview, not Vite dev injection. |
| Dev launch | PASS through Start-CAi.cmd; Vite served 127.0.0.1:5173. Page and transformed /src/app/App.tsx returned HTTP 200. |
| Git diff --check | NOT RUN: no Git repository exists. Source whitespace/conflict checks are recorded below after final read-back. No Git history or remote created. |

Earlier failures were corrected: a test helper's unsupported exact option; an encoding conversion in a temporary edit helper; duplicate retry controls; exact-label selectors for native selects; immediate checked-state assertions on controls that wait for persistence. Final tests assert committed state, not a successful-looking optimistic change. Initial Chrome startup failure was avoided with sequential execution. There is no remaining failed assertion in the final suite.

## Acceptance evidence

| Acceptance | Result and concrete evidence |
| --- | --- |
| AT-BOOT-01, AT-SEC-01 | PASS for local synthetic scope: planning files retained; real integrations remain unavailable; browser lifecycle scenario recorded zero requests outside the local preview origin and no new page from simulated Join. No employer approval inferred. |
| AT-BOOT-02 | PASS: actual install/type/lint/unit/build/E2E commands, exact dependency lock, synthetic-only fixtures. The security review is scoped to this prototype, not release certification. |
| AT-BOOT-03, AT-BOOT-05 | PASS: create/date/priority, reload, observe persisted reminder, complete, reload and verify completed state; edit path separately verified. Domain/storage tests cover cancellation and draft preservation on failed writes. |
| AT-BOOT-04 | PASS: deferred loading and write failure component tests; Chrome storage-opening failure, empty tasks, offline indicator/local editing and persistent demo label. Storage is not reset after schema or transaction failure. |
| AT-CAL-01 | PASS: Join only returns a visible simulation; no provider URL exists in the demo adapter and no external request/page was observed. |
| AT-BRAND-01 | PASS: exact identity, CAi wordmark and tagline; About heading verified by browser test; favicon/wordmark inspected in synthetic captures. |
| AT-BRAND-02, AT-BRAND-03, AT-BRAND-04 | PASS for delivered surfaces: persisted joke toggle removes optional About satire; functional labels/privacy disclosures remain. Source and observed network behavior contain no AI/advertising/telemetry integration. |
| AT-BRAND-05 | PASS for M1 surfaces: long task content, responsive/dark/light captures, keyboard editor/focus paths and automated accessibility checks. New future surfaces require their own regression. |
| AT-A11Y-01 through AT-A11Y-04 | Partial supporting evidence only: keyboard editing/Escape/focus, viewport/zoom, reduced-motion setting and automated scans passed for tested views. No manual screen-reader session or full WCAG conformance audit; do not mark these broad release cases complete. |
| AT-PERF-01 | Supporting measurement only: bundle gzip size reported above. No warm native reveal/CPU/memory/1,000-task interaction or owner usability benchmark was run. |

Unit/domain evidence additionally covers date-only vs timed semantics, priority independence, missed-reminder summaries, invalid title/date/reminder validation, stale edit rejection, corrupted future-schema preservation and transactional duplicate-delivery protection using two repository connections. These support later acceptance without completing M2/M4.

## Browser and visual evidence

Six Playwright scenarios: lifecycle/preferences/no external requests; edit and pending-reminder cancellation; empty/offline/escaped input; storage failure; keyboard/light-dark automated accessibility; responsive/zoom captures. Axe reported no violations for its selected WCAG A/AA tags on dashboard light/dark and dark settings. This does not replace manual screen-reader evaluation.

Synthetic images, ignored by Git: artifacts/dashboard-1440-light.png, dashboard-1024-light.png, dashboard-390-light.png, dashboard-390-dark.png, dashboard-1440-dark.png and dashboard-200-percent.png. Desktop light and phone dark captures were directly inspected for layout, long titles, hierarchy, brand case, readable surfaces and available actions. Phone order is next meeting, tasks, reminders, optional tagline. 200% was browser CSS zoom in Chrome; actual OS display-scale and browser-menu zoom were not separately tested. No live work data appears in these captures.

## Limits and next step

M1 is a synthetic prototype. It has no live calendar, Toast launcher, global shortcut, customizable widget grid, full Tasks view, recurrence, backup/restore, native notification or server. Dates entered through M1 are date-only. Reminders are explicitly scheduled absolute times; due-date changes do not move them. The prototype retains 100 history entries and 100 recent command IDs; it does not claim durable exactly-once delivery beyond that retry window. Only the newest five history entries are displayed. Production-sized migrations, backup recovery, multi-device delivery, manual screen-reader checks, supported-browser matrix and release operations remain untested.

The `.cmd` launcher was used because PowerShell script execution is disabled; no execution-policy bypass was attempted. Browser UI connector opening was unavailable, so delivery is the working local URL and screenshots. Browser behavior was tested with Playwright against the production preview. Review M1, then select M2.1 for core task/lifecycle/recovery work before M4.

## Final source and handoff read-back

PASS: temporary `finish_validation.py` verified every managed application/handoff file against its recorded SHA-256; no trailing whitespace, conflict markers or known encoding corruption; package.json dependencies match the lockfile root; required real scripts are present; 87 unique acceptance IDs; all integration gates remain unresolved; production source scan contains no fetch/XMLHttpRequest, arbitrary window opener, unsafe HTML renderer, localStorage or VITE secret-variable use. This scan is supporting evidence, not proof that a release contains no possible security defects. The final two documentation updates were read back byte-for-byte after saving.
