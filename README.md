# Furniture8home

Storefront for **Furniture8home**, with showrooms in Maligaon and Paschim Boragaon, Guwahati.

## Showrooms

- AT Road, Maligaon, opposite The GYM, Guwahati — 781011
- Paschim Boragaon, opposite GYM Central, Guwahati — 781035
- WhatsApp: [60025 84075](https://wa.me/916002584075)

## How the shop is split

| Repo | What it is | Hosted on |
| --- | --- | --- |
| [furniture8home.com](https://github.com/imrituraj/furniture8home.com) (this repo) | The public storefront (React + Vite, in `frontend/`) | Vercel |
| [furniture8home-backend](https://github.com/imrituraj/furniture8home-backend) | Shop API, D1 database, Razorpay, and the admin dashboard | Cloudflare Workers |

The storefront loads products and categories from the backend (`GET /api/products`, `GET /api/categories`). If the backend can't be reached it falls back to the copies bundled in `frontend/src/data/`, so the catalog still shows. Checkout, orders and payments always go through the backend.

Customers add pieces to a cart (with their fabric / chaise choice) and check out with:

- **Pay online**: Razorpay Checkout (UPI, cards, net banking, wallets), shown only when the backend has Razorpay keys.
- **Buy offline**: order now, pay on delivery or at the showroom.
- **Order on WhatsApp**: the order is saved and a pre-filled WhatsApp message with the order number opens.

## Develop

```bash
npm install          # installs the storefront in frontend/
npm run dev          # storefront on http://localhost:5173
```

Run the backend repo's `npm run dev` at the same time; Vite forwards `/api` and `/media` to it on port 8787. Without it, the storefront shows the bundled catalog and checkout fails.

## Deploy on Vercel

Vercel builds from the repo root using `vercel.json` (`npm install`, `npm run build`, output `frontend/dist`).

In the Vercel project, set this environment variable, then redeploy:

| Variable | Value |
| --- | --- |
| `VITE_API_URL` | The backend's URL, e.g. `https://furniture8home-backend.<your-subdomain>.workers.dev` |

The footer's "Catalog admin" link points at the same URL (where the admin dashboard lives). Set `VITE_ADMIN_URL` only if the admin is somewhere else. Both are read at build time, so a change needs a redeploy.

The backend only accepts storefront requests from the domains listed in its `STOREFRONT_ORIGIN` setting, so add any new domain there too.
