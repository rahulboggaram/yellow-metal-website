# Yellow Metal

Marketing website for Yellow Metal gold loans (RBI-registered NBFC).

## Local development

```bash
npm install
cp .env.local.example .env.local   # then fill secrets
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Local `npm run dev` can use `data/*.json` if Yellow Metal Supabase is unset. **Vercel Production/Preview always requires YM Supabase** — there is no silent local fallback on hosted runtimes.

## Required environment variables

| Variable | Purpose |
|----------|---------|
| `ADMIN_PASSWORD_HASH` | Preferred: `scrypt$…` hash for admin password (required style for production) |
| `ADMIN_SECRET` | Fallback plaintext password only for local/dev if hash is unset |
| `ADMIN_SESSION_SECRET` | ≥32-char random secret used only to sign/revoke admin cookies (never reuse the password) |
| `ADMIN_TOTP_SECRET` | Optional base32 TOTP secret (Google Authenticator) — when set, login requires a 6-digit code |
| `YM_SUPABASE_URL` | Yellow Metal official Supabase project URL (**required on Vercel**) |
| `YM_SUPABASE_SERVICE_ROLE_KEY` | Server-only secret key (`sb_secret_…` preferred; never expose to browser) |
| `SPOT_SUPABASE_URL` | Spot prices Supabase project URL |
| `SPOT_SUPABASE_ANON_KEY` | Spot anon key (RLS must be read-only on `market_prices`) |
| `CRON_SECRET` | Bearer token for `/api/cron/retention` (Vercel Cron Authorization header) |

## Deploy to Vercel

1. Push to GitHub and import in Vercel.
2. Set the environment variables above for Production and Preview.
3. Deploy.
4. Confirm Vercel Cron runs `/api/cron/retention` daily (see `vercel.json`).

## Admin

- UI: `/admin` (noindex)
- Sessions use an HttpOnly cookie (`__Host-ym_admin_session` in production), are revocable on sign-out, and expire in 4 hours.
- Loan plan create/update/delete writes an append-only audit log.

## Website telemetry

Public pages send minimal analytics/engagement beacons. Session IDs are hashed before storage; city and exact calculator grams are not stored. Rows older than ~90 days are deleted by the daily retention cron. See the Privacy Policy.

## Secret rotation (Supabase)

Legacy `service_role` JWT keys cannot be regenerated in place. Create a new **Secret key** (`sb_secret_…`) under Project Settings → API Keys, put it in `YM_SUPABASE_SERVICE_ROLE_KEY`, redeploy, then disable the legacy `service_role` key.
