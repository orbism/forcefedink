# Force Fed Ink — scratchpad

Running state. **New session? Read `docs/COMPREHENSION.md` first** — it is the verified map of
the code; this file is the history. (The old plan file under `~/.claude/plans/` is gone.)

## Current step

**UI/UX upgrade** — design round 2 built 2026-11-21 (see session log). The v4/v5 design-language
notes below are history; COMPREHENSION.md has the current system. Skills installed for it: `frontend-design`,
`web-design-guidelines`.

### Session log

- 2026-11-20 — Re-acquainted from a cold start. All 8 top-level routes 200 on :3100. Wrote
  COMPREHENSION.md. Found, not fixed: `--s-10` undefined (stage.module.css), 11 unused tokens,
  `src/brush/strokes.ts` dead, 4 unused presets. Build-order table and step-3 component names
  below are stale (LineDraw/PenDraw/BrushCycle/TextDrop/SectionInk/InkLink no longer exist;
  motion is PageStage/DrawGeometry/TypeIn/NavExit).

- 2026-11-21 — Cleanup (uncommitted): `--s-10` defined (group titles now get their 2.5rem top
  margin); 12 unused tokens, 4 unused global classes, `Direction` type, 5 unused presets and
  the `weave` pass removed; PageStage default motif fez → rabat (only seeds the deckle on
  detail pages). ESLint config moved to eslint-config-next's native flat configs (the
  FlatCompat import was unresolvable, lint never ran). tsc clean, 7 routes 200. Vercel CLI
  → 66.6.0. Installed `playwright` + `chrome-devtools-mcp` plugins. Correction to the
  11-20 entry: `src/brush/strokes.ts` is not dead — `scripts/seed.ts` uses it.

- 2026-11-21 — Design round 01 board published (private artifact):
  https://claude.ai/artifact/Ta9GeXM1pk6gTM8DisefnC — live demos for ink engine (new canvas
  physics + per-pixel meniscus shading, prototype JS lives in the board), strapwork, title
  entrance, type, palette, motion tokens, transitions, image loading, speed work, editions.
  Owner's verdicts/picks/notes land in its db: `ArtifactData list` collection `feedback`, one
  doc per section (`ink`, `linework`, `title`, `type`, `palette`, `motion`, `transitions`,
  `loading`, `speed`, `editions`, `order`). Read those before building anything.
  Note: the server already on :3100 was `pnpm start` of a **Sep 26 production build**, not
  dev — it shows stale layouts (e.g. drop detail without the carousel). Use a fresh dev server
  for screenshots of current code.

- 2026-11-21 — Round-1 picks (board db, no written notes yet): ink Leaf · strapwork B Engraved ·
  title C Trace · type B Bodoni Moda + Instrument Sans · palette C ramp + lapis · motion B four
  tokens · transitions A keep exit-then-enter · loading C blur-up · speed: all five · editions A
  ink meter. Owner wants more review time before building them.
- 2026-11-21 — Responsive pass (uncommitted): one 900px breakpoint (side splits become bottom
  sheets below it, was 760), narrow head up to 80vw at full title size (side-split 34vw squeeze
  removed on phones), splash placed beside titles on narrow, detail pages `data-showcase` sheet
  44dvh on narrow, header links nowrap + smaller home nav 900–1199, 44px hit areas on footer
  icons and carousel dots, contact spill capped at 560px on narrow. Audited 10 routes at
  375/768/1024/1440: no overflow-x, no nav wrap.

- 2026-11-21 — Voice: high-end art brand, short and professional, not pompous; not the artist's
  casual IG tone. Round 2 added to the board (same URL, "Round 2" tab): indigo-and-leaf
  direction, ground, gold, construction-first pen, artwork hero, loupe/full view, edition card
  with sizes, voice rewrite table, naming (Drops → Editions) + nav. Feedback keys `r2-*`.
