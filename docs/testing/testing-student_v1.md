# PEEL Detective — Subscribed Student Testing Guide

This guide walks through manual testing of all student-facing features for a **subscribed** student. A subscribed student has full access to all scenarios, submission, and feedback features. Follow the sections in order for a complete test run.

---

## Prerequisites

### 1. Ensure a Subscribed Student Account Exists

You need a student account that has been granted a subscription. Either:

- **Option A — Register and subscribe manually:**
  1. Register a new student account (see Section 1).
  2. Ask an admin or teacher to grant the subscription: log in as admin/teacher, go to `/teacher/students`, and click the **CreditCard** icon on the student row.

- **Option B — Use an existing subscribed student.**

### 2. Ensure Published Scenarios Exist

At least one published scenario must exist. If none does, log in as a teacher and publish one from `/teacher/scenarios`.

### 3. Start the Dev Server

```bash
pnpm dev
```

Open the app at `http://localhost:3000`.

---

## Section 1 — Registration

### 1.1 Register a New Account

1. Navigate to `/register`.
2. **Expected page title:** "Join the Agency" with subtitle "Create your detective profile and start solving cases."
3. Fill in the form:

| Field | Value |
|-------|-------|
| Name | `Jamie Watson` |
| Nickname *(optional)* | `SherlockJr` |
| Email | `student@test.com` |
| Password | `Secret1!` |
| Confirm Password | `Secret1!` |

4. Click **Create account**.
5. **Expected:** Redirected to `/dashboard` (or login page, depending on email verification settings).

### 1.2 Password Requirement Indicators

While typing in the Password field, verify that each requirement shows a live indicator (red X → green checkmark):

- [ ] At least 8 characters
- [ ] At least one uppercase letter
- [ ] At least one lowercase letter
- [ ] At least one number
- [ ] At least one special character

### 1.3 Nickname Availability Check

1. Type a nickname into the Nickname field and pause.
2. **Expected:** A spinner appears briefly, then either:
   - Green checkmark + "Nickname is available!"
   - Red X + "That nickname is already taken."
3. Type a duplicate nickname (one already used by another account).
4. **Expected:** "That nickname is already taken." message appears. The form does not submit until you change it.

### 1.4 Validation Errors

Test each invalid case before submitting the valid form:

| Scenario | Expected Error |
|----------|---------------|
| Leave Name empty | Validation error on Name |
| Enter invalid email (e.g. `notanemail`) | Validation error on Email |
| Password missing an uppercase letter | Live indicator stays red for that requirement |
| Passwords do not match | "Passwords do not match" error |
| Nickname with spaces or symbols | Real-time "already taken" or format error |

---

## Section 2 — Login and Logout

### 2.1 Log In

1. Navigate to `/login`.
2. **Expected page title:** "Welcome back, Detective" with subtitle "The case files are waiting for you."
3. Enter the student credentials.
4. Click **Sign in**.
5. **Expected:** Redirected to `/dashboard`.

### 2.2 OAuth Sign-In Buttons

Verify the three OAuth buttons are visible on the login page:
- **Continue with Google** (outline style)
- **Continue with Apple** (black background)
- **Continue with Facebook** (blue background)

*(Full OAuth flow testing requires valid provider credentials.)*

### 2.3 Forgot Password Flow

1. Click **Forgot password?** on the login page.
2. Enter a valid registered email and click **Send reset link**.
3. **Expected:** Success message: *"If an account exists with that email, a password reset link has been sent. Check your terminal for the reset URL."*
4. Copy the reset URL from the server console.
5. Open the URL — you should land on `/reset-password`.
6. Enter a new password that meets all requirements. Confirm it.
7. Click **Reset password**.
8. **Expected:** Redirected to `/login` with a green banner: *"Password reset successfully. Please sign in with your new password."*

### 2.4 Invalid Reset Link

