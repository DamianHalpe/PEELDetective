# Implementation Plan: PEEL Detective

## Overview

Build the PEEL Detective educational app on top of the existing Next.js 16 boilerplate. The boilerplate provides: BetterAuth (email/password), PostgreSQL + Drizzle ORM, shadcn/ui + Tailwind CSS 4, and an OpenRouter AI integration. We extend the schema, add role-based auth, build all pages, connect Claude for evaluation, and apply a crime-noir visual theme.

---

## Phase 1: Foundation — Schema, Auth & Theme

Extend the boilerplate's database schema with all PEEL-specific tables, add role-based access control, and apply the crime-noir visual theme.

### Tasks

- [ ] Extend `src/lib/schema.ts` with new columns on `user` and all new tables
- [ ] Generate and run database migration
- [ ] Add role-based middleware to protect `/teacher` and `/admin` routes
- [ ] Update BetterAuth config to expose `role` in session
- [ ] Apply crime-noir colour tokens to `src/app/globals.css`
- [ ] Update `src/components/site-header.tsx` with PEEL Detective branding and nav links

### Technical Details

**Extended `user` table columns (add to existing Drizzle `user` table):**
```ts
role: text("role").notNull().default("student"), // "student" | "teacher" | "admin"
schoolId: text("school_id").references(() => school.id),
points: integer("points").notNull().default(0),
```

**New Drizzle tables to add to `src/lib/schema.ts`:**
```ts
export const school = pgTable("school", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const scenario = pgTable("scenario", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  crimeDescription: text("crime_description").notNull(),
  suspects: jsonb("suspects").notNull(), // { name, background }[]
  clues: jsonb("clues").notNull(), // string[]
  correctCulprit: text("correct_culprit").notNull(),
  difficulty: integer("difficulty").notNull().default(1), // 1–3
  createdBy: text("created_by").notNull().references(() => user.id),
  published: boolean("published").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const submission = pgTable("submission", {
  id: text("id").primaryKey(),
  studentId: text("student_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  scenarioId: text("scenario_id").notNull().references(() => scenario.id, { onDelete: "cascade" }),
  responseText: text("response_text").notNull(),
  scorePoint: integer("score_point"),
  scoreEvidence: integer("score_evidence"),
  scoreExplain: integer("score_explain"),
  scoreLink: integer("score_link"),
  totalScore: integer("total_score"),
  feedbackJson: jsonb("feedback_json"), // { point, evidence, explain, link }
  grammarFlagsJson: jsonb("grammar_flags_json"), // string[]
  modelAnswer: text("model_answer"),
  teacherOverrideScore: integer("teacher_override_score"),
  teacherOverrideNote: text("teacher_override_note"),
  status: text("status").notNull().default("pending"), // "pending" | "evaluated" | "failed"
  submittedAt: timestamp("submitted_at").notNull().defaultNow(),
  aiEvaluatedAt: timestamp("ai_evaluated_at"),
});

export const badge = pgTable("badge", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  iconName: text("icon_name").notNull(), // Lucide icon name string
  triggerCondition: text("trigger_condition").notNull(),
});

export const studentBadge = pgTable("student_badge", {
  id: text("id").primaryKey(),
  studentId: text("student_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  badgeId: text("badge_id").notNull().references(() => badge.id),
  awardedAt: timestamp("awarded_at").notNull().defaultNow(),
});
```

**Migration commands:**
```bash
pnpm run db:generate
pnpm run db:migrate
```

**Middleware (`src/middleware.ts`):**
```ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Check session cookie and role for /teacher and /admin routes
  // Redirect to /login if unauthenticated, /scenarios if wrong role
}

export const config = {
  matcher: ["/teacher/:path*", "/admin/:path*"],
};
```

**Crime-noir colour tokens to add to `src/app/globals.css`:**
```css
:root {
  --detective-amber: oklch(0.75 0.18 75);
  --detective-crimson: oklch(0.55 0.22 25);
  --detective-slate: oklch(0.25 0.01 260);
}
.dark {
  --background: oklch(0.14 0.01 260);
  --card: oklch(0.18 0.01 260);
}
```

**Nav links to add to `site-header.tsx`:** Scenarios (`/scenarios`), Learn (`/learn`), Teacher Dashboard (`/teacher` — teacher/admin only).

---

## Phase 2: Core Platform — Scenarios & AI Evaluation

Build scenario CRUD for teachers and the AI evaluation pipeline.

### Tasks

