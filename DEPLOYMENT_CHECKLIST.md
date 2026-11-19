# Property Updates — Release Checklist (Phases A–F)

This is an operator checklist, **not deployment approval**. Phase F authorizes local code and explicitly disposable acceptance only. Do not push, deploy, send real messages, or change production data without separate approval. No migration tooling, backfill or feature-catalog seeding is required or permitted in this scope. This supersedes the older viewing-only checklist.

## Blocking launch gates

- [ ] Approve the actual business enquiry recipient; `CONTACT_NOTIFICATION_EMAIL` remains TBD. Existing website copy is not recipient approval.
- [ ] Configure backend `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_FROM`, and paired `SMTP_USER`/`SMTP_PASSWORD` when authentication is needed. Use an approved staging recipient for a separately authorized real-delivery rehearsal; mocked transport acceptance does not prove delivery.
- [ ] Allowlist approved existing owner accounts in backend-only `ADMIN_EMAILS`; an empty value intentionally denies all owner access. Public registration remains disabled.
- [ ] Set backend `FRONTEND_URL` to the trusted HTTPS website origin and frontend `VITE_API_URL` to the API base including `/api`; confirm host CORS permits the intended site. Never expose SMTP, database, JWT or owner secrets through `VITE_` values.
- [ ] Validate the exact proxy chain and `TRUST_PROXY_HOPS` (default 0); prevent untrusted direct ingress and use upstream/shared rate limiting for multiple API processes. The contact limiter is process-local.
- [ ] Resolve or explicitly risk-accept inherited dependency advisories, remaining frontend typing/lint debt, and public saved-search ownership/privacy gaps. Phase F matching fixes are not an authentication rewrite or a launch security approval.
- [ ] Decide how saved-search alerts will be invoked operationally. The owner-only match trigger is not a scheduler; saved frequency choices alone do not establish automatic delivery, deduplication or exact-once guarantees.
- [ ] Record both repository release SHAs, immutable artifacts and the exact pre-release rollback pair before deployment. Do not roll back to publicly writable admin endpoints.

## Local acceptance evidence

- [ ] Run backend `npm ci`, `npm test`, changed-JS syntax checks and `git diff --check`.
- [ ] Run frontend `npm ci`, `npm test -- --run`, `npm run typecheck`, `npm run lint`, changed-file lint, `npm run build` and `git diff --check`. Keep baseline failures visible; no rule suppression or source exclusion.
- [ ] Rehearse against an explicitly disposable isolated loopback MongoDB: real persistence/read-back, production frontend/Express integration, owner/ordinary/anonymous boundaries, and verified cleanup. Do not load production `.env` files in test runners.
- [ ] Verify create/edit/reload of Apartment, Bungalow, Townhouse and Land monthly rentals; retained sale types, legacy raw records and image/feature snapshots remain readable without read-time writes.
- [ ] Verify custom locations and reusable features across properties, case/whitespace duplicate handling, discount precision and effective-price filters, zero/unbounded bounds, KES/USD display and monthly labels.
- [ ] Verify Sold/Rented visibility across public surfaces, disabled viewing CTAs, direct API 409/no insertion, retained enquiry/WhatsApp draft actions, and no real WhatsApp send.
- [ ] Verify general/property enquiries persist before notification; owner inbox paging, filters, detail/status/retry, legacy records, missing configuration, controlled SMTP failure/recovery and retry concurrency. Receipt means saved, not delivered.
- [ ] Verify saved-search save/replay/matching/alerts agree on purpose, free-text location, canonical types and effective price. Retained structured constraints must not match a property missing those fields; ambiguous old house/commercial criteria must not broaden silently. New availability alerts exclude Sold/Rented/unknown statuses.
- [ ] Verify escaped alert HTML, trusted listing links and real Mongoose document mapping using a controlled transport. Label all transport/rate/font fixtures explicitly.
- [ ] Check mobile/desktop overflow, keyboard controls, form labels/errors, badge/action readability and browser console/page errors. Bind results to tested source hashes.

## Separately authorized deployment sequence

1. Confirm every launch gate above and obtain explicit push/deployment approval. Preserve database backups and old structured location fields; no destructive cleanup or automatic backfill.
2. Release the compatible backend first, then the frontend. Avoid old editor clients submitting full response metadata to the strict property write allowlist; use a short coordinated release window if necessary.
3. Verify the deployed SHAs and host health, public browse, anonymous contact/viewing submission and owner/ordinary denial boundaries. Only use approved test recipients and data for any live operations.
4. Confirm one approved general and property email arrives with correct trusted context, then verify notification failure/retry using approved staging infrastructure. Local controlled sends are not this proof.
5. Enable any operational alert invocation only after saved-search privacy/delivery risks are approved. No scheduler, bulk send or production match trigger is authorized by this document.

## Rollback

Roll back application artifacts as a reviewed backend/frontend pair; do not delete source files or collections as a recovery technique. Stop alert invocation first. Retain enquiry records and retry state, property fields, feature catalog and structured location metadata. Never restore public admin writes or login-only inbox access. Old saved-search consumers do not understand new purpose/location/effective-price semantics: disable those consumers during rollback rather than sending broadened/mispriced alerts. Verify health, browse, permissions and retained data after rollback; any data repair requires separate approval.
