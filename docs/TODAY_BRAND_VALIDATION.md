# Today/Tomorrow and brand v1.5 validation — October 27, 2026

Scope: D137-D140, AT-UI-06 and applicable AT-BRAND-01 through 23, with existing task/calendar/density regressions. Current source remains in Cursed Assistant-inator; sibling Cursed Assistant-inator ha contains the owner's brand materials only. No private ICS link, actual event, user storage, live session or production meeting was read or captured. No backend/API/config/dependency/storage change or reader restart was needed.

## Brand source verification

Source package: sibling branding/digital-assistant-codex-handoff-v1.5. Its original validator returned one inventory failure because str(relative_path) produces backslashes on Windows while the manifest uses slashes. A temporary copy normalized that comparison to as_posix and pointed ROOT at the unchanged source package: 602 checks PASS, 47 assets. No source-pack file or logo was modified. Selected runtime assets are separately matched against supplied asset inventory and v1.4 logo-lock hashes. Generated runtime identity/copy is checked against canonical JSON. Source boards/previews/share cards/unused composites stay outside runtime deployment.

## Application commands

With existing Node 24.22.1/npm 11.19.1 and installed Chrome, one Playwright worker:

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd test
npm.cmd run build
npm.cmd run test:e2e
```

Results: typecheck PASS, lint PASS, all 52 unit/component tests PASS in ten files, production build PASS, all 18 Chrome browser scenarios PASS. The Today/Tomorrow and brand scenarios also passed a focused rerun with explicit overflow-selection coverage. Final build JS 401.70 kB / 120.45 kB gzip; CSS 32.80 kB / 7.04 kB gzip. Pure additions cover local day grouping, ended/all-day/later exclusion, ongoing overnight inclusion, DST/year boundaries and empty groups; brand light/dark paths, tagline-off behavior and local-subpath URL validation. New browser cases cover Today/Tomorrow labels/empty copy/satire off/local-day rollover/incomplete suppression, canonical title, image loading, equal tagline typography, real privacy adjacency, light/dark, 320/375/768/1280 widths, forced colors, 200% zoom and no external resource requests. Existing source/launch/backup/task/density checks remain in the suite.

Initial existing browser selectors matched both a row and its join control after day text moved into section headings. They were made specific to the row's accessible name; no application behavior was bypassed. Failure results are not counted as passing tests.

## Coverage boundaries

AT-BRAND-01/02/06/07/09/11/12/15 through 23 are covered by package/hash/source checks plus relevant browser/component cases; this is not full WCAG or every subcase certification. The selected artwork is a supplied small raster plus traced wordmark, not a new all-vector master. No redraw/recolor/retrace/animation. Source hashes and actual small UI rendering were inspected.

AT-BRAND-08: configured root deployment asset loads are browser-tested; local subpath URL construction is unit-tested, but an actual subpath deployment is NOT RUN. AT-BRAND-10: existing theme/density/satire behavior regressed; custom logo/photo fields are not yet implemented. AT-BRAND-13: no manifest/PWA exists; none was added or identity changed. AT-BRAND-14: root favicon 16/32 assets were loaded and visually inspected separately from installed/native behavior, which is NOT RUN. The full 47-file source lock is validated, while only needed runtime files are deployed. Unused signatures/cards remain unchanged in the source pack rather than copied for the sake of coverage.

The Calendar reader and full agenda window are unchanged. Group previews are capped at three/day with an explicit more link; helper output retains the entire matching day. Per-day overflow is explicitly browser-tested: three Tomorrow rows plus a more link, opening the first hidden event in Calendar. No long-duration calendar stress or target installed-icon refresh claim. Existing release/performance/owner-usability follow-up remains open.

## Final read-back and visuals

`python %TEMP%\cai-today-brand\validate.py` passed 46 managed-file hashes, UTF-8/added-whitespace/conflict/Markdown checks, 119 unique acceptance IDs, the eight deployed asset locks/build copies, canonical generated identity, and retired-copy/source-board build exclusions. Screenshots reviewed: artifacts/today-tomorrow-light.png, brand-about-light.png, brand-about-mobile-dark.png. Source-pack PNG assets at 16/32px were also inspected; installed/native refresh remains unrun. All assets stay local and no source boards/previews entered the build.

The one-view 1,000-task sample reported search p95 44.8 ms and committed completion p95 98.1 ms. This run is under the proposed numeric budgets, unlike some prior samples; it does not establish stable performance, close the owner-timed usability check, or certify the later four-widget scenario. Existing performance follow-up stays open.