- 2026-11-21 — Shop switched to Payload ecommerce plugin (uncommitted): one Products list,
  migration `20261121_083350_shop` (additive, 20 tables; verified on a throwaway DB), local DB
  backed up to `backups/forcefedink-20261121-033200.sql` first, `pnpm shop:copy` verified 6
  editions + 3 originals (re-run = 0 created), two-size edition round-trip checked then
  deleted. Pages render identical content from products. `pnpm build` NOT run: the owner's
  `pnpm start` on :3100 serves `.next`, and a build would overwrite it.
  Open: remove retired drops/originals collections after owner confirms (that migration drops
  tables); payment adapter last.

- 2026-11-21 — **Round 2 built** (uncommitted). Picks (board db): ground A accents + note
  (indigo only on buttons/actions/some borders, black + gold lead), gold A ramp, construction
  B first, hero A pattern (kept), zoom B loupe + C full view, edition tweak (calligraphic bars
  not circles), naming Editions + new nav; round-1 locked picks applied (type, palette, motion
  tokens, trace titles, Leaf ink, blur-up, all five speed items). Built: tokens/fonts, engraved
  strapwork + construction guides (ink-line filter gone), TraceTitle, canvas ink engine in a
  worker, InkMeter + EditionCard, /editions (+ redirects) and /originals, nav + Contact button +
  footer Information, voice rewrite in code, BlurImage + `media.blurDataURL` (migration
  `20261121_171822_media_blur`, additive; verified on a throwaway DB) + `pnpm media:blur`
  (local: 18/18 backfilled; DB backed up first to `backups/…-pre-round2.sql`), prefetch on
  hover/touch, exit 200ms, contact form streams behind the stage (Suspense). Verified on
  :3101 at 1440 + 390: routes 200, `/drops` 308, trace overlay within 1px of the text, no
  console errors, exit + reduced motion OK. Not done: `pnpm build` (owner's :3100 serves
  `.next`). CMS copy still says "drop" (site settings intro + shipping note, product titles,
  some FAQ questions) — owner to edit or OK me to.

- 2026-11-21 — Layout: bottom sheets now measured to fit under the head (40–80% cap), side
  panels min(60vw, 54rem), short-screen (landscape phone) header/title rules, group headings
  spaced. Sweep at 8 sizes × 11 routes: no overflow, no clipped heads. Board Round 3 ("feel":
  scroll + click effects) published; feedback keys `r3-tap`, `r3-gilt`, `r3-press`,
  `r3-reveal`, `r3-draw`, `r3-stretch`, `r3-wipe`, `r3-cursor`, `r3-magnet`, `r3-order`.

### Brand inputs (Instagram @forcefedink, read 2026-11-21)

- Materials: steel dip + ruling pens, dividers, beam compass; **A4 indigo-dyed Arches paper**
  and black sheets scored with a steel point; bright saturated yellow-gold ink, white/silver
  construction lines, black foil on merch.
- Signature: construction scaffolding left visible (faint compass circles/rules) under the
  bold inked pattern. Bodies of work: Islamic tilings (8/12/24-fold, "Amorphous" pentagon/hex),
  Ammonite golden spiral (the logo), polyhedra (Cromwell/Coxeter), Mandelbrot, star-polygon
  line pieces on black, older mixed media (pink/red), lots of process reels + the cat.
- Voice: plain, wry, process-first ("real clown car of shapes", "Also, my cat.").
- Selling today by DM: prints in multiple sizes (8×8, 12×12), back-catalog 2015 editions,
  seasonal % off + free worldwide shipping, stickers + stamped cards in every order.
- Domain shown in highlights: forcefed.ink.

### Next up

- Not done, needs owner's call: dep bumps (Payload 3.94 / Next 16.4 / React 19.3), the 8 lint
  errors in motion code, installing `bun` for the Vercel plugin.

- Agree upgrade scope with owner, then audit visually at 390/768/1280/1920 before editing.

## Build order

