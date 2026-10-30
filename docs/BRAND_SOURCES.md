# Primary implementation references

References carried forward from the v1.4 handoff prepared October 27, 2026; B01 was rechecked during v1.5. Other platform references were not re-audited for this copy-only update. User-selected branding is grounded in the conversation and the bundled reference image, not an external brand guide. The following references inform implementation details only; recheck them during platform-specific integration.

## B01 - Codex repository instructions

OpenAI: [Custom instructions with AGENTS.md](https://developers.openai.com/codex/guides/agents-md/). At verification the URL redirected to OpenAI's ChatGPT Learn documentation. Repository instructions have directory scope; ordinary supporting documents need to be explicitly referenced. Merge applicable existing instructions rather than replacing them.

## B02 - PWA icons and masks

MDN: [Define your app icons](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/How_to/Define_app_icons) and [manifest icons](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/icons). Favicon and installed app icon are separate. Maskable artwork belongs within the central circular safe zone (diameter 80% of minimum image dimension) on an opaque background; src resolution is relative to the manifest. Platform behavior must still be tested.

## B03 - Accessible logo usage

W3C WAI: [Functional Images](https://www.w3.org/WAI/tutorials/images/functional/). A linked image's accessible name should identify its destination/function. Decorative logos next to equivalent link text should not duplicate the announcement.

## B04 - Text and controls

W3C WAI: [Contrast minimum](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) and [Non-text contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html). Use at least 4.5:1 for ordinary text, 3:1 for qualifying large text and essential control-state graphics. Logotypes have an exception, but practical legibility is still required. A token ratio alone is not a full accessibility conformance test.

Prior integration references in SOURCES.md remain historical, dated planning references; this branding export does not revalidate all provider/API assumptions.
