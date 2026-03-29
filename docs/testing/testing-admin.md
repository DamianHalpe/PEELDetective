# PEEL Detective — Admin Testing Guide

This guide walks through manual testing of all admin and teacher features in the PEEL Detective application. Follow each section in order for a complete test run, or jump to a specific area as needed.

---

## Prerequisites

### 1. Seed a Super-Admin Account

Before testing, ensure a super-admin user exists:

```bash
pnpm seed:admin
```

Check the console output for the generated credentials (email and password). You will use these to log in.

### 2. Start the Dev Server

```bash
pnpm dev
```

Open the app at `http://localhost:3000`.

---

## Section 1 — Authentication

### 1.1 Log In as Super-Admin

1. Navigate to `/login`.
2. Enter the super-admin credentials from the seed output.
3. Click **Sign In**.
4. **Expected:** Redirected to `/dashboard` or home page. No errors.

### 1.2 Verify Admin Nav Access

1. Navigate to `/admin`.
2. **Expected:** Admin Dashboard loads. Two cards are visible — **User Management** and **AI Token Usage**.
3. Navigate to `/teacher`.
4. **Expected:** Teacher Dashboard loads (admins have teacher-level access too).

---

## Section 2 — Teacher Management

### 2.1 View Teachers List

1. Go to `/admin/users` → click **Teachers**.
2. **Expected:** A table of existing teacher accounts loads with columns: Name, Email, Nickname, Joined, Actions.

### 2.2 Create a Teacher

1. Click **Add Teacher**.
2. Fill in the dialog:
   - **Full Name:** `Test Teacher`
   - **Email:** `teacher@test.com`
   - **Password:** `password123`
   - **Nickname:** `test_teacher` *(optional)*
3. Click **Create Teacher**.
4. **Expected:** Dialog closes. New teacher appears in the table. A success toast displays.

**Validation checks (run these before submitting a valid form):**
- Leave Name empty → should show a validation error.
- Enter an invalid email (e.g. `notanemail`) → should show a validation error.
- Enter a password shorter than 8 characters → should show a validation error.
- Enter a nickname with spaces or special characters (e.g. `bad name!`) → should show a validation error.
- Enter a duplicate nickname → should show a unique constraint error.

### 2.3 Edit a Teacher

1. On a teacher row, click the **Edit** (pencil) icon.
2. Change the **Name** to `Updated Teacher`.
3. Click **Save Changes**.
4. **Expected:** Teacher name updates in the table.

### 2.4 Send a Password Reset

1. Open the Edit dialog for a teacher.
2. Click **Send Password Reset Link**.
3. **Expected:** A confirmation message appears. The reset link is logged in the server console (dev mode).

### 2.5 Suspend a Teacher

1. Open the Edit dialog for a teacher.
2. Check **Suspend account**.
3. Click **Save Changes**.
4. **Expected:** The account is marked as suspended. Log in with that teacher's credentials — you should be redirected to `/account-suspended`.

Unsuspend: Repeat and uncheck the box to restore access.

### 2.6 Delete a Teacher

1. Click the **Delete** (trash) icon on a teacher row.
2. Read the confirmation warning.
3. Confirm the deletion.
4. **Expected:** Teacher is removed from the table. A success toast displays.

---

## Section 3 — Student Management

### 3.1 View Students List

1. Go to `/admin/users` → click **Students**.
2. **Expected:** Statistics cards (Total, Active, Suspended) display correct counts. Student table loads.

### 3.2 Search for a Student

1. Type a student name or email in the search box.
2. **Expected:** Table filters in real time to matching results. Case-insensitive matching works (e.g. searching `john` matches `John`).
3. Clear the search box.
4. **Expected:** Full list returns.

### 3.3 Edit a Student

1. Click the **Edit** icon on any student row.
2. Modify the **Name** field.
3. Click **Save Changes**.
4. **Expected:** Student name updates in the table.

### 3.4 Suspend a Student

1. Open the Edit dialog for a student.
2. Check **Suspend account**.
3. Save. Log in as that student.
4. **Expected:** Student is redirected to `/account-suspended`.

Unsuspend: Repeat and uncheck to restore access.

### 3.5 Delete a Student

1. Click the **Delete** icon on a student row.
2. Confirm the deletion.
3. **Expected:** Student is removed. Warning mentions all submissions, badges, and account data will be deleted.

---

## Section 4 — Admin Management (Super-Admin Only)

This section requires you to be logged in as a **super-admin**. A regular admin will see this section but cannot take write actions.

### 4.1 View Admins List

1. Go to `/admin/users` → click **Admins**.
2. **Expected:** Table shows all admin and super-admin accounts with role badges.

### 4.2 Create an Admin (Super-Admin Only)

1. Click **Add Admin**.
2. Fill in:
   - **Full Name:** `Test Admin`
   - **Email:** `admin@test.com`
   - **Password:** `adminpass123`
3. Click **Create Admin**.
4. **Expected:** New admin appears in the table with the **Admin** role badge.

**Access check:** Log in to a different browser session as a regular admin, navigate to `/admin/admins`, and verify:
- The **Add Admin** button is not visible.
- The edit and delete action columns are hidden or show a dash for all rows.

### 4.3 Edit an Admin (Super-Admin Only)

1. As super-admin, click the **Edit** icon on the newly created admin.
2. Change the name or role.
3. **Expected:** Changes save successfully.
4. Try to edit another **super-admin** row.
5. **Expected:** Edit action is not available for super-admin rows.

### 4.4 Delete an Admin (Super-Admin Only)

1. Click **Delete** on the test admin created in 4.2.
2. Confirm.
3. **Expected:** Admin is removed from the list.