| # | Step | State |
|---|------|-------|
| 1 | Scaffold: Next 16 + Payload 3.88, db-postgres, Blob storage, env | **done** |
| 2 | Design system: tokens, fonts, texture tiles, shell | **done** |
| 3 | Motion system: LineDraw / PenDraw / useInkReveal / BrushCycle / TextDrop / SectionInk / InkLink | **done** |
| 4 | Motif pipeline: ingest script + procedural generators | **done** (needs real linework from artist) |
| 5 | Payload schema: collections, globals, seed | **done** |
| 6 | Pages: landing, drops, archive, artwork, static set | **done** |
| 7 | Enquiry + mailing list: server actions, zod, honeypot, Resend | **done** |
| 8 | Polish: SEO/OG, responsive, reduced-motion, Lighthouse | partial — reduced-motion + responsive verified; Lighthouse not run |
| 9 | Deploy: Vercel + Prisma Postgres + Blob | in progress — migrations wired |

## Environment (verified)

- Postgres 16.9 (Homebrew) running on `/tmp:5432`; db `forcefedink` created.
- **Dev runs on port 3100** (`pnpm dev`) — 3000 is held by another project on this machine.
- Step 1 verified: `/admin` and `/` both 200, all 20 tables created by Payload on first boot.
- Node 22.15.1, pnpm 9.1.1 (repo uses pnpm).
- Scaffold taken from the `blank` template at git tag **v3.88.0**, not `create-payload-app`
  (that needs a TTY this shell doesn't have). Dropped from the template: playwright, vitest,
  Docker, `.vscode`, `my-route`. Kept `(payload)` routes verbatim — they're version-sensitive.

## Decisions in flight

- Commerce is **enquiry-only** this phase. `drops.editionsSold` is set by hand in admin.
  Schema stays Stripe-ready so phase 2 is purely additive.
- Local dev uses disk storage when `BLOB_READ_WRITE_TOKEN` is empty, Vercel Blob when set —
  so there's no cloud dependency to develop against.

## Design language (v4 — current)

Full-viewport page stages (unchanged structure). Horizontal split = canvas from `bottom`
(home, drops, FAQ, series); vertical split = `left` (about, commissions, drop detail) or
`right` (archive, contact, artwork). Side canvases become bottom sheets under 760px.

**Choreography.** `NavExit` intercepts internal link clicks: head blurs up and out, pattern
fades, canvas accelerates off along its own axis (240ms), then the route changes. Incoming page
holds `ENTER_DELAY` (190ms), then: splash hits → title inks in per character (blur/bloom →
sharp) → canvas slides in with slight overshoot → pattern draws from its corner.

**Geometry** (`src/geometry/patterns.ts`): Hankin polygons-in-contact over real tilings.
Presets: fez (4.8.8, home), tlemcen (square, drops), rabat (4.8.8 open, drop detail/FAQ),
marrakech (3.12.12, archive/commissions), meknes (dense 3.12.12, series/about), kairouan (hex,
artwork/contact). Rendered as gilded strapwork (band + channel) with `ink-line` filter: hand
wobble, dry-brush grain, soft bloom, metallic sheen gradient; masked to dissolve from the corner.

**Ink** (`src/ink/`): `blot.ts` shapes, `splat.ts` sharp directional splatter (random every
load), `spill.ts` corner spill (Contact only, random every load). Materials in `InkDefs`:
`ink-crisp`, `ink-wash` (watercolor granulation + drying edge), `ink-bloom`. Two-layer
crisp/bloom rendering; slow spread/fade is transform/opacity only.

**Canvas edge:** gentle deckle with a faint gold line (was too jittery).

**v4.1 tweaks:** header mark 48px (38 on phones), header 5.25rem; nav/wordmark a size up.
Titles brighter (`--gold-hot`) with a subtle dark outline (`-webkit-text-stroke` +
`paint-order: stroke fill`). Title splash is anchored by its impact point just past the end
of the title, thrown rightward (`aim={0}`), and fires ~140ms before the last letter lands.
Geometry keeps growing: corner piece draws, crossfades into an identical static field
(3.6× larger, same lattice via corner-anchored bounds), whose radial mask (`--reach`, a
registered @property) expands over 200s in 400 steps. Spill pools each scale about their own
centre (per-pool layers) — verified centres unchanged between 1s and 31s.

**v4.2:** Geometry growth reworked — the mask reveal read as stop-and-go. Now the whole field
sits as faint ghost lines and ink traces each stroke over them on one schedule,
start = 150s·(i/n)², later strokes traced slower; ink split into 500-unit cells so only
active cells re-filter. Measured: 82 strokes inked at 1.5s, 196 at 5s, 412 at 20s, 718 at 60s,
~10 in motion at once. Hydration error was an extension-injected `--oip-*` style on <html>;
`suppressHydrationWarning` on <html> only. Sheet grows on scroll (bottom splits + all phone
sheets): canvas built at `--sheet-max`, parked by `translate`, `--p` eased from scrollTop;
wheel/touch over the hero forwarded to the sheet. Home: taller header (7rem, 66px mark, bigger
nav) via `:root:has(.header[data-home])`, no hero mark, tagline instead of the byline, next
drop with open time/edition/price/paper/size + notify, past drops list. Three mock past drops
inserted additively (no reseed); also worth adding to scripts/seed.ts before the next cold seed.

**v4.6 (geometry, current):** Live pen. Every shape is in the DOM from the start with no
path data (undrawn). A scheduler in DrawGeometry picks each next shape when the previous one
finishes: adjoining undrawn shape nearest the pen (+0.5×corner distance), restricted to shapes
≥60% inside the *current* visible box; falls back to any on-screen undrawn shape; idles and
re-checks every 1s if none. Sets rotated path `d`, per-shape `--dur` from the decelerating
speed (20000→60 u/s, τ 1100ms) and opacity (1 → 0.35 with distance), then flips `data-on`.
Fixes: precomputed plans rebuilt on resize and mounted new shapes already drawn (the "left
side artifacts"), and edge-clipped shapes counted as visible. Verified: widening 1000→1600px
leaves drawn count unchanged; 0 drawn shapes mostly off-screen.
Motifs: 10 presets, one per page (added tangier, essaouira, chefchaouen, ouarzazate).
**v4.7:** Pen rhythm v = 180 + (9000−180)·e^(−t/700ms): strong open, ~1s slowing, then a held
rhythm (~1 shape per 2.5–3s). Measured on Drops: 4/9/12 shapes at 0.7/1.5/3s, 15 at 12s, 18 at
20s. PULL 0.9 keeps the burst compact in the corner. Commissions → essaouira, drop detail →
tangier (now truncatedHex θ35, interlaced rings — was too close to marrakech), rabat tile 85.
**v4.8:** Presets can `weave` a second contact angle over the same tiles (drawn pale, weight
0.6). Home → `medina` (truncatedHex 50, θ60 + weave 80: needle stars inside rosettes).
PageStage/DrawGeometry `burst` multiplies the pen's opening speed; home uses 6 (23 shapes by
3s vs ~12 elsewhere — the woven shapes are long, so it needs the extra push).
**v4.9:** Home → `cuenca` (Sevillian cuenca y arista, lazo de ocho: 4.8.8 θ67.5, tile 74) with
finishes: `interlace` (ground-coloured halo under each ribbon = raised ridge / over-under cut)
and `glaze` (star wells flood with a 0.16 gold wash after the pen closes them). Archive →
`konya` (new 4.6.12 `truncatedTrihex` tiling, tile 70, θ72: Seljuk/kündekâri twelve-point
stars ringed by six-point rosettes, interlaced). Tile joints tried and removed (invisible).
`medina` and `fez` remain as presets but are unused by pages.
**v5.0:** Swapped: home → `konya` (burst 6), archive → `cuenca` (burst 3); about + commissions
burst 3. Distance fade now a fixed reach: opacity 1 → 0.14 by 1700 units (^0.75), no longer
stretched across the whole free area. Detail pages (drops/[slug], artwork/[slug]) use a new
PageStage `showcase` slot: the free area shows `Carousel` (full-bleed contained image, arrows
flanking, capsule/dot tabs, keys + swipe); title/info moved into the canvas (StageHead with
`splash={false}`). Two mock views appended to each artwork additively (all now 3 images).
FAQ: shipping callout, numbered sections with rules, squiggle rule under each question
(`public/textures/squiggle.svg`, irregular 244px tile), hairline between Q&As.

## Verified

- 16 routes return 200; `pnpm build` prerenders all of them (contact is dynamic — searchParams).
- v4: exit choreography sampled in-page (canvas 6→39→94→216→387px over 260ms, head to 0
  opacity by 230ms, next page mounts parked off-screen). Hydration clean on all routes.
  Mobile 390×844: no overflow, words never break mid-word. `pnpm build` clean.
- Contact popup end to end: wrong answer rejected, corrected answer accepted, enquiry stored.
- No horizontal overflow at 390 or 1280; reduced-motion shows everything settled.
- Drop mechanic end to end on a **production build**: 25/25 → auto `soldout` → badge flips →
  buy CTA disabled, live on the prerendered page via `revalidatePath`.
- Enquiry form writes an `enquiries` row with the subject captured; subscribe writes
  `subscribers`. Honeypot + zod + per-IP rate limit in place.
- `prefers-reduced-motion: reduce` → veils `display:none`, nothing hidden, no animation.
- No horizontal overflow at 390 / 1280.

## Deploy / migrations

- `src/migrations/20260926_195338_initial.ts`: full schema (21 tables). Verified on a throwaway
  DB: applies cleanly, re-running is a no-op.
- Vercel runs `pnpm run ci` (`vercel.json`) = `payload migrate` then `next build`. Local
  `pnpm build` does **not** migrate — the local DB was built by dev-mode push (marker
  `dev|-1` in payload_migrations) and Payload would stop to ask if migrate ran against it.
- **Every schema change** (collections/fields/globals): run `pnpm migrate:create <name>` and
  commit the new migration, or production drifts from the code.
- Vercel needs: `DATABASE_URI` (Prisma Postgres *direct TCP* URL, `?sslmode=require`),
  `PAYLOAD_SECRET`. Optional: `BLOB_READ_WRITE_TOKEN` (else uploads go to the ephemeral disk
  and vanish), `RESEND_API_KEY`, `NEXT_PUBLIC_SERVER_URL` (else derived from Vercel's vars).
- Production DB starts empty: content must be created in /admin, seeded, or copied over.

## Open threads

- **Need real linework SVGs from the artist.** `solidammonitewhite.svg` turned out to be a
  filled silhouette, not line art (see LESSONS) — it is the logo, and is used as the mask for
  `.mark`. The four procedural generators carry the motion system meanwhile. North African /
  Middle Eastern geometry and equation-driven figures are what the ingest pipeline wants.
- Seed admin login: `studio@forcefedink.com` / `changeme123` — change before anything ships.
- Lighthouse pass not yet run.
- **Footer music player needs a track**: Payload → Site settings → Audio. With none set the
  player is not rendered and the footer's left side is empty.
- The `/contact` page form has no human challenge — only the footer popup does.
- Not started: step 9 (deploy). Needs a Prisma Postgres direct-TCP URL, a Vercel Blob token,
  a Resend key, and `payload migrate` wired into the build.
- Real artwork images + copy still to come; seed uses placeholders.
- Font pairing (Cormorant Garamond + Inter) is a recommendation — one token swap in
  `src/styles/tokens.css` if the artist wants different.
