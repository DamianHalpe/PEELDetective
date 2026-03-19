# PEEL Detective

An educational web app where students solve crime mystery scenarios by writing structured PEEL paragraphs. An AI evaluates each response with per-component scoring and feedback, while teachers manage scenarios and track class progress.

## Features

- **Mystery scenarios** — Teachers create crime cases with suspects, clues, and a correct culprit
- **PEEL writing practice** — Students write Point / Evidence / Explain / Link paragraphs to solve each case
- **AI evaluation** — OpenRouter grades each PEEL component (0–5 each, 20 total), flags grammar issues, and generates a model answer
- **Gamification** — Points accumulate per submission; badges are awarded for milestones (first case, high scores, scenario count)
- **Teacher dashboard** — Class overview with per-student stats, individual submission review, teacher score overrides, CSV export
- **Authentication** — Email/password and Google OAuth via Better Auth

## Tech Stack

- **Next.js 16** (App Router), React 19, TypeScript
- **Drizzle ORM** with PostgreSQL
- **Better Auth** for authentication
- **Vercel AI SDK** + **OpenRouter** for AI evaluation
- **shadcn/ui** + **Tailwind CSS v4**

## Prerequisites

- Node.js 18+
- pnpm
- PostgreSQL (local or hosted, e.g. Vercel Postgres)
- OpenRouter API key (for AI evaluation)

## Setup

**1. Install dependencies**

```bash
pnpm install
```

**2. Configure environment**

Copy the example and fill in values:

```bash
cp env.example .env
```

```env
# Database
POSTGRES_URL="postgresql://user:password@localhost:5432/peeldetective"

# Authentication
BETTER_AUTH_SECRET="your-32-char-random-secret"

# Google OAuth (optional)
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

# AI Evaluation (required for core functionality)
OPENROUTER_API_KEY="sk-or-v1-..."
OPENROUTER_MODEL="anthropic/claude-sonnet-4-5"

# App URL (must be set for the internal evaluation fetch)
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# File storage (optional — uses local public/uploads/ if unset)
BLOB_READ_WRITE_TOKEN=""
```

**3. Run database migrations**

```bash
pnpm db:migrate
```

**4. (Optional) Seed an admin user**

```bash
pnpm seed:admin
```

**5. Start the dev server**

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

```bash
pnpm dev           # Start dev server (Turbopack)
pnpm build         # Migrate + build for production
pnpm start         # Start production server
pnpm lint          # ESLint
pnpm typecheck     # TypeScript check
pnpm check         # lint + typecheck
pnpm format        # Prettier
pnpm db:generate   # Generate migration files from schema changes
pnpm db:migrate    # Apply pending migrations
pnpm db:push       # Push schema directly (dev shortcut)
pnpm db:studio     # Open Drizzle Studio
pnpm db:reset      # Drop and recreate database
pnpm seed:admin    # Seed super-admin user
```

## User Roles

| Role | Access |
|------|--------|
| `student` | Browse and attempt scenarios, view own submissions and feedback, dashboard with points/badges |
| `teacher` | All student access + create/edit/publish scenarios, view all student submissions, override scores, export CSV |
| `admin` | All teacher access + admin panel |

New registrations default to `student`. Role must be updated directly in the database or via the seed script.

## How AI Evaluation Works

When a student submits a response:

1. A `pending` submission is saved to the database.
2. The server calls `/api/evaluate` with the scenario context and student text.
3. OpenRouter scores each PEEL component (0–5), provides per-component feedback, lists grammar issues, and generates a model answer.
4. The submission is updated to `evaluated`, the student's cumulative points are incremented, and any newly earned badges are awarded.
5. The student is redirected to the feedback page.

If evaluation fails, the submission is marked `failed` and the student is still sent to a feedback page showing the error.

## Deployment

Deploy to Vercel (recommended):

```bash
vercel --prod
```

Set all environment variables in the Vercel dashboard. Use `BLOB_READ_WRITE_TOKEN` to enable Vercel Blob storage for file uploads; leave it unset to use local filesystem storage (not suitable for production).
