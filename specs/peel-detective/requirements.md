# Requirements: PEEL Detective

## Overview

PEEL Detective is an educational web application where students take on the role of a detective, analyse a crime scene, and write a structured PEEL paragraph to identify the culprit. An AI model reviews each submission instantly, assigns a score, provides element-by-element feedback, and generates a model answer for comparison.

The application solves three problems in structured writing education:
- **Slow feedback loop** — AI provides feedback within ~5 seconds instead of days
- **Low engagement** — Crime mystery framing motivates reluctant writers
- **Invisible progress** — Persistent score history and teacher dashboards surface student growth

## User Roles

| Role | Description |
|------|-------------|
| **Student** | Logs in, browses scenarios, writes PEEL responses, receives AI feedback, views progress |
| **Teacher** | All student capabilities + class dashboard, scenario creation, score override, report export |
| **Admin** | All teacher capabilities + user management, platform configuration |

## Core Concepts

### PEEL Framework
Each response is scored across four elements (0–5 each, total /20):
- **P — Point**: Clearly state who the culprit is
- **E — Evidence**: Cite specific clues from the scenario
- **E — Explain**: Logically connect evidence to the conclusion
- **L — Link**: Tie the argument back to the original question/scenario

### Crime Scenario Structure
Each mystery has: crime description, suspect list (3–5 characters), clues, and a correct culprit (known to AI for scoring).

## Acceptance Criteria

### Authentication & Roles
- [ ] Students can register and log in with email/password
- [ ] Users have a role: `student`, `teacher`, or `admin`
- [ ] Role-based access control: teacher and admin routes are protected
- [ ] Session management persists across browser sessions

### Scenario Library
- [ ] Students can browse all published crime scenarios
- [ ] Each scenario card shows: title, difficulty (1–3), student's personal best score
- [ ] Teachers can create, edit, preview, publish, and unpublish scenarios
- [ ] Scenario creation takes under 5 minutes

### Student Gameplay Flow
- [ ] Investigate screen shows crime description, suspect list, and clues
- [ ] Write screen provides a text area with an on-screen PEEL reference guide
- [ ] Single "Submit" button triggers AI evaluation
- [ ] Feedback screen shows: score per PEEL element, overall score /20, written feedback per element, spelling/grammar flags, and a model answer
- [ ] Students can revise and resubmit

### AI Feedback
- [ ] Claude API evaluates submissions and returns structured JSON
- [ ] Feedback is displayed within ~5 seconds of submission
- [ ] Submissions are never lost if AI evaluation fails (stored as `pending`, retry available)
- [ ] No student PII is sent to the AI (responses only, not names)

### Teacher Dashboard
- [ ] Class overview: all students with most recent activity and average score
- [ ] Per-scenario view: all submissions with student name, score breakdown, date
- [ ] Class-level aggregate: average per PEEL element (highlights weaknesses)
- [ ] Individual student view: chronological history, score trend
- [ ] Score override: teacher can manually adjust AI score with optional note
- [ ] Export: CSV or PDF per student or per class

### Student Profile
- [ ] View all submitted scenarios with scores
- [ ] Score history over time
- [ ] Badges earned and points total

### Gamification
- [ ] Points awarded per submission based on score
- [ ] Badges for milestones: first submission, score ≥ 18, 5 scenarios completed
- [ ] Optional leaderboard (configurable per teacher)

### Non-Functional
- [ ] Works on desktop browsers and tablets (iPad)
- [ ] AI feedback within ~5 seconds
- [ ] Page load under 2 seconds on standard broadband
- [ ] All student data encrypted in transit (HTTPS) and at rest
- [ ] Graceful error handling for AI timeouts

## Dependencies

- OpenRouter API key with access to `anthropic/claude-sonnet-4-5`
- PostgreSQL database (Supabase or Railway recommended)
- Vercel deployment (or compatible host)

## Related Documents

- Full spec: `docs/project-spec/PEEL_Detective_Project_Spec.md`
