# Furniture8home

Storefront for **Furniture8home**, with showrooms in Maligaon and Paschim Boragaon, Guwahati.

## Showrooms

- AT Road, Maligaon, opposite The GYM, Guwahati — 781011
- Paschim Boragaon, opposite GYM Central, Guwahati — 781035
- WhatsApp: [60025 84075](https://wa.me/916002584075)

## How the shop is split

| Repo | What it is | Hosted on |
| --- | --- | --- |
| [furniture8home-frontend](https://github.com/imrituraj/furniture8home-frontend) (this repo) | The storefront (`frontend/`) and the admin dashboard (`admin/`) | Vercel |
| [furniture8home-backend](https://github.com/imrituraj/furniture8home-backend) | The shop API, D1 database and Razorpay, nothing else | Cloudflare Workers |

One Vercel project serves both sites from this repo:

- `furniture8home.com`: the storefront.
- `admin.furniture8home.com`: the admin dashboard (Orders, Products, Categories), behind a PIN login. `vercel.json` routes the admin domain to it, and sends `furniture8home.com/admin` there too.

The storefront loads products and categories from the backend (`GET /api/products`, `GET /api/categories`). If the backend can't be reached it falls back to the copies bundled in `frontend/src/data/`, so the catalog still shows. Checkout, orders, payments and everything in the admin always go through the backend.

Customers add pieces to a cart (with their fabric / chaise choice) and check out with:

- **Pay online**: Razorpay Checkout (UPI, cards, net banking, wallets), shown only when the backend has Razorpay keys.
- **Buy offline**: order now, pay on delivery or at the showroom.
- **Order on WhatsApp**: the order is saved and a pre-filled WhatsApp message with the order number opens.

## Develop

Start the backend first (`npm run dev` in the backend repo, on port 8787). Then:

```bash
npm install          # installs the storefront and the admin
npm run dev          # storefront on http://localhost:5173
npm run dev:admin    # admin on http://localhost:5174/admin/ (local PIN 8888)
```

Both forward `/api` and `/media` to the backend on port 8787.

## Deploy on Vercel

Vercel builds from the repo root using `vercel.json`: `npm install`, then `npm run build`, which builds the storefront into `frontend/dist` and the admin into `frontend/dist/admin`.

1. **Environment variable.** In the Vercel project, set `VITE_API_URL` to the backend's URL, e.g. `https://furniture8home-backend.ritur-dev.workers.dev`, then redeploy. Both apps read it at build time.
2. **Admin domain.** In the Vercel project → Settings → Domains, add `admin.furniture8home.com`, then add the DNS record Vercel shows (a `CNAME` for `admin`) at your domain provider.

The backend only accepts storefront requests from `furniture8home.com` / `www.furniture8home.com`, and admin requests from `admin.furniture8home.com` (its `STOREFRONT_ORIGIN` and `ADMIN_ORIGIN` settings). Add any other domain there too.
