# Lessons learned

Things that cost time or would have been wrong if assumed. Newest first.

---

## Vercel defines env vars as empty strings — `??` does not catch them

Vercel build failed with `TypeError: Invalid URL … input: ''` from next.config: the project had
`NEXT_PUBLIC_SERVER_URL` defined but blank, and `process.env.X ?? 'fallback'` only falls back
on undefined, so `new URL('')` threw. Four call sites had the same shape, and env.ts also
defaulted to a stale localhost:3000 — which would have pointed Payload's serverURL at localhost
in production.

All now go through `src/lib/site-url.ts`: a non-blank `NEXT_PUBLIC_SERVER_URL`, else Vercel's
system vars (`VERCEL_PROJECT_PRODUCTION_URL` on production, `VERCEL_URL` on previews), else
localhost:3100. Verified by loading next.config under each env combination.

---

## React `<ViewTransition>` never fired on Next 16.3 navigations

The Next docs say view transitions "work in the App Router with no configuration". Here,
`document.startViewTransition` existed and worked when called by hand, but across a `<Link>`
navigation React never applied a single `view-transition-name`, in dev or production.
Replaced with `src/motion/NavExit.tsx`: a capture-phase click interceptor that sets
`html[data-leaving]`, lets CSS exits run for 240ms, then `router.push`es. `<Link>` checks
`e.defaultPrevented` and stands down. Verified by sampling computed styles in-page — a CDP
screenshot takes longer than the whole exit, so screenshots alone showed nothing.

---

## Constants exported from a `'use client'` module are not values on the server

`ENTER_DELAY` imported from `PageStage` (a client file) into a server component arrives as a
client reference, and calling `seedFrom()` the same way throws. Shared constants and pure
helpers live in plain modules (`src/motion/timing.ts`, `src/ink/*.ts`).

---

## Ink: metaballs read as droplets; polar blots + composited bloom read as ink

Metaballs (circles fused by a blur/threshold "goo" filter) gave liquid-looking splashes, but a
spill built from them spread "one drop at a time", and specular lighting made it plastic 3D.

What works (`src/ink/blot.ts`): each shape is one polar outline — slow wobble, scalloped rim,
and needle spikes with their own dense angular sampling. Splatter adds tapered streaks that
thicken to a bead where they land, all along one line of travel.

Watercolor behaviour comes from **two stacked SVGs per ink piece**: the crisp mark, and a
blurred bloom copy. After the hit, only `transform`/`opacity` animate on those layers, so the
slow spread and fade run on the compositor and the (expensive) SVG filters rasterise once.
Animating the shapes inside a filtered SVG instead re-runs the filter every frame.

---

## Two layout bugs worth remembering

- `.drawer { display: grid }` overrides the `hidden` attribute (author CSS beats the UA
  `[hidden]` rule) — the mobile menu sat open over every page. Needs `[hidden]{display:none}`.
- Per-character `inline-block` spans (for the ink-in animation) let lines break *mid-word* on
  phones. Characters are grouped into `nowrap` word spans.

---

## React 19 resets an uncontrolled form after its action — which broke the retry path

Submitting the contact popup with a wrong challenge answer showed the error correctly, but
correcting the answer and submitting again did nothing. Server logs showed the action ran
**once**, never twice.

Cause: React 19 automatically resets a form given a function `action` once that action
resolves. On a rejected submit that wipes name, email and message. The next `requestSubmit()`
then failed HTML5 `required` validation on the now-empty fields and never reached the server,
so the stale error just sat there looking like the same rejection.

Fix: the action echoes the submitted values back in its state (`FormState.values`) and the
inputs take them as `defaultValue`, so React's reset lands on the restored values. A wrong
answer now costs the one field, not the whole message.

Worth remembering because it silently degrades *any* server-action form with validation.

---

## Star polygons: get the inner radius from the construction, never by eye