1. Navigate to `/reset-password` with no token in the URL (or a mangled token).
2. **Expected:** Error message: *"This password reset link is invalid or has expired."* A "Request a new link" button appears.

### 2.5 Log Out

1. Click the user avatar or profile dropdown in the header.
2. Click **Sign out** (or equivalent).
3. **Expected:** Redirected to `/login` or the home page. Navigating to `/dashboard` should redirect back to login.

---

## Section 3 — Student Dashboard

Navigate to `/dashboard`.

### 3.1 Page Heading

**Expected:**
- Heading: "Welcome back, Jamie" (first name in amber).
- Subtitle: "The case files are waiting. What will you investigate today?"

### 3.2 Statistics Cards

**Expected:** Three cards display:

| Card | Shows |
|------|-------|
| Total Points | A number (amber trophy icon) |
| Cases Solved | Count of evaluated submissions (green target icon) |
| Best Score | Best score in `X/20` format (purple star icon) |

For a brand-new account all values should be `0` or `—`.

### 3.3 Subscription Status (Subscribed Student)

**Expected (when subscribed):**
- A card with a green credit card icon, title **"Subscription Active"**, and a description showing "Renews on [date]" or "You can submit case reports and receive AI feedback."
- A **"Cancel subscription"** button (ghost style).

**If you see a "Subscribe Now" banner instead**, the account is not yet subscribed — ask an admin/teacher to grant the subscription before continuing.

### 3.4 Cancel Subscription Confirmation Flow

1. Click **Cancel subscription**.
2. **Expected:** The button changes to a two-step confirmation row: **"Are you sure?"** + **"Yes, cancel"** (red/destructive) + **"Keep it"** (ghost).
3. Click **Keep it**.
4. **Expected:** Reverts to the original cancel button with no change applied.

### 3.5 Action Cards

**Expected:** Two action cards display:

- **Browse Case Files** → "Open Cases →" button (links to `/scenarios`)
- **PEEL Writing Guide** → "Read the Guide →" button (links to `/learn`)

### 3.6 Daily Tip

**Expected:** A tip panel displays below the action cards with a lightning bolt icon and a short writing tip. The tip rotates daily.

---

## Section 4 — Header Navigation

Verify all navigation links visible to a logged-in subscribed student:

| Link | Destination |
|------|-------------|
| **Cases** (folder icon) | `/scenarios` |
| **PEEL Guide** (book icon) | `/learn` |
| **Dashboard** | `/dashboard` |
| **My Results** (clipboard icon) | `/submissions` |

**The following should NOT appear for a student:**
- Subscribe link (since the account is subscribed)
- Teacher link
- Admin link

---

## Section 5 — PEEL Learning Guide

Navigate to `/learn`.

### 5.1 Page Structure

**Expected:**
- Page title: "The PEEL Method"
- Subtitle explains the framework.
- Four sections display, one per PEEL element: **Point**, **Evidence**, **Explain**, **Link**.

### 5.2 PEEL Element Cards

For each of the four elements, verify:

- A letter badge (P / E / E / L) and an icon are visible.
- Three quality-level cards appear: **Basic (0–2)**, **Developing (3–4)**, **Excellent (5)**.
- Each quality card contains an example quote in a gray italic box and a brief explanation.
- Score range badges use correct colours: red (Basic), amber (Developing), emerald (Excellent).

### 5.3 Detective's Tip

**Expected:** A footer tip block with a pulsing book icon and message: *"The best case reports weave all four PEEL elements into a single, flowing paragraph…"*

---

## Section 6 — Browse Scenarios

Navigate to `/scenarios`.

### 6.1 Page Structure

**Expected:**
- Section header: "Case Files"
- Page title: "Active Cases"
- Progress indicator: "X of Y cases solved"
- Difficulty filter buttons: **All**, **★**, **★★**, **★★★**

### 6.2 Scenario Cards

For each published scenario card verify:

