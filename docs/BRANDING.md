# CAi branding - canonical requirements

Identity/copy version 1.5; approved artwork repair v1.6. This file supersedes older **branding** instructions only; product behavior and security gates remain unchanged. Machine-readable identity is in `../branding/brand.json`.

## Identity

**Wordmark:** `CAi` (uppercase C/A, lowercase i). **Full name:** `Cursed Assistant-inator`. **Official tagline:** `Productivity is our job. Your data is our passion.` Include both periods. Prefer two equally styled lines, in that order: `Productivity is our job.` / `Your data is our passion.` The canonical single-line form uses one space between sentences. The full name is not `Cool Assistant-inator`. The UI may append sentence punctuation to the name, but punctuation is not part of the canonical name.

**Selected logo:** concept **10 from the SECOND, AI-startup-style board**, row 2, column 5. Luminous tilted interlocking orbital/ribbon loop, teal/cyan with blue/violet highlights, near-black ground, clean white sans-serif CAi lettering. `../branding/source/selected-concept-10-original.png` is the visual authority. Do not confuse it with concept 10 from the first board, introduce a robot/sparkle/brain replacement, or recolor the mark to plain green.

The chosen design is fixed. The owner supplied v1.6 assets to repair the old transparency mask; use those exports byte-for-byte, without local edits. `../branding/logo-lock.json` locks the installed subset; the previous v1.4/v1.5 lock is archived under `../branding/history/v1.5/`. The original concept reference remains historical design authority, not the current transparency mask. Crop/trace/size/light-mode adaptations in this package are implementation derivatives, not newly approved alternative concepts. The original is a small raster. Never describe the supplied color SVGs as an original all-vector master.

## Two visual layers

**Application layer:** retain `#115B47`, VS Code-like light/dark neutral surfaces, restrained density, and fast task/calendar interaction. Preserve the layout and customization requirements in `DESIGN_SYSTEM.md`. No obligatory glassmorphism, animated gradients, giant hero, or neon widget borders.

**Brand layer:** the orbital mark can retain its luminous teal/cyan/blue/violet treatment. The preferred presentation is on a near-black `#070F12` brand stage. Light mode uses the supplied transparent mark directly on the app surface with dark CAi lettering; the owner replaced the earlier dark-badge treatment. The logo palette supplements rather than replaces the green application accent.

## The position and the joke

CAi is a competent workplace assistant. Its fictional parent company is very polished and increasingly uncomfortable when it explains its priorities. The tagline clearly promises a productivity app, then reveals that its fictional company has a much more personal interest in collecting and circulating data. That interest is a vocation, not merely a revenue tactic: profit is secondary to doing it. The real application must not sell data, add tracking, or create insecure behavior to justify the fiction.

Write as an institution documenting outcomes it considers reasonable. Prefer precise wording, selective definitions, procedural reassurance and misplaced pride. The reader discovers the problem. Do not announce evil intentions, wink, explain the punchline, or bully the user. See `BRAND_VOICE.md`.

The polished AI-startup appearance is part of the joke. It does not authorize claims of AI functionality, external LLM connections or new data collection. Keep `runtimeAI: false` unless a separate explicit feature decision changes it.

## Public and internal corporate voices

Public-facing copy calls productivity our **job**: competent, ordinary and serious. Reserve **obligation** for clearly labeled fictional internal memos and corporate statements. Do not imply that the real assistant is reluctant, careless or unreliable.

Approved optional About wording: "We're in the business of productivity, with a passion for your data." This is fictional brand description, not the privacy notice.

"You work faster. We sell faster." is optional secondary campaign copy only when surrounding text explicitly identifies **fictional data brokerage**. Do not use it as the main tagline, as an unexplained standalone slogan, as a real sales-product claim or as an actual order/data status.

The main tagline has equal visual weight across both sentences. Keep the polished startup presentation; no quotation marks, wink, sinister treatment, or trailing explanation. Real data-practice information remains separately accessible and factual.