For {n/m} the inner radius is `R · cos(mπ/n) / cos((m−1)π/n)`. Two wrong formulas were tried
first — one giving 0.94·R, one giving exactly 1.0·R — and **both render as plain circles**, not
stars. The Moroccan khatam is m = 2 (0.765·R at n = 8); m = 3 is the sharper echo star.

Two other things that decide whether it reads as zellij rather than "stars on a grid":

- **Radius is pinned to half the lattice spacing** so neighbouring khatams meet point to point.
- **The cross is never drawn.** It is the negative space between four touching stars, so its
  outline is already the stars' own edges. Drawing it separately produced self-intersecting
  bowties.

Also guard `m < points/2`: an eight-point medallion drove the denominator through zero and blew
the coordinates up to infinity.

---

## Painting a brushstroke: mask it with a fat dashed line down its own spine

A brushstroke has to be a **filled outline** (its width varies along its length, and SVG
`stroke-width` cannot), but a filled shape can only fade in — which reads as a dissolve, not a
brush.

The fix in `src/motion/BrushStrokes.tsx`: keep the stroke's centre line, and use it as a mask —
a `<path>` stroked at ~1.7× the stroke's max width, `pathLength="1"`, `stroke-dasharray: 1`,
animating `stroke-dashoffset` 1 → 0. The outline is revealed *along its own direction*, so it
paints on like a real mark. One short path per stroke, so it stays cheap.

`src/brush/strokes.ts` generates the geometry: a quadratic spine, a width profile that lands
thick / swells / lifts to a point, offset along the normal into a closed outline.

**Placement matters more than shape.** Positioning each stroke independently piled them into an
illegible blob. Sharing one gesture angle and offsetting each stroke along the *perpendicular*
is what makes them read as a set of distinct marks.

---

## `revalidatePath` throws outside a request context and killed the seed script

`Invariant: static generation store missing in revalidatePath /archive` — the collection
`afterChange` hooks fire on any write, including from `pnpm seed`, which has no Next request
context. `bust()` in `src/hooks/revalidate.ts` now swallows that: there is no cache to bust in a
CLI run, so a script must not fail because of it.

---

## next/image refuses local media, and Payload emits absolute URLs

Payload builds media URLs from `serverURL`, so in dev they are
`http://localhost:3100/api/media/file/…`. `next/image` then tried to fetch them as *remote*
images and Next 16 blocked it:

```
upstream image ... hostname resolved to private IP ["::1","127.0.0.1"]
```

That is an SSRF guard, and `images.dangerouslyAllowLocalIP` is the wrong way past it.
`mediaUrl()` in `src/lib/format.ts` strips the origin when it matches
`NEXT_PUBLIC_SERVER_URL`, so same-origin media is served locally and never refetched.
Vercel Blob URLs are a genuinely different origin and stay absolute — those are covered by
`images.remotePatterns` in `next.config.ts`.

---

## Prerendered pages need on-demand revalidation, or edition counts go stale

Every content page builds as static/SSG, which means an edit in the admin would not surface
until the next deploy. For this site that is a correctness bug, not a nicety: `editionsSold` is
what tells a buyer whether a drop is still open.

`src/hooks/revalidate.ts` calls `revalidatePath` from collection/global `afterChange` and
`afterDelete`. Verified against a production build: setting a drop to 25/25 flipped it to
`soldout`, swapped the badge, and disabled the buy CTA on the already-prerendered page with no
rebuild.

Note the hook only fires inside the Next server process — a standalone script that writes via
the local API will not bust the running server's cache. Editing through `/admin` (or the REST
API) does.

---

## `solidammonitewhite.svg` is a filled silhouette, not linework

It is 919 open stroke paths — which is what made it look like ideal draw-in material — but the
strokes are packed so densely that they *fill* the shape. Rendered, it is a solid white ammonite
with black chambers, i.e. the logo, not a line drawing. Numbers:

| epsilon | points kept | output |
|---|---|---|
| 0.4 | 2,555 / 694,779 | 34.7 KB — geometry destroyed, reads as scribble |
| 0.03 | 7,331 | 89.4 KB — still broken |
| 0 (dedupe only) | 43,320 | 500.7 KB — faithful, too heavy to animate |

