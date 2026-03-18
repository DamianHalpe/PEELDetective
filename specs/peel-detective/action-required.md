# Action Required: PEEL Detective

Manual steps that must be completed by a human. These cannot be automated.

## Before Implementation

- [ ] **Get OpenRouter API key** — Required for AI evaluation. Sign up at https://openrouter.ai/settings/keys and ensure the account has credits to access `anthropic/claude-sonnet-4-5`
- [ ] **Provision PostgreSQL database** — Set up a PostgreSQL instance. Recommended: Supabase (free tier) or Railway. Copy the connection string.
- [ ] **Generate BetterAuth secret** — Generate a 32-character random string for `BETTER_AUTH_SECRET` (e.g., `openssl rand -base64 32`)
- [ ] **Get Google OAuth credentials** — Create a project in [Google Cloud Console](https://console.cloud.google.com/), enable the Google+ API, and create OAuth 2.0 credentials. Set authorised redirect URI to `http://localhost:3004/api/auth/callback/google` (dev) and your production URL. Copy Client ID and Client Secret.

## During Implementation

- [ ] **Set environment variables** — Copy `env.example` to `.env.local` and fill in all required values:
  ```env
  POSTGRES_URL=postgresql://user:password@host:5432/db
  BETTER_AUTH_SECRET=<32-char-random-string>
  OPENROUTER_API_KEY=sk-or-v1-your-key
  OPENROUTER_MODEL=anthropic/claude-sonnet-4-5
  NEXT_PUBLIC_APP_URL=http://localhost:3000
  GOOGLE_CLIENT_ID=your-google-client-id
  GOOGLE_CLIENT_SECRET=your-google-client-secret
  ```
- [ ] **Run database migrations** — After schema changes in Phase 1, run `pnpm run db:migrate` to apply the new tables
- [ ] **Seed initial badge data** — After Phase 5 badge table is created, run the seed script to insert default badges

## After Implementation

- [ ] **Create at least 10 crime scenarios** — Required for launch. Schedule a content workshop with Marissa to create these using the teacher scenario creation form. Each scenario needs: title, crime description, 3–5 suspects with backgrounds, 4–6 clues, and the correct culprit.
- [ ] **Configure Vercel deployment** — Set all environment variables in Vercel project settings (same as `.env.local` but with production database URL and `NEXT_PUBLIC_APP_URL=https://your-domain.com`)
- [ ] **Create admin user account** — After deploying, register the first account, then manually update its `role` to `admin` in the database using Drizzle Studio (`pnpm run db:studio`) so the admin can then promote other teachers
- [ ] **Test AI evaluation quality** — Have Marissa review a sample of AI-generated feedback before launch to confirm accuracy and age-appropriateness

---

> **Note:** These tasks are also listed in context within `implementation-plan.md`
