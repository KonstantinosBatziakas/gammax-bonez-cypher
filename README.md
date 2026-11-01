# GAMMAX x BONEZ — Cypher Verse

Bilingual Next.js registration website. Editable rules in `lib/content.ts`. Submissions are emailed to the organizer using Resend; no registration database is used.

## Deploy on Vercel

1. Import this GitHub repository at https://vercel.com/new.
2. Create a Resend account and verify a sending domain. Create a Resend API key.
3. Create a Cloudflare Turnstile widget for the production domain. Copy the site key and secret key.
4. In Vercel > Project > Settings > Environment Variables, set:

- `RESEND_API_KEY` — private Resend key
- `RESEND_FROM_EMAIL` — e.g. `Cypher Verse <registration@your-verified-domain.com>`
- `NOTIFICATION_EMAIL` — `codinginquires1@gmail.com`
- `TURNSTILE_SECRET_KEY` — private Cloudflare Turnstile secret
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` — public Cloudflare Turnstile site key

5. Redeploy after adding environment variables. Submit a test registration and check your inbox.

**Important:** Without Turnstile and Resend configuration, the form intentionally does not send email. The sender must use a verified Resend domain. Do not commit API keys. For production use, consider server-side rate limiting and a retention/privacy policy appropriate to your event. 

## Local development

`npm install && npm run dev`
