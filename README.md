# CAi · Cursed Assistant-inator

Version 0.3.0 includes the read-only Outlook ICS connection and dedicated Calendar/Reminders views. Run `Start-CAi.cmd` and open **http://127.0.0.1:5173/**. Refresh an already-open page. Existing task data is preserved.

## Connect your calendar

Open **Settings → Outlook calendar**, paste your published ICS subscription link, and select **Connect calendar**. Paste it in the local app rather than chat. No client ID, Microsoft sign-in, email access, or calendar writes are involved. See [Outlook setup](docs/OUTLOOK_SETUP.md).

The dashboard shows separate **Today** and **Tomorrow** groups (three preview rows per day, with a more link): name, local day/time, relative minutes below an hour and then hours/days, with small phone/video join icons. Click a row for that meeting’s details. When today is clear, it says “No more meetings today,” with an optional brand quip. The icon pair opens the provider join screen; audio/camera choices stay in the meeting app. Open **Calendar** for a day-grouped agenda, ranges/search and meeting details. **Reminders** has its own scheduled/history view; every dashboard widget links to its full view. Join opens an available approved meeting link only when clicked; a missing link offers Open Outlook. Published updates may lag behind Outlook. CAi refreshes about every two minutes while visible and on return to the app; manual refresh is available.

The private link and calendar are kept in local process/browser memory, separate from tasks, backups and logs. Reload retains the connection while the reader runs. Restarting CAi or eight hours without requests requires pasting the link again. Disconnect clears calendar state. The link grants access to the details Outlook publishes; unpublish it in Outlook to revoke the feed itself.

## What changed

Use **Tasks** for Today, Upcoming, Overdue, Inbox, Waiting, All tasks, Completed, Archive and Trash. Search titles/descriptions/projects/tags, filter status/priority, add detailed tasks, and archive/trash/restore or undo the last task edit/lifecycle action. Full lists show 50 tasks per page; the dashboard summarizes six tasks.

**Settings → Backup and recovery** downloads a reviewed JSON backup or previews a restore. Choose merge/replace and conflict handling. Meeting/tracking links in structured fields are excluded; descriptions can be omitted. Titles, generic links and text can still contain private information, so review before export. Imported reminders stay off. Every upgrade/restore keeps a local recovery snapshot; snapshots can be recovered in Settings. A failure to save the safety snapshot aborts the restore. Both import and export enforce a 5 MiB limit.

Choose **Settings → Appearance → Display density** for Compact, Default or Comfortable spacing across views. The preference saves locally and is included in task/preference backups; text size stays unchanged.

The supplied v1.5 identity with the v1.6 corrected transparent mark is applied to navigation/About and local favicon assets. About shows the new two-line tagline when satirical copy is enabled; privacy text stays separate and factual.

## Run and verify

Use an approved Node 24.x runtime (24.15+), `npm.cmd ci`, then `npm.cmd run dev`. The launcher uses Node on PATH or the existing portable runtime under `%LOCALAPPDATA%\Temp\cai-m1-work\node-v24.22.1-win-x64`; cleanup can remove that temporary runtime. No global install or execution-policy change is needed. Keep the server bound to 127.0.0.1.

Checks: `npm.cmd run typecheck`, `npm.cmd run lint`, `npm.cmd test`, `npm.cmd run build`, then `npm.cmd run test:e2e`. Browser checks use installed Chrome and synthetic data. The ICS reader is part of Vite dev/preview; serving `dist/` alone does not provide connectivity. This is a local single-user tool, not a deployed backend.

Reminders require the app to remain open. Multiple chosen-time/deadline-relative reminders, snooze, quiet hours and private previews are now available. Movable widgets, advanced task views and desktop shortcuts remain later work. Development port 5173 and preview port 4173 have separate task storage and calendar sessions. Do not clear site data as a repair step.

Current status: [STATUS](docs/STATUS.md). Evidence: [day/brand validation](docs/TODAY_BRAND_VALIDATION.md), [list/density validation](docs/LIST_DENSITY_VALIDATION.md), [widget/view validation](docs/WIDGET_VIEWS_VALIDATION.md), [ICS validation](docs/ICS_VALIDATION.md), [task validation](docs/M2_VALIDATION.md), [bootstrap validation](docs/M1_VALIDATION.md). The owner reports a successful ICS connection. The agent has not read or captured the actual calendar; UI tests use synthetic fixtures.

## Aster Hall and reminders

Open **Aster Hall** from its dashboard widget or navigation tab. **Open ordering** opens https://asterhall.order.online/ in a new tab. After placing an order there, choose a time for **Check pickup**, optionally save its private tracking link, and mark it checked when finished. CAi does not receive order/ready status.

In **Reminders**, choose **New reminder** and an active task, or open a task editor's Reminders section. Add multiple reminders, use a chosen local time or the saved deadline, snooze 15 minutes/change time, cancel and review history. Deadline-relative reminders move with saved deadline changes; chosen-time reminders stay fixed. Complete/archive/trash cancels pending task reminders. **Settings > Reminders** controls quiet hours and private dashboard previews.

Keep a CAi window visible for timely in-app reminders. Returning after tabs close summarizes missed reminders; browser/desktop notifications are not enabled. The upgrade preserves tasks/preferences/schedules and creates a local recovery snapshot. Backups include pickup labels and reminder rules but omit tracking URLs; imported rules stay off for review. Do not clear site data. Verification and remaining runtime limits: [REMINDERS_FOOD_VALIDATION](docs/REMINDERS_FOOD_VALIDATION.md).
