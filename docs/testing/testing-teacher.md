# PEEL Detective — Teacher Testing Guide

This guide walks through manual testing of all teacher-facing features. Follow each section in order for a complete test run, or jump to a specific area as needed.

A user with the `teacher` role has access to everything in this guide. A user with the `admin` or `super-admin` role can also perform all of these actions.

---

## Prerequisites

### 1. Create a Teacher Account

An admin must create a teacher account first. If you have no admin yet, seed one:

```bash
pnpm seed:admin
```

Log in as admin, navigate to `/admin/teachers`, and create a teacher:

- **Full Name:** `Test Teacher`
- **Email:** `teacher@test.com`
- **Password:** `password123`

### 2. Ensure Test Students and Submissions Exist

For the dashboard and student management sections to show meaningful data, at least one student account should exist with one or more scenario submissions. Create these manually or use any existing seed data.

### 3. Start the Dev Server

```bash
pnpm dev
```

Open the app at `http://localhost:3000`.

---

## Section 1 — Authentication

### 1.1 Log In as Teacher

1. Navigate to `/login`.
2. Enter the teacher credentials created above.
3. Click **Sign In**.
4. **Expected:** Redirected to the app without errors.

### 1.2 Verify Teacher Route Access

1. Navigate to `/teacher`.
2. **Expected:** Teacher Dashboard loads with title "Teacher Dashboard".
3. Navigate to `/admin`.
4. **Expected:** Redirected away (teachers do not have admin access).

---

## Section 2 — Teacher Dashboard

Navigate to `/teacher`.

### 2.1 Statistics Cards

**Expected:** Three cards display at the top:

| Card | Shows |
|------|-------|
| Total Students | Count of unique students who have submitted at least once |
| Total Submissions | Total number of all submissions across all scenarios |
| Class Average | Average score out of 20 across all evaluated submissions, or `--` if none |

### 2.2 PEEL Averages Panel

**Expected (if evaluated submissions exist):**

- Four element tiles display: **P** (Point), **E** (Evidence), **E** (Explain), **L** (Link).
- Each tile shows an average score out of 5 and a progress bar.
- The weakest element is highlighted in amber with a **"Class weakness"** label.

If no evaluated submissions exist, this panel does not appear.

### 2.3 Student Table

**Expected:**

- Table rows list students alphabetically with columns: Name, Email, Submissions, Avg Score, Latest Submission.
- Student names are clickable amber links.
- Students with no evaluated submissions show `--` for Avg Score.

### 2.4 Leaderboard Toggle

1. Note the current button state.
2. Click the **Leaderboard** toggle button.
3. **Expected:** A success message or toast confirms the change. The button label/state updates.
4. Click again to restore the original state.

---

## Section 3 — Scenario Management

Navigate to `/teacher/scenarios`.

### 3.1 View Scenarios List

**Expected:**

- A grid of scenario cards displays. Each card shows the title, difficulty stars, a truncated crime description, a Published/Draft badge, and action buttons.
- If no scenarios exist: an empty state with a "Create Scenario" button displays.

### 3.2 Create a New Scenario

1. Click **New Scenario**.
2. Fill in all required fields:

**Title**
- Enter: `The Case of the Missing Artifact`

**Crime Description**
- Enter a paragraph describing the crime scene.

**Suspects** (at least 1 required)
- Click **Add Suspect** to add a second suspect if desired.
- For each suspect fill in:
  - **Name:** e.g. `Dr. Helena Graves`
  - **Background:** e.g. `Museum curator with access to the vault.`
  - **Image:** *(optional)* Upload a JPG/PNG under 5 MB.

**Clues** (at least 1 required)
- Click **Add Clue** to add more clues.
- For each clue enter a text description, e.g. `Muddy footprints near the display case.`

**Correct Culprit**
- Enter the exact name of one of the suspects, e.g. `Dr. Helena Graves`.

**Difficulty**
- Select a difficulty: **★ Easy**, **★★ Medium**, or **★★★ Hard**.

**Published** checkbox — leave unchecked (creates as Draft).

3. Click **Create Scenario**.
4. **Expected:** Redirected to `/teacher/scenarios`. The new scenario appears as a **Draft** card.

### 3.3 Validation Checks

Re-open the new scenario form and test each error case before submitting:

| Field | Invalid Input | Expected Error |
|-------|--------------|----------------|
| Title | *(empty)* | "Title is required" or similar |
| Crime Description | *(empty)* | Validation error |
| Suspect Name | *(empty)* | Validation error |
| Suspect Background | *(empty)* | Validation error |
| Clue | *(empty)* | Validation error |
| Correct Culprit | A name that does not match any suspect | Validation error |
| Image upload | File larger than 5 MB | Per-suspect error message in red |

An error alert box appears at the top of the form and the form does not submit.

### 3.4 Preview Mode

1. Open the create or edit scenario form.
2. Click **Preview**.
3. **Expected:** The form switches to a read-only student view showing the title, difficulty stars, crime description (HTML rendered), suspects with images and backgrounds, and a numbered clue list. No edit controls are visible.
4. Click **Exit Preview** to return to editing.

