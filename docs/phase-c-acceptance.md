# Phase C — owner property workflow acceptance

## Scope and checkpoint

Phase C implements shared owner property fields, reusable features, and the create/edit flows against the Phase B API. Public filters/pricing/status labels, viewing enforcement and WhatsApp remain Phase D. No migration, backfill, feature seeding, push, deployment, production data change or real message is included. Final full cross-phase acceptance remains deferred until all phases.

Current status: Phase C complete for its scoped checkpoint, specification PASS (`deleg_d31a9e45`) and quality APPROVED (`deleg_121d5554`, carrying the initial quality review). The frontend commit containing this document is the checkpoint. STOP before Phase D. This is not final cross-phase or production acceptance.

## Captured pre-edit baseline

Frontend `main` started clean at `eb2dc0b5d951e6d7954e289535328679c076fb11`; backend `master` remains at `0de20ac968aa4b4cb8d712a8cddc612ff99b81af` and is unchanged.

- `npm run build`: PASS.
- `npm run typecheck`: config check PASS; application check FAIL with the three existing diagnostics: `location-selector.tsx:159` missing `County.county_coordinates`, and `saved-searches-manager.tsx:60-61` duplicate `maxPrice`.
- `npx eslint src/pages/Admin.tsx src/pages/AdminProperties.tsx`: FAIL with 16 existing explicit-any errors (eight per file).
- Raw logs are in the controller scratch directory `zawamu-phase-c-baseline/`, not committed.

## Implementation

- Shared typed form values, API property types and explicit writable payload builder. Legacy structured locations/features/images survive edits; API metadata never enters PUT payloads.
- Purpose/type compatibility, free-text location, compatible availability, monthly rent, percentage offer and decimal half-up effective-price preview. Land hides bedroom/bathroom controls and writes zero values.
- Searchable multiple feature selections with public catalog loading, owner inline creation, normalized duplicate reuse, legacy snapshots, removal, loading/error/retry states. Pending creation locks selection edits to avoid stale-closure overwrite.
- Both property workflows share the fields while keeping existing image-upload handling and ten-image limits. Validate before uploads, retain values on API failure, expose conflicts. Create refreshes dashboard via GET; edit uses the authoritative saved API response in the management table.

## Focused verification

Controller executed after shared/page implementation and delayed-create regression:

```sh
npm test -- --run src/lib/property.test.ts src/components/properties/FeatureSelect.test.tsx src/components/properties/PropertyFields.test.tsx src/pages/Admin.property-form.test.tsx src/pages/AdminProperties.test.tsx
npm run typecheck
npm run build
npx eslint src/types/property.ts src/lib/property.ts src/lib/property.test.ts src/components/properties/FeatureSelect.tsx src/components/properties/FeatureSelect.test.tsx src/components/properties/PropertyFields.tsx src/components/properties/PropertyFields.test.tsx src/pages/Admin.tsx src/pages/AdminProperties.tsx src/pages/Admin.property-form.test.tsx src/pages/AdminProperties.test.tsx
git diff --check
```

- Focused tests: **30 passed in five files**. UI/API responses are explicit mocks, not persistence evidence. The delayed feature-create regression was observed failing before its fix by the implementer.
- Typecheck: config PASS; app FAIL with exactly the same three baseline diagnostics, no new diagnostics.
- Production build: PASS; existing stale Browserslist data and large-chunk warnings remain.
- Changed-file lint: four existing explicit-any errors in unchanged Admin stat/alert/blog paths; all new shared code, edit page and tests are clean. Baseline was 16 errors across the two pages; no rule suppression/exclusion introduced.
- Whitespace: PASS.
- Controller logs: scratch `zawamu-phase-c-final/`. The final cross-phase suite was not run.

## Review history

- Specification review `deleg_fb95fa8e` identified pending feature creation not coordinated with parent save/close (late callbacks can overwrite/reset form state), and removed legacy snapshots missing from selectable options. Both were confirmed against source and repaired by `deleg_11e0e6ab` with RED→GREEN regressions. The 30-test result above predates those repairs.
- Final narrow specification review `deleg_d31a9e45` PASS after strengthening the failed-reload test with a distinct unsaved title (parent6/6edit tests and lint PASS; reviewer targeted1pass/5filtered). Quality review `deleg_769a10c7` requested the image-control repair described below; final targeted re-review `deleg_121d5554` APPROVED and independently reran15/15page tests. No source changes followed that review.
- Handoff/plan reconciled; commit exact Phase C paths locally and stop before Phase D. No other review/implementation workers remain pending.

## Fresh post-repair evidence

The controller reran the five-file focused command above: **33 tests passed** (helpers8, fields4, feature picker9, create7, edit5). This includes parent save/close coordination, unmount late-completion protection, and legacy remove/reselect without a catalog POST. Config typecheck and production build passed; application typecheck still has exactly the three captured baseline diagnostics. Changed-file ESLint still reports only four pre-existing Admin non-property explicit-any errors. Whitespace checks passed. No final full cross-phase suite was run.

