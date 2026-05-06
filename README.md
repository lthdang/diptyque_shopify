# Diptyque Remake — Shopify Monorepo

A monorepo for the Diptyque Shopify storefront, containing a custom **Online Store 2.0 theme** and an **embedded Shopify app** for store management.

---

## 📌 Project Overview

This repository houses two tightly coupled workspaces:

| Workspace | Path                       | Purpose                                                  |
| --------- | -------------------------- | -------------------------------------------------------- |
| **Theme** | `Theme/`                   | Custom Shopify OS 2.0 theme with advanced UI components  |
| **App**   | `App/diptyque-remake-app/` | Embedded Shopify app (React Router) for store operations |

---

## 🛠 Tech Stack

### Theme

| Technology               | Usage                                                                             |
| ------------------------ | --------------------------------------------------------------------------------- |
| **Shopify Liquid**       | Templating engine for all sections, snippets, and layouts                         |
| **HTML5 / CSS3**         | Markup and styling, including CSS custom properties                               |
| **JavaScript (Vanilla)** | Custom Elements (Web Components), scroll/intersection logic                       |
| **Vite**                 | Bundles the account-page SPA (`src/account/`) into `assets/account-app.bundle.js` |
| **Shopify CLI**          | Local development, theme push/pull, store preview                                 |

### App

| Technology              | Usage                                              |
| ----------------------- | -------------------------------------------------- |
| **React Router v7**     | Full-stack SSR framework for the embedded app      |
| **Shopify App Bridge**  | Embeds the app inside the Shopify admin            |
| **Shopify Polaris**     | Shopify admin UI component library                 |
| **Prisma + PostgreSQL** | ORM and relational database for persistent storage |
| **TypeScript**          | Type safety across the entire app codebase         |
| **Docker / Render**     | Containerised deployment on Render.com             |

---

## 📁 Repository Structure

```
diptyque-remake/
├── Theme/                        # Shopify OS 2.0 theme
│   ├── assets/                   # Compiled CSS, JS, and static files
│   ├── blocks/                   # Block partials (prefixed with _)
│   ├── config/                   # Theme settings schema
│   ├── layout/                   # Root layout files (theme.liquid, password.liquid)
│   ├── locales/                  # i18n translation strings
│   ├── sections/                 # Standalone UI sections (each has Liquid + CSS + JS + schema)
│   ├── snippets/                 # Shared Liquid partials ({% render %})
│   ├── src/account/              # Account page SPA source (bundled by Vite)
│   ├── templates/                # JSON page templates
│   └── build.mjs                 # Vite build script → assets/account-app.bundle.js
│
└── App/diptyque-remake-app/      # Embedded Shopify app
    ├── app/
    │   ├── config/               # App-wide enums and constants
    │   ├── jobs/                 # Background workers (e.g. publishProductWorker)
    │   ├── routes/               # React Router routes (admin pages, API, webhooks)
    │   ├── services/             # Business logic services
    │   ├── db.server.ts          # Prisma client singleton
    │   └── shopify.server.ts     # Shopify app authentication setup
    ├── prisma/
    │   └── schema.prisma         # Database models (Session, ScheduledPublish, Customer)
    ├── extensions/               # Shopify app extensions
    ├── shopify.app.toml          # App configuration (scopes, webhooks, URLs)
    ├── Dockerfile                # Production container image
    ├── docker-compose.yml        # Local Docker Compose setup
    └── render.yaml               # Render.com deployment config
```

---

## ✨ Features

### Theme

- **Custom sections** — `header-custom`, `tab-list-scroll`, `pin-image-popup`, `layered-slideshow`, `parallax-image`, `product-hotspots`, and more
- **Rich block system** — Dozens of composable blocks for product cards, media, headings, tabs, carousels, and navigation
- **Account SPA** — A Vite-bundled JavaScript app rendered on the `/pages/account` page
- **Web Components** — All JS behaviour is encapsulated via `customElements.define`; no global scripts
- **CSS custom properties** — Theme values are injected from Liquid into CSS via `--` variables
- **Mobile-first responsive layouts** — Tested across devices with Shopify's preview tools

### App

- **Scheduled Publish** — Schedule Shopify products to go live at a future date/time; a background worker (`publishProductWorker`) processes the queue
- **Customer Management** — Browse and manage store customers from within the Shopify admin
- **Webhook Handling** — Responds to `app/uninstalled` and `app/scopes_update` events
- **Embedded experience** — Fully embedded in the Shopify admin via App Bridge; session management handled by `@shopify/shopify-app-react-router`

---

## ⚙️ Setup & Development

### Prerequisites