### 4.5 Self-Edit Restrictions

1. Open the Edit dialog for your own account.
2. Try to change your **Role**.
3. **Expected:** The role dropdown is disabled or the save is rejected with an error.
4. Try to check **Suspend account** on your own account.
5. **Expected:** Checkbox is disabled or the save is rejected.

---

## Section 5 — AI Token Usage

### 5.1 View Usage (Any Admin)

1. Navigate to `/admin/usage`.
2. **Expected:**
   - Two sections display: **Today's Usage** and **This Month's Usage**.
   - Each shows `X / Y tokens used` with a color-coded progress bar:
     - Green: 0–70%
     - Amber: 70–90%
     - Red: 90%+
   - The **Configure Caps** section shows current daily and monthly cap values.

### 5.2 Modify Caps (Super-Admin Only)

1. Ensure you are logged in as super-admin.
2. Change the **Daily Cap** value.
3. Change the **Monthly Cap** value.
4. Click **Save Caps**.
5. **Expected:** Values persist on page refresh. A success toast displays.

**Access check (regular admin):** Log in as a regular admin and navigate to `/admin/usage`. Verify:
- Cap input fields are **read-only**.
- The **Save Caps** button is hidden or disabled.

---

## Section 6 — Teacher Dashboard & Scenario Management

These features are accessible to both teachers and admins.

### 6.1 View Teacher Dashboard

1. Navigate to `/teacher`.
2. **Expected:**
   - Statistics cards show: Total Students, Total Submissions, Class Average (out of 20).
   - PEEL element averages panel shows per-element scores with progress bars.
   - The weakest element is highlighted.
   - Student table lists students with submission counts and latest submission date.

### 6.2 Export Class Data

1. On the Teacher Dashboard, click **Export CSV**.
2. **Expected:** A CSV file downloads containing student submission data.
3. Click **Download PDF**.
4. **Expected:** A PDF file downloads with the same data.

### 6.3 Toggle Leaderboard

1. Click the **Leaderboard** toggle button.
2. **Expected:**
   - Button state changes (enabled → disabled or vice versa).
   - A success/update toast displays.

### 6.4 Create a Scenario

1. Go to `/teacher/scenarios`.
2. Click **New Scenario**.
3. Fill in the scenario form with all required fields (title, crime description, suspects, clues, correct culprit, difficulty).
4. Submit the form.
5. **Expected:** Redirected to the scenario list. New scenario appears as a **Draft** card.

### 6.5 Publish and Unpublish a Scenario

1. On a Draft scenario card, click **Publish**.
2. **Expected:** Badge changes to **Published**. Students can now see it.
3. Click **Unpublish**.
4. **Expected:** Badge changes back to **Draft**.

### 6.6 Edit a Scenario

1. Click **Edit** on a scenario card.
2. Modify any field.
3. Save.
4. **Expected:** Changes reflected on the scenario card.

### 6.7 View Scenario Submissions

1. Click **View Submissions** on a scenario card.
2. **Expected:** List of student submissions for that scenario displays, with scores per PEEL element.

### 6.8 Delete a Scenario

1. Click **Delete** on a scenario card.
2. Confirm in the dialog.
3. **Expected:** Scenario removed from the list.

---

## Section 7 — Teacher Student Management

### 7.1 View Students

1. Go to `/teacher/students`.
2. **Expected:** Statistics cards and a table of all students with submissions. Columns include Status and Subscription badges.

### 7.2 Toggle Student Subscription

1. Click the **Subscription** toggle icon on a student row.
2. **Expected:** Subscription badge toggles between **Subscribed** and **Inactive**.

### 7.3 Deactivate and Reactivate a Student

1. Click the **Deactivate** icon on a student row.
2. Confirm the dialog.
3. **Expected:** Status badge changes to **Deactivated**. Log in as that student — access should be blocked.
4. Click **Reactivate**.
5. **Expected:** Status badge returns to **Active**.

### 7.4 View Student Detail

1. Click a student's name link.
2. **Expected:** Student detail page loads at `/teacher/students/{id}`, showing that student's submission history.

### 7.5 Review a Submission

1. From the student detail page, click a submission entry.
2. **Expected:** Submission detail page loads, showing the student's PEEL response, per-element scores, AI feedback, and grammar flags.

---

## Section 8 — Role Access Boundary Tests

These tests verify that role boundaries are enforced.

| Test | Steps | Expected Result |
|------|-------|-----------------|
| Regular admin cannot create admins | Log in as admin, go to `/admin/admins`, look for Add Admin | Button not visible |
| Regular admin cannot edit admins | Log in as admin, go to `/admin/admins`, look for edit icons | No edit actions on admin rows |
| Regular admin caps are read-only | Log in as admin, go to `/admin/usage` | Cap inputs are disabled |
| Teacher cannot access `/admin` | Log in as teacher, navigate to `/admin` | Redirected away or 403 |
| Student cannot access `/teacher` | Log in as student, navigate to `/teacher` | Redirected away or 403 |
| Suspended user cannot log in | Suspend a user, attempt login | Redirected to `/account-suspended` |

---

## Quick Reference — Key URLs

| URL | Purpose |
|-----|---------|
| `/admin` | Admin dashboard |
| `/admin/users` | User management hub |
| `/admin/teachers` | Manage teacher accounts |
| `/admin/students` | Manage student accounts |
| `/admin/admins` | Manage admin accounts (super-admin) |
| `/admin/usage` | AI token usage and caps |
| `/teacher` | Teacher dashboard |
| `/teacher/scenarios` | Scenario list and management |
| `/teacher/scenarios/new` | Create a new scenario |
| `/teacher/students` | Student management (teacher view) |
