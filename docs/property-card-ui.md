# Property card UI checkpoint

## Scope

Frontend `main`, base `f4826e53350e99f4d58154eeada93c217395a90d`.
The user requested readable purpose/availability badges, separation of Featured,
icon-only equal-width WhatsApp/viewing controls below View Details, and full-card
navigation. The user subsequently authorized pushing the finished changes.
Backend, dependencies, account configuration and delivery behavior are unchanged.

- Solid slate purpose and emerald Available badges provide measured white-text
  contrast of 17.85:1 and 5.48:1 respectively. Sold/Rented/Unavailable remain explicit.
- Featured uses a separate amber star badge at the bottom-left of card imagery.
  On the homepage, property type occupies the bottom-right instead of crowding status.
- Both homepage and listings (grid/list) share `PropertyCardActions`.
  A native details link stretches across its relative, isolated card. The contact
  row sits above that overlay; there are no nested links/buttons or card click handlers.
- Icon-only contact actions retain accessible names, hover titles, keyboard focus
  and 44px minimum targets. Unavailable listings retain WhatsApp/details but disable viewing.
- Property-details WhatsApp buttons retain their text labels by default.

## Executed verification

- Pre-edit focused baseline: 17 tests/4 files, typecheck and affected-source lint PASS.
- New action regression suite initially failed because its component did not exist;
  the implemented suite now passes all 7 cases, including the real viewing dialog,
  Escape/focus restoration, keyboard details navigation and unavailable states.
- Final `npm test`: **192 tests/29 files PASS**.
- `npm run typecheck`, `npm run lint`, targeted six-file ESLint,
  `npm run build`, `git diff --check`: PASS.
- Production build retains its existing nonblocking large-bundle warning.
- Impeccable detector over the five changed UI files: `[]` / exit 0.
- Real production Chromium at `http://127.0.0.1:4179`: **143 assertions PASS**,
  homepage and listings at 320/390/768/1440px, plus list-mode contact actions.
  Image/body clicks navigate; WhatsApp href has the exact company destination and
  local public listing URL, but navigation is intercepted so no message is sent.
  Modal actions do not navigate the card; Escape restores focus. Sold/Rented remain
  visible and their viewing controls disabled. Contact widths are equal and below details.
  No mutation requests, console errors or uncaught page errors occurred.
- Browser transport is an explicit property/blog/currency/font fixture, with a local
  existing hero image. This is presentation/interaction coverage, not real backend,
  exchange-rate, provider-delivery or production acceptance.
- Mobile and desktop card screenshots were visually inspected.
- The first browser attempt found document overflow at 768px: measured overflowing
  elements are the unchanged desktop Header navigation/sign-in controls, not cards.
  This unrelated header issue is retained. Cards themselves fit every tested viewport.
  A separate harness click timeout was corrected by centering the card after modal
  focus restoration before coordinate clicks; no application workaround was added.

## Executed input SHA-256 bindings

```text
d06efc8d4ba1e075026a31172d9b01ed7e59aaad755f7114d005ed87a7661cff  src/components/home/FeaturedListings.tsx
e26a88a259ff47247831cf59a0c9d90bfa6283873f32a9dbeb57c0257fa9d910  src/pages/Listings.tsx
e7f00e1bca62a10299e31229c5d5950b4acdb2f2226becd8b8aa95af0368c607  src/components/properties/PropertyBadges.tsx
434035b5a8130e535da2efb833d7ae3258d3b1af2657ead17b5f10e6a972d08e  src/components/properties/WhatsAppButton.tsx
14b3e5d6ae4253b83e7612e74af9145bfdd8989f9a281a319764f3ca15d20497  src/components/properties/PropertyCardActions.tsx
b0c783cb046a210dfd38ec23375ff052b0a53f818ecfdc2fa8ca94bd9ed4d841  src/components/properties/PropertyCardActions.test.tsx
```

## Closure

Independent review `deleg_c8042917` PASS: no security concerns or logic errors;
reviewer independently ran 12 focused badge/action tests. Nonblocking suggestions:
add caller-level legacy-id regression coverage and pointer-interception unit tests.
The latter interaction is already exercised by the real-browser checks above;
the existing FeaturedListings legacy-id test also remains green. No source repairs
were required after review. The scoped commit containing this document is approved
for the user's requested push. Remote main was read back at the base SHA; only
this frontend checkpoint needs publishing. No backend push,
production data/account operation, provider message or explicit deployment is authorized
by this UI task. Repository deployment configuration contains SPA rewrites only;
provider-side Git auto-deployment cannot be determined from this local configuration.
