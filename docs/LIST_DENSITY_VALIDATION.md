# Calendar list / density validation — October 27, 2026

Scope: D134-D136, AT-UI-04/05 and relevant CAL/ICS/task/backup/responsive regressions. The dashboard is a four-row timed list; full Calendar retains richer details. Density is an optional workspace preference, not calendar persistence. Agent tests use synthetic feeds/destinations only; no live user URL/events/session or screenshot was read. No backend/API/config/dependency change or reader restart is required.

## Checks

Commands from the project with existing portable Node 24.22.1/npm 11.19.1 and installed Chrome:

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd test
npm.cmd run build
npm.cmd run test:e2e
```

Results: typecheck PASS, lint PASS, 48 unit/component tests PASS in nine files, production build PASS, all 16 Chrome browser scenarios PASS. Final build JS 399.47 kB / 119.66 kB gzip; CSS 30.86 kB / 6.63 kB gzip. Unit additions cover exact minute/hour/day thresholds, in-progress and subminute labels; density compatibility with old workspace/backup records, preference commands, backup/restore and invalid-value rejection. Browser additions check list size/fields/icons, selected-row deep opening, destination/passcode preservation, automatic relative-time update, density persistence, measured row height, unchanged font size, all three densities and light/dark/mobile accessibility.

The shared phone/video pair opens a single provider join action, not separate enforced camera/microphone modes or an invented dial-in route. Zoom's official [joining guidance](https://support.zoom.com/hc/en/article?id=zm_kb&sysparm_article=KB0060732) instructs users to open the meeting link and check audio/video settings before joining. Original approved URLs and Safe Links wrappers remain unchanged. No SDK, device access or undocumented join parameters are added.

Initial new browser checks exposed boundary-clock drift and an immediate check() expectation on an asynchronously persisted controlled radio. The fixture clock is now paused at a known instant for boundary assertions, resumed before the timer-dependent accessibility scanner, and radio clicks wait for the saved preference before asserting the UI. Existing persistence behavior was not bypassed; actual density read-back/row-height changes are required. These initial failed checks are not counted as passes.

Reviewed synthetic captures: artifacts/meetings-list-default.png, meetings-list-mobile.png, calendar-density-compact.png and density-settings-dark.png. The dashboard has quiet title/time/countdown rows, a small icon pair and no prominent URL/button; density controls and compact Calendar spacing are readable. `python %TEMP%\cai-calendar-list\validate.py` passed saved-file hash read-back, UTF-8, added whitespace/conflict markers, Markdown links/fences and 100 unique acceptance IDs. No Git repository exists, so repository git diff --check is unavailable; guarded source writes and UTF-8/added-whitespace/conflict-marker/Markdown checks are used instead. Real-feed validation, Zoom device settings and release-wide accessibility/performance acceptance remain outside this fixture-only UI check.

The one-view 1,000-task sample in this regression reported search p95 99.7 ms and committed completion p95 165.1 ms. Search is below its proposed 200 ms budget; committed completion exceeds the proposed 100 ms target. The benchmark reports this instead of asserting a passing performance gate. This varies from earlier samples and does not establish a cause; retain the existing M2.1 performance follow-up, with no threshold change or full performance claim. Owner-timed usability and four-widget performance remain open.