### 3.5 Edit a Scenario

1. On any scenario card, click **Edit**.
2. Change the title or crime description.
3. Click **Save** (or equivalent submit button).
4. **Expected:** Redirected back to `/teacher/scenarios`. The updated title/content appears on the card.

### 3.6 Publish and Unpublish a Scenario

1. On a **Draft** scenario card, click **Publish**.
2. **Expected:** The badge on the card changes to **Published**. Students can now browse this scenario.
3. Click **Unpublish**.
4. **Expected:** The badge changes back to **Draft**.

### 3.7 Delete a Scenario

1. On a scenario card, click **Delete**.
2. Read the confirmation dialog.
3. Confirm.
4. **Expected:** The scenario is removed from the grid. A success toast displays.

---

## Section 4 — Scenario Submissions View

Navigate to `/teacher/scenarios`, then click **View Submissions** on any scenario that has student submissions.

### 4.1 Submission List

**Expected:**

- Header shows the scenario title and total submission count (e.g. "3 submission(s)").
- Export buttons appear: **Export CSV**, **Download PDF**.
- The PEEL averages panel displays if any submissions are evaluated (same format as the dashboard panel).
- The submissions table lists rows with columns: Student, P, E, E, L, Total, Override, Status, Date, Actions.

### 4.2 Submission Statuses

**Expected badge colours:**

| Status | Colour |
|--------|--------|
| Evaluated | Green |
| Pending | Amber |
| Failed | Red |

### 4.3 Override Score Display

If any submission has a teacher override score set:

- **Expected:** The **Override** column shows an amber badge with `{score}/20`.
- Hover over the badge.
- **Expected:** A tooltip shows the override note, or "No note provided" if none was entered.

### 4.4 Export from Scenario Submissions

1. Click **Export CSV**.
2. **Expected:** A CSV file downloads containing the scenario's submission data.
3. Click **Download PDF**.
4. **Expected:** A PDF file downloads.

---

## Section 5 — Submission Detail and Score Override

From the scenario submissions table, click **View** on any submission.

### 5.1 Submission Detail Page

**Expected sections:**

| Section | Visible when |
|---------|-------------|
| Status badge + submitted timestamp | Always |
| Override badge | Only if an override score is set |
| Student Response box | Always |
| PEEL Score Breakdown | Status is "evaluated" |
| Grammar Flags | At least one grammar flag exists |
| Model Answer | A model answer was generated |
| Score Override form | Always |

### 5.2 PEEL Score Breakdown

When status is **evaluated**:

- **Expected:** Four score cards display in a 2×2 grid: Point, Evidence, Explain, Link.
- Each card shows a score out of 5 and the AI feedback text.
- The header shows the total score, e.g. `PEEL Score Breakdown 16/20`.

### 5.3 Submit a Score Override

1. Scroll to the **Score Override** card.
2. Enter a score between 0 and 20 in the **Override Score** field.
3. Enter an optional note in the **Note** field, e.g. `Student demonstrated strong understanding despite minor errors.`
4. Click **Save Override**.
5. **Expected:** A green success message appears: "Score override saved successfully."
6. Navigate back to the scenario submissions table.
7. **Expected:** The **Override** column now shows the amber badge with the new score.

### 5.4 Score Override Validation

1. Clear the score field or enter an invalid value (e.g. `25`, `-1`, `abc`).
2. Click **Save Override**.
3. **Expected:** A red error message appears: "Score must be a number between 0 and 20." The override is not saved.

---

## Section 6 — Student Management

Navigate to `/teacher/students`.

### 6.1 Statistics Cards

**Expected:** Four cards display at the top:

| Card | Shows |
|------|-------|
| Total Students | All users with role "student" |
| Active Students | Students where banned = false |
| Deactivated Students | Students where banned = true |
| Subscribed | Students where subscribed = true |

### 6.2 Students Table

**Expected columns:** Name (amber link), Email, Nickname, Status (Active/Deactivated badge), Subscription (Subscribed/Inactive badge), Submissions count, Joined date, Actions.

- Rows are sorted alphabetically by name.
- Students with no nickname show a dash (—).

### 6.3 Grant and Revoke Subscription

1. Find a student in the table.
2. Click the **CreditCard** icon in the Actions column.
3. **Expected:**
   - If student was **Inactive**: Badge changes to **Subscribed** (emerald). Button tooltip changes to "Revoke subscription".
   - If student was **Subscribed**: Badge changes to **Inactive**. Button tooltip changes to "Grant subscription".
4. Toggle back to restore the original state.

### 6.4 Deactivate a Student

1. Click the **ShieldBan** icon on an active student row.
2. Read the confirmation dialog: *"This will prevent {name} from accessing the platform…"*
3. Click **Deactivate**.
4. **Expected:** Status badge changes to **Deactivated** (red). The icon changes to a ShieldCheck.
5. Open a new browser session and log in as that student.
6. **Expected:** Student is redirected to `/account-suspended`.

### 6.5 Reactivate a Student

