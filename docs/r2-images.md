# R2 image delivery

New owner uploads are processed by the backend into WebP thumbnail/card/large variants and stored only in Cloudflare R2. The application no longer includes a Cloudinary upload integration or SDK. Existing saved image URL strings remain compatible; they are not automatically transferred or deleted. Do not cancel the old asset-hosting account until all retained references have been separately inventoried and transferred/replaced and verified. No production data change or migration tooling is included here.

## Public build configuration and paths

The subsequent HEIC upload checkpoint accepts JPEG, PNG, WebP, AVIF and HEVC HEIC/HEIF phone photos in owner property create/edit and blog creation. Explicit picker formats and filename placeholders avoid broken HEIC previews in browsers without a decoder. Files are submitted unchanged and converted by the backend into the same WebP variants; original HEIC files are not stored. Limits remain 8 MiB / 24 million pixels per image. See sibling backend `docs/heic-uploads.md` and the new `docs/heic-uploads-evidence.json`; historical R2 evidence below predates this follow-up. Release the compatible backend first; no deployment is authorized here.

Set `VITE_MEDIA_PUBLIC_URL=https://media.<your-domain>` at build time, matching backend `R2_PUBLIC_URL` (a trailing slash is normalized). A prefix such as `/assets` may be used on both sides. That prefix is stored in each R2 object key and stays in the public URL path: `/assets/images/v1/...` must directly resolve to the `assets/images/v1/...` object key; do not depend on a CDN/path-stripping rewrite. This is a public HTTPS delivery domain, **not the authenticated R2 S3 API endpoint**. No R2 credentials belong in the frontend.

The upload endpoint still returns `{ urls: string[] }`, with a canonical large image URL per input in order:

`<base>/images/v1/<random UUID-v4>/large.webp`

Persist these original strings in property `images` and blog `image`; never persist presentation-derived URLs in place of them. All three variants exist in the same directory: `thumbnail.webp`, `card.webp`, `large.webp`. The resolver changes only exact configured-owned versioned UUID paths. Legacy/nonmatching/foreign/blob URLs remain unchanged; no Cloudinary-specific URL transformation exists. Missing/invalid media-base configuration retains the original URL (functional, but without size selection).

| Context | File | Maximum bounding box |
| --- | --- | --- |
| Admin saved previews / gallery thumbnails | thumbnail.webp | 320 × 320 |
| Property, blog and saved-result cards | card.webp | 768 × 768 |
| Property/blog detail | large.webp | 1600 × 1600 |

Backend Sharp processing preserves aspect ratio, auto-rotates phone EXIF, strips metadata, never upscales small images, and produces WebP only. Bounds are not crops or guaranteed output dimensions. Do not assign nominal width descriptors to small variants as though they were actual encoded widths. No unoptimized original is uploaded. Inputs are limited to8MiB/24million pixels; unsupported, animated/multipage or corrupt images fail with safe errors. At most10 images per request and one active batch per API process;503/Retry-After5 asks the user to retry.

R2 custom domains are the production delivery path; r2.dev is development-only/rate-limited. Ordinary image elements do not require `crossOrigin="anonymous"`; do not introduce it without an actual canvas/fetch requirement. Cache new immutable UUID objects for one year; never overwrite their contents. Sharp native binaries must be installed on the backend's deployment platform using the npm lockfile and optional packages.

## Release, rollback and lifecycle gates

Read sibling backend `docs/r2-images.md` for credential scope, explicit endpoint/timeout/batch bounds, safe error mapping and best-effort compensation. The backend attempts deletion of fresh keys on failed batches, not arbitrary supplied URLs; object/network uncertainty can still leave orphans. Cancelled uploads, failed property saves and removed references are not automatically garbage-collected. Define media ownership/reference tracking/retention before automatic deletion.

Before deployment, separately authorize and verify a real canary upload with the intended bucket/secret, public delivery for all variants, MIME/cache headers and approved-key compensation; rebuild frontend with the matching base, and verify actual browser requests across card/detail/admin contexts. Retain a compatible backend/frontend rollback pair that understands the immutable layout. Do not roll back owner authorization or remove objects that retained records still use. Provider credentials, DNS, public bucket delivery and the old-account asset retirement are **not proven by local tests**.

See `docs/r2-images-evidence.json` for executed source-bound local checks and fixture limitations. No push/deployment, production account/database access, real R2 upload or Cloudinary deletion/account cancellation is authorized or performed by this checkpoint.
