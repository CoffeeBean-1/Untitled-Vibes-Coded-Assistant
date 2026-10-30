# Separate meeting buttons validation - October 28, 2026

Scope: owner-requested separation of the dashboard phone/video buttons (AT-UI-04 and relevant CAL/keyboard/accessibility checks). Each icon now has its own native button, one icon, hover state, accessible name and keyboard stop. A labelled event group keeps the relationship clear. Targets are 36px on desktop and 44px on narrow screens.

Both controls preserve the invitation's approved provider link and any destination chooser. Audio/camera choices remain in the meeting app; no phone dial-in extraction, call-mode parameter, SDK, camera/microphone access or mode-enforcement claim is added. Titles explain the provider join-screen behavior. Sample audio/video actions are intercepted; unsupported live links show neither control. Full Calendar's existing Join/Outlook actions are unchanged.

Executed with existing portable Node 24.22.1/npm 11.19.1 and installed Chrome:

- npm.cmd run build: PASS, including tsc --noEmit.
- npm.cmd run lint: PASS.
- npm.cmd test -- src/features/calendar/MeetingActions.test.tsx src/app/App.test.tsx: 6 tests PASS. Covers independent actions, exact approved URL/passcode preservation, opener isolation, sample interception, unsafe-link rejection and protected-link chooser behavior from either button.
- npm.cmd run test:e2e -- tests/e2e/calendar-density.spec.ts tests/e2e/calendar.spec.ts tests/e2e/calendar-views.spec.ts tests/e2e/dashboard.spec.ts: 12 scenarios PASS. Both buttons launch intercepted fixture pages independently via Enter/Space, Tab moves between them, events without supported links omit them, and event-detail navigation/full Calendar remain intact. Light/dark, 320px/390px layout, target dimensions and zero Axe violations are covered.
- Visually reviewed artifacts/meetings-list-default.png and artifacts/meeting-buttons-mobile-dark.png. Separate controls remain quiet and usable in each row.

No real meeting, private calendar/URL, camera, microphone or production provider page was accessed. Browser tests use synthetic data at 4173 and intercepted external destinations. The running development reader was not restarted. No storage/schema, asset, dependency, account, backend or policy changes. Full unrelated domain/performance/release suites were not rerun; existing performance and bundle-size follow-ups remain open. No Git repository exists, so git diff --check is unavailable. Guarded synchronization verifies saved-file hashes.
