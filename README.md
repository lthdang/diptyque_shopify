# Diptyque Remake — Shopify Theme

A custom Shopify Online Store 2.0 theme built to deliver advanced UI components and rich admin customization for the Diptyque brand experience.

---

## 📌 Project Overview

This is a **Shopify Online Store 2.0** theme project focused on building custom sections and blocks that go beyond the defaults. It extends the Shopify admin with deeply configurable components while maintaining clean, performant frontend output.

**Main purpose:**

- Custom UI components such as `header-custom`, `tab-list-scroll`, and `pin-image-popup`
- Extend Shopify Theme Editor customization via structured schema blocks

**Key features:**

- Custom sections with rich schema settings
- Dynamic blocks with per-block configuration
- Advanced UI behaviors: sticky elements, scroll-driven interactions, hover effects
- Responsive layouts with mobile-first CSS

---

## 🛠 Tech Stack

| Technology               | Usage                                                       |
| ------------------------ | ----------------------------------------------------------- |
| **Shopify Liquid**       | Templating engine for all sections, snippets, and layouts   |
| **HTML5 / CSS3**         | Markup and styling, including CSS custom properties         |
| **JavaScript (Vanilla)** | Custom Elements (Web Components), scroll/intersection logic |
| **Shopify CLI**          | Local development, theme push/pull, store preview           |

---

## 📁 Project Structure

```
.
├── assets/         # CSS and JavaScript files
├── blocks/         # Reusable block partials (prefixed with _)
├── config/         # Theme settings schema (settings_schema.json)
├── layout/         # Theme layout files (theme.liquid, password.liquid)
├── locales/        # Translation strings
├── sections/       # Main UI sections rendered on pages
├── snippets/       # Reusable Liquid partials included by sections
└── templates/      # JSON page templates
```

| Folder       | Description                                                                                           |
| ------------ | ----------------------------------------------------------------------------------------------------- |
| `sections/`  | Each file is a standalone section with Liquid, CSS, JS, and schema. These appear in the Theme Editor. |
| `snippets/`  | Shared partials (e.g. icon sets, card components) included via `{% render %}`.                        |
| `assets/`    | Static CSS and JS files. JS uses custom elements pattern for self-contained behavior.                 |
| `templates/` | JSON templates that define which sections appear on each page type.                                   |
| `config/`    | Global theme settings exposed in the Theme Editor under "Theme settings".                             |
| `blocks/`    | Block-level partials prefixed with `_` used inside section block rendering.                           |

---

## ⚙️ Setup & Development

### Requirements

- [Node.js](https://nodejs.org/) (v18+)
- [Shopify CLI](https://shopify.dev/docs/themes/tools/cli) (v3+)
- A [Shopify Partner](https://partners.shopify.com/) account with access to a development store

### Steps

**1. Clone the repository**

```bash
git clone <repository-url>
cd diptyque-remake
```

**2. Authenticate with Shopify**

```bash
shopify auth login
```

**3. Start local development**

```bash
shopify theme dev --store=<your-store>.myshopify.com
```

**4. Open the preview URL**

The CLI outputs a local preview URL (e.g. `http://127.0.0.1:9292`). Open it in a browser to see live changes.

> Changes to Liquid, CSS, and JS files are picked up automatically without a restart.

---

## 🚀 Shopify CLI Commands

| Command                 | Description                                           |
| ----------------------- | ----------------------------------------------------- |
| `shopify auth login`    | Authenticate your Shopify Partner account             |
| `shopify theme dev`     | Start a local development server with live reload     |
| `shopify theme push`    | Upload the local theme to the connected Shopify store |
| `shopify theme pull`    | Download the current theme from the store to local    |
| `shopify theme publish` | Set the theme as the active published theme           |
| `shopify theme delete`  | Remove a theme from the store                         |

---

## 📌 Development Notes

- **Follow Shopify Liquid best practices** — avoid logic-heavy templates; move complexity into snippets or JS.
- **Reuse snippets** — do not duplicate markup. Extract repeated patterns into `snippets/`.
- **Validate schema JSON** — malformed schema blocks break the Theme Editor silently. Always lint before pushing.
- **Test in Theme Editor** — all sections and blocks must render correctly and be configurable via the editor without errors.
- **CSS custom properties** — use `--` variables for theming values passed from Liquid into stylesheets.
- **Web Components** — JS behavior is encapsulated in custom elements (`customElements.define`). Avoid global scripts.

---

## ⚠️ Notes

- Ensure your **Shopify CLI version** is up to date (`shopify version`). CLI v2 and v3 have different command signatures.
- **Test on both mobile and desktop** before pushing — use browser DevTools and Shopify's mobile preview.
- **Resolve all Liquid errors** locally before running `shopify theme push`. A broken section can prevent the entire page from rendering.
- Do not push directly to a live production theme without first testing on a unpublished duplicate.
