# Furniture8home

React catalog for **Furniture8home**, with showrooms in Maligaon and Paschim Boragaon, Guwahati.

## Showrooms

- AT Road, Maligaon, opposite The GYM, Guwahati — 781011
- Paschim Boragaon, opposite GYM Central, Guwahati — 781035
- WhatsApp: [60025 84075](https://wa.me/916002584075)

## Project layout

| Folder      | What it is                                                                                   |
| ----------- | -------------------------------------------------------------------------------------------- |
| `frontend/` | The public storefront (React + Vite). Builds to a static site.                               |
| `backend/`  | Node/Express server: the catalog API plus the PIN-protected admin dashboard for editing it. |

The storefront loads its products from `GET /api/products`. If the API can't be reached it falls back to the copy bundled in `frontend/src/data/products.json`.

Edits made in the admin dashboard (prices, stock, visibility, new products) are saved by the backend to `backend/data/catalog.json`, which is created on first run from `backend/data/products.json` (the factory catalog).

## Categories

Categories are managed from the **Categories** tab in the admin dashboard: add, rename (English and Assamese), set a cover photo, reorder, hide, or delete them. Each category can also turn on the L-shape orientation (left / right chaise) picker for its products. A category's id never changes, because products store it in `cat`. A category can't be deleted while products still use it.

The live list is saved to `backend/data/categories.json`, created on first run from `backend/data/category-seed.json`. The storefront loads it from `GET /api/categories` and falls back to `frontend/src/data/categories.json` if the API can't be reached. Category tiles and filters only appear once a category has at least one product.

## Shopping & payments

Customers add pieces to a cart (with their fabric / chaise choice) and check out with one of three options:

- **Pay online** — Razorpay Checkout (UPI, cards, net banking, wallets). Shown only when Razorpay keys are configured.
- **Buy offline** — order now, pay by cash/UPI/card on delivery or at the showroom.
- **Order on WhatsApp** — the order is saved and a pre-filled WhatsApp message with the order number opens.

Prices are always recalculated on the server from the catalog, and online payments are only marked paid after the Razorpay signature is verified (or a signed webhook arrives). Out-of-stock pieces can't be bought online — they stay as WhatsApp custom-order enquiries.

Orders are saved to `backend/data/orders.json` and managed from the **Orders** tab in the admin dashboard (status, payment status, internal notes, one-tap WhatsApp to the customer).

### Razorpay setup

1. In the Razorpay Dashboard, generate API keys (use **Test mode** keys first).
2. Set `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` for the backend.
3. Recommended: add a webhook pointing to `https://<your-backend>/api/razorpay/webhook` with the events `order.paid`, `payment.captured` and `payment.failed`, and set its secret as `RAZORPAY_WEBHOOK_SECRET`. This marks orders paid even if the customer closes the page right after paying.

## Develop

```bash
npm run install:all
npm run dev:backend    # admin + API on http://localhost:4000
npm run dev:frontend   # storefront on http://localhost:5173 (proxies /api to :4000)
```

The admin PIN defaults to `8888`. See `backend/.env.example` for all settings (admin PIN, Razorpay keys, allowed storefront origin) and set `ADMIN_PIN` before deploying. The backend reads them from the environment, e.g. `ADMIN_PIN=… RAZORPAY_KEY_ID=… npm run dev:backend`.

## Build & deploy

```bash
npm run build       # storefront only (what Vercel / Cloudflare deploy)
npm run build:all   # storefront + admin dashboard
```

At the repo root, `npm install` also installs the storefront's dependencies, so hosts that run install-then-build from the root work without extra settings. `vercel.json` and `wrangler.jsonc` point both hosts at `frontend/dist`.

- `frontend/dist/` is the static storefront. Set `VITE_API_URL` (where the backend lives) and `VITE_ADMIN_URL` (for the footer's staff login link) at build time if the backend is on a different domain.
- `backend/dist/` is the admin dashboard. Run `ADMIN_PIN=… npm start --prefix backend` to serve it together with the API. In production the server refuses to start unless `ADMIN_PIN` is 6–8 digits. Serve it over HTTPS, and set `TRUST_PROXY=1` when it sits behind a reverse proxy so login and order rate limits see real visitor IPs.
- The dev backend (`npm run dev:backend`) only listens on `127.0.0.1`. Don't expose it to a network — deploy with `npm start`. Set `VITE_STOREFRONT_URL` at build time so image previews and "view on store" links point at the storefront.
