# PEEL Detective — Feature Backlog

> Tasks derived from gap analysis against `docs/project-spec/PEEL_Detective_Project_Spec.md`.
> Status: `[ ]` = todo, `[x]` = done, `[-]` = in progress

---

## HIGH Priority

### 1. Class-Level PEEL Aggregate Stats
> Teacher dashboard should surface average scores per PEEL element across all submissions for a scenario, highlighting class weaknesses. (Spec §4.5)

- [x] Add aggregate query to `GET /api/scenarios/[id]/submissions` returning avg point/evidence/explain/link scores
- [x] Add aggregate stats bar/chart to `/teacher/scenarios/[id]/submissions` page showing per-element class averages
- [x] Add summary aggregate panel to `/teacher` main dashboard (overall class averages across all scenarios)
- [x] Highlight weakest PEEL element visually (e.g. lowest avg shown in amber/red)

---

### 2. Revise & Resubmit Flow
> After viewing AI feedback, students should have a clear path to edit and resubmit. Prior submissions must be preserved. (Spec §4.3, Feature #8)

- [x] Audit `/scenarios/[id]/write` — confirm the page accepts a `?revise=submissionId` param and pre-fills the prior response text
- [x] Add a prominent "Revise My Answer" button on the feedback screen (`/scenarios/[id]/feedback/[submissionId]`) linking to write page with prior text
- [x] Ensure resubmission creates a new `submission` row (does not overwrite the previous one)
- [x] Show revision number / attempt count on feedback screen (e.g. "Attempt 2 of 3")

---

### 3. Admin: Full User Management
> Admins can currently only create/view teachers. Need student management and the ability to edit/delete any user. (Spec §3.3, Feature #23)

- [x] Create `/admin/students` page listing all students with search/filter
- [x] Add edit user dialog (change role, reset password, suspend/unsuspend) accessible from both teacher and student admin lists
- [x] Add delete user action with confirmation dialog
- [x] Add `/admin/users` overview page linking to teachers and students sub-sections
- [x] Restrict all admin actions to `admin` role server-side

---

## MEDIUM Priority

### 4. Score Trend Chart
> Visual score-over-time chart on the student profile page and on the teacher's individual student view. (Spec §4.5, §4.10)

- [x] Install a chart library (e.g. `recharts` or `shadcn` chart primitive) if not already present
- [x] Build a `ScoreTrendChart` component that accepts an array of `{ date, total, point, evidence, explain, link }` data points
- [x] Add chart to `/profile` page below the submission history table
- [x] Add the same chart to `/teacher/students/[id]` page
- [x] Show total score line by default; allow toggling individual PEEL element lines

---

### 5. Teacher-Configurable Leaderboard Toggle
> Teachers should be able to disable the leaderboard for their class for privacy or competition reasons. (Spec Feature #20)

- [x] Add `leaderboardEnabled` boolean column to `school` or `user` (teacher) table via Drizzle migration
- [x] Add toggle UI in teacher settings or teacher dashboard header
- [x] Update `GET /api/leaderboard` to respect the setting — return empty/hidden when disabled
- [x] Hide leaderboard panel on `/scenarios` page when disabled for the student's school/teacher

---

### 6. SSO / School Credentials Login
> School-specific SSO (SAML/OIDC). Google OAuth partially covers this. (Spec Feature #2)

- [ ] Evaluate whether BetterAuth supports SAML/OIDC provider config
- [ ] Add school SSO config fields to `school` table (`ssoProvider`, `ssoConfig` JSONB)
- [ ] Implement dynamic OAuth provider registration per school if BetterAuth supports it
- [ ] Add SSO login button on `/login` that resolves the provider from the user's email domain

---

## LOW Priority

### 7. PDF Export
> Spec says "PDF or CSV" for progress reports; only CSV is currently implemented. (Spec §4.5, Feature #13)

- [x] Add a PDF generation utility (e.g. `@react-pdf/renderer` or `puppeteer`)
- [x] Add `format=pdf` query param support to `GET /api/export`
- [x] Add "Download PDF" button alongside existing "Download CSV" buttons in teacher views

---

### 8. Embedded Video in PEEL Learning Module
> Optional embedded video explaining the PEEL technique. (Spec §4.7)

- [x] Source or create a suitable PEEL explanation video (hosted on YouTube or similar)
- [x] Add video embed section to `/learn` page between the intro and element breakdowns
- [x] Make it optional/collapsible so the page remains usable without the video

---

### 9. AI Token Usage Tracking & Admin Cap
> Per-submission token logging and an admin-configurable daily/monthly usage cap. (Spec §5 Cost Management)

- [ ] Add `tokensUsed` integer column to `submission` table via Drizzle migration
- [ ] Update `POST /api/evaluate` to capture and store token usage from the OpenRouter response
- [ ] Create `usageConfig` settings table (or use admin config) with `dailyCap` and `monthlyCap` fields
- [ ] Add usage cap enforcement in `POST /api/evaluate` — return 429 if cap exceeded
- [ ] Add token usage summary to `/admin` dashboard (daily/monthly usage vs cap)

---

### 10. School Management UI
> The `school` table exists in the DB but there are no pages to manage schools. (Spec §6 Data Models)

- [ ] Create `/admin/schools` page listing all schools
- [ ] Add "Create School" dialog with name field
- [ ] Add edit/delete actions per school row
- [ ] Link users to schools — show student/teacher count per school on the list
