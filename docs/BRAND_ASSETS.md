# Brand asset inventory and usage

## Asset selection

All deployable files are under `public/branding/cai/`. Filenames are lowercase for predictable paths; user-facing spelling remains CAi.

| Need | File(s) | Treatment |
| --- | --- | --- |
| Primary app symbol | `cai-mark-native.png`, `cai-mark-64.png`, `cai-mark-128.png`, `cai-mark-256.png` | Source-derived RGBA. **Dark surfaces only**; original dark-matte character is visible on white. |
| Efficient symbol | `cai-mark-128.webp`, `cai-mark-256.webp` | Lossless WebP alternatives; PNG fallback available. |
| Header lockup | `cai-logo-dark.svg`, `cai-logo-light.svg` and PNG/@2x variants | Symbol + traced CAi. Light file adds a dark symbol badge. Hybrid SVG. |
| Full signature | `cai-signature-dark.svg`, `cai-signature-light.svg` and PNG/@2x | Unchanged symbol and CAi, full name, current two-line tagline. Hybrid SVG; text is outlined. |
| Wordmark only | `cai-wordmark-dark.svg`, `cai-wordmark-light.svg`, `cai-wordmark-currentcolor.svg` | Pure vector trace of source lettering, not a new font selection. Dark means white lettering for dark backgrounds. |
| One-color symbol | `cai-mark-mono-white.svg`, `cai-mark-mono-black.svg`, `cai-mark-mono-currentcolor.svg` | Pure vector **silhouette derivative**, omits colored ribbon structure. Utility use only. |
| Browser favicon | `favicon.ico`, `cai-app-icon-16.png`, `cai-app-icon-32.png` | Full-color symbol on near-black. ICO has 16, 32, 48, 64, 128, 256 layers. |
| Optional scalable favicon | `favicon.svg` | One-color utility silhouette; not the main colored mark. Do not force this fallback as the primary identity. |
| Apple touch icon | `apple-touch-icon.png` | 180 x 180, opaque near-black ground. |
| PWA/general app icons | `cai-app-icon-192.png`, `cai-app-icon-512.png` | Opaque square, purpose any. Other sizes: 16/32/48/64/128/256/1024. |
| Maskable icons | `cai-maskable-192.png`, `cai-maskable-512.png` | Opaque square with extra safe-zone padding. Purpose maskable only. |
| Notification/tray utility | `cai-notification-mono-16.png`, `-24.png`, `-32.png`, `-48.png` | Transparent white silhouette. Select/recolor for actual host-platform conventions only after testing. |
| Optional static brand card | `cai-share-card.png`, `cai-share-card.svg` | 1200 x 630. Brand only; no task/calendar data. Do not publish/share automatically. |

`branding/asset-manifest.json` is the exhaustive inventory: size, SHA-256, dimensions and representation type.

## Fidelity and provenance

Original board: 1536 x 1024 pixels. Selected tile: `[1229,257,1536,510]`. Native symbol canvas: 140 x 144; the colored artwork itself occupies less. `branding/source/PROVENANCE.json` records exact crop coordinates, source hash, extraction method and limits.

The approved colored symbol is **not** recreated as a new image. It is cropped from the selected tile, unmatted from the original dark background, and resampled for export sizes. The CAi lettering is vector-traced from that same tile. Secondary text is supplied as outlined lettering in composite signatures; no font binaries are distributed. UI text should use the existing system font stack.

Color SVGs contain an embedded PNG symbol. They are convenient, self-contained packaging, **not lossless geometric color masters**. Wordmark and mono SVGs are vector traces; they do not recover the lost original design geometry. No trademark clearance or exclusive-rights assertion is included.

Large 512/1024 exports meet dimension needs but do not add detail. They are acceptable as interim installed icons at normal displayed sizes; inspect the target platform. Do not use them for large-format printing or a huge hero. Seek a separately reviewed vector recreation if that becomes necessary, preserving the chosen geometry instead of silently substituting another logo.

## Layout rules

