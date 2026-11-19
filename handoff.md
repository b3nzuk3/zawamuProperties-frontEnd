# Frontend Handoff — Phase A

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