## Placement

| Surface | Default |
| --- | --- |
| Header/sidebar | Orbital mark + CAi. No tagline by default. |
| Compact quick view | Mark + CAi, or symbol with a correct accessible name. |
| About / optional brand panel | Full name + official tagline; link to factual data-practice information. |
| Optional marketing/start screen | Official signature; never delay access to tasks behind a splash animation. |
| Tabs/PWA/taskbar | Symbol-only icon, correctly named CAi. |
| Permissions, authentication, security, privacy, deletion/export | Literal copy. No satire, fake consent, or playful warnings. |
| Reminder/meeting/order notifications | Literal events and actions; no tagline or jokes. |

Never put the source-board crop in production: it contains the superseded tagline and concept number. Prefer semantic live text for the full name/tagline instead of an entire signature image in interactive UI.

## Satire setting

Reuse the existing `satiricalCopyEnabled` preference. When off, remove the official tagline and all optional joke copy from application surfaces, including About. The name and logo remain. Functional labels, auth, security and actual privacy information do not change. Default remains true for a synthetic demo; honor existing deployment policy and saved user preference.

For a link or compact icon, use a concise accessible name such as `CAi home`. Do not make assistive technology announce the tagline every time the navigation logo receives focus. Static marketing images can have a complete alternative if the tagline is otherwise absent. Decorative symbols beside equivalent text get empty alt text.

## Truth and trust

Do not add advertising pixels, analytics SDKs, data brokerage, shadow profiling, fake network traffic, mock data-sale receipts, fabricated incidents, or hidden collection. All brand assets load locally. The app's actual permissions, stores, transmissions and retention must be documented accurately for its configured deployment. Do not replace a real privacy notice with a parody policy.

A fictional `The Company - Satire` section is allowed as an optional presentation. Keep accurate privacy/security information easy to reach nearby, not hidden behind that section. A promise such as 'CAi does not sell your data' is appropriate only after the configured product has been checked to make it factual. Do not claim 'local only', 'end-to-end encrypted', 'anonymous', or 'zero telemetry' without implementation evidence.

Do not present a joke as a real incident, actual legal finding, or statement about a named company. No external provider affiliation is implied.

## Customization and migration

The user can still choose a favicon, in-app logo, palette or background. These are defaults, not a reason to overwrite personal choices. Keep the canonical CAi identity in About and actual disclosure/ownership information. A 'Reset appearance' action restores the selected CAi brand only when explicitly invoked.

Superseded taglines are documented only as migration/history data: `Your data is going places.`, `Work. Organized` / `Data. Sold.` and `It knows your schedule. Unfortunately.` Never show them in current UI, metadata, tests of expected current copy, or new assets. Historical reference images are the sole intentional visual exception and must not be served by the app.

## Existing-app integration note

The complete reference package remains in the owner-supplied sibling branding folder. This app deploys only the eight selected mark/wordmark/favicon/Apple assets; the broader source inventory is retained outside public, not a claim that every listed export is deployed. Source boards, crops, preview pages, share cards, unused composites and native/PWA variants were not copied into the runtime. See TODAY_BRAND_VALIDATION.md for actual host-app evidence and unrun platform cases.

## Owner company-voice revision - October 27, 2026

The owner explicitly requested the About heading **THE COMPANY**, without a Satire suffix, and a fully committed fictional AI-company narrative aimed at fictional investors. About adds Our dedication to AI, AI is the future positioning, deterministic intelligence, inference-free narrative scaling and investor-ready implementation deferral. This owner direction supersedes the earlier requirement to label this particular company panel Satire. The existing satire preference hides the hype/tagline while leaving the company heading and factual privacy information visible. No actual AI feature, model/API dependency, runtime inference, tracking or investor communication is added. Actual privacy/data-handling copy remains literal and states that the app has no AI processing.
