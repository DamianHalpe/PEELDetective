# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Project Is

**PEEL Detective** is an educational web app where students solve crime mystery scenarios by writing structured PEEL paragraphs (Point, Evidence, Explain, Link). An AI (via OpenRouter) evaluates their responses and provides scored feedback. Teachers can manage scenarios, review student submissions, and export class data.

## Commands

```bash
pnpm dev           # Start dev server with Turbopack
pnpm build         # Run DB migrations then build for production
pnpm lint          # ESLint
pnpm typecheck     # tsc --noEmit
pnpm check         # lint + typecheck together
pnpm format        # Prettier write
pnpm db:generate   # Generate Drizzle migration files
pnpm db:migrate    # Apply pending migrations
pnpm db:push       # Push schema changes directly (dev shortcut)
pnpm db:studio     # Open Drizzle Studio GUI
pnpm seed:admin    # Seed a super-admin user
```

Run `pnpm check` before committing — it covers both lint and type errors.

## Architecture

### Stack
- **Next.js 16** (App Router) with React 19, TypeScript, Turbopack in dev
- **Better Auth** for authentication (email/password + Google OAuth)
- **Drizzle ORM** with PostgreSQL (`postgres` driver)
- **Vercel AI SDK** + **OpenRouter** for AI evaluation
- **shadcn/ui** + **Tailwind CSS v4** for UI

### Key Directories
- `src/app/` — Next.js App Router pages and API routes
- `src/lib/` — Shared utilities: `auth.ts`, `auth-client.ts`, `db.ts`, `schema.ts`, `session.ts`, `badges.ts`, `storage.ts`
- `src/hooks/` — Client-side hooks
- `src/components/` — Shared React components (`ui/` = shadcn)

### Database Schema (`src/lib/schema.ts`)
Core tables:
- `user` — extends BetterAuth user with `role` ("student" | "teacher" | "admin"), `schoolId`, `points`
- `scenario` — mystery scenarios with `suspects` (jsonb), `clues` (jsonb), `correctCulprit`, `published`, `difficulty`
- `submission` — student responses with per-PEEL scores (`scorePoint`, `scoreEvidence`, `scoreExplain`, `scoreLink`), `feedbackJson`, `grammarFlagsJson`, `modelAnswer`, `status` ("pending" | "evaluated" | "failed"), teacher override fields
- `badge` / `studentBadge` — gamification: badges seeded via `src/lib/badges.ts`

**Important:** All non-BetterAuth ID fields must use UUID (`crypto.randomUUID()`), not auto-increment integers. BetterAuth tables (user, session, account, verification) use text IDs managed by the library.

### Auth & Session Pattern
- Server-side auth check: `auth.api.getSession({ headers: await headers() })` — used directly in Server Components and API routes
- Helper wrappers in `src/lib/session.ts`: `requireAuth()` (redirects if unauthenticated), `getOptionalSession()`
- Client-side: `useSession()` from `src/lib/auth-client`
- Middleware (`src/proxy.ts`) protects `/teacher/*` and `/admin/*` routes via session cookie check; role enforcement happens server-side in pages/routes

### Role-Based Access
Roles: `student` (default), `teacher`, `admin`. Role checks are done in individual pages/API routes, not middleware. Teacher pages redirect to `/dashboard` if the user is not `teacher` or `admin`.

### AI Evaluation Flow
1. Student submits at `POST /api/submissions` — creates a `pending` submission in DB
2. The route internally calls `POST /api/evaluate` with the scenario context and student text
3. `/api/evaluate` calls OpenRouter (model from `OPENROUTER_MODEL` env var, defaults to `anthropic/claude-sonnet-4-5`) with a structured prompt, returns JSON scores + feedback
4. Submission is updated to `evaluated` (or `failed`), points are added to the user, badges are awarded via `src/lib/badges.ts`
5. Client is redirected to `/scenarios/[id]/feedback/[submissionId]`

### Route Structure
- `/(auth)/` — login, register, forgot/reset password (route group, shared layout)
- `/scenarios/` — student-facing: browse scenarios, view details, write response, view feedback
- `/teacher/` — teacher dashboard, scenario CRUD, student views, submission review; protected by middleware + role check
- `/dashboard/` — student dashboard
- `/learn/` — PEEL learning guide
- `/api/` — REST endpoints mirroring the above domains

### Styling
Tailwind CSS v4 (config is inline in `globals.css` via `@theme`). Custom brand tokens:
- `detective-amber` — primary accent color (gold/amber, used throughout)
- `detective-crimson` — danger/highlight
- `detective-slate` — muted backgrounds

Use these tokens in classnames: `text-detective-amber`, `bg-detective-amber/10`, `border-detective-amber/20`, etc.

### File Storage
`src/lib/storage.ts` auto-switches between local `public/uploads/` (dev, no token set) and Vercel Blob (prod, when `BLOB_READ_WRITE_TOKEN` is set).

## Environment Variables

Required:
- `POSTGRES_URL` — PostgreSQL connection string
- `BETTER_AUTH_SECRET` — 32+ char random secret
- `NEXT_PUBLIC_APP_URL` — app base URL (used for internal fetch in submissions route)

Optional:
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — Google OAuth
- `OPENROUTER_API_KEY` — required for AI evaluation
- `OPENROUTER_MODEL` — defaults to `anthropic/claude-sonnet-4-5`
- `BLOB_READ_WRITE_TOKEN` — Vercel Blob (falls back to local storage)
