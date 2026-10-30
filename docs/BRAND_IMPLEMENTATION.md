# Apply branding without rebuilding the product

Use `prompts/03_APPLY_BRANDING.md`. This is a bounded branding migration, not permission to restart the application or add live integrations.

## 1. Inspect and map

Read repository instructions, Git status, the existing theme/customization store, metadata pipeline, manifest, logo components, notification copy and tests. Read this handoff's `BRANDING.md`, `BRAND_ASSETS.md`, `BRAND_VOICE.md`, `branding/brand.json` and the asset manifest. Identify whether the project is empty or already implemented. Never replace its root instructions with this export blindly.

Determine the real deployment base, CSP, source/static directories, framework, and saved settings. Honor current dependencies and conventions. Do not install a new framework or font just for branding.

## 2. Merge identity and assets

Use one runtime source of truth for wordmark/full name/tagline and the ordered `taglineLines` array. Display both sentences at equal font size, weight and color; allow natural wrapping on narrow layouts. The supplied JSON is source material; generated constants must stay synchronized. Update headings, title, About, onboarding, reset defaults and metadata. Search current source for previous names/taglines and substitute only brand references, not unrelated user-entered tasks or archived history.

Copy only selected public assets into the project's local asset pipeline. Prefer the 128px mark plus SVG wordmark, rather than loading the large board or all signature variants. Keep source references out of production. Use the exact selected second-board #10 geometry. Preserve all existing non-brand features.

## 3. Integrate one logo component

`branding/examples/Brand.tsx` and `Brand.css` demonstrate mark, lockup, and signature variants. They use no new runtime dependency beyond React already in the proposed stack. Copy/adapt them into the project's structure, or implement the same contract in the existing framework.

Inputs: resolved light/dark appearance, deployment base path, variant, and the actual satiricalCopyEnabled setting. Decorative mode is available for a parent link already labeled `CAi home`. Default navigation is compact and has no tagline. Signature mode uses semantic full-name/tagline text so it can wrap, scale and be hidden by the satire preference. Both tagline sentences must be hidden together; keep them out of compact navigation accessible names.

Do not duplicate an existing theme provider or settings store. Map the provided `--cai-*` tokens into existing semantic tokens as needed. The app accent remains #115B47; the orbital logo retains its own colors. Use system fonts, not remote font imports.

## 4. Metadata and installed identity

Merge the head snippet and manifest fragment, adapting base paths and preserving existing PWA id/start_url/scope. Keep the browser title functional. Favicon, Apple touch icon, PWA icon and native-shell icon are separate integrations. The optional native shell must not be installed merely to apply branding.

Respect existing user-defined logos/favicons/backgrounds and explicit appearance choices. Apply new defaults only when a value is still default or the user deliberately resets it. Do not change installed app identity/id to force an icon refresh. Document cache/install behavior after actual target testing. No auto-publishing of the optional share card.

## 5. Voice and trust

The selected tagline is canonical but its app display is optional via the satire setting. Replace early overt 'evil company' copy with restrained institutional examples only in suitable places. Real permission, privacy, security, task, meeting, notification and order flows remain literal. Review actual data practices before writing reassuring claims; do not fabricate a privacy guarantee.

## 6. Verification and completion

Run the package validator before integration, then actual repository build, type checking, lint and relevant tests after integration. Test at 320/375/768/1280px viewport widths, light/dark and custom backgrounds, keyboard navigation, 200% zoom, forced-colors mode and satire off. Check all requested assets return successfully under both root and configured subpath deployment. Inspect favicon 16/32 sizes and installed icons separately where authorized.

Use `AT-BRAND-01` through `AT-BRAND-23` in the acceptance matrix. Record exact commands and results. Screenshots are supplementary evidence, not proof of functioning calendar/notifications. Report unrun or blocked tests honestly. Keep optional integrations disconnected.

## Definition of done

One coherent CAi identity; no wrong-board logo or obsolete tagline in live surfaces; readable default UI; no altered user customization; no runtime asset/font requests to external origins; no satire in sensitive workflows; no change to app permissions, integrations or storage; build/tests pass with recorded evidence. A package of assets is not itself a completed application integration.

## v1.5 migration boundaries

Only supporting copy and copy-bearing signatures/share card change. All 39 non-tagline
runtime assets, including every mark, wordmark, logo lockup and icon, are locked to
v1.4 hashes in `branding/logo-lock.json`. Preserve that lock and validate it. Do not
run the icon rebuild tool, trace again, regenerate a logo, or change its colors for
this migration. The full signature SVG image payload/wordmark geometry is also locked.

Reserve `obligation` for optional, clearly fictional internal-company material. The
canonical public line uses `job`. Optional About/campaign copy follows `BRAND_VOICE.md`;
do not add campaign modules or a marketing page merely to use every approved line.
Retire the old tagline from active UI, asset caches and expectation fixtures, not
user-authored tasks or historical records. Update only changed branded cache entries;
do not change PWA identity or wipe application data to refresh supporting text.

## Existing-app integration note

The complete reference package remains in the owner-supplied sibling branding folder. This app deploys only the eight selected mark/wordmark/favicon/Apple assets; the broader inventory/lock is retained as source authority, not a claim that every listed export is deployed. Source boards, crops, preview pages, share cards, unused composites and native/PWA variants were not copied into the runtime. See TODAY_BRAND_VALIDATION.md for actual host-app evidence and unrun platform cases.
