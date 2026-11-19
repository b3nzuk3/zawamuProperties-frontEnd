# Phase D — public browsing checkpoint evidence

## Accepted final checkpoint

Spec PASS `deleg_e582a712`, quality APPROVED `deleg_0bbc8297` carrying earlier full/targeted reviews. Final owner edit-path repair prevents null/empty/unknown status becoming Available on unrelated edits: invalid sentinel, blocked validation and payload construction until explicit choice. Three edit-flow regressions observed RED→GREEN. Final **61 focused tests across13files PASS**, build/config typecheck/changed-file lint/whitespacePASS; app typecheck3baseline diagnostics. Backend25PASS. The66-assertion real browser/API/Mongo run below precedes this last owner-form-only repair; public/backend source otherwise unchanged, and fresh helper/create/edit/fields tests cover the final repair. No claim of browser rerun for it. Checkpoint commit contains this document; E separately approved but starts only after D commits/clean-state read-back. Later pending-review language below is historical and superseded here.

## Final quality-repair evidence (supersedes earlier counts below)

Quality review `deleg_9a36119e` identified fail-open unknown/null availability in the controller and misleading Available badges. Only missing/`available` now permits viewings; explicit null, empty and unknown statuses are Unavailable/409/no insertion. Three badge regressions and one backend regression were observed RED then GREEN. Fresh scoped frontend **39 tests PASS**, backend viewing/access **25 PASS**, build/config typecheck/changed-file lint/whitespace PASS; app typecheck retains exactly the original three errors. Final real browser/API/Mongo acceptance **66 assertions PASS**, **10 real browser API responses**, rates33/fontCSS8explicit mocks, one expected409resource error and zero unexpected/page errors. This supersedes, rather than adds to, prior52/54runs. Raw null/withdrawn/empty fixtures each returned409/no insert and rendered disabled viewing with Unavailable badge. Final report `zawamu-phase-d/acceptance-2e56f2f35f8af16f/result.json` under TMPDIR; all11source hashes match browser snapshot/final worktree. DB empty/drop, disconnection, browser/API/preview shutdown and exact container absence verified. Targeted quality re-review `deleg_c8d3c295` pending until the handoff records its verdict. User separately approved E, but D checkpoint must be committed first.

## Scope and boundary

Authorized Phase D only: public sale/rent filters, free-text location precedence, unbounded optional effective-price bounds, shared prices/badges, Sold/Rented visibility with disabled viewings, Land statistics, and company WhatsApp draft links. No migration/backfill/catalog seeding, real message sending, push, deployment or production data change. Phase E enquiry delivery/inbox and Phase F saved-search/alert alignment remain unimplemented. Saved Search explicitly declines unsupported purpose/free-text location/effective-price filters rather than silently dropping them or applying legacy base-price semantics.

Starting commits: frontend `6627614` on `main`; backend `0de20ac` on `master`. Initial worktrees were clean. Review and checkpoint commit are pending until recorded in the handoff.

## Executed scoped checks

- `npm test -- src/lib/property.test.ts src/lib/whatsapp.test.ts src/lib/companyContact.test.ts src/components/properties/PropertyPrice.test.tsx src/components/properties/PropertyBadges.test.tsx src/components/properties/WhatsAppButton.test.tsx src/pages/PropertyDetails.test.tsx src/components/ui/schedule-viewing-modal.test.tsx src/pages/Listings.test.tsx src/components/home/FeaturedListings.test.tsx`: **36 tests PASS in 10 files**, freshly rerun after the review repair. Component API/conversion fixtures are explicit mocks. The new regression first failed because price bounds could be saved with incompatible legacy semantics; it passed after guarding both max-price and min-price (including zero).
- `npm run build`: PASS; existing stale Browserslist and large-chunk warnings remain.
- `npm run typecheck`: FAIL with exactly the same three pre-edit application diagnostics: `location-selector.tsx:159` missing `County.county_coordinates`; `saved-searches-manager.tsx:60,61` duplicate `maxPrice`. Node/config typecheck PASS. No new diagnostic or suppression.
- Changed-file `npx eslint` covering all 21 changed/new frontend source/test files: PASS. Pre-edit targeted lint had three inherited explicit-any errors in Listings/FeaturedListings, removed by typed property integration.
- Frontend/backend `git diff --check`: PASS before checkpoint documentation.
- Backend `node --test test/viewing-availability.test.js test/admin-access.test.js`: **24 tests PASS** (including nested endpoint tests). Actual loopback HTTP with explicitly mocked model methods, not real Mongo evidence. Controller syntax PASS.

The final full cross-phase test pass is deliberately deferred until all phases finish; no full-suite acceptance claim is made.

## Separate real browser/API/Mongo acceptance

Parent executed scratch `zawamu-phase-d/acceptance.mjs` using installed Playwright and actual Chromium, an isolated production frontend snapshot/build, real Express app and owned disposable MongoDB 8 tmpfs container. No `.env` loaded. Final post-repair result: **54 assertions PASS**, 7 real browser API responses, one deliberately exercised real HTTP 409. This supersedes the earlier 52-assertion run; totals are not cumulative. The only browser console error was that expected conflict resource response; zero unexpected errors/page errors. New assertions verify price-bound Save Search is disabled and its limitation explained.

Verified public default includes five fixtures (including a KSh 30m sale, Sold, Rented Land and legacy listing); grid/list retention; purpose selection; discounted rent max-price matching; original strike-through; monthly label; case-insensitive free-text filtering; manual location precedence; clear/reset; disabled grid/featured/detail viewings; retained contact link; exact company WhatsApp destination and encoded title/current-site public URL; desktop/mobile document overflow; and stale-page submission after a real persisted Available→Rented update returning 409 without a new DB request. Inputs persist and repeat submit is disabled.

Separate direct HTTP/DB checks proved Available and legacy viewing persistence/read-back; Sold/Rented 409 with no insert; general contact persistence remains permitted; and raw legacy property unchanged. General contact checks are existing backend behavior, not Phase E form/email acceptance. No WhatsApp navigation or message send, SMTP, uploads, or external provider integration was exercised.

Exchange-rate responses were explicit browser mocks (26 requests at KES150/USD); Google Fonts CSS was stubbed (5 requests), so screenshots use fallback fonts. Fixture images are plain inline SVG blocks, not property photography. Mobile screenshots visually inspected: layout readable, badges and contact/viewing actions fit, no clipping/overlap observed; geometry assertions passed at 390px and desktop 1440px. These are fixture/fallback-font observations, not production visual acceptance.

Scratch report: `/home/b3nzuk3/.hermes/profiles/orcha/cache/scratch/zawamu-phase-d/acceptance-7d757913841fbe4f/result.json`. The 11 application source files' SHA-256 hashes are recorded for the browser-built snapshot and final worktree verification. Backend source was stable during execution. Owned DB dropped and read back empty, Mongoose disconnected, HTTP/preview/browser stopped, exact container removed and absence read back. Parent independently confirmed no Phase D containers remain.

## Remaining gates

Independent specification then quality review and exact-path checkpoint commits; final cross-phase acceptance after F; baseline type/lint/dependency debt; saved-search contract/privacy gaps; production owner allowlist; approved notification recipient and SMTP configuration. Nothing in this local phase constitutes launch or deployment approval.
