# Design system and dashboard rules

All dimensions and limits below are proposed product defaults. Change deliberately and record consequential changes in `DECISIONS.md`.

## 1. Visual direction

A calm productivity workspace: restrained green accents, neutral surfaces, readable task rows, clear hierarchy, minimal shadows, and generous but not wasteful spacing. Notion is an interaction reference, not a requirement to reproduce its branding. Avoid ornamental analytics charts, giant welcome heroes, excessive gradients, and fake dashboard metrics.
The canonical name is **Cursed Assistant-inator** and the precise wordmark is **CAi** (not CAI or Cai). Use optional darkly satirical big-tech marketing voice in decorative microcopy only. Preserve plain, truthful copy for tasks, meetings, alerts, security/privacy controls, disclosures and accessibility labels. Official tagline: `Productivity is our job. Your data is our passion.` See `BRANDING.md`; no AI functionality is implied.


Use the system font stack initially. Basic typography: 14px body on desktop, 13px secondary metadata only when readable, 16px widget titles, 24px page titles, and 12px minimum for rare nonessential labels. Never shrink all text to fit a smaller widget. Comfortable task rows target 40px; compact rows may target 32px with usable controls. Provide roomier touch interactions in narrow layouts.

Use a 4px spacing scale, 8-12px control/card radii, and subtle separation. Avoid full-screen blur and large layered translucent surfaces. Respect reduced-motion preferences; state transitions should be brief and optional.

## 2. Color tokens

The user-specified primary brand color is fixed at `#115B47`. Neutral starting points are based on VS Code's Light Modern and Dark Modern theme files, not a promise to duplicate every VS Code component. [S14](SOURCES.md#s14), [S15](SOURCES.md#s15).

| Token | Light | Dark |
| --- | --- | --- |
| `--brand-primary` | `#115B47` | `#115B47` |
| `--app-bg` | `#F8F8F8` | `#181818` |
| `--surface` | `#FFFFFF` | `#1F1F1F` |
| `--surface-raised` | `#FFFFFF` | `#252526` |
| `--text-primary` | `#3B3B3B` | `#CCCCCC` |
| `--text-secondary` | `#616161` | `#9D9D9D` |
| `--border-subtle` | `#E5E5E5` | `#2B2B2B` |
| `--control-border` | `#767676` | `#868686` |
| `--button-primary-bg` | `#115B47` | `#115B47` |
| `--button-primary-fg` | `#FFFFFF` | `#FFFFFF` |
| `--link-fg` | `#115B47` | `#67C5A3` |
| `--focus-ring` | `#115B47` | `#67C5A3` |

