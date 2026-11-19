# Frontend Handoff — Phase C

## Current status (supersedes historical Phase A below)

Phase C complete, scoped-verified and independently approved: specification PASS `deleg_d31a9e45`, quality APPROVED `deleg_121d5554` (carrying the prior full review). Frontend `main` started at `eb2dc0b`; the commit containing this handoff is the Phase C checkpoint (`git log -1 --oneline`). Backend remains unchanged at Phase B `0de20ac`. STOP before Phase D for checkpoint approval. No migration/backfill/catalog seeding, push, deployment, production data change or real message.

Shared types/helpers/fields now power create/edit monthly rentals, free-text locations, compatible purpose/status, offers, Land without bed/bath controls, and reusable features. Explicit writable payloads retain legacy structured metadata/images/feature snapshots and exclude response metadata. Feature pending state blocks parent save/close; unmount callbacks are guarded. Removed legacy snapshots remain reselectable. Create refreshes dashboard; edit uses the authoritative saved response in its management table. A409 blocks retries for that property across close/reopen until an explicit successful latest-record GET; failed reload retains inputs and the lock.

Fresh parent evidence after the final image-control repair: **36 focused tests PASS**, build/config typecheck PASS; app typecheck exactly3baseline diagnostics, changed-file lint4existing Admin non-property anys (baseline16), whitespace PASS. UI/API unit fixtures are mocks, including deferred uploads/saves proving image controls remain locked and recover on error. Latest scratch production Chromium + real Express/Mongo8 acceptance: **116 assertions PASS**, five created rentals, reusable feature persistence/reuse, custom location/price/offer/status/area read-back, legacy preservation, management table refresh, mobile/desktop keyboard/listbox geometry, and409 recovery.43real browser API responses; property503/409 responses explicitly injected, latest reload and persistence real. Google Fonts CSS stubbed on7navigations (fallback-font geometry). Zero unexpected console errors/page errors; no upload/provider/mail/WhatsApp requests. Six source files match browser-tested snapshot; owned DB dropped/read back empty, API/preview/browser stopped, Mongoose disconnected, exact container removed/read back. Final full cross-phase gate remains deferred.

Latest result: scratch `phase-c-acceptance-mwn3x9pz-6d01b03550f1d7/result.json`. See `docs/phase-c-acceptance.md`. Spec findings (feature lifecycle/reselection and409 enforcement) and quality finding (pending-save image controls) were fixed with observed RED→GREEN regressions and approved re-reviews. Quality reviewer independently reran15/15page tests. No workers or review gates remain pending. Root plan/handoff are local-only; child docs are versioned. D public surfaces/viewing/WhatsApp, E enquiry/mail/inbox and F saved-search/rollout/final acceptance remain unstarted. Original baseline debt, dependency advisories, legacy saved-search privacy gap, owner allowlist setup and notification recipient TBD remain rollout limitations. The attempted final AGENTS status-only update was denied by an approval timeout and was not retried; its in-progress wording is superseded by this checkpoint status, without changing the required stop before D.

## Historical Phase A checkpoint

## Status
Phase A scoped checkpoint complete; frontend and sibling backend specification/quality reviews approved. Branch `main`, baseline `b9e531b`; the commit containing this handoff is the checkpoint (`git log -1 --oneline`). **STOP: wait for explicit Phase B approval.**

## Implemented
- Vitest/React Testing Library/jsdom, npm test, actual app + node/config typecheck scripts.
- Strict server capability normalization (`isAdmin === true`), trusted profile/login DTO hydration, failed hydration token removal and revision-based stale auth response rejection.
- Every existing /admin route uses AdminRoute; loading waits, anonymous redirects to login, ordinary users to dashboard, owners render admin content.
- Desktop/mobile owner-only Admin navigation and anonymous Sign In entry; login sends owner to /admin and ordinary account to /dashboard.

## Evidence and freshness
- `npm ci --no-audit --no-fund` with final lockfile, followed by `npm test -- --run`: **47 passed in 5 files**. UI/Axios/auth fixtures are explicitly mocks.
- Production build PASS. Config typecheck PASS. Application typecheck has exactly 3 original diagnostics; full lint29errors11warnings vs baseline30/11. Changed-file lint0errors and1pre-existing React Refresh warning.
- Production-preview Chromium against real disposable API/Mongo: **17 checks**, **0 uncaught page errors**. Anonymous redirect, ordinary login/dashboard/admin403, owner login/listing/profile refresh/admin200, removed-token redirect, mobile owner nav. Test accounts were randomly generated and disposable, not deployed identities.
- Source matches approved immutable frontend snapshot; no source changed after verification. `git diff --check` PASS.
- Independent spec PASS and quality APPROVED; only nonblocking suggestions for overlapping-login and rejected-login UI regressions remain for later focused/final test work.
- Local test preview/API/Mongo and private fixture credentials are removed. No push/deployment or real message delivery.

## Checkpoint rule
Only Phase A is authorized. Commit the scoped Phase A changes in both repositories, then STOP for explicit user approval before Phase B. Do not push, deploy, migrate production, change retained data, or send real messages.

User clarification: retain per-phase commits/approvals and focused verification; the final full cross-phase test pass is after all phases. Do not confuse recorded Phase A evidence with acceptance of unfinished product features.

## Remaining product phases (not started)
- B: property contract, reusable-feature API, backward compatibility, additive migration preparation.
- C: owner property forms and reusable feature picker/create interaction.
- D: public rental filters/prices/offers/status labels, availability enforcement, WhatsApp.
- E: persisted general/property enquiries, notifications and protected owner inbox.
- F: saved searches/alerts, rollout preparation and final full test pass.

Monthly rentals; free-text location; one unit per listing; reusable owner-created features; percentage sale/rental discounts; Sold/Rented remains visible, blocks viewings but allows enquiry/WhatsApp; company WhatsApp +254711168716. Notification email remains TBD.

## Remaining risks / no launch approval
- Frontend retains 3 original app type diagnostics and 29 lint errors / 11 warnings (baseline 30/11). No exclusions or rules were suppressed.
- Production audits report inherited advisory package entries: backend12 (2critical/9high/1moderate), frontend35 (2critical/24high/8moderate/1low). No broad dependency repair occurred.
- User saved-search email lookup/ID access/modification remains public; its legacy ownership/privacy gap is deferred, not fixed by Phase A.
- Existing simulated Contact UI, email transport defects/unconfigured SMTP, missing enquiry inbox, placeholder settings, and later property functionality remain work for later phases.
- Backend-only ADMIN_EMAILS must name approved existing accounts before deployment; empty/unset denies all owner access. Public registration remains disabled. Do not expose this allowlist through VITE variables.

## References
- `AGENTS.md`: phase and engineering rules.
- `docs/phase-a-baseline.md`: unchanged measured baseline.
- `docs/phase-a-acceptance.md`: commands, evidence layers, review and cleanup details.
- Workspace root plan: `.hermes/plans/2026-11-19_042648-client-property-updates.md` (local coordination artifact, not inside either Git repository).
