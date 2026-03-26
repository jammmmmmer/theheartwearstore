# The Heartwear Store

Natural, thoughtfully made clothing for every generation. Built with Next.js 14, Stripe, Supabase, and Printify.

---

## Tech Stack

- **Next.js 14** (App Router, TypeScript)
- **Tailwind CSS** — warm earth tone design system
- **Supabase** — PostgreSQL database for products and orders
- **Stripe** — payment processing (CAD currency)
- **Printify** — print-on-demand fulfillment
- **Zustand** — client-side cart state with localStorage persistence
- **Netlify** — hosting with `@netlify/plugin-nextjs`

---

## Setup Guide

### 1. Clone and install dependencies

```bash
git clone <your-repo-url>
cd theheartwearstore
npm install
```

### 2. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. In the SQL Editor, paste and run the contents of `supabase/schema.sql`.
3. From **Project Settings → API**, copy:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (service_role secret — keep this private)

### 3. Configure Stripe

1. Go to [dashboard.stripe.com](https://dashboard.stripe.com) and enable **Test mode**.
2. From **Developers → API keys**, copy:
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - `STRIPE_SECRET_KEY`
3. For the webhook secret (`STRIPE_WEBHOOK_SECRET`):
   - **Local dev**: Run `stripe listen --forward-to localhost:3000/api/webhooks/stripe` using the [Stripe CLI](https://stripe.com/docs/stripe-cli). Copy the webhook signing secret it outputs.
   - **Production**: In the Stripe dashboard, create a webhook endpoint pointing to `https://www.theheartwearstore.ca/api/webhooks/stripe` and select the `checkout.session.completed` event. Copy the signing secret.

### 4. Get Printify credentials

1. Go to [printify.com](https://printify.com) → **My Profile → Connections → API**.
2. Generate an API token → `PRINTIFY_API_KEY`.
3. Find your Shop ID in the URL when viewing your shop, or call `GET https://api.printify.com/v1/shops.json` with your token → `PRINTIFY_SHOP_ID`.

### 5. Fill in `.env.local`

```bash
cp .env.local.example .env.local
```

Then fill in every value:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

PRINTIFY_API_KEY=your-printify-api-token
PRINTIFY_SHOP_ID=12345678

NEXT_PUBLIC_SITE_URL=http://localhost:3000
SYNC_SECRET=some-long-random-secret-string
```

### 6. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 7. Sync products from Printify

Once your `.env.local` is configured and Printify products are set up, sync them to Supabase:

```bash
curl -X POST http://localhost:3000/api/sync-products \
  -H "Authorization: Bearer your-sync-secret-here"
```

You should see `{ "synced": N, "errors": [] }`. Products will now appear in the shop.

Re-run this command whenever you add or update products in Printify.

### 8. Deploy to Netlify

1. Push your code to a GitHub repository.
2. Go to [netlify.com](https://netlify.com) → **Add new site → Import from GitHub**.
3. Select your repository. Build settings are pre-configured via `netlify.toml`.
4. In **Site configuration → Environment variables**, add all the same variables from your `.env.local` — but set `NEXT_PUBLIC_SITE_URL=https://www.theheartwearstore.ca`.
5. Deploy the site.

### 9. Point GoDaddy DNS to Netlify

1. In Netlify, go to **Domain management** and add your custom domain: `theheartwearstore.ca`.
2. Netlify will give you nameservers (e.g. `dns1.p01.nsone.net`).
3. In GoDaddy DNS settings, update the nameservers to Netlify's (or add CNAME/A records as Netlify instructs).
4. SSL is handled automatically by Netlify via Let's Encrypt.

### 10. Configure Stripe webhook for production

1. In the Stripe dashboard (production mode), go to **Developers → Webhooks → Add endpoint**.
2. Set the endpoint URL to: `https://www.theheartwearstore.ca/api/webhooks/stripe`
3. Select event: `checkout.session.completed`
4. Copy the signing secret and update `STRIPE_WEBHOOK_SECRET` in Netlify environment variables.
5. Redeploy (or trigger a new deploy) on Netlify for the env var to take effect.

---

## Product Sync

The `/api/sync-products` endpoint is protected by `SYNC_SECRET`. To automate it, you can:

- Set up a GitHub Action on a cron schedule
- Use a simple cron job from any server
- Call it manually after updating your Printify catalog

Example GitHub Action (`.github/workflows/sync-products.yml`):

```yaml
name: Sync Printify Products
on:
  schedule:
    - cron: '0 6 * * *' # Daily at 6am UTC
  workflow_dispatch:
jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - run: |
          curl -X POST ${{ secrets.SITE_URL }}/api/sync-products \
            -H "Authorization: Bearer ${{ secrets.SYNC_SECRET }}"
```

---

## Project Structure

```
theheartwearstore/
├── app/
│   ├── layout.tsx          # Root layout (fonts, Header, Footer, CartDrawer)
│   ├── page.tsx            # Homepage (Hero, Featured, Our Promise)
│   ├── globals.css         # Tailwind + custom design tokens
│   ├── shop/
│   │   ├── page.tsx        # Shop listing page
│   │   └── [productId]/
│   │       └── page.tsx    # Product detail page
│   ├── success/page.tsx    # Post-checkout success
│   ├── cancel/page.tsx     # Post-checkout cancel
│   └── api/
│       ├── products/route.ts          # GET products
│       ├── sync-products/route.ts     # POST sync from Printify
│       ├── create-checkout/route.ts   # POST create Stripe session
│       └── webhooks/
│           ├── stripe/route.ts        # Stripe webhook handler
│           └── printify/route.ts      # Printify webhook handler
├── components/
│   ├── Header.tsx          # Sticky nav + cart icon
│   ├── Footer.tsx          # Dark footer
│   ├── Hero.tsx            # Homepage hero section
│   ├── ProductCard.tsx     # Product grid card
│   ├── ProductDetail.tsx   # Client-side product page with variant selector
│   └── CartDrawer.tsx      # Slide-out cart
├── lib/
│   ├── supabase.ts         # Supabase client + admin client
│   ├── stripe.ts           # Stripe client
│   ├── printify.ts         # Printify API functions
│   ├── cart-store.ts       # Zustand cart store
│   └── utils.ts            # formatPrice, slugify
├── types/
│   └── index.ts            # Shared TypeScript types
├── supabase/
│   └── schema.sql          # Database schema + RLS policies
├── tailwind.config.ts
├── next.config.ts
├── netlify.toml
└── .env.local.example
```

---

## License

Private — All rights reserved, The Heartwear Store.