- Title and truncated crime description display.
- Difficulty stars are correct (1–3 filled stars).
- Status badge shows **Unsolved** for unsolved cases.
- For a subscribed student: The button reads **Investigate** (not locked).
- Cards have a slight alternating rotation for visual variety.

### 6.3 Difficulty Filter

1. Click the **★** filter.
2. **Expected:** Only Easy (1-star) scenarios display. Non-matching cards are hidden.
3. Click **★★★**.
4. **Expected:** Only Hard scenarios display.
5. Click **All**.
6. **Expected:** All scenarios return.

### 6.4 Leaderboard Panel

**Expected (if leaderboard is enabled by the teacher):**

- A "Top Detectives" panel appears with a trophy icon.
- A table lists students by rank with columns: Rank, Name, Points, Cases.
- Rank 1 has a crown icon and amber background.

If leaderboard is disabled by the teacher, this panel does not appear.

---

## Section 7 — Scenario Detail Page

From the scenarios list, click **Investigate** on any published scenario.

### 7.1 Page Layout

**Expected:**
- A "← Back to Cases" link is visible.
- The scenario title and difficulty stars display in the header.
- **Left column (wider):** Crime Scene Briefing and Suspects sections.
- **Right column (narrower, sticky):** Evidence Board with clue cards.

### 7.2 Crime Scene Briefing

**Expected:** A card renders the full crime description with formatted HTML (paragraphs, bold text, etc.).

### 7.3 Suspects Section

**Expected:**
- Each suspect displays a name and background text.
- If an image exists, a thumbnail (64×64) renders.

**Test the image lightbox:**
1. Click a suspect's image.
2. **Expected:** A dark overlay opens with the full-size image and the suspect's name below.
3. Click the close button (top-right) or press **Escape**.
4. **Expected:** Overlay closes.

### 7.4 Evidence Board (Clues)

**Expected:** A sticky right panel lists all clues as cards with amber lightbulb icons.

### 7.5 PEEL Guide Sidebar

**Expected (desktop):** A PEEL Writing Guide sidebar is visible with four element cards (P, E, E, L), each showing a letter badge, element name, description, and example.

**On mobile:** A "PEEL Writing Guide" toggle button appears. Tap it to expand/collapse the guide.

### 7.6 Start Writing

1. Scroll to the bottom of the page.
2. **Expected:** A full-width sticky bar reads **"Begin Writing Your Case Report →"**.
3. Click it.
4. **Expected:** A writing form expands on the page (or you are navigated to the write page).

---

## Section 8 — Submitting a Case Report

This section assumes you clicked the CTA button from the scenario detail page and are on the writing view.

### 8.1 Textarea

**Expected:**
- A large monospace textarea with placeholder: *"Write your PEEL paragraph here. Start with your Point — who is the culprit?…"*
- A character count or word count displays below.

### 8.2 Word Count Guidance

1. Type a few words (less than 50).
2. **Expected:** Amber guidance text appears: *"— aim for 80–150 words for a complete response"*.
3. Continue typing past 50 words.
4. **Expected:** Guidance text disappears.

### 8.3 Write a Valid Submission

Write a complete PEEL paragraph (80–150 words). For example:

> The culprit is Dr. Helena Graves because she had both the motive and the opportunity to commit the theft. The muddy footprints found near the display case match the pattern of the curator's shoes (Clue 2), and the torn jacket fragment discovered in her office (Clue 4) directly places her at the scene. This combination of physical evidence demonstrates that Dr. Graves was present during the crime and had unrestricted after-hours access to the vault. Her stated alibi — attending a late lecture — is contradicted by the security log showing her badge was scanned at 10:47 PM. Therefore, the weight of physical evidence conclusively identifies Dr. Helena Graves as the individual responsible for the missing artifact.

### 8.4 AI Evaluation Progress

