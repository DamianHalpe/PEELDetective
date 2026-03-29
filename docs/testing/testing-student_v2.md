# PEEL Detective — Unsubscribed Student Testing Guide

This guide covers manual testing of the PEEL Detective application from the perspective of a student who has **not yet subscribed**. It verifies that access restrictions are enforced correctly and that the subscription flow works end-to-end.

---

## Prerequisites

### 1. Create an Unsubscribed Student Account

Register a fresh account (see Section 1), or use an existing student account that has not been subscribed. If an account was previously subscribed, ask an admin or teacher to revoke the subscription via `/teacher/students` before testing.

### 2. Ensure a Mix of Scenarios Exists

For thorough testing you need:
- At least one **locked** published scenario (standard, not marked "Free to View").
- At least one **free** published scenario (teacher has checked "Free to View").

If none exist, log in as teacher/admin and create or configure scenarios at `/teacher/scenarios`.

### 3. Start the Dev Server

```bash
pnpm dev
```

Open the app at `http://localhost:3000`.

---

## Section 1 — Registration

### 1.1 Register a New Account

1. Navigate to `/register`.
2. **Expected page title:** "Join the Agency"
3. Fill in the form:

| Field | Value |
|-------|-------|
| Name | `Alex Unsubscribed` |
| Nickname *(optional)* | `newdetective` |
| Email | `unsubscribed@test.com` |
| Password | `Secret1!` |
| Confirm Password | `Secret1!` |

4. Click **Create account**.
5. **Expected:** Redirected to `/dashboard` (or login). No subscription is active by default.

---

## Section 2 — Dashboard (Unsubscribed State)

Navigate to `/dashboard`.

### 2.1 Subscription Banner

**Expected:** A banner displays in place of the subscription card:

- Lock icon (amber)
- Title: **"Subscribe to unlock the full experience"**
- Description: *"A subscription is required to submit case reports and receive AI feedback."*
- Button: **"Subscribe Now"** (amber with black border)

The "Subscription Active" card seen by subscribed students should **not** appear.

### 2.2 Header Navigation — Subscribe Link

**Expected:** A **Subscribe** navigation link (with a star icon, amber text) is visible in the header. This link does **not** appear for subscribed students.

### 2.3 Stats Cards

**Expected:** The three stats cards (Total Points, Cases Solved, Best Score) display with `0` or `—` since the student has made no submissions.

### 2.4 Action Cards

**Expected:** The Browse Case Files and PEEL Writing Guide action cards are visible and accessible — these do not require a subscription.

---

## Section 3 — Browsing Scenarios

Navigate to `/scenarios`.

### 3.1 Locked Scenario Cards

For each **standard (non-free) scenario**, verify:

- A lock icon and the button text **"Subscribe to Investigate"** appear (muted/greyed style).
- The button is still a link (clicking it redirects rather than showing an error inline).
- No "Investigate" amber button is shown.

### 3.2 Free Scenario Cards

For any scenario marked **"Free to View"** by the teacher, verify:

- A green **Free** badge appears on the card alongside the difficulty stars.
- The button reads **"Investigate"** (amber, accessible without a subscription).
- There is no lock icon.

### 3.3 Progress Indicator

**Expected:** "X of Y cases solved" displays at the top. For a brand-new account this should read **"0 of Y cases solved"**.

### 3.4 Difficulty Filter

1. Click the **★**, **★★**, and **★★★** filter buttons.
2. **Expected:** Cards filter to the correct difficulty level. Lock state on each card is maintained regardless of filter.
3. Click **All** to return to the full list.

### 3.5 Leaderboard Panel

**Expected (if leaderboard is enabled by the teacher):** The "Top Detectives" panel is visible to unsubscribed students. Verify it renders with rank, name, points, and cases columns.

---

## Section 4 — Accessing a Locked Scenario

### 4.1 Click a Locked Scenario Card

1. Click the **"Subscribe to Investigate"** button on a locked scenario.
2. **Expected:** You are redirected to `/subscribe?from=/scenarios/{id}`.
3. Verify the URL in your browser bar includes the `from` query parameter pointing to the scenario.

### 4.2 Navigate Directly to a Locked Scenario Detail

