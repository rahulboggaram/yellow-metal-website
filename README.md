# Yellow Metal

Marketing website for Yellow Metal gold loans — a single landing page with footer pages for About, Blog, Contact, Privacy, and Terms.

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy to Vercel

1. Push this folder to a new GitHub repo (e.g. `yellow-metal`).
2. Go to [vercel.com/new](https://vercel.com/new) and import the repo.
3. Framework preset: **Next.js** (auto-detected).
4. Deploy — no environment variables required for the live gold rate API.

Optional: connect a custom domain (e.g. `yellowmetal.com`) in Vercel → Project → Settings → Domains.

## Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page (hero, rates, packet animation, UPI, features) |
| `/about` | About us |
| `/blog` | Blog index |
| `/contact` | Contact details |
| `/privacy` | Privacy policy |
| `/terms` | Terms & conditions |

## Gold rates

`/api/gold-price` fetches international spot gold and USD/INR, then calculates 22K per gram and 75% LTV loan amount.
