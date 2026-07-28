# Email sign-up verification — Supabase SMTP setup

When a new visitor signs up with email + password, Supabase sends a
verification email ("Confirm your email") to the address they used.
That email contains a one-click link that:

1. Verifies the user's email with Supabase auth.
2. Redirects them back to `/auth/callback?code=...` on this app.
3. Exchanges the code for a session, creates the `users` row, and
   routes them to `/onboarding/role` so they can pick Student / Club /
   Company.

If the email never arrives (or lands in spam), the user can't finish
sign-up. So getting SMTP right is part of the launch checklist.

---

## 1. Pick an SMTP provider

Supabase has a built-in email service, but it caps at ~3 emails/hour
and isn't tuned for deliverability in Bangladesh. For production, swap
in a custom SMTP provider.

| Provider                | Bangladesh deliverability | Free tier    | Notes                                                          |
| ----------------------- | ------------------------- | ------------ | -------------------------------------------------------------- |
| **Resend**              | Good (Asia POPs)          | 3,000/mo     | Easiest setup, modern API, recommended default.                |
| **Brevo (Sendinblue)**  | Good                      | 300/day free | Good if you also want marketing email later.                   |
| **SendGrid**            | Mixed                     | 100/day free | Established, more setup steps.                                 |
| **AWS SES**             | Good (with sns config)   | 62k/mo free  | Cheapest at scale but harder to set up; not recommended yet.   |
| Supabase built-in       | OK for dev                | 3/hour       | Fine for local testing, NOT for production.                    |

For Storporate, **Resend** is the best starting point: smallest setup
friction, good deliverability into @gmail.com / @yahoo.com / @bracu.ac.bd,
and you can keep using the same provider for transactional email
later (drafts, outreach notifications).

---

## 2. Get SMTP credentials from the provider

For Resend, the setup is:

1. Create an account at <https://resend.com>.
2. **Add and verify your sending domain** (e.g. `mail.storporate.bd`).
   Resend shows you the DNS records (SPF, DKIM, DMARC) you need to add
   to your domain registrar. Wait for them to verify before continuing.
3. Create an **API key** with "Sending access" scope. Save it as
   `RESEND_API_KEY`.
4. The SMTP host is `smtp.resend.com`, port `465` (SSL) or `587` (TLS),
   username `resend`, password = the API key.

For Brevo / SendGrid, the dashboard exposes similar host/port/user/password
fields.

---

## 3. Plug SMTP into Supabase

1. Open the Supabase dashboard → **Authentication → Sign In / Up → SMTP
   Settings**.
2. Click **Enable Custom SMTP**.
3. Fill in:
   - **Sender email**: `noreply@storporate.bd` (or whatever you verified).
   - **Sender name**: `Storporate`.
   - **Host**: `smtp.resend.com` (or provider equivalent).
   - **Port**: `465`.
   - **Username**: `resend`.
   - **Password**: the API key.
4. Save. Supabase will send a test email to your Supabase account email
   to confirm the wiring works.

> Note: Supabase also exposes **Templates** under
> Authentication → Emails. The default "Confirm signup" template is fine
> for now — Supabase renders it with your brand color from the SMTP
> config and uses the redirect link from your app automatically.

---

## 4. Tell Supabase the right redirect URL

The verification link Supabase embeds in the email points to:

```
https://<your-app-domain>/auth/callback?code=...
```

To configure it:

1. **Authentication → URL Configuration**.
2. Set **Site URL** to your production URL: `https://storporate.bd`
   (or whatever you deployed to on Vercel).
3. Under **Redirect URLs**, add both:
   - `http://localhost:3000/auth/callback`
   - `https://<your-vercel-domain>/auth/callback`
4. Save.

These are also what `lib/supabase/server.ts` and
`app/auth/actions.ts` derive `emailRedirectTo` from at runtime — they
read `NEXT_PUBLIC_APP_URL` and fall back to `localhost:3000`.

Make sure `NEXT_PUBLIC_APP_URL` is set in your Vercel project to your
production domain. Without it, the verification link in the email will
point at `localhost` and the user will land on a dead end.

---

## 5. Local dev tip

For local testing, you don't need real SMTP — Supabase's built-in email
service will deliver to the inbox of any email you've added to
**Authentication → Users** in the Supabase dashboard. The verification
link lands in the Supabase project's email logs (under
**Authentication → Logs**).

If you want to test the full flow including deliverability, point your
local `.env.local` at a real SMTP provider and re-trigger a sign-up.

---

## 6. Where this lives in the code

- `app/auth/actions.ts` — calls `signUp({ emailRedirectTo })` with the
  app's canonical origin. The redirect URL is appended with a trailing
  slash to be friendly to intermediaries that strip the path.
- `app/auth/callback/route.ts` — exchanges the code, ensures the
  `users` row exists, and routes to `/onboarding/role`,
  `/onboarding/details`, or `/dashboard` based on what the user still
  needs to do.
- `app/signup/check-email/page.tsx` — the "we sent you a link" landing
  page, masked email so users can confirm where to look.
- `middleware.ts` — protects `/dashboard` and `/onboarding` so unauthed
  users land on `/signin` instead of a broken dashboard.

If you want me to switch the SMTP provider in the future, you only
need to update the values in the Supabase dashboard — no code changes
required.