1. Click the **ShieldCheck** icon on a deactivated student row.
2. Read the confirmation dialog: *"This will restore {name}'s access…"*
3. Click **Reactivate**.
4. **Expected:** Status badge changes back to **Active** (green).

### 6.6 Delete a Student (Admin/Super-Admin Only)

The **Delete** (trash) icon is only visible when logged in as `admin` or `super-admin`.

1. Click the **Trash** icon on a student row.
2. Read the confirmation: *"This action is irreversible. All of {name}'s submissions, badges, and account data will be permanently removed."*
3. Click **Delete Permanently**.
4. **Expected:** Student is removed from the table. Page refreshes.

---

## Section 7 — Student Detail Page

From the student table, click any student's name link.

### 7.1 Student Header

**Expected:**

- Page title is the student's name.
- If the student is deactivated, a red **Deactivated** badge appears next to the name.
- Email and nickname (if set) display below the name.
- Export buttons appear: **Export CSV**, **Download PDF**.
- Action buttons display: **Grant/Revoke Subscription**, **Deactivate/Reactivate Account**, and (admin only) **Delete Account**.

### 7.2 Statistics Cards

**Expected:**

| Card | Shows |
|------|-------|
| Total Points | Student's accumulated points |
| Total Submissions | Count of all the student's submissions |
| Average Score | Average of evaluated submissions out of 20 (uses override score when set), or `--` if none |

### 7.3 Score Trend Chart

**Expected (if evaluated submissions exist):**

- A line/area chart renders showing the student's scores over time.
- X-axis labels show dates (e.g. "Mar 5").
- Legend allows toggling individual PEEL elements on/off.

### 7.4 Submission History Table

**Expected columns:** Scenario, P, E, E, L, Total, Status, Date, Actions.

- Rows are sorted newest first.
- If a teacher override score is set, the Total column shows `{score}/20 ✎`.

**Expand a submission:**

1. Click the **chevron** expand icon on a row.
2. **Expected:** A monospace text box slides open beneath the row showing the student's full response text.
3. Click the chevron again to collapse.

**View a submission:**

1. Click **View** on a row.
2. **Expected:** Navigated to the submission detail page (Section 5).

**Delete a submission:**

1. Click the **Delete** icon on a row.
2. Confirm in the dialog.
3. **Expected:** Row is removed. Page refreshes.

### 7.5 Subscription History Table

**Expected:**

- A table lists all subscription change events for the student: Date, Action (Activated/Revoked badge), Changed By, Amount, Period End.
- If no events exist: an empty state with "No subscription events recorded." displays.

### 7.6 Student Actions from Detail Page

Test the action buttons in the header (same logic as the students table, but these redirect back to `/teacher` on delete):

1. **Grant/Revoke Subscription** — subscription badge in the header updates.
2. **Deactivate Account** — Deactivated badge appears in the page title area.
3. **Reactivate Account** — Deactivated badge disappears.
4. **Delete Account** (admin only) — After confirmation, redirected to `/teacher`.

---

## Section 8 — Exports

Exports are available in three places. Test each:

| Location | Button | Expected Download |
|----------|--------|------------------|
| Teacher Dashboard (`/teacher`) | Export CSV | CSV of class-wide submission data |
| Teacher Dashboard (`/teacher`) | Download PDF | PDF of class-wide submission data |
| Scenario Submissions (`/teacher/scenarios/{id}/submissions`) | Export CSV | CSV for that scenario's submissions |
| Scenario Submissions | Download PDF | PDF for that scenario's submissions |
| Student Detail (`/teacher/students/{id}`) | Export CSV | CSV of that student's submissions |
| Student Detail | Download PDF | PDF of that student's submissions |

**For each:** Click the button and verify a file downloads without a browser error.

---

## Section 9 — Access Boundary Tests

| Test | Steps | Expected Result |
|------|-------|-----------------|
| Teacher cannot access `/admin` | Log in as teacher, navigate to `/admin` | Redirected away (not admin) |
| Teacher cannot delete students | Log in as teacher, go to `/teacher/students` | No trash icon visible in Actions column |
| Student cannot access `/teacher` | Log in as student, navigate to `/teacher` | Redirected to `/dashboard` |
| Deactivated student is blocked | Deactivate a student (Section 6.4), log in as them | Redirected to `/account-suspended` |
| Reactivated student can log in | Reactivate the student (Section 6.5), log in again | Login succeeds |

---

## Quick Reference — Key URLs

| URL | Purpose |
|-----|---------|
| `/teacher` | Teacher dashboard with stats and student table |
| `/teacher/scenarios` | List, publish, edit, and delete scenarios |
| `/teacher/scenarios/new` | Create a new scenario |
| `/teacher/scenarios/{id}/edit` | Edit an existing scenario |
| `/teacher/scenarios/{id}/submissions` | View all submissions for a scenario |
| `/teacher/submissions/{id}` | View a single submission and apply score override |
| `/teacher/students` | Manage all students |
| `/teacher/students/{id}` | View a single student's detail and submission history |