- [ ] Create `GET /api/scenarios` — list published scenarios (students) or all (teachers)
- [ ] Create `POST /api/scenarios` — create new scenario (teacher/admin only)
- [ ] Create `GET /api/scenarios/[id]` — get single scenario with clue details
- [ ] Create `PUT /api/scenarios/[id]` — update scenario (teacher/admin only)
- [ ] Create `DELETE /api/scenarios/[id]` — delete scenario (teacher/admin only)
- [ ] Create `POST /api/evaluate` — internal endpoint that calls Claude and returns structured feedback
- [ ] Create `POST /api/submissions` — create submission, call evaluate, store result, return feedback
- [ ] Create `PATCH /api/submissions/[id]` — teacher score override
- [ ] Build teacher scenario management page (`/teacher/scenarios`) with list + publish toggle
- [ ] Build teacher scenario creation form (`/teacher/scenarios/new`) [complex]
  - [ ] Form fields: title, crime description, suspects (dynamic list), clues (dynamic list), correct culprit, difficulty
  - [ ] Preview mode before publishing
  - [ ] Publish/unpublish toggle on save
- [ ] Build teacher scenario edit page (`/teacher/scenarios/[id]/edit`)

### Technical Details

**AI evaluation API route (`src/app/api/evaluate/route.ts`):**
Uses existing OpenRouter integration. Configure model via env var `OPENROUTER_MODEL=anthropic/claude-sonnet-4-5`.

System prompt (from spec):
```
You are an educational writing evaluator for students aged 11–16.
Evaluate the student's response using the PEEL writing framework.
Respond only in valid JSON.

Score each element 0–5:
- Point (P): Did the student clearly state who the culprit is?
- Evidence (E): Did the student cite relevant clues from the scenario?
- Explain (E): Did the student logically connect the clues to their conclusion?
- Link (L): Did the student tie everything back to the crime scenario?

Return JSON in this exact schema:
{
  "scores": { "point": int, "evidence": int, "explain": int, "link": int },
  "total": int,
  "feedback": { "point": "string", "evidence": "string", "explain": "string", "link": "string" },
  "grammar_flags": ["string"],
  "model_answer": "string"
}
```

User prompt (dynamic):
```
Crime scenario: {crime_description}
Suspects: {suspect_list}
Clues: {clues}
Correct culprit: {correct_culprit}

Student's response:
{student_response}
```

**`POST /api/submissions` flow:**
1. Authenticate user, verify student role
2. Insert submission with `status: "pending"`
3. Call `/api/evaluate` internally
4. Parse JSON response, validate all fields present
5. Update submission with scores + `status: "evaluated"`
6. Check badge triggers, award if applicable
7. Return full submission with feedback

**Error handling:** If Claude times out (30s) or returns invalid JSON, update submission to `status: "failed"`, return error with `submissionId` so client can retry.

**Environment variable:** `OPENROUTER_MODEL=anthropic/claude-sonnet-4-5`

**Key files to create:**
- `src/app/api/scenarios/route.ts`
- `src/app/api/scenarios/[id]/route.ts`
- `src/app/api/evaluate/route.ts`
- `src/app/api/submissions/route.ts`
- `src/app/api/submissions/[id]/route.ts`
- `src/app/teacher/scenarios/page.tsx`
- `src/app/teacher/scenarios/new/page.tsx`
- `src/app/teacher/scenarios/[id]/edit/page.tsx`

---

## Phase 3: Student Experience — Full Gameplay Journey

Build all student-facing pages for the complete mystery-solving flow.

### Tasks

- [ ] Build landing/hero page (`src/app/page.tsx`) — replace boilerplate content with PEEL Detective branding
- [ ] Build scenario library page (`/scenarios`) — grid of scenario cards with difficulty and personal best score
- [ ] Build investigate screen (`/scenarios/[id]`) — crime description, suspects, clues panel, guide character [complex]
  - [ ] Split layout: narrative left, clues right
  - [ ] Suspect cards with name and background
  - [ ] Numbered clue evidence cards
  - [ ] Detective guide character SVG in corner with contextual hint text
  - [ ] "Begin Writing" sticky CTA button
- [ ] Build write screen (`/scenarios/[id]/write`) — PEEL text area with collapsible guide panel
- [ ] Build feedback screen (`/scenarios/[id]/feedback/[submissionId]`) — score cards, feedback text, model answer [complex]
  - [ ] Four P/E/E/L score cards (0–5) with colour-coded progress bars
  - [ ] Total score /20 with star visual
  - [ ] Per-element feedback text blocks
  - [ ] Grammar flag chips
  - [ ] Collapsible model answer section
  - [ ] Retry / New Case CTA buttons
- [ ] Build student profile page (`/profile`) — extend existing page with submission history, badges, points
- [ ] Add loading states and skeleton screens for AI evaluation wait (~5s)

### Technical Details

**Scenario library card component:**
```tsx
// Difficulty shown as 1–3 star icons (lucide Star)
// Personal best score shown as badge chip: "Best: 17/20"
// "Investigate" button navigates to /scenarios/[id]
// Published filter: students only see published:true scenarios
```

**Write screen PEEL guide panel (collapsible sidebar):**
- Shows each element name, description, and example sentence
- Collapse/expand with chevron toggle
- Stays visible at ≥ md breakpoint, collapses to toggle on mobile