1. Click **Submit Case Report**.
2. **Expected:** The button changes to "Evaluating…" (with a spinner).
3. A progress panel appears: "AI Evaluation in Progress" with five steps:
   - "Reading your case report…"
   - "Analysing Point — who is the culprit?"
   - "Checking Evidence — clues cited?"
   - "Reviewing Explanation — logical connection?"
   - "Evaluating Link — tied back to the question?"
4. Each step shows: empty circle → spinner (current) → green checkmark (done).
5. **Expected:** After evaluation completes, you are redirected to the feedback page.

### 8.5 Submit Button Disabled State

1. Clear the textarea completely.
2. **Expected:** The **Submit Case Report** button is disabled.

---

## Section 9 — Feedback Page

After submitting, you should be on `/scenarios/[id]/feedback/[submissionId]`.

### 9.1 Page Header

**Expected:**
- Title: "Case Report Results"
- Subtitle: "Here is how your PEEL paragraph was evaluated by the AI detective."
- An "Attempt X of Y" badge if this is not the first attempt.

### 9.2 Your Response

**Expected:** A card displays your submitted paragraph exactly as submitted (preformatted, preserves whitespace).

### 9.3 Total Score

**Expected:**
- A large animated number counts up from 0 to your total score.
- Format: "X/20".
- A 5-star row fills proportionally to the score.
- For a score of 16 or above: A celebration header appears — **"Outstanding Work, Detective!"** with a glowing amber shield icon.

### 9.4 PEEL Breakdown

**Expected:** Four score cards display in a 2×2 grid:

| Card | Shows |
|------|-------|
| **P — Point** | Score out of 5, progress bar, AI feedback |
| **E — Evidence** | Score out of 5, progress bar, AI feedback |
| **E — Explain** | Score out of 5, progress bar, AI feedback |
| **L — Link** | Score out of 5, progress bar, AI feedback |

Progress bar colours:
- Score 0–2 → Red
- Score 3–4 → Amber
- Score 5 → Emerald

Badge labels:
- 0–2 → "Needs Work"
- 3–4 → "Developing"
- 5 → "Excellent"

### 9.5 Writing Notes (Grammar Flags)

If the AI flagged any grammar or style issues:
- **Expected:** A "Writing Notes" section appears with a list of flag badges (outline style).

If no flags were found, this section does not appear.

### 9.6 Model Answer (Collapsible)

1. Find the **Model Answer** toggle button.
2. Click it.
3. **Expected:** A box expands revealing the ideal example response (monospace, preformatted).
4. Click again to collapse.

### 9.7 Bottom Action Bar

**Expected:** A fixed bar at the bottom of the page with three buttons:
- **"Revise My Answer"** (amber primary)
- **"New Case"** (outline)
- **"My Results"** (ghost, smaller)

### 9.8 Pending / Loading State

If the AI evaluation is still running when the feedback page loads:

**Expected:**
- An amber spinner displays.
- Message: *"Evaluating your case report… this takes about 5 seconds."*
- The page polls every 2 seconds for up to 30 seconds.
- Once evaluation completes, the page updates automatically.

---

## Section 10 — Revising a Submission

From the feedback page, click **Revise My Answer**.

### 10.1 Revision Banner

**Expected:** A banner displays at the top of the writing form:

> "Revising Attempt X of Y — your prior text has been pre-filled below. Edit and resubmit to improve your score."

### 10.2 Pre-filled Textarea

**Expected:** The textarea is pre-populated with your previous submission text. You can edit it before resubmitting.

### 10.3 Submit Revised Answer

1. Edit the text to improve it.
2. Click **Submit Case Report**.
3. **Expected:** The evaluation flow runs again. You are redirected to a new feedback page showing "Attempt 2 of 2" (or higher).

### 10.4 Re-investigate from Scenarios List

Navigate back to `/scenarios`.

