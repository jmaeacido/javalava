# Java Lava — Redesign Concepts (Client Review Build)

Three interactive homepage directions for the Java Lava website redesign. Same brand,
same assets, three distinct moods. Open `index.html` to pick a concept.

```
site/
├─ index.html          ← concept chooser (start here)
├─ concept-a/          ← Volcanic Cinematic — DEVELOPED INTO FULL SITE
│   ├─ index.html      ·  Home
│   ├─ shop.html       ·  Product detail (tasting notes, qty, add-to-cart)
│   ├─ story.html      ·  Our Story (origin + how-it's-made timeline)
│   ├─ cocktails.html  ·  Recipes (filterable grid + featured recipe)
│   ├─ locator.html    ·  Store Locator (search + map preview + store list)
│   ├─ contact.html    ·  Contact (form + details)
│   ├─ css/site.css    ·  shared design system
│   └─ js/site.js      ·  shared behavior (smooth scroll, nav, reveals, mobile menu)
├─ concept-b/          ← Editorial Luxe (homepage concept)
├─ concept-c/          ← Bold Nightlife (homepage concept)
├─ assets/             ← brand images harvested from the live site
└─ vendor/             ← GSAP, ScrollTrigger, Lenis (self-hosted, no CDN)
```

**Concept A is the approved direction and is now a full multi-page site.** Concepts B and C
remain single-page homepages for comparison.

## View locally
Any static server works. From this `site/` folder:

```bash
python -m http.server 8777
# then open http://localhost:8777
```

(Opening the HTML files directly with `file://` mostly works too, but a local server
avoids browser security quirks with the scripts.)

## Share with the client (no account needed)
1. Zip this `site/` folder (a ready-made `java-lava-concepts.zip` is in the project root).
2. Go to https://app.netlify.com/drop and drag the zip in → you get an instant live URL.
   (Or use Vercel / GitHub Pages / any static host.)

## Notes for the client review
- These are **visual prototypes for approval**, not the production build.
- The chosen direction will be expanded into the full multi-page site, then rebuilt in Wix.
- Animations used (parallax, scroll reveals, sticky nav, hover states, marquee) are all
  reproducible in Wix Studio.
- Mobile nav hamburger is a placeholder in the concept stage; the approved direction gets a
  full responsive menu.

## Tech
Static HTML + Google Fonts (Cinzel Decorative + Josefin Sans) + GSAP/ScrollTrigger + Lenis
smooth scroll. No build step, no framework.

## API smoke test

From the **repository root**, after configuring `.env` (see `.env.example` — never commit
secrets), you can POST test payloads to the Vercel serverless routes:

```bash
# Terminal 1 — local API (run from this _deploy/java-lava folder)
npx vercel dev

# Terminal 2 — from repo root
npm run smoke:api -- --base http://localhost:3000
```

Against a deployed preview or production host:

```bash
SMOKE_API_BASE=https://java-lava-eta.vercel.app npm run smoke:api
```

Options:

- `--dry-run` — print URLs and JSON bodies only (no writes)
- `--base URL` — override `SMOKE_API_BASE` / `SITE_URL`
- `SMOKE_TEST_EMAIL` — optional fixed email; default is `smoke+<timestamp>@example.com`

The script hits `/api/contact`, `/api/newsletter`, and `/api/merch-notify` with
`source: api-smoke-test`. It treats **200** and **502** as pass (502 means Supabase saved
the row but SMTP failed). Review or delete smoke rows in Email Admin when finished.