**Feedback screen score card colour coding:**
- 0–2: destructive red
- 3–4: amber/yellow
- 5: emerald green

**Submission polling:** After submit, poll `GET /api/submissions/[id]` every 2s until `status !== "pending"` (max 30s, then show timeout error).

**Guide character:** Simple SVG detective silhouette or magnifying glass in corner. Static on investigate screen with hint text cycling every 8s. Hidden on write screen to avoid distraction.

**Key files to create:**
- `src/app/scenarios/page.tsx`
- `src/app/scenarios/[id]/page.tsx`
- `src/app/scenarios/[id]/write/page.tsx`
- `src/app/scenarios/[id]/feedback/[submissionId]/page.tsx`
- `src/components/peel-guide.tsx` (reusable collapsible guide)
- `src/components/score-card.tsx` (P/E/E/L score display card)
- `src/components/scenario-card.tsx` (library grid card)
- `src/components/guide-character.tsx` (animated detective SVG)

---

## Phase 4: Teacher Dashboard

Build the teacher's class overview, student detail views, and score override.

### Tasks

- [ ] Create `GET /api/scenarios/[id]/submissions` — all submissions for a scenario (teacher only)
- [ ] Create `GET /api/students/[id]/submissions` — submission history for one student (teacher/admin)
- [ ] Build teacher dashboard overview page (`/teacher`) — class stats + student table
- [ ] Build per-scenario submissions page (`/teacher/scenarios/[id]/submissions`) — sortable submission list
- [ ] Build individual student view (`/teacher/students/[id]`) — history, score trend chart
- [ ] Add score override UI to submission detail — inline form with note field
- [ ] Add CSV export for per-class and per-student reports

### Technical Details

**Teacher dashboard data queries:**
```ts
// Class overview: latest submission per student + average total_score
// Per-scenario: all submissions ordered by submitted_at desc
// Student history: all submissions by studentId ordered by submitted_at
```

**Score trend chart:** Use a simple line chart with recharts (already in many Next.js setups) or a CSS-only sparkline if recharts is not installed. Data points: `{ date: submittedAt, score: totalScore }`.

**Score override API (`PATCH /api/submissions/[id]`):**
```ts
// Body: { teacherOverrideScore: number, teacherOverrideNote?: string }
// Auth: teacher/admin only, must be teacher of that student's school
// Returns: updated submission
```

**CSV export:** Use a simple server-side route that streams CSV rows. No third-party library needed — manually construct CSV string.

**Key files to create:**
- `src/app/teacher/page.tsx`
- `src/app/teacher/students/[id]/page.tsx`
- `src/app/teacher/scenarios/[id]/submissions/page.tsx`
- `src/app/api/scenarios/[id]/submissions/route.ts`
- `src/app/api/students/[id]/submissions/route.ts`
- `src/app/api/export/route.ts`

---

## Phase 5: Polish & Gamification

Add points, badges, leaderboard, PEEL learning module, and visual polish.

### Tasks

- [ ] Implement points system — award points on submission evaluated (points = total_score)
- [ ] Seed default badges into `badge` table
- [ ] Implement badge award logic in `POST /api/submissions` handler
- [ ] Build PEEL learning module page (`/learn`) — illustrated breakdown + sample answers at 3 quality levels
- [ ] Add leaderboard section to scenario library (teacher-configurable show/hide)
- [ ] Polish investigate and write screens with final crime-noir styling
- [ ] Add page transitions and micro-animations (submit button loading state, score reveal animation)

### Technical Details

**Default badges (seed data):**
```ts
const defaultBadges = [
  { id: "first-case", name: "First Case Closed", description: "Submit your first response", iconName: "Badge", triggerCondition: "submission_count >= 1" },
  { id: "sharp-eye", name: "Sharp Eye", description: "Score 18 or above", iconName: "Eye", triggerCondition: "total_score >= 18" },
  { id: "veteran", name: "Veteran Detective", description: "Complete 5 scenarios", iconName: "Shield", triggerCondition: "scenario_count >= 5" },
  { id: "perfect", name: "Perfect Case", description: "Score 20/20", iconName: "Trophy", triggerCondition: "total_score == 20" },
];
```

**Badge award check after each evaluated submission:**
```ts
// Check: first submission (count == 1)
// Check: score >= 18
// Check: distinct scenarios with evaluated submissions >= 5
// Check: score == 20
// Insert to student_badge if not already awarded
```

**PEEL learning module (`/learn`) content:**
- Three sample answers per element: Basic (0–2), Developing (3–4), Excellent (5)
- Each with an explanation of what earns that grade
- Static content — no database needed

**Points display:** Show on profile page and in site header when logged in (e.g., "🔍 142 pts" next to avatar).

**Key files to create:**
- `src/app/learn/page.tsx`
- `src/lib/badges.ts` (badge trigger evaluation logic)
- `src/app/api/leaderboard/route.ts` (optional, teacher-configurable)
