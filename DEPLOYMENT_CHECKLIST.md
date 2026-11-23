# Property Updates — Release Checklist (Phases A–F and launch readiness)

This is an operator checklist, **not push/deployment approval**. Phases A–F are locally committed; the launch-readiness follow-up repairs remaining local code and prepares another scoped local commit, then stops. Read `docs/launch-readiness.md` for current evidence; historical acceptance remains historical. Do not push, deploy, send real messages, or change production data without separate approval. No migration tooling, backfill or feature-catalog seeding is required or permitted in this scope. A passing configuration check/template is not release approval.

## Blocking launch gates

- [ ] Configure `CONTACT_NOTIFICATION_EMAIL` as the approved `zawamuproperty@gmail.com`; the template is not host configuration.
- [ ] Configure backend `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_FROM`, and paired `SMTP_USER`/`SMTP_PASSWORD` when authentication is needed. Use an approved staging recipient for a separately authorized real-delivery rehearsal; mocked transport acceptance does not prove delivery.
- [ ] Allowlist the existing approved owner `zawamuproperty@gmail.com` in backend-only `ADMIN_EMAILS`; an empty value intentionally denies all owner access. Preserve its password and disabled registration. No default account/password is created here.
- [ ] Set backend `FRONTEND_URL` to the trusted HTTPS website origin and frontend `VITE_API_URL` to the API base including `/api`; confirm host CORS permits the intended site. Never expose SMTP, database, JWT or owner secrets through `VITE_` values.
- [ ] Validate the exact proxy chain and `TRUST_PROXY_HOPS` (default 0); prevent untrusted direct ingress and use upstream/shared rate limiting for multiple API processes. The contact limiter is process-local.
- [ ] Require final follow-up typecheck/lint/tests/build and full/production audit reports for the exact release inputs. Do not substitute historical Phase F results or interim checks.
- [ ] Verify email-link guest ownership, expiry/revocation, cross-email denial, explicit per-search consent and invalid-criteria fail-closed behavior against the deployed API. Admin JWTs are not guest proof. Never restore former public email/ID CRUD/results routes.
- [ ] Keep `SAVED_SEARCH_ALERTS_ENABLED=false` until approved provider acceptance. The former send-capable GET is disabled. Owner POST `/api/saved-searches/admin/check-matches` and `npm run alerts:run -- --execute` use the durable worker; neither is a health probe. CLI defaults to read-only dry-run and never loads `.env`.
- [ ] Review unique delivery/lease indexes, immediate-per-invocation/daily09:00/weeklyMonday09:00 Africa/Nairobi cadence, quotas, overlap and uncertain-send quarantine. Verify true dry-run nonmutation on disposable infrastructure. Separately approve actual timer activation/frequency; none is activated here. SMTP is not transactionally exact-once.
- [ ] Run backend `npm run check:release` with inherited configuration, then separately approve actual origins, proxy/shared controls, existing-owner login, provider delivery and rollback pair. Its safe report always has `launchApproved:false`.
- [ ] Record both repository release SHAs, immutable artifacts and the exact pre-release rollback pair before deployment. Do not roll back to publicly writable admin endpoints.

## Local acceptance evidence

- [x] Backend clean `npm ci --ignore-scripts`, `npm test` (152 passed), changed-JS syntax (23 files) and whitespace checks passed; exact input bindings are in `docs/launch-readiness-evidence.json`.
- [x] Frontend clean `npm ci --ignore-scripts`, `npm test -- --run` (185 passed/28 files), typecheck, full lint, changed-file lint (44 files), production build and whitespace passed. Both repositories' full/production audits report zero; no rule/source exclusions. Nonblocking bundle-size warning retained.
- [x] Real owned loopback Mongo8, executable Express startup and production Chromium acceptance passed (run `e4539882-d033-4270-8729-daf636e13eff`):105 assertions/80API responses, fixture owner/ordinary/anonymous boundaries, persistence/read-back and verified cleanup. No retained `.env` or accounts used.
- [ ] Verify create/edit/reload of Apartment, Bungalow, Townhouse and Land monthly rentals; retained sale types, legacy raw records and image/feature snapshots remain readable without read-time writes.
- [ ] Verify custom locations and reusable features across properties, case/whitespace duplicate handling, discount precision and effective-price filters, zero/unbounded bounds, KES/USD display and monthly labels.
- [ ] Verify Sold/Rented visibility across public surfaces, disabled viewing CTAs, direct API 409/no insertion, retained enquiry/WhatsApp draft actions, and no real WhatsApp send.
- [ ] Verify general/property enquiries persist before notification; owner inbox paging, filters, detail/status/retry, legacy records, missing configuration, controlled SMTP failure/recovery and retry concurrency. Receipt means saved, not delivered.
- [ ] Verify saved-search save/replay/matching/alerts agree on purpose, free-text location, canonical types and effective price. Retained structured constraints must not match a property missing those fields; ambiguous old house/commercial criteria must not broaden silently. New availability alerts exclude Sold/Rented/unknown statuses.
- [ ] Verify escaped alert HTML, trusted listing links and real Mongoose document mapping using a controlled transport. Label all transport/rate/font fixtures explicitly.
- [x] Follow-up unit/component and real runtime layers verify pending saves/link confirmation/opt-in, private pagination beyond100, last-row page clamping and30-day timer scheduling (component regressions), fragment clearance, logout/revocation, exact match totals, concurrent/repeated worker calls, unknown-quota safety and CLI nonmutation. Layer/fixture limits remain explicit in the evidence report.
- [ ] Check mobile/desktop overflow, keyboard controls, form labels/errors, badge/action readability and browser console/page errors. Bind results to tested source hashes.

## Separately authorized deployment sequence

1. Confirm every launch gate above and obtain explicit push/deployment approval. Preserve database backups and old structured location fields; no destructive cleanup or automatic backfill.
2. Release the compatible backend first, then the frontend. Avoid old editor clients submitting full response metadata to the strict property write allowlist; use a short coordinated release window if necessary.
3. Verify the deployed SHAs and host health, public browse, anonymous contact/viewing submission and owner/ordinary denial boundaries. Only use approved test recipients and data for any live operations.
4. Confirm one approved general and property email arrives with correct trusted context, then verify notification failure/retry using approved staging infrastructure. Local controlled sends are not this proof.
5. Enable any operational alert invocation only after saved-search privacy/delivery risks are approved. No scheduler, bulk send or production match trigger is authorized by this document.

## Rollback

Roll back application artifacts as a reviewed backend/frontend pair; do not delete source files or collections as a recovery technique. Disable the alert feature and stop invocation first; let in-flight leases settle. Retain enquiry/retry state, property fields, feature catalog, location metadata, guest sessions/consent and the delivery ledger. Never delete unknown delivery evidence or reset counters to force retries. Never restore public admin writes, login-only inbox access or public saved-search management. Old saved-search consumers do not understand the new ownership/purpose/location/effective-price/consent semantics: disable incompatible consumers during rollback rather than exposing records or sending broadened/mispriced alerts. Verify health, browse, permissions and retained data after rollback; any data repair requires separate approval.