1. Copy the URL of a locked scenario's detail page (e.g. `/scenarios/abc123`).
2. Paste it directly in the browser.
3. **Expected:** You are redirected away to `/subscribe?from=/scenarios/abc123`. The scenario content is never shown.

---

## Section 5 — Accessing a Free Scenario

### 5.1 Open a Free Scenario

1. Click **Investigate** on a free scenario card.
2. **Expected:** The scenario detail page loads fully, showing:
   - Crime Scene Briefing (full HTML content)
   - Suspects section with names, backgrounds, and images
   - Evidence Board sidebar with all clues
   - PEEL Writing Guide sidebar (desktop) or toggle button (mobile)

### 5.2 Suspect Image Lightbox

1. Click a suspect's image thumbnail.
2. **Expected:** A dark overlay opens with the full-size image and the suspect's name.
3. Press **Escape** or click the close button.
4. **Expected:** Overlay closes.

### 5.3 Start Writing on a Free Scenario

1. Scroll to the bottom of the free scenario detail page.
2. Click the sticky **"Begin Writing Your Case Report →"** button.
3. **Expected:** The writing form expands — the textarea is shown and accessible. *(A subscription is not required to submit responses for free scenarios.)*

---

## Section 6 — Attempting to Access a Locked Scenario's Write Page

### 6.1 Click "Begin Writing" Context on a Locked Scenario

If you somehow reach a locked scenario's detail page (which normally redirects), clicking "Begin Writing" triggers a subscription check:

**Expected:** `router.push(/subscribe?from=/scenarios/{id})` — you are redirected to the subscribe page.

### 6.2 Navigate Directly to the Write URL

1. Manually type a locked scenario's write URL in the browser (e.g. `/scenarios/abc123/solve`).
2. **Expected:** Redirected to `/subscribe?from=/scenarios/abc123/solve`. The write form is never shown.

---

## Section 7 — The Subscribe Page

Navigate to `/subscribe` (or follow any redirect that lands you there).

### 7.1 Page Content

**Expected:**

- Header: **"Detective Subscription"**
- Subheading: *"Everything you need to submit cases and receive AI-powered feedback."*
- Price: **$10** per month
- Four feature perks listed:
  - "Submit PEEL case reports for AI evaluation"
  - "Receive detailed scores on all 4 PEEL elements"
  - "View model answers and in-depth feedback"
  - "Track your score history and earn detective badges"
- Call-to-action button: **"Subscribe for $10 / month →"**
- Banner: *"Renews automatically every 30 days. Cancel any time."*
- Footer note: *"Payment is simulated — no real charge will occur."*

### 7.2 Back Link

**Expected:** A **"← Back"** link is visible. If you arrived via a redirect from a scenario, clicking it returns to that scenario's page (using the `?from=` query parameter).

### 7.3 Already Subscribed Redirect

If you log in with a **subscribed** account and navigate to `/subscribe`:

**Expected:** You are redirected away to the `from` destination (or `/scenarios` by default) without seeing the subscribe page.

---

## Section 8 — Checkout Flow

From the subscribe page, click **"Subscribe for $10 / month →"**. You should land on `/subscribe/checkout`.

### 8.1 Page Content

**Expected:**

- **Order summary:** "Detective Subscription — Monthly plan — $10.00" with total "$10.00"
- Fine print: *"Then $10.00 / month. Cancel any time."*
- Note: *"Simulated payment — no real charge will occur."*
- A payment form with four fields.
- A **"← Back to pricing"** link that returns to `/subscribe`.

### 8.2 Payment Form Fields

| Field | Placeholder | Constraint |
|-------|------------|-----------|
| Card number | `1234 5678 9012 3456` | Exactly 16 digits; auto-formats with spaces |
| Expiry date | `MM / YY` | MM and YY format; auto-formats |
| CVC | `123` | 3–4 digits |
| Name on card | `Jane Smith` | At least 1 character |

### 8.3 Validation — Submit Button Disabled State

1. Leave all fields empty.
2. **Expected:** The **"Pay $10.00"** button is disabled.
3. Fill in an incomplete card number (e.g. only 10 digits).
4. **Expected:** Button remains disabled.
5. Fill all four fields with valid values (any 16-digit number, valid expiry, 3-digit CVC, any name).
6. **Expected:** Button becomes active.

