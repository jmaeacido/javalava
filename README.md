# Java Lava

Marketing website for **Java Lava**, a premium coffee liqueur brand. The site combines static HTML pages with a **Node.js / Express** API backend, Supabase for blog and form data, and branded admin tools for day-to-day operations.

**Production:** [www.javalava.rocks](https://www.javalava.rocks)

---

## Table of contents

- [Overview](#overview)
- [Features](#features)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Local development](#local-development)
- [Environment variables](#environment-variables)
- [Database setup](#database-setup)
- [API reference](#api-reference)
- [Admin tools](#admin-tools)
- [SEO workflow](#seo-workflow)
- [Deployment](#deployment)
- [Scripts](#scripts)
- [Architecture notes](#architecture-notes)

---

## Overview

Java Lava is a **static-first** front end: each public page is a standalone HTML file with shared CSS and JavaScript. Dynamic behavior (contact forms, newsletter signups, merch waitlists, blog posts, Instagram feed, store locator maps) is handled by a **persistent Node.js server** in `server/` that mounts the route handlers in `api/`.

There is no front-end build step. Pages are served as-is. In production the Node server can serve both static files and API routes; locally you can run the same server alone or split static (Apache/Laragon) from API (Node on port 3000).

```
Browser (static HTML/CSS/JS)
        │
        ▼
   Apache/nginx  ──optional proxy──▶  Node (Express)
        │                                    │
        ├── Static assets                    ├── /api/*  route handlers
        │   (HTML, CSS, JS, images)          │       │
        │                                    │       ├── Supabase (blog, forms)
        └── /api/* proxied when split        │       ├── SMTP (Nodemailer)
                                             │       ├── Instagram Graph API
                                             │       └── Google Maps config
                                             └── /rss.xml, /sitemap-blog.xml
```

---

## Features

### Public site

| Page | Route | Description |
|------|-------|-------------|
| Home | `/` | Hero, brand story highlights, Instagram feed, age gate (21+) |
| Our Story | `/story` | Brand narrative |
| Shop | `/shop` | Product showcase for the coffee liqueur |
| Merch | `/merch` | Apparel catalog with waitlist signups |
| Store Locator | `/locator` | Google Maps stockist finder |
| Contact | `/contact` | Contact and wholesale enquiry form |
| Blog | `/blog` | Published posts from Supabase |
| Blog post | `/blog-post` | Single post view (slug via query string) |
| Policies | `/privacy-policy`, `/terms-conditions`, `/shipping-policy`, `/refund-policy`, `/accessibility-statement` | Legal and accessibility pages |
| 404 | `/404` | Branded not-found page |

### Back end

- **Contact form** — saves to Supabase, emails the team (wholesale enquiries route to a separate inbox)
- **Newsletter** — upserts subscriber, sends welcome email and internal notification
- **Merch waitlist** — records product/size/quantity interest, sends auto-reply and team alert
- **Blog CMS** — full CRUD for posts, categories, and tags; RSS and blog sitemap generation
- **Instagram feed** — live Graph API when configured, otherwise curated mock assets
- **Google Maps** — API key served to the browser via a config endpoint

### Admin (protected)

- **Admin** (`/admin`) — unified view of merch, newsletter, and contact records
- **Email Admin** (`/email-admin`) — mailing and contact record browser
- **Merch Admin** (`/merch-admin`) — merch signup management
- **Blog Admin** (`/blog-admin`) — rich-text post editor (TipTap)

---

## Tech stack

| Layer | Technology |
|-------|------------|
| Markup | Static HTML5 |
| Styles | Vanilla CSS (`css/site.css`, page-specific sheets) |
| Client JS | Vanilla JavaScript (no bundler) |
| Animation | GSAP, ScrollTrigger, Lenis (vendored in `vendor/`) |
| Backend | Node.js 18+, Express |
| Database | [Supabase](https://supabase.com) (PostgreSQL REST API) |
| Email | [Nodemailer](https://nodemailer.com) over SMTP |
| Hosting | Node server (production); Laragon/Apache (local static + API proxy) |
| Blog editor | TipTap (CDN, admin only) |

---

## Project structure

```
javalava/
├── server/
│   ├── index.js              # Express app — static + API routes
│   └── dev-api.js            # API-only entry (SERVE_STATIC=false)
├── api/                      # Route handlers (mounted by server/)
│   ├── blog.js               # Blog CRUD, RSS, sitemap
│   ├── contact.js            # Contact form submissions
│   ├── newsletter.js         # Newsletter signups
│   ├── merch-notify.js       # Merch waitlist (public POST)
│   ├── merch-signups.js      # Merch records (admin GET/DELETE)
│   ├── mailing-records.js    # Combined records (admin GET)
│   ├── instagram-feed.js     # Instagram posts (live or mock)
│   ├── instagram-config.js   # Client-side Instagram config
│   ├── google-maps-config.js # Client-side Maps API key
│   └── lib/
│       ├── mailer.js         # Branded HTML email + SMTP transport
│       └── merch-images.js   # Merch product image URL helpers
├── assets/                   # Images, video, press PDFs, awards
├── css/                      # site.css, home.css
├── js/
│   ├── site.js               # Shared nav, drawer, reveals, page transitions
│   ├── home.js               # Homepage-only GSAP animations
│   ├── api-config.js         # API base URL resolution + fetch fallback
│   ├── instagram-feed.js     # Instagram widget renderer
│   ├── merch-catalog.js      # Merch product definitions
│   ├── seoData.js            # SEO metadata source of truth
│   └── seo.js                # SEO tag builders (used by apply-seo script)
├── scripts/
│   ├── apply-seo.js          # Inject SEO tags into HTML + regenerate sitemap
│   └── smoke-api.js          # POST smoke tests for form APIs
├── vendor/                   # GSAP, ScrollTrigger, Lenis (minified)
├── *.html                    # Public and admin pages
├── supabase-blog.sql         # Blog schema (run in Supabase SQL editor)
├── supabase-merch-notifications.sql  # Forms/signups schema
├── .htaccess                 # Apache extensionless URLs + API proxy (Laragon)
├── .env.example              # Environment variable template
├── config.local.js.example   # Local API base override template
└── package.json
```

---

## Prerequisites

- **Node.js** 18+ (backend and scripts)
- **Supabase project** — for blog and form storage
- **SMTP credentials** — e.g. Gmail app password for transactional email
- **Google Maps API key** — browser key with Maps JavaScript API enabled (for locator)
- **Laragon** (optional) — serve static HTML locally at e.g. `http://localhost/javalava/` with Apache proxying `/api/*` to Node

---

## Local development

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy the example env file and fill in values:

```bash
cp .env.example .env
```

Set at minimum:

- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
- `JAVA_LAVA_ADMIN_TOKEN` (for admin API access)
- `BLOG_ADMIN_KEY` (for blog admin CRUD)
- SMTP variables if you want email delivery locally

The server loads `.env` automatically via `dotenv`.

### 3. Choose a dev mode

**Option A — All-in-one (simplest):** Node serves static files and API on one port.

```bash
npm run dev
```

Open **http://localhost:3000**. Extensionless URLs (`/shop`, `/contact`) and `/api/*` all work from the same origin.

**Option B — Split (Laragon + API):** Apache serves HTML; Node serves API only.

Terminal 1:

```bash
npm run dev:api
```

Terminal 2: open the site via Laragon at `http://localhost/javalava/`.

`.htaccess` proxies `/java-lava/api/*`, `/java-lava/rss.xml`, and `/java-lava/sitemap-blog.xml` to port 3000. Enable `mod_proxy` and `mod_proxy_http` in Apache if the proxy rules are not active.

For Maps and any cross-origin fallback, copy `config.local.js.example` to `config.local.js` and set `apiBase: 'http://localhost:3000'`.

### 4. Verify APIs

```bash
npm run smoke:api
# or against production:
npm run smoke:api -- --base https://www.javalava.rocks
```

Smoke tests POST to contact, newsletter, and merch-notify. They create real Supabase rows tagged `source=api-smoke-test` and may send email when SMTP is configured. A `502` response with a saved row means Supabase succeeded but email failed.

---

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default: `3000`) |
| `SERVE_STATIC` | No | Serve HTML/assets from Node (default: `true`; set `false` for API-only behind Apache) |
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Service role key (server-side only; never expose in client) |
| `JAVA_LAVA_ADMIN_TOKEN` | Yes (admin) | Secret for `x-java-lava-admin-token` header on admin routes |
| `BLOG_ADMIN_KEY` | Yes (blog admin) | Secret for `x-admin-key` header on blog admin routes |
| `SUPABASE_MERCH_SIGNUPS_TABLE` | No | Default: `merch_notifications` |
| `SUPABASE_CONTACT_SUBMISSIONS_TABLE` | No | Default: `contact_submissions` |
| `SUPABASE_NEWSLETTER_TABLE` | No | Default: `newsletter_subscribers` |
| `SITE_URL` | Recommended | Canonical public URL (emails, RSS, sitemap, asset fallbacks) |
| `SMTP_HOST` | For email | e.g. `smtp.gmail.com` |
| `SMTP_PORT` | For email | e.g. `587` |
| `SMTP_ENCRYPTION` | For email | `tls` or `ssl` |
| `SMTP_USER` | For email | SMTP username |
| `SMTP_PASS` | For email | SMTP password or app password |
| `CONTACT_EMAIL_FROM` | For email | From address, e.g. `Java Lava <contact@javalava.rocks>` |
| `CONTACT_EMAIL_TO` | For email | Default inbox for contact notifications |
| `WHOLESALE_EMAIL_TO` | For email | Inbox for wholesale/stockist subjects |
| `GOOGLE_MAPS_API_KEY` | For locator | Browser-restricted Maps JavaScript API key |
| `INSTAGRAM_HANDLE` | No | Display handle (default: `drinkjavalava`) |
| `INSTAGRAM_PROFILE_URL` | No | Profile link |
| `INSTAGRAM_USER_ID` | For live feed | Instagram Business/Creator user ID |
| `INSTAGRAM_ACCESS_TOKEN` | For live feed | Long-lived Graph API token |
| `INSTAGRAM_FEED_MODE` | No | Set to `mock` to force mock posts |
| `INSTAGRAM_FEED_LIMIT` | No | Max posts (default: 6) |
| `INSTAGRAM_WIDGET_SCRIPT_SRC` | No | Third-party widget script URL (alternative to API feed) |
| `INSTAGRAM_WIDGET_HTML` | No | Embed HTML for widget mode |
| `SMOKE_API_BASE` | No | Override base URL for `scripts/smoke-api.js` |
| `SMOKE_TEST_EMAIL` | No | Fixed email for smoke tests |

See `.env.example` for a complete template with placeholder values.

---

## Database setup

Run the SQL files in the Supabase SQL editor. Both are idempotent (safe to re-run).

### Forms and signups

Run `supabase-merch-notifications.sql`. Creates:

- `merch_notifications` — merch waitlist entries
- `contact_submissions` — contact form rows
- `newsletter_subscribers` — mailing list (unique email)

### Blog CMS

Run `supabase-blog.sql`. Creates:

- `blog_categories`, `blog_tags`, `blog_posts`, `blog_post_tags`
- Triggers for `updated_at`
- Seed categories/tags (optional starter data)

The blog API uses the Supabase REST API with the service role key. Row Level Security policies are defined in the SQL file for public read of published posts only.

---

## API reference

All routes are mounted by `server/index.js` under `/api/`.

### Public endpoints

| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/health` | Server health check |
| `POST` | `/api/contact` | Submit contact form |
| `POST` | `/api/newsletter` | Subscribe to mailing list |
| `POST` | `/api/merch-notify` | Join merch waitlist |
| `GET` | `/api/blog?action=posts` | List published posts (paginated) |
| `GET` | `/api/blog?action=posts&slug=…` | Single published post |
| `GET` | `/api/blog?action=rss` | RSS 2.0 feed (also `/rss.xml`) |
| `GET` | `/api/blog?action=sitemap` | Blog post sitemap XML (also `/sitemap-blog.xml`) |
| `GET` | `/api/instagram-feed` | Instagram posts (live or mock) |
| `GET` | `/api/instagram-config` | Returns JS assigning `window.JavaLavaConfig.instagram` |
| `GET` | `/api/google-maps-config` | Returns JS with Maps API key |

### Admin endpoints

Require the header shown. Admin HTML pages store the token in session storage after login.

| Method | Route | Auth header | Description |
|--------|-------|-------------|-------------|
| `GET` | `/api/mailing-records` | `x-java-lava-admin-token` | Combined merch, newsletter, contact records |
| `GET` / `DELETE` | `/api/merch-signups` | `x-java-lava-admin-token` | Merch signup list / delete by id |
| `GET` / `POST` / `PATCH` / `DELETE` | `/api/blog?action=admin` | `x-admin-key` | Blog CRUD (all statuses) |

### Contact form body (example)

```json
{
  "firstName": "Jane",
  "lastName": "Doe",
  "email": "jane@example.com",
  "subject": "General enquiry",
  "message": "Hello!",
  "source": "contact-page"
}
```

Wholesale or stockist subjects are routed to `WHOLESALE_EMAIL_TO`.

### Response behavior

- **200** — Success (row saved; email sent when configured)
- **502** — Row saved to Supabase but email delivery failed (`emailError` in body)
- **401** — Missing or invalid admin token/key
- **405** — Wrong HTTP method

---

## Admin tools

| URL | Purpose | Auth |
|-----|---------|------|
| `/admin` | Dashboard for all submission types | `JAVA_LAVA_ADMIN_TOKEN` |
| `/email-admin` | Email-style browser for contact and newsletter | Same |
| `/merch-admin` | Merch waitlist management | Same |
| `/blog-admin` | Create/edit/publish blog posts | `BLOG_ADMIN_KEY` |

All admin pages set `noindex, nofollow` in meta tags. Do not link to them from public navigation.

---

## SEO workflow

SEO metadata is maintained in **`js/seoData.js`** — one entry per public page (title, description, path, focus keyword, Open Graph overrides).

To apply approved copy into HTML files and regenerate `sitemap.xml` / `robots.txt`:

```bash
npm run seo:apply
```

The script (`scripts/apply-seo.js`):

1. Replaces the `<title>` and meta/link block in each mapped HTML file
2. Writes `sitemap.xml` from public, indexable routes
3. Updates `robots.txt` if configured in the script

Blog posts are indexed separately via `/sitemap-blog.xml` (dynamic, from Supabase).

---

## Deployment

### Node server (production)

1. Set all environment variables from `.env.example` on the host (or in a process manager env file).
2. Install dependencies: `npm ci --omit=dev`
3. Start the server: `npm start` (or run under **PM2**, **systemd**, etc.).
4. Put **nginx** or **Apache** in front for TLS and optionally reverse-proxy to `PORT`.

With `SERVE_STATIC=true` (default), Node serves the full site. Point your domain at the Node process or proxy to it.

Example nginx location block:

```nginx
location / {
  proxy_pass http://127.0.0.1:3000;
  proxy_http_version 1.1;
  proxy_set_header Host $host;
  proxy_set_header X-Real-IP $remote_addr;
}
```

### Apache split (static + API proxy)

If Apache continues to serve HTML from disk:

1. Set `SERVE_STATIC=false` in `.env`.
2. Run `npm start` (or `npm run dev:api` in development).
3. Configure `ProxyPass` for `/api/`, `/rss.xml`, and `/sitemap-blog.xml` to the Node port (see `.htaccess` for the Laragon `/java-lava/` path pattern).

Legacy `/concept-a/*` URLs redirect to the site root via `.htaccess`.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Production server (static + API) |
| `npm run dev` | Development server with file watch |
| `npm run dev:api` | API-only server (for Apache split setup) |
| `npm run smoke:api` | POST smoke tests against contact, newsletter, merch-notify |
| `npm run seo:apply` | Sync SEO tags from `seoData.js` into HTML + sitemap |

### Smoke test options

```bash
node scripts/smoke-api.js --help
node scripts/smoke-api.js --dry-run
node scripts/smoke-api.js --base https://www.javalava.rocks
```

---

## Architecture notes

### API base resolution

`js/api-config.js` tries multiple origins in order:

1. `window.JavaLavaConfig.apiBase` (from `config.local.js` or config endpoints)
2. Current site prefix + origin (works when Apache proxies `/api/*` to Node on the same host)
3. `http://localhost:3000` on local hostnames

Requests to port 3000 use a 1.5s timeout so pages remain usable when the API process is not running.

### Email

`api/lib/mailer.js` builds branded HTML emails (volcanic palette, logo, hero image) and sends via Nodemailer. Asset URLs in email resolve from `SITE_URL`.

### Instagram

Three modes, chosen at runtime:

1. **Widget** — `INSTAGRAM_WIDGET_SCRIPT_SRC` or `INSTAGRAM_WIDGET_HTML` set
2. **Live API** — `INSTAGRAM_ACCESS_TOKEN` + `INSTAGRAM_USER_ID` (unless `INSTAGRAM_FEED_MODE=mock`)
3. **Mock** — curated assets from `assets/instagram/`

### Merch catalog

Product definitions live in `js/merch-catalog.js` (client-side). Waitlist submissions go to `/api/merch-notify` and persist in Supabase; the admin UI reads them via `/api/merch-signups` or `/api/mailing-records`.

### Age gate

The homepage includes a 21+ age verification dialog. Confirmation is stored in `localStorage` (`jl_age_ok`). Under-21 visitors are redirected to a responsible-drinking resource.

### Motion and accessibility

GSAP powers scroll reveals, parallax, and homepage cinematics. `prefers-reduced-motion` is respected; without GSAP, content is shown immediately via fail-safe logic in `site.js` and `home.js`.

---

## License

ISC (see `package.json`). Site content, imagery, and brand assets are proprietary to Java Lava.