- [Node.js](https://nodejs.org/) `>=20.19 <22 || >=22.12`
- [Shopify CLI](https://shopify.dev/docs/themes/tools/cli) v3+
- A [Shopify Partner](https://partners.shopify.com/) account with access to a development store
- A PostgreSQL database (for the App)

---

### Theme — Local Development

```bash
# 1. Enter the theme directory
cd Theme

# 2. Install dependencies (Vite build tooling)
npm install

# 3. Build the account-page JS bundle
npm run build

# 4. Start the Shopify theme dev server
shopify theme dev --store=<your-store>.myshopify.com
```

> **Tip:** Use `npm run watch` (in a separate terminal) while running `shopify theme dev` to automatically rebuild the account bundle on changes.

#### Theme CLI Commands

| Command                 | Description                                           |
| ----------------------- | ----------------------------------------------------- |
| `shopify theme dev`     | Start a local development server with live reload     |
| `shopify theme push`    | Upload the local theme to the connected Shopify store |
| `shopify theme pull`    | Download the current theme from the store to local    |
| `shopify theme publish` | Set the theme as the active published theme           |
| `shopify theme delete`  | Remove a theme from the store                         |

---

### App — Local Development

```bash
# 1. Enter the app directory
cd App/diptyque-remake-app

# 2. Install dependencies
npm install

# 3. Copy and configure environment variables
cp .env.example .env   # then edit DATABASE_URL and other secrets

# 4. Run database migrations
npm run setup          # prisma generate && prisma migrate deploy

# 5. Start the development server
npm run dev            # shopify app dev
```

> Press `P` in the terminal to open the app URL in the browser. Install the app on your dev store to begin development.

#### App Scripts

| Script               | Description                                            |
| -------------------- | ------------------------------------------------------ |
| `npm run dev`        | Start the Shopify app dev server with tunnel           |
| `npm run build`      | Build the React Router app for production              |
| `npm run start`      | Serve the production build                             |
| `npm run setup`      | Run Prisma migrations (used in deployment/Docker)      |
| `npm run worker`     | Run the scheduled-publish background worker            |
| `npm run worker:dev` | Run the worker in watch mode (auto-restarts on change) |
| `npm run deploy`     | Deploy the app configuration to Shopify                |
| `npm run lint`       | Run ESLint                                             |
| `npm run typecheck`  | Run TypeScript type-checking                           |

---

## 🚀 Deployment

### App — Render.com (Production)

The app is deployed to **[Render.com](https://render.com)** via Docker. The live URL is:

```
https://diptyque-shopify.onrender.com
```

Configuration files:

- `Dockerfile` — Multi-stage production build
- `docker-compose.yml` — Local Docker Compose for testing the containerised app
- `render.yaml` — Render service definitions (web + worker)
- `entrypoint.sh` — Container entrypoint (runs migrations then starts the server)

### App — Database

The app uses **PostgreSQL** via Prisma. Key models:

| Model              | Description                                          |
| ------------------ | ---------------------------------------------------- |
| `Session`          | Shopify OAuth session tokens                         |
| `ScheduledPublish` | Product publish jobs (status: SCHEDULED → PUBLISHED) |
| `Customer`         | Cached customer records synced from Shopify          |

---

## 📌 Development Notes

### Theme

- **Reuse snippets** — extract repeated markup into `snippets/` and include with `{% render %}`.
- **Validate schema JSON** — malformed schema blocks break the Theme Editor silently; always lint before pushing.
- **Test in Theme Editor** — all sections and blocks must be configurable from the editor without errors.
- **No global scripts** — encapsulate all JS behaviour in Custom Elements (`customElements.define`).
- **CSS custom properties** — pass Liquid values into CSS using `--` variables to keep styles decoupled.

### App

- **Run migrations before deploying** — always execute `prisma migrate deploy` as part of the release step.
- **Worker must run separately** — the `publishProductWorker` is a standalone process; ensure it is provisioned alongside the web server in production.
- **Webhooks are app-specific** — subscribe in `shopify.app.toml`, not via `afterAuth`, so Shopify auto-syncs on every `npm run deploy`.
- **Embedded navigation** — use `Link` from `react-router` and `redirect` from `authenticate.admin`; avoid plain `<a>` tags inside the embedded iframe.

---

## ⚠️ Common Gotchas

- Ensure **Shopify CLI** is up to date (`shopify version`). CLI v2 and v3 have different command signatures.
- **Test on both mobile and desktop** before pushing the theme — use browser DevTools and Shopify's mobile preview.
- **Resolve all Liquid errors** locally before `shopify theme push`; a broken section can prevent the entire page from rendering.
- Do not push directly to the live/published theme without testing on an unpublished duplicate first.
- If Prisma reports `The table does not exist`, run `npm run setup` to apply pending migrations.
