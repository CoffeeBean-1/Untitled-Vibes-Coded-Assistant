# Corrected logo v1.6 validation - October 27, 2026

Scope: the owner's supplied asset-only transparency repair, AT-BRAND-20 and relevant AT-BRAND appearance/accessibility checks. This is not a full handoff migration or a new design. Brand identity/copy remain v1.5 plus the owner's later wording.

The active transparent mark is copied unchanged from CAi-corrected-logo-assets-v1.6/assets/cai-mark-128.png. SHA-256: d507a69b1286d9884087270ecd44cbf722fe7168ae3c998c13ff06a3879d63cf. Its size is 17,479 bytes (previously 23,644). The shared sidebar and About component already reference this mark, so no application-code/path/layout changes were required. Both themes use the repaired transparency; wordmark theme variants remain intact.

All eight installed files match the supplied pack, active manifest and built dist byte-for-byte. Only cai-mark-128.png differs from the prior deployed bytes. The other seven installed files, including favicon/Apple/app icons, are intentionally unchanged by the source release. The 47-export source inventory records 21 changed exports; unused composites, source boards and previews remain outside runtime. The original supplied pack was rehashed after verification and remains unchanged. Previous lock/manifest files are archived under branding/history/v1.5. The active lock now records the installed v1.6 subset, superseding the old transparency mask without discarding its history.

Passed with existing portable Node 24.22.1/npm 11.19.1:

- npm.cmd run build (includes tsc --noEmit): PASS.
- npm.cmd run lint: PASS.
- npm.cmd test -- src/branding/Brand.test.tsx: 2 tests PASS.
- npm.cmd run test:e2e -- tests/e2e/today-brand.spec.ts --grep 'locked local identity': 1 Chrome scenario PASS. Checks local assets, theme variants, equal tagline lines, satire-off behavior, widths 1280/768/375/320, forced colors, 200% zoom and zero Axe violations/external requests.
- Source/public/dist SHA-256/byte comparison: all eight assets PASS. Source inventory recheck: all 47 exports PASS.

Visually reviewed artifacts/brand-about-light.png and artifacts/brand-about-mobile-dark.png. The shared navigation and About symbols show clean edges/open centers on their respective surfaces, without the previous dark speckling visible on white. Responsive copy remains readable. Existing test uses isolated synthetic data at port 4173. No owner's actual calendar/session or work content was inspected; the running dev reader was not restarted.

No dependency, data/store, configuration, feature or privacy change. Full unrelated regression suite, installed PWA/OS icon refresh and release/performance acceptance were not rerun; no broader pass is claimed. The project has no Git repository, so git diff --check is unavailable. Refresh the running page to request the updated local image.
