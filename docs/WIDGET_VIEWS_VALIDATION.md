# Widget/full-view validation — October 27, 2026

Scope: owner-requested dashboard hierarchy, date-aware next meeting, dedicated Calendar and Reminders tabs. Applicable acceptance: AT-UI-01 through AT-UI-03; relevant AT-CAL-01/03 through 09, AT-ICS-07, AT-BRAND, responsive/keyboard and existing task/reminder regression subcases. No Graph, grid editing, new scheduler, deployment or new integration capability is claimed.

Owner reports their existing ICS connection succeeded. Tests here use synthetic calendars and intercepted meeting destinations on preview port 4173. The agent did not request the user's feed URL, inspect their running session or capture actual meetings. Server/API/config/dependencies/task storage are unchanged; no development reader restart was required.

## Executed checks

On Windows with existing Node 24.22.1/npm 11.19.1, installed Chrome and one Playwright worker:

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd test
npm.cmd run build
npm.cmd run test:e2e
```

Results: typecheck PASS, lint PASS, 45 unit/component tests PASS in eight files, production build PASS, all 14 Chrome browser scenarios PASS. Build JS 397.23 kB / 118.84 kB gzip; CSS 28.67 kB / 6.22 kB gzip. Four new pure presentation tests cover the 1,378-minute regression, urgency boundary, local midnight/DST/year labels, all-day range bounds and search. Two new browser scenarios cover full-view navigation, detail fields/conflicts/missing-link fallback, range filters/search, chooser Escape/focus, existing shared reminder scheduling/history/editor, light/dark accessibility scans and 390px layout. Existing connect/reload/stale/disconnect and task/backup scenarios also pass.

Calendar navigation leaves the count of status requests unchanged, verifying it consumes the mounted root coordinator. User-initiated join uses the existing URL validation in a shared action component; no production meeting opens. Today includes past events earlier that same day; Upcoming excludes ended timed events and retains ongoing all-day spans. All loaded displays only the bounded feed window, not a claim to fetch calendar history. Fifty-event paging is implemented; a 1,000-event calendar stress/performance run is not claimed.

Synthetic screenshots reviewed: artifacts/overview-tomorrow.png, calendar-full-light.png, calendar-full-dark.png and calendar-full-mobile.png. Dashboard is compact, full details are readable beside the day list, narrow navigation scrolls without widening the page, and mobile details stack above the agenda. Existing 1024/1440/390px and 200% zoom dashboard checks pass. Full Calendar at 200% zoom and long-duration testing are not separately certified.

The regression's one-view 1,000-task sample measured search p95 39.4 ms and committed completion p95 80.6 ms. This is not the later four-widget performance acceptance or owner-timed usability evidence. Live feed freshness, actual meeting details/time accuracy and end-to-end production meeting launch were not retested here. No change to the calendar-only/no-email boundary.

The folder is not a Git repository, so repository git diff --check is unavailable. Guarded per-file writes preserve unrelated edits and compare staged/read-back hashes. `python %TEMP%\cai-calendar-ui\validate.py` passed managed-file hash comparison, UTF-8, added-line whitespace/conflict markers, Markdown links/fences and 98 unique acceptance IDs.
