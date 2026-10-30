# Export validation

Historical planning-export evidence below predates M1. Current application test results are recorded in [M1 validation](M1_VALIDATION.md).

Date: October 26, 2026
Scope: planning artifacts only. No application tests were run because no application code is included.

Original export reported these structural checks (historical, not application evidence):
- JSON parses; all integration approval gates remain unresolved.
- Default brand and exact user-supplied Toast URL match the specification.
- All relative Markdown links and referenced source anchors resolve within the package.
- All referenced acceptance IDs exist. The original count of 75 was stale after branding additions; review found 80 before v1.4 changes. The current count is recorded below.
- Markdown code fences balance.
- Default layouts have valid bounds, consistent presets, unique widget IDs and no overlaps in all three profiles.
- Root AGENTS.md is below the documented default 32 KiB project-instruction size limit.

Manual review: provider assumptions updated to Toast; no API access is claimed; website-order and channel-order status paths are distinguished; no secret values, real calendar data, payment data or work tasks are included.

Not verified: app execution, UI rendering, API authentication, calendar results, notifications, desktop behavior, restaurant authorization, ordering availability beyond the dated public page observation, dependency compatibility, or performance. Those belong to implementation and its acceptance matrix.

## v1.4 revision validation

Validation status: staged structural checks PASS (87 unique acceptance cases). Project read-back PASS: all 13 revised files matched staged bytes after atomic per-file replacement; original hashes were checked before writing to avoid overwriting concurrent edits. Scope is planning artifacts only. All application acceptance scenarios remain NOT RUN. No application code, dependency installation, live account connection or deployment was performed.

Review revisions: reordered core/advanced task delivery, corrected milestone dependencies and acceptance ownership, explicit recurrence/transaction/restore rules, session-generation race protection, measurable interaction/usability criteria, and synchronized clock defaults. See DECISIONS D112-D116. The final report records actual structural commands/results after verification.

Validation command (temporary review tooling, not an application test):

```powershell
python %TEMP%\cai-plan-review-20261026\validate.py --staged
```

Result: PASS. 87 unique acceptance IDs; referenced IDs/ranges and backlog ownership; JSON parsing, unchanged unresolved gates, identity/color/Toast defaults and clock policy; relative Markdown links/source anchors; balanced fences and well-formed acceptance tables; whitespace/conflict markers; three layout profiles' bounds, presets and non-overlap; revised core dependencies. The matrix had 80 cases before revision and now has seven additional cases.

Directory diff check returned exit 1 with no whitespace/conflict diagnostics; the snapshots contain intended content differences. The independent structural validator's whitespace/conflict checks passed. The project is not a Git repository. Command:

```powershell
git -c core.autocrlf=false diff --no-index --check %TEMP%\cai-plan-review-20261026\original %TEMP%\cai-plan-review-20261026\revised
```

A normalized original/revised text diff was inspected using temporary snapshots; no history was initialized or modified. The temporary validator and snapshots are outside the project. No dependency compatibility, UI, performance, API or application acceptance result is implied by these checks.
