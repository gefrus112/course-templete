# CoursePress — Sell Courses Like freeCodeCamp (But Get Paid)

![MIT](https://img.shields.io/badge/license-MIT-green) ![Node](https://img.shields.io/badge/node-18%2B-blue) ![PRs welcome](https://img.shields.io/badge/PRs-welcome-orange) ![Pages](https://github.com/gefrus112/Flux-agent/actions/workflows/pages.yml/badge.svg)

> **This is a GitHub template.** Click **Use this template** (green button, top of the repo) to create your own copy, then make it yours in 3 edits. No fork needed.

A free course-storefront template: **freeCodeCamp-style learning + Gumroad-style money button**. Blue + green theme, SVG icons (no emojis), cart + Stripe Checkout, slideshows, docs tabs, signup/login mock API.

**Live demo:** enable GitHub Pages (see below) → `https://<you>.github.io/<repo>/#/`

---

## Use this template (1 minute)

1. Click **Use this template → Create a new repository** (top of this page).
2. Name it, e.g. `my-course-store` → **Create repository**.
3. Clone yours and run it:

```bash
git clone https://github.com/<you>/<repo>.git
cd <repo>
npm install
npm start   # http://localhost:3000
```

Open `http://localhost:3000` → click **Scratch Games From Zero** → try the slideshow with arrow keys.

---

## Make it yours (3 edits)

1. **`courses.json`** — replace the 4 demo courses.
   Fields: `slug, title, tagline, price, compareAt, level, category, badge, rating, students, hours, lessonsCount, image (gradient-1..4), features[], curriculum[] {module, lessons[]}, slides[] {title, bullets[], code}`.
2. **`public/index.html`** — brand name, announcement bar, footer links, page `<title>`.
3. **Payments** — set Stripe env vars (below) to take live payments. Without keys the demo mock checkout is used automatically.

---

## Features

| Area | What you get |
|---|---|
| Storefront | Hero, featured courses, category filter, blue-green cards with hover lift |
| Courses | Detail pages with curriculum, pricing anchor + SAVE badge, reviews |
| Slideshows | Scratch-block slides per lesson (arrow-key nav) + lesson preview |
| Docs tabs | Quickstart · Sell · Payments · Deploy, built in at `#/docs` |
| Auth | Signup / login mock API (`/api/signup`, `/api/login`) — swap for Supabase/Firebase |
| Cart + Checkout | Drawer cart, order summary, **Stripe Checkout** (live) with dev-mock fallback |
| Theme | Dark ocean-blue + green, custom scrollbar, SVG icon set (no emojis), responsive |

---

## Go live with Stripe (5 min)

Checkout is already wired to **Stripe Checkout** (branded Stripe-hosted page). Just add keys:

```bash
STRIPE_SECRET_KEY=sk_test_...        # required for live payments
STRIPE_PUBLISHABLE_KEY=pk_test_...   # optional (Stripe.js)
STRIPE_WEBHOOK_SECRET=whsec_...      # optional (marks orders paid)
PUBLIC_BASE_URL=https://yoursite.com  # optional (defaults to request host)
```

Then restart (`npm start`). Flow:

- `POST /api/checkout` → creates a Stripe Checkout Session (course name + price) → frontend redirects buyer to `session.url`.
- Success → `#/learn/:slug`, cancel → `#/course/:slug`.
- `POST /api/stripe-webhook` marks `stripe-pending` orders as `paid` (forward with `stripe listen --forward-to localhost:3000/api/stripe-webhook` in dev).
- Free ($0) courses skip Stripe and enroll instantly.
- `GET /api/config` → `{ stripeLive: true/false }`.

No keys? The demo mock marks the order paid so the template works out of the box.

---

## Enable GitHub Pages (free static demo)

> Pages serves **static files only** — perfect for the storefront/slides/docs demo. The Node API (auth, orders, live Stripe) needs a host like Render/Railway (see below). On Pages the app auto-falls back to the bundled `courses.json` demo data.

**Option A — click (easiest):**

1. Push this repo to GitHub (already done for you — see push notes below).
2. Go to **Settings → Pages**.
3. **Source:** `Deploy from a branch` → **Branch:** `main` → folder `/ (root)` → **Save**.
   (Why root, not `/public`? The included Pages workflow publishes `./public` for you; branch-source serves the whole repo which also works since `public/index.html` paths are relative — but the workflow URL is cleaner.)
4. Wait ~1 min → your site is live at `https://<you>.github.io/<repo>/#/`.

**Option B — GitHub Actions (recommended, auto-deploys `public/`):**

This repo ships `.github/workflows/pages.yml`. Just:

1. **Settings → Pages → Source: `GitHub Actions`** → Save.
2. Push to `main` (or run the workflow manually) → Pages builds from `./public`.

```
main push → actions/upload-pages-artifact (./public) → deploy-pages → live URL
```

Test locally the same way Pages serves it:

```bash
npx serve public   # or: python3 -m http.server -d public 8000
# open http://localhost:3000 (serve) or :8000 (python)
```

---

## Deploy with backend (Render / Railway / VPS)

Pages can't run Node, so for signup/login/orders/live-Stripe use one of these (free tiers work):

| Host | Build | Start | Env |
|---|---|---|---|
| Render | `npm install` | `npm start` | add `STRIPE_SECRET_KEY` etc. in dashboard |
| Railway | auto | `npm start` | Variables tab |
| VPS | `npm install --omit=dev` | `node server.js` (use pm2/systemd) | `.env` or shell export |

---

## Project structure

```
├── server.js          # static server + API (courses/auth/checkout/newsletter/Stripe)
├── courses.json       # ← EDIT ME: your courses, prices, slides
├── public/
│   ├── index.html     # shell (nav, footer, cart drawer)
│   ├── styles.css     # blue-green theme, icons, scrollbar, cards
│   └── app.js         # hash router: home/courses/course/docs/signup/checkout/learn
├── .github/workflows/pages.yml  # deploys ./public to GitHub Pages
├── test/smoke.js      # API smoke test
├── CONTRIBUTING.md
└── LICENSE (MIT)
```

---

## Test

```bash
npm test
# ✅ smoke passed: health, courses, signup, login, checkout, newsletter, index
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). PRs welcome — especially new example courses!

## License

MIT — sell all the courses. See [LICENSE](LICENSE).
