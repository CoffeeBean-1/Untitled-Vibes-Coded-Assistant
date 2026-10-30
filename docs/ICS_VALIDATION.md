# ICS validation — October 27, 2026

Scope: local read-only published Outlook ICS subscription, version 0.3.0, D126-D129. Tests contain synthetic events/URLs only. No actual feed was supplied to the agent, no mailbox API was called and no real meeting was opened. Source/runtime behavior is verified separately from provider compatibility and workplace release acceptance.

Environment: Windows, existing portable Node 24.22.1/npm 11.19.1; installed Google Chrome through Playwright, one worker. Added pinned ical.js 2.2.1, @js-temporal/polyfill 0.5.1, ipaddr.js 2.5.0. `npm.cmd install` completed; audit reported zero vulnerabilities at installation. ICAL source/API and official registry metadata were inspected. Licenses: MPL-2.0 / ISC / MIT; full release dependency review remains later.

## Executed commands

From the project folder, with the existing portable Node directory prepended to PATH for the process only:

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd test
npm.cmd run build
npm.cmd run test:e2e
```

Final results: typecheck PASS; lint PASS; 41 unit/component tests PASS across seven files; production build PASS; all 12 Chrome browser scenarios PASS. Build output: JS 386.82 kB / 115.91 kB gzip; CSS 23.27 kB / 5.40 kB gzip. Production build includes the calendar UI; parser/DNS/network code runs on Node, outside the browser bundle. E2E uses preview at 127.0.0.1:4173, while normal dev stays 5173. API integration tests reject an unsupported URL before any network read. Worker smoke test parses synthetic ICS in a genuine isolated Node worker. Network reader tests inject DNS/transport responses rather than fetching a real Outlook URL.

## Coverage

| Acceptance | Evidence and boundary |
| --- | --- |
| AT-ICS-01 | Browser fixture connect/reload clears the masked input and replaces sample data; code inspection confirms no calendar path into task storage/export. Actual feed remains unrun. |
| AT-ICS-02 | Unit tests: RRULE/RDATE/EXDATE, moved/cancelled exceptions, latest revision deduplication, IANA DST, embedded VTIMEZONE, floating time, exclusive all-day bounds, unsupported zones, expansion cap and worker smoke. This is not every possible ICS extension. |
| AT-ICS-03 | Unit tests: URL credentials/ports/lookalikes, private/mapped DNS, public destination pin handed to transport, blocked redirect, DNS abort, HTML body rejection and cross-site/foreign-host checks. Actual middleware tests verify same-origin cookie/no-store and rejected URL/Origin. TLS byte/timeout/redirect/worker limits also inspected in source; no real provider/TLS endpoint was exercised. |
| AT-ICS-04 | Unit tests: stale data on failure, Retry-After suppression, valid 304 reuse, unsolicited 304 rejection, midnight unconditional request. Browser stale warning verified. Polling/coalescing are inspected; no long-duration soak or live provider throttle test. |
| AT-ICS-05 | Unit tests: separate sessions, expiry and late abort-ignoring response after disconnect. Browser reload/disconnect and real middleware cookie state verified. Replacement uses the same generation guard; process-memory restart clearing inspected rather than tested against an actual feed. |
| AT-ICS-06 | URL unit tests reject executable schemes/lookalikes/credentials, preserve passcodes and Safe Links, deduplicate extracted candidates; normalized payload excludes descriptions/attendee emails. Browser explicit Join opens an intercepted synthetic destination with passcode preserved. No production launch. |
| AT-ICS-07 | Ongoing/all-day selection, tentative state, stale/error/disconnected flow tested. Existing accessibility/responsive/keyboard suite remains; new live-fixture accessibility scan and light/dark/390px screenshots. Conflict/missing-link/chooser/loading/incomplete presentation inspected; those individual browser branches are not all independently automated. |
| AT-ICS-08 | NOT RUN: owner enters the actual link in the local app and compares with Outlook. Includes feed freshness, real publication format/detail, organizational availability and actual join destinations. |

Graph-specific calendarView pagination/authentication/consent tests remain NOT RUN/not applicable to the selected ICS transport. Full calendar milestone, WCAG conformance, long-duration resource/performance testing and work-ready release are not claimed. Calendar cache is not durable and is never part of task backups. Optional calendar email filters declined only where attendee responses exist.

## Visual and correction evidence

Synthetic captures: artifacts/calendar-light.png, calendar-dark.png, calendar-mobile.png. Screenshots were visually reviewed. Reader warnings, location, Join, timestamp and agenda align with card spacing in both themes/mobile. A broad new accessibility scan found the pre-existing brand-link aria-label omitted its visible tagline; removing that overriding label lets the visible text name the link. No visible branding was changed.

Initial checks caught an inserted non-UTF-8 apostrophe and a hook cleanup lint warning; both were corrected. Initial broad accessibility check failed on the brand-link naming mismatch, then passed after the correction. These failures were not treated as successful runs. No OS execution policy or Geordie/security machinery was modified.

The folder has no Git repository, so git diff --check is unavailable as a repository check. Guarded per-file synchronization checks prior hashes, verifies final bytes and preserves unrelated files. UTF-8/whitespace/conflict-marker and documentation-link checks are recorded with the final results.

## Final read-back

`python %TEMP%\cai-ics-work\validate.py` passed saved-hash comparison for 62 managed files, UTF-8, added-line whitespace/conflict markers, Markdown links/fences, 95 unique acceptance IDs and package/lock consistency. A fresh no-cookie request to the development /api/calendar/status returned HTTP 200, sample/idle, confirming that the local reader is available without connecting any feed. Actual Git status confirms the folder is not a repository; no commit or repository diff check is claimed.

The full regression's one-view 1,000-task sample measured search p95 31.3 ms and committed completion p95 80.4 ms. This run is below the proposed numeric budgets, unlike the earlier sample; it does not resolve the separate four-widget acceptance or establish stable performance across environments. Owner usability measurement remains NOT RUN.

After the full 12-scenario regression, the final private-link explanation and compact-agenda count/empty wording were built and linted successfully; both calendar browser scenarios passed again on that final build. No task/domain/parser behavior changed after the 41-test unit run.
