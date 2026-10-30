# Continuation prompt for Codex

Check current owner authorization and STATUS first. A plan-review/revision request does not start implementation. Once development is authorized, follow package dependencies rather than milestone number order: M2.1 unblocks M4; advanced M2.2/M2.3 come later. Do not treat unfinished subcases as whole acceptance-test passes.

Read AGENTS.md, docs/STATUS.md, docs/DECISIONS.md, and the active milestone in docs/IMPLEMENTATION_BACKLOG.md. Inspect the live repository and recent changes; do not rely on a previous chat's claimed completion.

Choose the next dependency-ready, unblocked work package unless I name a different one. Read the relevant architecture, design, and acceptance sections. State the scope, acceptance IDs, and any unresolved permission gate. Then implement and verify that bounded slice.

Stay in demo mode for any integration whose authorization and configuration are not established. Never substitute mock data for an apparently live connection. Do not overwrite unrelated edits, introduce a new hosted provider, or broaden enterprise permissions without explicit direction and applicable approval.

Update status, backlog, and any decision changed by evidence. Report exactly what changed, checks that passed/failed/were not run, current blockers, and the next practical step. Keep remaining work honest and resumable.
