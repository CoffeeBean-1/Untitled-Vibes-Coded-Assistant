# Slim task entry validation - October 27, 2026

Owner scope: replace the cumbersome dashboard Add Task form with slim quick entry; retain advanced task creation in Tasks. Acceptance: AT-UI-07, relevant AT-TASK-01, AT-UI-03/05 and keyboard/accessibility checks. This is an M2.1 usability refinement, not a new task schema or M2.2 completion.

Implemented:

- Title-only row with Add button and Enter support; header plus focuses the input. Basic defaults are To do, Normal priority, no deadline/reminder. Successful adds clear/refocus the field and show Active tasks; failed writes preserve the draft and saved state.
- Add details in Tasks navigates to the full task view and opens its existing New task form with the title. Opening/cancelling does not create a record. Returning to Dashboard after cancel preserves the original quick title in memory for the running app session; successful advanced creation clears it. A page reload is not a promise of unsaved-draft persistence.
- Tasks > New task retains dates, priority/status, reminders, description, project/list, tags and links. Both paths use the same existing domain create command. The shared dialog now focuses opt-in task title fields after showModal, fixing focus that previously occurred before the modal became active. Other dialogs retain their existing focus behavior.
- No dependency, storage/schema, calendar, reminder-engine or branding change. No restart of the user's ICS reader and no access to private calendar data.

Verification with the existing portable Node 24.22.1/npm 11.19.1 and installed Chrome:

- npm.cmd run build: PASS, including tsc --noEmit.
- npm.cmd run lint: PASS.
- npm.cmd test -- src/app/App.test.tsx: 3 component tests PASS, including a failed write that preserves the draft.
- npm.cmd run test:e2e -- --grep-invert '1,000-task baseline': 25 functional scenarios PASS. Two new scenarios cover minimal controls/Enter/defaults, draft handoff/cancel/one committed record/reload, entry height below 120px, both themes, widths 768/390/320, 200% zoom and zero Axe violations. Existing task/reminder/backup/calendar/brand flows pass using the advanced form where needed.
- Reviewed artifacts/quick-task-desktop-light.png and artifacts/quick-task-mobile-dark.png. The input and Add button remain on one line; the full dashboard form and zone text are gone. Other widget layouts remain intact.

The most recent full 71-test domain/component suite remains evidence from the previous reminder increment; it was not rerun for this UI-only change. The unrelated 1,000-task timing benchmark was deliberately excluded, and no improvement to its open feedback budget is claimed. Vite's existing >500 kB chunk warning remains (current bundle approximately 595.65 kB / 174.55 kB gzip). No warning threshold or performance target changed. Owner-timed AT-UX-01 remains NOT RUN. No Git repository exists, so git diff --check is unavailable; saved files use guarded hash verification and source diff review.

All browser data is isolated synthetic content at port 4173. No production meeting or checkout is opened. Refresh the running app to use the slim task entry; no site-data clearing is required.