### 8.4 Validation Error Cases

| Scenario | Expected |
|----------|---------|
| Card number with fewer than 16 digits | Submit button stays disabled |
| Expiry missing year (only month entered) | Submit button stays disabled |
| CVC with 2 digits | Submit button stays disabled |
| Name left empty | Submit button stays disabled |

### 8.5 Successful Payment

1. Enter valid (simulated) details:
   - **Card number:** `1234 5678 9012 3456`
   - **Expiry:** `12 / 26`
   - **CVC:** `123`
   - **Name:** `Alex Unsubscribed`
2. Click **Pay $10.00**.
3. **Expected:** Button changes to **"Processing…"** with a spinner.
4. After a moment, a success screen appears:
   - Checkmark icon
   - **"Subscription Activated!"**
   - *"Your account now has full access. Redirecting…"*
5. After ~1.8 seconds, you are redirected to the `from` destination (e.g. `/scenarios`).

### 8.6 Verify Subscription is Active After Checkout

After the redirect:

1. Navigate to `/dashboard`.
2. **Expected:**
   - The lock/subscribe banner is **gone**.
   - A **"Subscription Active"** card now appears with a green credit card icon.
   - The **Subscribe** link in the header is **gone**.
3. Navigate to `/scenarios`.
4. **Expected:** Previously locked scenarios now show the amber **"Investigate"** button — no lock icon.

---

## Section 9 — Post-Subscription: Submit a Case Report

After subscribing, verify the full submission flow is now accessible.

### 9.1 Open a Previously Locked Scenario

1. Click **Investigate** on any scenario.
2. **Expected:** The detail page loads (no redirect to subscribe).

### 9.2 Write and Submit

1. Click **"Begin Writing Your Case Report →"**.
2. **Expected:** Writing form appears inline.
3. Write a response (aim for 80–150 words).
4. Click **Submit Case Report**.
5. **Expected:** AI evaluation progress steps run, then you are redirected to the feedback page with scores.

---

## Section 10 — Account Suspended State

This section tests the suspension page. Ask an admin or teacher to **deactivate** the student account (via `/teacher/students` → ShieldBan icon), then attempt to log in.

### 10.1 Login with a Suspended Account

1. Navigate to `/login` and enter the suspended student's credentials.
2. **Expected:** Redirected to `/account-suspended`.

### 10.2 Account Suspended Page Content

**Expected:**

- Red shield-with-X icon.
- Title: **"Account Suspended"**
- Message: *"Your account has been deactivated by your teacher. Please contact your teacher if you believe this is a mistake."*
- Button: **"Sign Out"**

### 10.3 Sign Out from Suspended Page

1. Click **Sign Out**.
2. **Expected:** Redirected to `/login`. The suspended account cannot access any protected pages.

Ask the teacher/admin to reactivate the account (ShieldCheck icon) to restore access.

---

## Section 11 — Access Boundary Verification

Verify that unsubscribed students are blocked from protected areas:

| Attempt | Steps | Expected |
|---------|-------|---------|
| Access locked scenario detail directly | Navigate to `/scenarios/{locked-id}` | Redirected to `/subscribe?from=…` |
| Access locked write page directly | Navigate to `/scenarios/{locked-id}/solve` | Redirected to `/subscribe?from=…` |
| Access teacher dashboard | Navigate to `/teacher` | Redirected away (not a teacher) |
| Access admin dashboard | Navigate to `/admin` | Redirected away (not an admin) |
| Submit via API without subscription | `POST /api/submissions` while unsubscribed | HTTP 403 with `{"error":"subscription_required"}` |

---

## Quick Reference — Key URLs

| URL | Purpose |
|-----|---------|
| `/register` | Create a new account |
| `/login` | Sign in |
| `/dashboard` | Student home — shows subscription banner when unsubscribed |
| `/scenarios` | Browse cases — locked ones show "Subscribe to Investigate" |
| `/scenarios/{id}` | Locked: redirected to `/subscribe`; Free: full detail shown |
| `/subscribe` | Subscription pricing page |
| `/subscribe/checkout` | Simulated payment form |
| `/account-suspended` | Shown when a teacher has deactivated the account |
| `/learn` | PEEL Writing Guide — freely accessible |
