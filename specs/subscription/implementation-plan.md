# Subscription Feature — Implementation Plan

## Phase 1: Schema & Auth Foundation

Add the database schema, run the migration, and wire the new fields into the auth session.

### Tasks

- [x] Add `subscribed`, `subscribedAt`, `subscriptionPeriodEnd` columns to the `user` table in `src/lib/schema.ts`
- [x] Add `subscriptionHistory` table to `src/lib/schema.ts` (id, userId, action, changedById, changedByRole, amount, periodEnd, createdAt)
- [x] Run `pnpm db:generate` to produce `drizzle/0005_married_nomad.sql` migration file
- [x] Run `pnpm db:push` to apply schema to local dev database
- [x] Register `subscribed`, `subscribedAt`, `subscriptionPeriodEnd` in `additionalFields` in `src/lib/auth.ts`
- [x] Add `isSubscribedOrStaff` helper to `src/lib/session.ts`

### Technical Details

- `subscribed` is `boolean NOT NULL DEFAULT false` — all existing users default to unsubscribed
- `subscriptionHistory.changedById` uses `ON DELETE SET NULL` to preserve history if actor account is deleted
- `additionalFields` registration makes the new fields flow through `session.user` automatically
- Migration file must be committed and pushed to repo so Vercel's `pnpm db:migrate` at build time applies it to production

---

## Phase 2: API Endpoints

Create the self-serve subscribe endpoint, extend the student PATCH route, and gate the submission endpoints.

### Tasks

- [x] Create `src/app/api/subscribe/route.ts` — student-only POST; activates subscription + inserts history row with `amount: 1000`
- [x] Extend `PATCH /api/students/[id]` to accept `{ subscribed: boolean }` — updates user + inserts history row with `amount: 0`
- [x] Gate `POST /api/submissions` — return `{ error: "subscription_required" }` 403 for unsubscribed students
- [x] Gate `GET /api/submissions/[id]` — return `{ error: "subscription_required" }` 403 for unsubscribed students

### Technical Details

- `/api/subscribe` is idempotent — returns success if already subscribed
- Manual activations via teacher/admin record `amount: 0` to distinguish from paid self-serve
- `subscriptionPeriodEnd = now + 30 days` on activation, `null` on revocation
- Subscription gates apply to `student` role only; teachers and admins always pass

---

## Phase 3: Student-Facing UI

Build the subscribe pricing page, mock checkout form, and gate existing scenario pages.

### Tasks

- [x] Create `src/app/subscribe/page.tsx` — pricing overview; redirects if already subscribed; CTA navigates to checkout
- [x] Create `src/app/subscribe/checkout/page.tsx` — mock card form (number, expiry, CVC, name); calls POST /api/subscribe; success state + full redirect
- [x] Gate `handleBeginWriting` in `src/app/scenarios/[id]/page.tsx` — redirect to `/subscribe?from=...` if student + unsubscribed
- [x] Handle 403 `subscription_required` in `handleSubmit` in `src/app/scenarios/[id]/page.tsx`
- [x] Gate `useEffect` in `src/app/scenarios/[id]/write/page.tsx` — redirect to `/subscribe?from=...`
- [x] Handle 403 in `handleSubmit` in `src/app/scenarios/[id]/write/page.tsx`
- [x] Handle 403 in `fetchSubmission` in `src/app/scenarios/[id]/feedback/[submissionId]/page.tsx`

### Technical Details

- Checkout form uses `formatCardNumber` (groups of 4, max 16 digits) and `formatExpiry` (MM / YY) helpers
- "Pay $10.00" button disabled until all fields are valid (16-digit card, 4-digit expiry, 3+ digit CVC, non-empty name)
- After successful payment: `window.location.href = from` forces full page reload to re-hydrate the session with `subscribed: true`
- `from` query param is thread through: `/subscribe?from=X` → `/subscribe/checkout?from=X` → redirect back to X

---

## Phase 4: Teacher/Admin Management UI

Add subscription toggling to the teacher dashboard and student detail page, plus the subscription history section.

### Tasks

- [x] Add `isSubscribed: boolean` prop and `CreditCard` toggle button to `src/app/teacher/students/_components/StudentRowActions.tsx`
- [x] Add `subscribed` to select projection and "Subscription" column + "Subscribed" stat card in `src/app/teacher/students/page.tsx`
- [x] Pass `isSubscribed` prop to `<StudentRowActions />` in `src/app/teacher/students/page.tsx`
- [x] Add `isSubscribed: boolean` prop and "Grant/Revoke Subscription" button to `src/app/teacher/students/[id]/_components/StudentActionsBar.tsx`
- [x] Pass `isSubscribed` to `<StudentActionsBar />` in `src/app/teacher/students/[id]/page.tsx`
- [x] Add subscription history DB query + render "Subscription History" Card in `src/app/teacher/students/[id]/page.tsx`

### Technical Details

- Row toggle (list page): `CreditCard` icon, no confirmation dialog — low-stakes reversible action
- Detail page toggle: labelled button "Grant Subscription" (emerald) / "Revoke Subscription" (destructive)
- History table columns: Date, Action (badge), Changed By, Amount ($10.00 vs Manual), Period End
- Empty state: CreditCard icon + "No subscription events recorded."
- Deleted actor gracefully displays as "Unknown (role)" when `changedByName` is null

---

## Phase 5: Navigation & Dashboard UX

Surface the subscription CTA in the header, mobile nav, and student dashboard.

### Tasks

- [x] Add conditional "Subscribe" amber link for unsubscribed students in `src/components/site-header.tsx`
- [x] Add `showSubscribe?: boolean` prop and conditional link in `src/components/mobile-nav.tsx`
- [x] Add subscription info banner with "Subscribe Now" CTA to `src/app/dashboard/page.tsx` for unsubscribed students

### Technical Details

- Header and dashboard are Server Components — check `session.user.subscribed` and `session.user.role` server-side
- Mobile nav receives `showSubscribe` as a prop from the server layout
- Banner uses `detective-amber/10` background with `Lock` icon for visual consistency