The controller executed scratch-only `node "$TMPDIR/phase-c-real-acceptance.mjs"` against an isolated production frontend build and actual Express app with MongoDB8 in an owned tmpfs container. **111 assertions passed**, five rental listings created (the four requested types plus a mobile keyboard-selection listing), one inline feature created, 41 real browser API responses observed. Real owner login/profile hydration, free-text location/monthly price/offer/status/area persistence, feature reuse on another listing after navigation, legacy record edits preserving images/features/structured location and other fields, writable-only payloads, and refreshed table data were exercised with Mongo read-back.

One property-save response was explicitly mocked as503 to prove input/error retention; an incompatible rent/sold request received a real400 and left storage unchanged. Those two expected resource-console errors were classified only for that method/path/action. Google Fonts stylesheet responses were explicitly stubbed in seven navigations with empty CSS to avoid external service calls; geometry/screenshots therefore use fallback fonts, not live Google Fonts. No upload/media provider, SMTP or WhatsApp calls occurred. **Zero unexpected console errors and zero uncaught page errors**. Desktop/mobile listbox geometry checks passed; the mobile screenshot crop was visually inspected with no horizontal clipping/overlap of the visible form controls.

The first harness attempt failed on Docker tmpfs inspection (Docker exposes the flag through `HostConfig.Tmpfs`); the next completed the business flows but failed because intentionally blocked Google Fonts requests produced seven console errors. The harness was repaired, with explicit font stubs rather than hiding unexpected resource errors. The final third run passed. No application source changed between these runs.

Final result: scratch `phase-c-acceptance-mwn38aoa-87ff9e65e8db44/result.json`. All six Phase C application source files matched that browser-tested snapshot byte-for-byte. The owned database was dropped and read back empty/absent, Mongoose disconnected, API/preview/browser closed, and exact owned container removal read back. Parent separately confirmed no Phase C containers or acceptance listeners remained. Scratch harness/dependencies/screenshots are verification-only, not shipped application dependencies.

### Final409 recovery repair

Specification re-review `deleg_6fdc8279` confirmed both prior fixes but found that409 retries remained enabled. Parent reproduced the issue with a failing regression, added a per-property conflict lock that survives editor close/reopen, and an explicit “Reload latest (discard unsaved edits)” action. Only a successful latest-record GET clears the lock; failed reload keeps current edits and blocks saves. A remounted feature picker resets local snapshots to the freshly loaded property. This is409 recovery, not a new backend client-version/ETag protocol.

Fresh final controller checks: **34 focused tests passed**, build/config typecheck PASS, application typecheck the same3baseline errors; edited page/test lint and whitespace PASS. The overall changed-file lint retains4existing unrelated Admin anys. Final scratch browser/API/Mongo run passed **116 assertions**, with43real browser API responses and two explicitly mocked failures (503create and409edit). The409 response was simulated; latest-record GET, DB update/read-back and successful subsequent save were real. Other earlier flows were rerun unchanged. Seven Google Fonts CSS responses were stubbed; zero unexpected console/page errors. Owned DB drop/empty read-back, disconnect, HTTP/browser stop and exact container removal succeeded. Latest result: scratch `phase-c-acceptance-mwn3e6q9-fe5b5ed6dd83d0/result.json`; all six source files again matched its snapshot byte-for-byte. This supersedes the earlier33-test/111-assertion evidence for the final source.

## Final image-control quality repair and verification

Quality review `deleg_769a10c7` requested locking image selection/removal while uploads or property saves are pending. The risk existed in the prior pages but belongs to the retained Phase C workflow. Parent reproduced both create/edit failures with delayed mocked upload/property requests, then disabled the file inputs and all existing/new image-removal buttons and guarded their handlers during save/upload/inline feature creation. Controls re-enable after failure without dropping previews. Both new tests were RED before the fix and GREEN afterward.

Final parent five-file command: **36 tests PASS** (helpers8, fields4, picker9, create8, edit7). Build/config typecheck PASS; app typecheck unchanged3baseline errors; changed-file lint unchanged4old Admin non-property anys; whitespace PASS. The image-upload regression tests use mock upload responses; no real Cloudinary operation was performed.

The bounded browser/API/Mongo harness was rerun after this final source repair: **116 assertions PASS**,43real browser API responses, two disclosed injected503/409 responses,7fontCSSstubs, zero unexpected console/page errors. Source matched all six browser snapshot files byte-for-byte. Owned DB drop/empty read-back/disconnect, HTTP/browser shutdown and exact tmpfs container removal all succeeded. Final result: scratch `phase-c-acceptance-mwn3x9pz-6d01b03550f1d7/result.json`. This is fresh scoped Phase C evidence, not a final cross-phase aggregate or live media-provider test. Final targeted quality re-review APPROVED with no outstanding findings.

## Remaining rollout limitations

The recorded baseline typing/lint debt, dependency advisories, legacy saved-search privacy gaps, unfinished public product surfaces, contact simulation/mail defects, owner allowlist configuration and notification recipient TBD remain. Phase C is not production launch approval.