**Expected:**
- The scenario you solved now shows a **"✓ X/20"** amber badge (your best score).
- The button on the card now reads **"Re-investigate"** (with a checkmark icon).
- The progress indicator ("X of Y cases solved") increments.

---

## Section 11 — Submission History

Navigate to `/submissions`.

### 11.1 Page Header

**Expected:**
- Label: "Case Report History" (with clipboard icon)
- A badge shows the total count: "X submission(s)"
- Subtitle: "Review your previous submissions and track your progress."

### 11.2 Submission Cards

**Expected:** One card per submission, sorted newest first.

Each card shows:

| Field | Expected |
|-------|---------|
| Case title | Italic, bold |
| Status badge | Green (Evaluated), Amber (Pending), Red (Failed) |
| Submitted date | "Submitted DD Mon YYYY" format |
| PEEL pills *(evaluated only)* | "P: X/5", "E: X/5", "E: X/5", "L: X/5" with colour coding |
| Total score *(evaluated only)* | "X/20" colour-coded: Red (≤8), Amber (9–14), Emerald (15+) |
| View button | "View Feedback" (amber if evaluated, outline if pending) |

### 11.3 View Feedback from History

1. Click **View Feedback** on any evaluated submission.
2. **Expected:** Navigated to the feedback page for that submission.

### 11.4 Empty State

If the student has made no submissions:

**Expected:**
- Icon: Amber search magnifying glass.
- Title: "No Case Reports Yet"
- Message and a "Browse Cases" button.

### 11.5 Teacher Override Indicator

If a teacher has applied a score override to any submission:

**Expected:**
- A graduation cap icon appears next to the score on the submission card.
- On the feedback page, the score area shows "Score adjusted by your teacher."

---

## Section 12 — Badge System

Badges are awarded automatically when thresholds are reached. After completing the steps above, verify the following have been awarded:

| Badge | Trigger |
|-------|---------|
| **First Case Closed** | After submitting your first case report |
| **Sharp Eye** | After scoring 18 or above on any submission |
| **Veteran Detective** | After completing 5 different scenarios |
| **Perfect Case** | After scoring 20/20 on any submission |

*(Badge display location depends on implementation — check the dashboard or profile area for badge icons.)*

---

## Section 13 — Scenario Access for Unsubscribed Students

To verify locked behaviour, temporarily revoke the student's subscription (ask an admin/teacher to click the CreditCard icon on the student row in `/teacher/students`).

### 13.1 Dashboard Subscription Banner

**Expected:** The subscription card now shows:
- Lock icon (amber)
- Title: "Subscribe to unlock the full experience"
- Description: "A subscription is required to submit case reports and receive AI feedback."
- Button: "Subscribe Now"

The **Subscribe** navigation link also appears in the header.

### 13.2 Locked Scenario Cards

Navigate to `/scenarios`.

**Expected:**
- Non-free scenarios show a "Subscribe to Investigate" button (muted, with lock icon).
- Free scenarios (marked "Free to View" by the teacher) show a green **Free** badge and remain accessible.

### 13.3 Attempting to Submit While Unsubscribed

Navigate directly to a scenario's detail page and try to click the write CTA.

**Expected:** Either the CTA is hidden/disabled, or submitting shows an error indicating a subscription is required.

Restore the subscription via the teacher panel before continuing.

---

## Quick Reference — Key Student URLs

| URL | Purpose |
|-----|---------|
| `/register` | Create a new account |
| `/login` | Sign in |
| `/forgot-password` | Request a password reset email |
| `/reset-password` | Set a new password via reset link |
| `/dashboard` | Student home — stats, subscription status, tips |
| `/learn` | PEEL Writing Guide |
| `/scenarios` | Browse all published scenarios |
| `/scenarios/{id}` | View scenario detail, suspects, clues |
| `/scenarios/{id}/solve` | Write and submit a case report |
| `/scenarios/{id}/feedback/{submissionId}` | View AI feedback and scores |
| `/submissions` | Full submission history |
