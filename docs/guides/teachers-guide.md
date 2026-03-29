# Teacher Guide: How to Use PEEL Detective

PEEL Detective lets you create crime-mystery scenarios that students solve by writing structured PEEL paragraphs. An AI evaluates each submission instantly, and you can review results, override scores, manage student access, and export reports — all from the teacher dashboard.

---

## Table of Contents

1. [Getting Access](#1-getting-access)
2. [Teacher Dashboard Overview](#2-teacher-dashboard-overview)
3. [Managing Scenarios](#3-managing-scenarios)
4. [Creating a Scenario](#4-creating-a-scenario)
5. [Editing and Publishing Scenarios](#5-editing-and-publishing-scenarios)
6. [Reviewing Submissions](#6-reviewing-submissions)
7. [Overriding a Score](#7-overriding-a-score)
8. [Managing Students](#8-managing-students)
9. [Viewing a Student's Profile](#9-viewing-a-students-profile)
10. [Exporting Reports](#10-exporting-reports)
11. [Leaderboard Settings](#11-leaderboard-settings)
12. [Roles and Permissions](#12-roles-and-permissions)

---

## 1. Getting Access

Your account must have the **teacher** role (or higher) to access the teacher dashboard. This is assigned by an admin — contact your school's administrator if you can log in but cannot reach `/teacher`.

Once your role is set, logging in will take you directly to `/teacher`.

---

## 2. Teacher Dashboard Overview

The dashboard at `/teacher` is your central hub.

### Stats cards

| Card | What it shows |
|---|---|
| **Total Students** | Students who have submitted at least once |
| **Total Submissions** | All submissions across every scenario |
| **Class Average** | Mean total score (out of 20) across evaluated submissions |

### Class PEEL Averages panel

When evaluations exist, this panel shows the class mean for each PEEL element (P, E, E, L — each out of 5). The weakest element is highlighted in amber, making it easy to spot where the class needs the most support.

### Students table

Lists every student who has submitted work, with their name (clickable), email, submission count, average score, and latest activity. Click any name to go to that student's detail page.

### Action buttons (top-right)

| Button | Action |
|---|---|
| **Student Leaderboard** toggle | Show or hide the public leaderboard for students |
| **Scenarios** | Go to scenario management |
| **Manage Students** | Go to student management |
| **Export CSV** | Download a class-wide report |
| **Download PDF** | Download a formatted PDF report |

---

## 3. Managing Scenarios

Navigate to `/teacher/scenarios` (or click **Scenarios** from the dashboard).

Each scenario card shows the title, publication status (**Published** / **Draft**), difficulty (1–3 stars), and a brief description preview.

**Actions on each card:**

| Button | What it does |
|---|---|
| **Publish / Unpublish** | Toggle student visibility |
| **Submissions** | View all student responses for this scenario |
| **Edit** | Open the editing form |
| **Delete** (trash icon) | Permanently remove the scenario (confirmation required) |

Only **published** scenarios are visible to students. Keep a scenario as a draft while you are still building it.

---

## 4. Creating a Scenario

Click **New Scenario** on the scenarios page. Fill in the form:

### Title *(required)*
A concise, descriptive name for the mystery (e.g. "The Mystery of the Missing Diamond").

### Crime Description *(required)*
Use the rich-text editor to write the full story — setting, events, and context that students will read before writing their response. Formatting (bold, italic, lists) is supported.

### Suspects *(at least one required)*
Click **+ Add Suspect** to add people of interest. For each suspect provide:
- **Name** — shown to students
- **Background** — alibi, motive, or relevant history
- **Photo** *(optional)* — JPG, PNG, GIF, or WebP, max 5 MB, 1:1 aspect ratio recommended. Students can enlarge photos to inspect them.

Click the **−** button to remove a suspect (you must keep at least one).

### Clues *(at least one required)*
Click **+ Add Clue** to add evidence items students will cite in their responses. Each clue is a single line of text. Keep clues specific and unambiguous so students can reference them precisely.

### Correct Culprit *(required)*
Type the name of the actual culprit. **This must exactly match the name of one of your suspects** (case-sensitive). Students never see this field — it is only used by the AI evaluator to assess whether a student identified the right person.

### Difficulty
Select 1 (Easy), 2 (Medium), or 3 (Hard). This controls the star rating students see when browsing cases.

### Options
- **Publish immediately** — makes the scenario live for students as soon as you save. Leave unchecked to save as a draft.
- **Free to view** — allows students without an active subscription to open and attempt this scenario.

### Preview before saving
Click **Preview** (top-right of the form) to see exactly what students will see — crime description, suspect cards, and evidence board. Click **Exit Preview** to return to the form without losing your work.

### Save
Click **Create Scenario**. You are returned to the scenarios list and the new scenario appears as a draft (or published, if you checked that option).

---

## 5. Editing and Publishing Scenarios

Click **Edit** on any scenario card to reopen the form. All fields are editable at any time, including on published scenarios.

**To publish or unpublish without opening the form**, click the **Publish** / **Unpublish** button directly on the card.

> Editing a published scenario updates it immediately. If students are mid-submission on the old version, they will see the updated content if they refresh.

---

## 6. Reviewing Submissions

### Via the scenario

1. Go to **Scenarios** and find the relevant scenario.
2. Click **Submissions** on the card.
3. The submissions table shows every student who has attempted the scenario, with columns for each PEEL element score (out of 5), the total (out of 20), override score (if any), status, and date.
4. Click **View** on any row to open the submission detail page.

The top of the submissions page also shows **per-scenario PEEL averages**, highlighting the lowest-scoring element — useful for post-class discussion.

### Via a student

1. Go to **Manage Students** and click a student's name.
2. Scroll to their **Submission History** table.
3. Click the **chevron** icon to expand and read the student's full response inline, or click the **eye** icon to go to the full submission detail page.

### Submission detail page

Each submission detail page shows:

- **Student response** — the full text submitted
- **PEEL Score Breakdown** — individual scores (0–5) and the AI's written feedback for each element
- **Writing Notes** — grammar and style flags raised by the AI (if any)
- **Model Answer** — the reference answer for the scenario (if one exists), shown for your context

---

## 7. Overriding a Score

If you disagree with the AI's total score, you can override it directly on the submission detail page.

1. Scroll to the **Score Override** form at the bottom of the page.
2. Enter a score between **0 and 20** in the override field.
3. Optionally add a note (e.g. "Student misidentified culprit but showed strong PEEL structure — partial credit awarded").
4. Click **Save Override**.

The override score replaces the AI score everywhere it is displayed to the student and in exports. An amber badge and pencil icon indicate an override has been applied. The note is stored but is only visible to teachers.

To remove an override, there is no dedicated button — contact an admin or re-save the submission detail if the underlying score needs correcting.

---

## 8. Managing Students

Go to `/teacher/students` (or click **Manage Students** from the dashboard).

### Stats cards

| Card | What it shows |
|---|---|
| **Total Students** | All registered student accounts |
| **Active Students** | Students not deactivated |
| **Deactivated** | Accounts blocked from access |
| **Subscribed** | Students with an active subscription |

### Students table

The table lists every student with their name, email, nickname (if set), account status, subscription status, submission count, and join date.

### Managing subscriptions

Click the **credit card icon** in the Actions column to toggle a student's subscription:

- **Granting** a subscription activates a 30-day period from today and logs the event in the student's subscription history.
- **Revoking** removes access to non-free scenarios immediately.

The button turns green when the student is subscribed.

### Deactivating and reactivating accounts

Click the **shield icon** in the Actions column. A confirmation dialog explains the effect:

- **Deactivate** — the student cannot log in and sees a suspension notice. Their submissions and data are preserved.
- **Reactivate** — restores full access. The student can log in immediately.

### Deleting a student account *(admin only)*

The **trash icon** appears only for admin and super-admin roles. Deleting a student is **irreversible** — all submissions, badges, and account data are permanently removed. A confirmation dialog must be accepted before deletion proceeds.

> You cannot deactivate, delete, or modify the subscription of another teacher or admin account, nor your own account.

---

## 9. Viewing a Student's Profile

Click any student's name (from the dashboard table or the students list) to open their detail page at `/teacher/students/[id]`.

### What you will see

- **Stats cards** — total points, total submissions, average score
- **Score Trend Chart** — a line graph of their total score over time; individual PEEL element lines can be toggled on/off to compare progress
- **Submission History** — a table of every submission with PEEL scores, status, date, and actions
- **Subscription History** — a log of every subscription change (who made it, when, and for how long)

### Deleting an individual submission

Click the **trash icon** on any submission row and confirm. The system automatically recalculates the student's total points — if the deleted submission held their best score on that scenario, points are adjusted downward accordingly.

### Exporting a student's data

Use the **Export CSV** or **Download PDF** buttons at the top of the page to download all of that student's submissions.

---

## 10. Exporting Reports

Export buttons are available in three places:

| Location | What is exported |
|---|---|
| Teacher Dashboard | All students: name, submission count, average score, latest date |
| Scenario Submissions page | All submissions for that scenario with per-student PEEL scores |
| Student Detail page | All submissions for that student with full PEEL breakdown |

Both **CSV** (for spreadsheets) and **PDF** (for printing or sharing) formats are available.

---

## 11. Leaderboard Settings

The student-facing leaderboard (visible on the scenarios page) can be toggled on or off from the teacher dashboard using the **Student Leaderboard** switch in the top-right corner. This setting is saved per teacher account.

---

## 12. Roles and Permissions

| Action | Teacher | Admin | Super-Admin |
|---|---|---|---|
| Create / edit / delete scenarios | Yes | Yes | Yes |
| View all submissions | Yes | Yes | Yes |
| Override submission scores | Yes | Yes | Yes |
| Grant / revoke student subscriptions | Yes | Yes | Yes |
| Deactivate / reactivate students | Yes | Yes | Yes |
| Delete student accounts | No | Yes | Yes |
| Manage teacher accounts | No | No | Yes |
| Manage admin accounts | No | No | Yes |
| Access `/admin/*` pages | No | Yes | Yes |

**Teacher** — standard classroom access. All scenario, submission, and student management features described in this guide.

**Admin** — all teacher permissions plus the ability to delete students and access admin-level pages for managing teacher and student accounts across the school.

**Super-Admin** — full access. The only role that can create, edit, or remove admin accounts. Seeded once via `pnpm seed:admin`.

---

## Quick Reference

| Task | Where to go |
|---|---|
| Create a new scenario | `/teacher/scenarios` → **New Scenario** |
| Publish / unpublish a scenario | `/teacher/scenarios` → card action button |
| View submissions for a scenario | `/teacher/scenarios` → **Submissions** |
| Review and override a submission | `/teacher/submissions/[id]` |
| See class PEEL analytics | `/teacher` (dashboard) |
| Manage subscriptions and access | `/teacher/students` |
| View one student's full history | `/teacher/students/[id]` |
| Export class report | `/teacher` → **Export CSV** / **Download PDF** |