- Preserve aspect ratio; use contain, never crop/fill a rectangular lockup into a square.
- Keep clear space at least 20% of the symbol's visible height around the composite. The master files contain some padding; add layout spacing rather than squeezing other controls into it.
- Recommended UI symbol height: 24-48 CSS px. Use a 128px PNG for a 32-48px symbol on high-density screens. Prefer <=72 CSS px for fidelity-sensitive use. Large brand previews demonstrate composition, not vector-quality detail.
- Minimum typical wordmark height: 18 CSS px; symbol-only is better than squeezing a full signature into tiny navigation.
- Full signature artwork should normally be >=370 CSS px wide for its supporting text. On narrow screens use semantic live text with responsive wrapping, not shrinking the image until the tagline is unreadable.
- Do not mirror, rotate, stretch, tint-filter, add outlines, animate continuously, attach an AI sparkle, or recolor the orbital symbol. Do not apply global uppercase transformations to CAi.
- On light surfaces, use the light lockup/dark badge. On custom photos, place the lockup on an opaque contrasting surface; do not rely on the photo's current average color.

## Security, paths and performance

SVG assets contain only local trusted paths, shapes and embedded PNG data. No remote references, scripts, event handlers or foreignObject. When inlining multiple copies, namespace title/description IDs or mark decorative graphics appropriately to avoid duplicate document IDs. An SVG with currentColor inherits surrounding CSS **when inlined**, not through an external img element; fixed-color files are supplied for that reason.

Use separate PNG mark + vector wordmark for strict CSP deployments that reject embedded data-image SVGs. Do not relax production CSP to make a decorative logo work. Trusted packaged SVG does not permit arbitrary uploaded SVG; retain the app's raster-upload validation requirements.

Only copy needed runtime files. Do not import the original board, include all variants in initial bundles, or precache branding/source and branding/preview. Header assets should remain small; the default 128px symbol + vector wordmark is the intended lightweight path. Local hosting means no remote fonts, icon CDNs or tracking pixels.

Manifest icon src URLs resolve relative to the manifest; preserve the app's existing id, scope and start_url. The fragment is illustrative for a manifest at the app base. Vite's BASE_URL placeholder in the HTML snippet must be adapted to the actual deployment base. Changing a favicon is not a guarantee that an installed icon updates immediately. Validate actual installation/cache behavior before claiming it works. See B02 in `BRAND_SOURCES.md`.

## v1.5 copy-only asset delta

The two signature SVGs, their four PNG renders, and the share-card SVG/PNG contain the
new two-line tagline. All dimensions remain unchanged (signatures 370 x 166, 2x
740 x 332; card 1200 x 630). Symbol payloads, positions and CAi vector paths in these
composites remain unchanged. All 39 other runtime assets are byte-identical to v1.4.
`branding/logo-lock.json` records prior hashes; `branding/logo-preservation-report.json`
records the actual comparison. No logo redraw, vector recreation or icon rebuild is
part of this release. Existing raster-resolution limitations remain.

## Existing-app integration note

The complete reference package remains in the owner-supplied sibling branding folder. This app deploys only the eight selected mark/wordmark/favicon/Apple assets; the broader inventory/lock is retained as source authority, not a claim that every listed export is deployed. Source boards, crops, preview pages, share cards, unused composites and native/PWA variants were not copied into the runtime. See TODAY_BRAND_VALIDATION.md for actual host-app evidence and unrun platform cases.

## Owner light-mode logo refinement - October 27, 2026

Use the existing transparent cai-mark-128.png in both sidebar and About, with the dark-lettering wordmark in light mode. This replaces the earlier solid dark app-icon badge on white surfaces. Dark mode and the full-color favicon/app icons keep their existing treatment. The approved artwork files remain byte-identical: no redraw, recolor, image edit or new asset dependency. The owner request supersedes the initial handoff's badge-placement default for these app surfaces.

## Corrected logo assets v1.6 - October 27, 2026

The owner supplied CAi-corrected-logo-assets-v1.6, lifting the previous logo hold. The installed transparent cai-mark-128.png now uses the repaired exterior/central-opening mask in the shared sidebar and About component, in both themes. The remaining seven installed icons/wordmarks are identical to the supplied v1.6 pack and to their previous bytes; installed/favicons are intentionally unchanged by this release. Copy, tagline, spacing, theme preferences, task/calendar data and dependencies are preserved. Active artwork locks/inventory now reference v1.6; prior source records are archived, and the complete supplied asset inventory remains outside public. No image regeneration or source-pack modification. See LOGO_V16_VALIDATION.md for checks.