694,779 stylus sample points for one drawing. There is no setting that makes this both faithful
and light, because pen-draw is simply the wrong treatment for a fill.

**What it is used for instead:** the solid PNG is a CSS `mask-image` on `.mark`
(`src/components/site/Ammonite.tsx`), coloured from tokens. One 47 KB asset, any colour.

**The pipeline is fine** — the input class was wrong. Run against genuinely sparse linework it
drops only ~19% of points and preserves geometry exactly. Real linework exports are still needed
from the artist; the procedural generators cover the gap.

---

## Loading `.env` for the Payload CLI: two traps

Next loads `.env` itself, but the Payload CLI and `tsx` scripts do not, so `src/lib/env.ts`
threw on every CLI invocation.

1. **`--env-file*` is rejected inside `NODE_OPTIONS`** — `node: --env-file-if-exists= is not
   allowed in NODE_OPTIONS`. It has to be a direct flag on `node`.
2. **Wrapping the command in `cross-env` swallowed it entirely** — no output, no file written,
   and a misleading `exit 0`. The identical command run directly worked first time.

So the package scripts call node with the flags on it, no `cross-env`:

```
node --no-deprecation --env-file-if-exists=.env node_modules/payload/bin.js generate:types
```

`--env-file-if-exists` (not `--env-file`) so production, where the platform injects env and no
`.env` exists, doesn't hard-fail.

Related: a config that throws during import makes the Payload CLI exit **0 with no output**.
If a command appears to do nothing, import `src/payload.config.ts` under `tsx` directly — the
real error surfaces immediately.

---

## Payload is Drizzle-based — `db-vercel-postgres` will not talk to Prisma Postgres

The target stack is Vercel + Prisma Postgres. The obvious-looking adapter,
`@payloadcms/db-vercel-postgres`, is bound to the Neon-backed `@vercel/postgres` **websocket**
driver and cannot connect to Prisma Postgres.

**Use `@payloadcms/db-postgres`** (node-postgres) with Prisma Postgres's **direct TCP** URL:

```
postgres://USER:PASSWORD@db.prisma.io:5432/?sslmode=require
```

Direct connections went GA in Prisma ORM 6.17. The default `prisma+postgres://` Accelerate URL
is *not* usable here — it isn't a TCP Postgres endpoint. Watch connection counts on serverless.

Payload also never uses Prisma itself; "Prisma Postgres" here is only the hosting product.

---

## `create-payload-app` needs a TTY

Fails with `uv_tty_init returned EINVAL` in a non-interactive shell even with flags. Pulling
`templates/blank` from the repo tarball at the exact version tag is more deterministic anyway —
it pins the version-sensitive `src/app/(payload)` routes to the Payload version in use.

---

## Concepts exports are animatable — but check whether the drawing is line or fill

Concepts writes real open stroke paths (`fill="none"`), which is exactly what the pen renderer
needs, and any export drops straight into `pnpm motif`. The trap is that *stroke paths* and
*line art* are not the same thing: a drawing whose strokes are packed densely enough reads as a
solid fill, and no amount of simplification recovers it (see the ammonite entry above).

Before treating an export as a motif, render it and look. Two numbers give it away — points per
path, and whether the figure has interior white space.

## `content-visibility: auto` silently kills scroll-reveal animations

A skipped subtree reports its descendants as **not intersecting**, so the IntersectionObserver
driving the ink never fires and the motif stays veiled forever. The `.defer` utility in
`src/styles/base.css` carries a warning; keep it off anything containing a motif.

## `mask-position` is not compositor-accelerated

The original plan was to reveal dense art by animating a CSS mask. Chrome repaints that every
frame, which defeats the point with a 900-path motif. `LineDraw` instead slides an opaque veil
in the page's ground colour using `transform` only — genuinely composited, and the SVG below
rasterises once. The cost is that the veil colour must match whatever sits behind the motif
(hence the `veil` prop); it would break over a photographic background.