Subtle separators are decorative, not the only indication of an interactive control. Verify focus rings, control boundaries, disabled states, custom accents, and text contrast in the actual composition. Standard text should meet 4.5:1 contrast and large text 3:1; do not assume a brand-colored label is readable on a dark card. [S17](SOURCES.md#s17).

Use explicit text labels/icons for urgency and priority. Distinguish 'High priority' from 'Overdue'; do not communicate either using color alone. Use reviewed semantic danger/warning/success tokens, not arbitrary per-component hex values. Test selected/hover/active states as well as defaults.

Initial appearance presets: Forest Light and Forest Dark with the required green; neutral variants can be added in M5. Background choices: solid, a small set of restrained gradients, or a processed uploaded raster image. System mode follows OS preference unless the user chooses Light/Dark explicitly.

## 3. Grid geometry

Measure the dashboard's usable content width after navigation and outer padding using its container, not `screen.width`.

| Profile | Usable width | Columns | Gap | Base row |
| --- | --- | --- | --- | --- |
| Wide | >=1200 CSS px | 12 | 16px | 64px |
| Medium | 800-1199 CSS px | 8 | 16px | 64px |
| Narrow | <800 CSS px | 4 | 12px | 64px |

A widget spanning `h` rows has content-box layout height `64*h + gap*(h-1)`, before any deliberately modeled outer border. Keep the grid library's row/margin semantics consistent with this formula through an adapter. Widgets do not choose arbitrary pixel heights on their own.

| Preset | Wide geometry | Available profiles |
| --- | --- | --- |
| Compact | 4 columns x 2 rows | Wide, medium, narrow |
| Standard | 4 x 4 | Wide, medium, narrow |
| Wide | 8 x 4 | Wide, medium |
| Tall | 4 x 8 | Wide, medium, narrow |
| Large | 8 x 8 | Wide, medium |
| Full width short | 12 x 4 | Wide only |
| Full width tall | 12 x 8 | Wide only |

Use descriptive names in UI, not raw grid numbers. A widget registry declares which presets it supports. Resize grips snap only to those presets; an accessible menu offers the same choices. Do not expose a grip for unsupported dimensions.

### Initial placement on the wide grid

Coordinates are zero-based. `x + w <= 12`; rectangles must not overlap.

| Widget | x | y | w | h |
| --- | --- | --- | --- | --- |
| Today Tasks | 0 | 0 | 8 | 8 |
| Next Meeting | 8 | 0 | 4 | 2 |
| World Clocks | 8 | 2 | 4 | 4 |
| Aster Hall | 8 | 6 | 4 | 2 |

Medium and narrow profiles have their own defaults in `planning-defaults.json`. When no saved target-profile layout exists, derive a deterministic stacked layout once, then preserve it independently. On medium, a 12-column preset maps to an appropriate 8-column alternative; on narrow all widgets are four columns wide with a registry-approved height. Preserve widget identity/configuration across profiles.

### Movement and persistence rules

Normal mode never drags/resizes. Edit mode shows handles, size menus, alignment preview, Save, Cancel, Reset, and Undo. Clicking a task while not editing never accidentally drags its widget.

No overlap. During a move, use deterministic downward displacement of unlocked widgets in stable order. Locked widgets never move; invalid drops must preview rejection or choose an explicitly shown valid position. Do not compact or reshuffle the dashboard when data changes. Optional 'Tidy layout' is a separate deliberate action.

Track layout history for at least the last 20 edit operations in the active edit session. Cancel restores the pre-edit layout. Save updates only the active breakpoint profile. Reset asks which profile to reset and never deletes tasks or settings. Validate bounds and duplicates on load; recover invalid placements without erasing other data.

Provide Move earlier/later or directional controls for keyboard users, size menus, and announcements of position changes. Focus must return to the moved widget. At 200% zoom, the layout reflows without obscuring core actions. Narrow-screen order should prioritize Next Meeting, Today Tasks, World Clocks, then Aster Hall unless the user rearranges it.

## 4. Widget content contracts

| Widget | Allowed initial presets | Adaptation |
| --- | --- | --- |
| Next Meeting | Compact, Standard | Compact shows title/time/Join; Standard adds location, state, and a small next-up preview. |
| Agenda | Standard, Wide, Tall, Large | More rows/detail as space grows; never shrink text or show a tiny week grid. |
| Tasks | Compact, Standard, Wide, Tall, Large, Full width | Compact shows count plus 1-3 tasks; Standard is a list; larger sizes add columns. Board is for full view or a deliberately enabled large widget. |
| World Clocks | Compact, Standard, Wide | Compact shows 1-2 digital clocks; Standard shows more rows or a small analog clock; Wide offers comparison rows. |
| Aster Hall | Compact, Standard | Compact provides ordering action; Standard adds shortcuts and clearly manual reminder/tracking information. |
| Reminder summary | Compact, Standard | Counts and actionable list; never a separate scheduler. |

Each widget header contains a title and menu with configure/open full view/size/remove as applicable. A widget can have a bounded internal scroll area, but avoid nested horizontal scrolling. Header and primary actions remain visible. Empty and permission states should provide a meaningful next action, not a fake success card.

## 5. Tasks and quick view

Task rows prioritize checkbox/status, title, due/urgency, and priority. Project/tags are secondary. Prefer inline popovers to modal dialogs for common edits. A side panel holds description, subtasks, recurrence, reminders, and references. Closing the panel preserves focus and list scroll.

Quick View target size is a resizable compact surface, initially about 420px wide and 560px high where supported; clamp to available display bounds. It contains Next Meeting, urgent tasks, and quick entry. It must remain useful at narrow widths and use the same typography and records as full views.

## 6. Personal asset processing

Proposed upload limits: 10 MiB input and 24 megapixels per raster file; reject dimensions/headers indicating a decompression risk before a large decode where feasible. If safe inspection is not possible in a supported browser, use a stricter limit or an approved server processor. Reject animated, corrupt, unsupported, and vector input in the first implementation.

Background output: maximum 2560px on the longest side, preserve aspect ratio, target <=1 MiB encoded, hard cap 2 MiB with an explicit error if not achievable. Preserve reasonable quality rather than silently degrading to unreadability. Decode/re-encode to strip original metadata; test output behavior instead of assuming every encoder discards all metadata.

Logo output: maximum 512px longest side, <=256 KiB, preserve transparency where supported. Generate favicon PNG variants (16/32/48px) from validated assets. PWA/native icon handling is separate. Store image blobs in an asset store and references in preferences; revoke temporary object URLs after use.

Offer fit/fill, focal point, dimming, and reset. Keep widget surfaces opaque by default. An image is not allowed to make UI text unreadable. Do not fetch arbitrary remote background URLs. Surface storage quota failures and let users remove unused assets; never delete tasks to make room for pictures.

## 7. Visual acceptance capture

Capture synthetic-data views at 1440x900, 1024x768, and 390x844, plus 200% zoom and keyboard-only operation. These viewport sizes are test fixtures; grid breakpoints still depend on actual container width. Capture both themes, long task/meeting titles, empty/error states, busy lists, custom-photo contrast, and Edit dashboard mode.

Screenshots must not contain live meeting details, credentials, personal photos, or actual work tasks. Screenshots document appearance; they do not replace behavioral or accessibility testing.

## 8. Interaction validation and staged surfaces

Use the performance sampling protocol in AT-PERF-03 and the owner usability check in AT-UX-01. Measure discoverability and task capture as well as rendering speed. Keep urgency and priority labels distinct in every density preset.

M1 uses a fixed responsive dashboard and minimal About/settings with the brand/joke toggle; dashboard editing arrives in M3. M2.1 adds the shared basic Tasks list; advanced table/board/saved views and the command palette arrive in M2.2. Do not expose unfinished actions as working controls. First-run clock initialization follows planning-defaults.json: Chicago plus detected local zone, deduplicated; other suggested cities are opt-in.

## Dashboard overviews and full feature views

Every feature widget has a matching navigation tab and a direct Open/View control. Dashboard content is a quick summary, with key status and primary action; extended lists, filters and details belong in the full feature view. Current destinations: Tasks, Calendar, Reminders. Apply this rule to clocks/food when implemented, without placeholders for undelivered features.

Next Meeting: quiet Today/Tomorrow/calendar day plus local start time, title, duration/end, location, tentative/conflict badges, and a launch action. A live dot/countdown and stronger action apply only within 15 minutes or during the meeting. No raw hours-long minute count. Calendar's full view provides day-grouped agenda, ranges/search and date/time/zone/attendee/location/link details; all-day dates are preserved. Reminders exposes schedules and history. Shared snapshots/coordinators keep dashboard/full views consistent.

On narrow screens, feature navigation scrolls horizontally without widening the page; Calendar details stack above the agenda and selecting an event brings its details into view. Visible focus, native buttons and selected states remain available. No invitation HTML or new data fields are fetched for presentation.

## Meeting list and density revision (supersedes dashboard card above)

Meetings widget: at most four upcoming timed rows. Meeting name is the primary text, followed by quiet local day/start and relative countdown (minutes below an hour, then whole hours/days). Phone/video icons form one understated provider join control; no oversized launch button, invitation URL, attendee/location/duration/conflict block or live dot in the dashboard. A small provider label is sufficient. Clicking a row opens that meeting in the full Calendar view, which retains details and fuller launch actions. All-day events remain in Calendar.

Appearance density: Compact, Default, Comfortable. Apply spacing consistently to dashboard meeting/task rows, full calendar, task lists and reminder lists. Density changes padding/gaps, not font size. Default calendar rows use 12px vertical padding, Compact 7px, Comfortable 20px; preserve touch/focus affordances. Existing records with no preference render Default. This replaces the prior 15-minute dashboard urgency treatment; it remains a quiet list throughout.

## Today/Tomorrow dashboard revision

Group the Meetings widget into Today and Tomorrow, with quiet date headers, up to three remaining timed rows per day and an explicit overflow link. Keep day headings visible even when empty. All-day events remain in Calendar. Complete-feed Today empty text is No more meetings today.; the single optional secondary quip is Enjoy your time before it becomes availability. Do not combine it with additional dashboard jokes. Failed/incomplete data must not imply a free calendar.

Brand v1.5 replaces the text badge with supplied orbital mark + CAi, no navigation tagline. Light uses the dark symbol badge; dark uses the transparent mark. Keep #115B47 controls and existing neutral themes/density. About uses semantic, equally styled tagline lines and an adjacent actual-privacy section. Satire off removes both tagline lines and optional company/empty copy; the name/logo persist. No new animation or theme store.

## Owner empty-state copy revision - October 27, 2026

Heading: **No more meetings today!** Use one of the four owner-supplied ready lines, stable for the local calendar day:

- Go touch some grass before it's too late.
- Don't get too comfortable.
- Hopefully it stays this way <3
- Would be a shame if you were added to another meeting.

The Click here to get added to another meeting variant is retained as pending copy with no destination. Do not render an unfinished link or invent an external redirect. Satire off hides the secondary line. The existing complete-calendar requirement remains. This explicit owner wording supersedes the earlier empty-calendar candidate; no random selection, private-data interpolation or AI service is added.

## Owner light-mode logo refinement - October 27, 2026

Use the existing transparent cai-mark-128.png in both sidebar and About, with the dark-lettering wordmark in light mode. This replaces the earlier solid dark app-icon badge on white surfaces. Dark mode and the full-color favicon/app icons keep their existing treatment. The approved artwork files remain byte-identical: no redraw, recolor, image edit or new asset dependency. The owner request supersedes the initial handoff's badge-placement default for these app surfaces.

## Dashboard task entry (owner refinement)

Use a single title field and adjacent Add button, with Enter as the keyboard shortcut. Keep the entry under 120 CSS pixels tall at normal zoom across supported widths/densities. Add details in Tasks transfers the draft to the full task form in its tab. The dashboard should prioritize the task list; creation metadata, advanced fields and scheduling-zone explanation belong in the full form. Keep inputs readable, focus visible and mobile controls at least 44 pixels tall.
