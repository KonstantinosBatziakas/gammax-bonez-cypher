# GAMMAX x BONEZ — Cypher Verse

Bilingual Next.js registration website. Rules are editable in `lib/content.ts`. Registration notifications are sent using **Google Apps Script + Gmail**. No paid email service or domain required. Subject to Google Apps Script and Gmail quotas.

## 1. Create the Gmail notification service (on iPhone)

1. Sign into the Google account that should **send** notifications, ideally `codinginquires1@gmail.com`.
2. Visit https://script.google.com and create a new project.
3. Replace its `Code.gs` contents with the code in `google-apps-script/Code.gs`.
4. In Apps Script > Project Settings > Script Properties add `SHARED_SECRET` with a long random string. Never put this secret in GitHub.
5. Deploy > New deployment > Web app. Execute as **Me**; Who has access: **Anyone**. Authorize Gmail sending in Google's permission flow. Copy the URL ending in `/exec`.
6. When you edit the Apps Script code later, deploy a **new version** of the existing deployment.

## 2. Deploy on Vercel

1. Import this GitHub repository at https://vercel.com/new.
2. Create a free Cloudflare Turnstile widget for your Vercel domain. Copy its site and secret keys.
3. In Vercel > Project > Settings > Environment Variables, set:

- `GOOGLE_SCRIPT_WEB_APP_URL` — Apps Script Web app URL ending in /exec
- `GOOGLE_SCRIPT_SHARED_SECRET` — **same** value as Apps Script `SHARED_SECRET`
- `TURNSTILE_SECRET_KEY` — Turnstile private key
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` — Turnstile public site key

4. Redeploy. Submit a registration and confirm that `codinginquires1@gmail.com` receives it.

## Security and limitations

The browser posts only to the Next.js server. The server validates the form, checks Cloudflare Turnstile, and forwards it with a private shared secret to Apps Script. Apps Script rejects requests without the correct secret. Keep both secrets private in Vercel / Google Script Properties. Do not put secrets in the repository or browser. This is a small-event solution: Google quotas apply, and for higher volume you should add persistent rate limiting and duplicate prevention. Form data is sent to Google for email delivery. Keep a clear privacy notice and delete registrations when no longer needed. Google authorization and Vercel deployment must be completed by the account owner.

## Local development

`npm install && npm run dev`
