# Welcome to your Zawamu Properties project

## Current launch-readiness follow-up

Saved-search management now requires an email-verified guest session, separate from admin login. See `docs/launch-readiness.md` and `DEPLOYMENT_CHECKLIST.md` for current contracts, evidence and push/deployment boundaries; older Phase A–F sections below describe those historical checkpoints. Use Node 22.12+ and npm with the committed lockfile. Follow-up verification is in progress, not launch approval.

## Project info

**URL**:

## How can I edit this code?

You can edit your application in several ways:

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## Phase A: owner-aware admin access and tests

Read `AGENTS.md`, `handoff.md`, and the phase acceptance documents in `docs/`. Work proceeds through separate verify/review/commit/approval checkpoints; do not infer authorization for later phases from historical status below.

Use npm with the committed package lock:

```sh
npm ci
npm test -- --run
npm run typecheck
npm run lint
npm run build
```

`typecheck` checks the application and Node/Vite configuration, rather than only the empty solution config. Baseline application typing/lint errors are documented separately; do not suppress them or report a clean repository-wide gate without proof. Vitest/React Testing Library fixtures are simulated UI/API responses, not evidence of production authentication.

Configure `VITE_API_URL` with the backend base including `/api`. Backend login and profile return `{ id, name, email, isAdmin }`. Only `isAdmin === true` enables owner routes/navigation; missing flags fail closed. This UI is not a security boundary: the backend independently checks its current persisted account against backend-only `ADMIN_EMAILS` on each protected request. Never put that allowlist in a `VITE_` variable.

Anonymous admin navigation goes to sign-in; ordinary accounts cannot mount admin pages and go to their dashboard; owners can enter admin routes. Session restoration must not resurrect an earlier account after logout or a newer login.

Phase A evidence does not establish acceptance of later product phases or production deployment.

## Phase C: owner property workflow

The create and edit flows share property fields and use the Phase B backend contract:

- Purpose and property type are independent. Monthly rentals support Apartment, Bungalow, Townhouse, and Land; sales also retain Maisonette and Office space.
- The owner enters a free-text location. Editing retains existing structured location metadata rather than erasing it.
- Availability must match the purpose: Available/Sold for sales, Available/Rented for rentals. Changing purpose on an unavailable listing requires a compatible availability choice.
- Price is the undiscounted sale price or monthly rent. Offers accept 0–99.99 percent with at most two decimals. A live preview is advisory; the saved API response is authoritative.
- Land does not require bedrooms or bathrooms. Existing image upload handling and the ten-image limit remain.
- Features load from public `GET /features`; owner-only `POST /features` creates or reuses a whitespace/case-normalized name. Existing property feature snapshots remain selectable even if absent from the catalog. Removing a selection never deletes the shared feature. There is no migration or automatic catalog seeding.
- Property writes use explicit editable fields, not a spread of API response metadata. On errors the editor retains inputs; conflicts require reloading before retrying. The management table uses the server's saved response.

## Phase D: public browsing and availability

Public listings, featured cards and details share sale/rental pricing, discount and availability badges. The owner's free-text location takes priority over retained structured metadata. Rentals show `/ month`; offers show the base amount struck through and the discounted KES amount with approximate USD conversion. Exchange rates remain approximate, not a payment quote.

Browse supports All / For Sale / For Rent, independent property type, free-text location, and optional minimum/maximum effective-price amounts. Empty price bounds are unbounded, including sale listings above KSh 20 million. Sold/Rented listings stay visible; Land hides bedroom/bathroom statistics. Viewing controls are disabled for unavailable listings. A stale page receiving HTTP 409 preserves the form and blocks repeat submission for that listing while retaining a Contact link.

WhatsApp links use the shared company destination `254711168716` and include the listing title and public URL on the current site origin. They open a chat draft only; the application does not automatically send messages. Phase E implements real contact submission/email and property enquiry forms; Phase F aligns saved-search/alert criteria. Unsupported criteria fail closed rather than silently saving a different search.

Each phase remains a separate approval checkpoint, not launch approval. Backend-only `ADMIN_EMAILS`, the notification recipient and mail configuration remain rollout gates.

## Phase E: public enquiries and owner inbox

