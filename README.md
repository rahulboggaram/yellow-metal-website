# Yellow Metal

Marketing website for Yellow Metal gold loans (RBI-registered NBFC).

## Local development

```bash
npm install
cp .env.local.example .env.local   # then fill secrets
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Required environment variables

| Variable | Purpose |
|----------|---------|
| `ADMIN_SECRET` | Admin login password (or use `ADMIN_PASSWORD_HASH`) |
| `ADMIN_SESSION_SECRET` | ≥32-char random secret used only to sign/revoke admin cookies (never reuse the password) |
| `ADMIN_PASSWORD_HASH` | Optional `scrypt$…` hash instead of plaintext `ADMIN_SECRET` |
| `ADMIN_TOTP_SECRET` | Optional base32 TOTP secret (Google Authenticator) — when set, login requires a 6-digit code |
| `YM_SUPABASE_URL` | Yellow Metal official Supabase project URL |
| `YM_SUPABASE_SERVICE_ROLE_KEY` | Server-only service role key (never expose to browser) |
| `SPOT_SUPABASE_URL` | Spot prices Supabase project URL |
| `SPOT_SUPABASE_ANON_KEY` | Spot anon key (RLS must be read-only on `market_prices`) |
| `BLOB_READ_WRITE_TOKEN` / `BLOB_STORE_ID` | Optional legacy Blob — not required once YM Supabase is configured |

## Deploy to Vercel

1. Push to GitHub and import in Vercel.
2. Set the environment variables above for Production and Preview.
3. Deploy.

## Admin

- UI: `/admin` (noindex)
- Sessions use an HttpOnly cookie (`__Host-ym_admin_session` in production), are revocable on sign-out, and expire in 4 hours.
- Loan plan create/update/delete writes an append-only audit log.

## Website telemetry

Public pages send minimal analytics/engagement beacons. Session IDs are hashed before storage; city and exact calculator grams are not stored. Retention ~90 days. See the Privacy Policy.
