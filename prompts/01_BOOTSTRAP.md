# First prompt for Codex

Use this implementation prompt only after explicit owner authorization to begin development. The v1.4 review request authorized documentation changes only. If the current request is only to review/revise the plan, complete that request and return without scaffolding.

Read AGENTS.md and the project handoff documents it references. Treat this repository as a workplace productivity application, not an AI chatbot. Use the official name `Cursed Assistant-inator`, the exact logo text `CAi` (not `CAI`), the exact tagline `It knows your schedule. Unfortunately.`, and the satire-vs-reality requirements in docs/BRANDING.md. The export may be the only context you have; do not depend on the original conversation.

Inspect the repository and preserve existing work. Identify which files, tools, and checks actually exist. Summarize the product constraints, the permission-dependent features, and the first implementation slice before changing code.

Execute M0, then M1 from docs/IMPLEMENTATION_BACKLOG.md as one bounded bootstrap effort, using synthetic data only. Do not wait for Microsoft 365 credentials, desktop permissions, or a restaurant API to build the safe core. Record unknown workplace permissions as unresolved, not approved.

For a new repository, create the proposed React/TypeScript/Vite structure and real build, typecheck, lint, unit-test, and E2E scripts using currently supported compatible dependencies. Use the default #115B47 brand, VS Code-like light/dark neutral tokens, a responsive dashboard shell, a persisted local-demo task slice, a synthetic next-meeting widget, and a visible in-app reminder demonstration. The mock Join action must be simulated rather than opening a real meeting. Separate domain logic and provider interfaces from widgets.

Only install dependencies through the permitted development environment. If tooling or network access is blocked, report it and complete the parts that can be verified; do not disable security controls or claim unrun tests passed.

M1 uses AT-BOOT-05 for its dashboard task/reminder scope; full Tasks-view AT-TASK-01 belongs to M2.1 and coordinator/widget lifecycle AT-REM-01 to M4. Include the minimal About/settings and joke toggle required by M1 brand acceptance. Do not expand M1 into advanced tasks or the full reminder system.

At the end, update docs/STATUS.md, docs/DECISIONS.md where a real decision was made, and docs/IMPLEMENTATION_BACKLOG.md. Report changed files, exact validation commands and results, how to run the prototype, known limitations, and the next bounded work package. Do not mark the product work-ready or enable any live integration.