- The general contact form and the property-details enquiry form submit through the shared `src/components/contact/EnquiryForm.tsx` to `POST /contact`. General enquiries preserve the optional phone and interest fields plus the subject; property enquiries send `source: "property"` and the listing ID, and display that listing's title as context. Sold/Rented listings still accept enquiries.
- The form treats `{ received: true }` as persisted receipt, clears inputs only after that confirmation, prevents duplicate submissions, and retains the user's entries on API failure. The confirmation does not claim that an email was sent.
- Owner inbox: `/admin/enquiries` is protected by the same owner-only `AdminRoute` as other admin pages. It requests server-side pages of 20 and applies `status` / `source` query filters; detail, status updates, and notification retry use the owner `/contact` API endpoints. Retry is disabled for sent/sending notifications and after five attempts.
- Legacy three-field contacts render as general/new with safe missing-date and notification defaults. The inbox keeps public enquiries separate from viewing appointments. API/form fixtures in frontend tests are mocks, not real mail-delivery or production access evidence.

This frontend assumes the Phase E backend contract: `POST /contact` returns `{ message: "Your enquiry has been received.", received: true }`; owner `GET /contact` returns `{ items, total, page, limit, pages }`; owner detail/status/retry endpoints return an enquiry DTO. The notification recipient and SMTP/owner rollout configuration remain backend operational gates.

## Phase F: saved searches and result replay

Listings can save free-text location, optional For Sale/For Rent purpose, canonical property types and effective discounted-price bounds alongside search term and bedroom/bathroom constraints. Summaries identify monthly rent and preserve zero/cents bounds. Saved search View Results replays these criteria through `/listings?search=<encoded JSON>`; Clear All Filters explicitly removes replay constraints. Existing structured county/constituency/ward and hidden maximum bedroom/bathroom bounds remain active and visible in the retained-criteria summary, not silently discarded.

Historical `apartment`, `land` and `office` types map only to Apartment, Land and Office space. `house`/`commercial` are labelled exact legacy types rather than inferred categories. Old structured-location searches do not match a manually located property missing the required structured fields. County `all` is the historical no-county-filter sentinel; retained constituency/ward constraints still apply. Malformed/unsupported replay criteria show an error and no results, with save/replay actions disabled until explicitly cleared; no broad fallback search is substituted.

The saved-search manager's matching previews use the shared price, location and availability components. Saved browse matches may include Sold/Rented listings; only available listings qualify for new-property email alerts. The backend matcher and alert sender remain authoritative. UI/API test responses are mocks unless the acceptance report explicitly records disposable Mongo/HTTP/browser execution.

The launch-readiness follow-up replaces typing an email as authority with a one-time email link and explicit confirmation. A dedicated sessionStorage proof and `X-Saved-Search-Session` client scope private CRUD/results; admin JWTs do not grant guest access. Public saves return a pending receipt with alerts off. Each pending or legacy search needs an explicit verified alert opt-in; consuming a management link alone does not subscribe anyone. Invalid legacy criteria disable replay and alerts rather than falling back to an unrestricted search. The manager uses server pages and labels matching previews limited to the first ten results.

## Deployment authorization

Use `DEPLOYMENT_CHECKLIST.md` as the current coordinated release/rollback checklist; historical viewing-only instructions are not release approval. Phase F covers final local verification only. Pushing, deployment, production writes and real message delivery require separate approval. Release the compatible backend before the frontend, preserve legacy location metadata and stored enquiries, and do not introduce migration/backfill/catalog seeding jobs.

The approved business enquiry recipient and owner email are `zawamuproperty@gmail.com`. Launch still requires working backend SMTP sender/credentials, that existing account in backend-only `ADMIN_EMAILS`, trusted backend `FRONTEND_URL`, correct frontend `VITE_API_URL` including `/api`, and validated proxy/shared rate-limit configuration. The existing admin password is unchanged and cannot be recovered from its bcrypt hash; there are no default credentials. Controlled mail fixtures are not real-provider delivery evidence. Verified saved-search ownership and durable worker/cadence fixes are local changes, not permission to enable bulk alerts or activate a timer. The old send-capable GET is disabled; admin execution uses explicit POST and feature opt-in. Current follow-up acceptance records, not historical baseline failures, determine typing/lint/dependency status.

You can deploy this project using your preferred hosting provider (e.g., Vercel, Netlify, etc.).

## Can I connect a custom domain?

Yes, most hosting providers allow you to connect a custom domain to your deployed project.
