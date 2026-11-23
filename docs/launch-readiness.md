# Launch-readiness follow-up

Status: local code, source reviews and disposable acceptance passed; see evidence below. Nothing has been pushed, deployed, provisioned in production, or sent through a real provider. The approved checkpoint ends after scoped local commits and a push-preparation handoff. No migration, backfill or catalogue seed is included.

## Guest saved searches

The `/dashboard` route no longer treats an entered email or an admin JWT as guest authority. Request an email link, open it, then explicitly confirm it. The one-time fragment bearer is removed before React mounts API consumers and is never written to browser storage. Only its server-confirmed management session is stored in sessionStorage; its isolated API client sends `X-Saved-Search-Session` and does not attach the admin JWT. Clear proof on expiry/401 and revoke it on logout. New-tab/browser/session-storage behavior and expiry must be tested against the real API, not inferred from mocked responses.

API base remains the backend origin plus `/api` in build-time `VITE_API_URL`. Backend contracts:

- `POST /saved-searches/access-links {email}`: generic202 request receipt, not proof of delivery or access.
- Explicit `POST /saved-searches/access-links/consume {token}`: `{success,data:{token,email,expiresAt}}`.
- Private `GET /saved-searches?page=N&limit=20`: scoped data array plus sibling pagination (`currentPage,totalPages,totalSearches,hasNextPage,hasPrevPage`). Detail, update, delete and matching-preview calls require the same session header.
- `DELETE /saved-searches/session`: revoke current proof.
- Public saves are pending202 receipts with alerts off. A link does not bulk-subscribe pending or legacy searches. Each valid search requires its own explicit verified alert opt-in; consent dates come from the server. Invalid criteria (including null from corrupt legacy data) must not become an unrestricted browse replay.

Keep public listings, viewing/contact submissions, and the company WhatsApp link accessible. Sold/Rented listings remain visible, reject new viewings and allow enquiries. Matching previews may include unavailable listings; the alert worker excludes them. List pagination must remain reachable after deleting the final record on a page; matching previews are explicitly limited to ten even when the backend reports a larger exact count.

## Owner login

Owner email and approved enquiry recipient: `zawamuproperty@gmail.com`. Sign in at `/login`, then use `/admin`; owner inbox is `/admin/enquiries`. Backend checks the current persisted account against backend-only `ADMIN_EMAILS`; neither a UI flag nor a stale JWT email is sufficient.

The existing password is preserved, not extracted or reset. There are no default credentials, and a bcrypt hash is not a usable login password. Obtain the password from its current credential holder; an explicitly authorized recovery and secure delivery channel are separate operations. Registration remains disabled.

Admin alert execution now confirms an explicit POST to `/saved-searches/admin/check-matches`; it does not parse or expose subscriber match/email arrays. The backend remains feature-gated and durable. No timer is activated from the UI or by this checkpoint.

## Tooling and dependency changes

Use npm and Node22.12+ with the committed lockfile. Targeted security fixes update Vite7/Vitest5/plugin-react-swc4, React Router7 (compatible React18 routes), MDXEditor4, and the compatible ESLint/TypeScript-ESLint chain. Vitest's fork execArgv configuration is migrated without excluding source or suppressing rules. Unused backend-only dependencies and nonexistent `dev:server` are removed. Scoped overrides replace vulnerable selector-parser/nanoid/minimatch transitives; compatible sucrase/brace-expansion updates complete the audit repair.

The auth context and non-component button/toggle variants are separated into modules to satisfy refresh-boundary rules rather than disable lint. Existing business fields and admin password behavior remain intact. Transport mocks in unit tests are explicitly identified; they prove client behavior, not provider delivery.

## Verification evidence

Clean sibling snapshot: `$TMPDIR/zawamu-launch-clean-4smmkfwe/result.json`. Both `npm ci --ignore-scripts` runs passed. Frontend `npm test -- --run`: **185 passed in 28 files**, with `npm run typecheck`, full `npm run lint`, and `npm run build` passing. Backend `npm test`: **152 passed**, no failures/skips. Both full `npm audit --json` and production `npm audit --omit=dev --json` report zero vulnerabilities in each repository. Supplementary44changedfrontendfilelint,23changedbackendJS syntax and whitespace passed. The build retains a nonblocking large-chunk warning; no rule/threshold suppression or source exclusion was used. Executable source/test/config hashes match the executed and reviewed packets; later handoff/docs edits are not code changes.

Independent read-only reviews: backend specification/security `deleg_e3d3e6b5` PASS; frontend specification/contracts `deleg_4aeeada6` PASS; second-stage full-stack quality/security `deleg_5a4c554a` PASS/no blockers. Nonblocking suggestions remain: shared upstream limits and full-catalog matching throughput need operational review; admin completion text does not show continuation, and guest users may explicitly request an additional link after a pending save already requested one.

Final integrated run `e4539882-d033-4270-8729-daf636e13eff` passed all11 gates against clean sibling copies: executable backend startup200/401 without fallback, real Mongo8, Vite production preview and Chromium. Browser: **105 assertions,80 API responses**, no unexpected4xx/external hosts, management-token leakage, unclassified console errors or uncaught page errors. Five desktop/mobile overflow checks passed; parent inspected both screenshots. Management reconciled108 saved searches across six pages and250 exact property matches in100/100/50/0 slices. Guest confirmation/ownership/consent/replay/expiry/logout, fixture owner/ordinary/anonymous boundaries, disabled registration, owner property/inbox and persisted general/property enquiries passed. Fixture account login does not verify the retained owner's password/account.

Worker checks passed for immediate/daily/weekly cadence, concurrent deduplication, terminal unknown/no resend and no-consent exclusion:8 immediate messages,16 sent/1unknown in concurrent due invocations,27 unique delivery rows in that cohort. A separate two-property unknown digest consumed its one-message daily quota and suppressed a new third property without another transport call. Exact09:00 boundary cases remain unit coverage; runtime samples were1ms before and5minutes after Monday09:00 Africa/Nairobi. Real CLI dry-run left collections/counts/indexes and mail counts unchanged. Database drop/empty read-back, exact labelled container absence and backend/preview/browser cleanup were verified.

Durable exact results and executable input SHA-256 bindings are in [`launch-readiness-evidence.json`](launch-readiness-evidence.json). Font/currency/image transports and the actual Nodemailer ESM transport were explicitly stubbed; mail remained in loopback memory. No real provider message, production data/account access, push or deployment occurred. Local acceptance is not launch approval.

## External gates and push preparation

Actual SMTP credentials/domain authentication, trusted runtime origins, deployed owner account/password verification, proxy-hop/shared limiter configuration, staged provider delivery, timer activation, deployed SHA pairing and rollback approval remain external gates. `npm run check:release` in the backend reads inherited configuration without `.env`, database or provider access and never declares launch approval. A source template is not host configuration.

Review the paired backend `docs/launch-readiness.md` and this repository's `DEPLOYMENT_CHECKLIST.md`. Prepare the exact local commits and remote divergence report, then stop. Push/deployment/production writes and real messages each need separate authorization. Disable alert execution before rollback, preserve consent/session/delivery and enquiry/property records, and never restore the former public saved-search management endpoints.
