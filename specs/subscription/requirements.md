# Subscription Feature

## Overview

Students must hold an active subscription to submit PEEL responses and view AI-generated feedback. Browsing and reading scenarios remains free. Teachers and admins bypass all subscription gates automatically. Payment is simulated (mock card form — no real payment integration).

## Goals

- Gate high-value features (submission + feedback) behind a paid subscription
- Provide a self-serve checkout flow for students ($10/month recurring, mocked)
- Allow teachers and admins to manually activate or revoke any student's subscription
- Maintain a full audit log of every subscription activation and revocation

## Roles & Access

| Action                         | Student (unsubscribed) | Student (subscribed) | Teacher / Admin |
|-------------------------------|------------------------|----------------------|-----------------|
| Browse / read scenarios        | ✅                     | ✅                   | ✅              |
| Submit a PEEL response         | ❌ → `/subscribe`      | ✅                   | ✅              |
| View AI feedback               | ❌ → `/subscribe`      | ✅                   | ✅              |
| Self-subscribe (mock payment)  | ✅                     | N/A                  | N/A             |
| Toggle student subscription    | ❌                     | ❌                   | ✅              |

## Subscription Tier

- **Single tier**: active or not (no free trial, no partial access)
- **Price**: $10.00 USD / month (recurring)
- **Period**: 30 days from activation date (`subscriptionPeriodEnd`)
- **Payment**: simulated — card form collects number / expiry / CVC / name but no real charge

## Student Self-Serve Flow

1. Unsubscribed student triggers a gated action (e.g., "Begin Writing") → redirected to `/subscribe?from=<current-path>`
2. `/subscribe` — pricing page showing plan perks and $10/month CTA → navigates to `/subscribe/checkout?from=<path>`
3. `/subscribe/checkout` — mock card form; "Pay $10.00" button disabled until all fields filled
4. On submit: `POST /api/subscribe` activates subscription, records history with `amount: 1000` (cents)
5. Success screen → full-page redirect back to `from` (forced full navigation to re-hydrate session)

## Teacher/Admin Management

- Toggle button on the student list row (teacher dashboard) — no confirmation dialog
- "Grant Subscription" / "Revoke Subscription" button on the student detail page
- Calls `PATCH /api/students/[id]` with `{ subscribed: boolean }`
- Manual activations record `amount: 0` in history to distinguish from paid

## Subscription History

Every activation and revocation is recorded in `subscription_history`:
- **Date/time** of the event
- **Action**: "Activated" (green badge) or "Revoked" (red badge)
- **Changed by**: actor name + role; "Student (self)" for self-serve; "Unknown (role)" if actor deleted
- **Amount**: "$10.00" for self-serve; "Manual" for teacher/admin
- **Period end**: end date of the subscription period (or — for revocations)

History is visible to teachers and admins on the student detail page (`/teacher/students/[id]`).

## Navigation & Dashboard UX

- **Site header**: "Subscribe" amber link shown to unsubscribed students only
- **Mobile nav**: same conditional "Subscribe" link
- **Dashboard banner**: info banner shown to unsubscribed students with CTA to `/subscribe`

## Database Changes

New columns on `user`:
- `subscribed: boolean NOT NULL DEFAULT false`
- `subscribed_at: timestamp`
- `subscription_period_end: timestamp`

New table `subscription_history`:
- `id, user_id (FK→user, cascade), action, changed_by_id (FK→user, set null), changed_by_role, amount (integer cents), period_end, created_at`

## API Surface

| Method | Path                        | Auth     | Purpose                                      |
|--------|-----------------------------|----------|----------------------------------------------|
| POST   | `/api/subscribe`            | student  | Self-serve mock payment + activate           |
| PATCH  | `/api/students/[id]`        | teacher+ | Toggle `subscribed` or `banned`             |
| POST   | `/api/submissions`          | student  | Gate: 403 `subscription_required` if unsubscribed |
| GET    | `/api/submissions/[id]`     | student  | Gate: 403 `subscription_required` if unsubscribed |
