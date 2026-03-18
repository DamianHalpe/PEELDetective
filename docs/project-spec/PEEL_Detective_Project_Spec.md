# PEEL Detective — Claude Code Project Specification

> **Tagline:** A fun, game-like website where students practise structured writing through crime-scene mysteries, get instant AI feedback, and teachers can see exactly how every student is progressing — all in one place.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Core Concepts](#2-core-concepts)
3. [User Roles](#3-user-roles)
4. [Functional Requirements](#4-functional-requirements)
5. [AI Integration](#5-ai-integration)
6. [Data Models](#6-data-models)
7. [User Flows](#7-user-flows)
8. [Feature List](#8-feature-list)
9. [Non-Functional Requirements](#9-non-functional-requirements)
10. [Delivery Phases](#10-delivery-phases)
11. [Success Criteria](#11-success-criteria)
12. [Known Constraints & Risks](#12-known-constraints--risks)

---

## 1. Project Overview

**Product name:** PEEL Detective  
**Status:** Pre-development — approved for build  
**Timeline:** 16 weeks (4 months)  
**Team:** Solo developer, AI-assisted (vibe coding)  
**Stakeholders:** Marissa & Malith (school contacts); Damian (developer)

### Problem Statement

Teaching structured writing is one of the most labour-intensive tasks in education. Three specific problems exist:

- **Slow feedback loop** — Marking 30 PEEL paragraphs takes hours; students receive feedback days later, when the learning moment has passed.
- **Low engagement** — Worksheets and essay prompts fail to capture student attention, especially for reluctant writers.
- **Invisible progress** — No consistent, accessible record of each student's writing development makes it hard to identify who needs support or demonstrate growth.

### Solution

An educational web application where students take on the role of a detective, analyse a crime scene, and write a structured PEEL paragraph to identify the culprit. An AI model reviews each submission instantly, assigns a score, provides element-by-element feedback, and generates a model answer for comparison.

---

## 2. Core Concepts

### The PEEL Framework

PEEL is a four-element structured writing technique:

| Element | Description |
|---------|-------------|
| **P — Point** | Clearly state the main argument or conclusion (e.g. who the culprit is) |
| **E — Evidence** | Cite specific clues or facts that support the point |
| **E — Explain** | Logically connect the evidence to the conclusion |
| **L — Link** | Tie the argument back to the original question or scenario |

### Crime Scenario Structure

Each mystery has:
- A **crime description** (short narrative setting the scene)
- A **list of suspects** (typically 3–5 named characters with brief backgrounds)
- A set of **clues** (facts the student must reference and reason about)
- A **correct culprit** (known to the AI for scoring purposes)

### Scoring

- Each PEEL element is scored **0–5**
- Total score: **out of 20**
- Scores are stored per submission and tracked over time

---

## 3. User Roles

### 3.1 Student

- Logs in with school credentials (or username/password)
- Browses and selects crime scenarios
- Reads clues and writes a PEEL response
- Receives instant AI feedback and a score
- Can revise and resubmit
- Views their own progress history

### 3.2 Teacher

- Has all Student capabilities
- Views all student submissions for any scenario
- Sees per-element breakdowns across a class
- Views individual student progress over time
- Creates and publishes new crime scenarios
- Can override AI scores if needed
- Downloads progress reports

### 3.3 Administrator

- Has all Teacher capabilities
- Manages user accounts and class groupings
- Full access to the content library
- Platform-level configuration

---

## 4. Functional Requirements

### 4.1 Authentication

- [ ] Students log in with school credentials (SSO preferred) or username/password
- [ ] Teachers and admins have separate login with elevated permissions
- [ ] Session management with secure token handling
- [ ] No new passwords to remember — integrate with existing school systems where possible

### 4.2 Scenario Library

- [ ] Browse a list of available crime scenarios
- [ ] Each scenario card shows: title, difficulty indicator, and student's personal best score (if attempted)
- [ ] Scenarios are published/unpublished by teachers; students only see published ones
- [ ] At least 10 scenarios required at launch (created during Week 3 content workshop)

### 4.3 Student Gameplay Flow

- [ ] **Investigate screen** — Display crime description, suspect list, and clues; animated guide character visible
- [ ] **Write screen** — Structured writing area with on-screen PEEL guide; separate input field or label per element (P, E, E, L), or a single free-text area with structural prompts
- [ ] **Submit** — Single "Submit my answer" button; triggers AI evaluation
- [ ] **Feedback screen** — Display score per PEEL element, overall score, written feedback per element, and a model answer
- [ ] **Retry or continue** — Option to revise and resubmit, or return to scenario library

### 4.4 AI Feedback

- [ ] On submission, send student response + scenario context to Claude API
- [ ] Receive and display: score per element (0–5), feedback text per element, overall score (/20), spelling/grammar flags, model answer
- [ ] Store full submission (response, scores, feedback, timestamp) to student profile
- [ ] AI evaluation target time: ~5 seconds

### 4.5 Teacher Dashboard

- [ ] List all students with their most recent activity and average score
- [ ] View all submissions for a given scenario (student name, score breakdown, submission date)
- [ ] Class-level aggregate: average score per PEEL element across all submissions (highlights weaknesses)
- [ ] Individual student view: chronological submission history, score trend chart
- [ ] Score override: teacher can manually adjust an AI-assigned score with an optional note
- [ ] Download/export progress report (PDF or CSV) per student or per class

### 4.6 Scenario Management

- [ ] Teacher-facing form to create a new scenario: title, crime description, suspect list, clues, correct culprit (for AI context)
- [ ] Preview scenario before publishing
- [ ] Publish / unpublish toggle
- [ ] Edit or delete existing scenarios
- [ ] Target creation time: under 5 minutes per scenario

### 4.7 PEEL Learning Module

- [ ] Dedicated section accessible before or during gameplay
- [ ] Illustrated breakdown of each PEEL element
- [ ] Three sample answers at quality levels: Basic, Developing, Excellent — each with an explanation of its grade
- [ ] Optional embedded video explaining the technique

### 4.8 Gamification

- [ ] Points system — students earn points per submission based on score
- [ ] Badges — awarded for milestones (e.g. first submission, score of 18+, 5 scenarios completed)
- [ ] Student can view their points total and badge collection on their profile
- [ ] Leaderboard (optional / configurable by teacher — can be disabled for class)

### 4.9 Animated Guide Character

- [ ] On-screen character visible during Investigate and Write screens
- [ ] Offers contextual hints and encouragement
- [ ] Age-appropriate design; not distracting

### 4.10 Student Progress Profile

- [ ] Per-student view of all submitted scenarios
- [ ] Score history over time (chart or timeline)
- [ ] Highlights best scores and most-improved areas
- [ ] Accessible to the student themselves and their teacher

---

## 5. AI Integration

### Model

Use **Claude** (Anthropic) — selected for age-appropriate, measured, explanatory feedback in educational contexts.

Recommended model: `claude-sonnet-4-20250514` (balance of quality and cost for per-submission evaluation)

### Prompt Design

Each evaluation call should include:

```
SYSTEM PROMPT (fixed):
You are an educational writing evaluator for students aged [target age range].
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
  "feedback": {
    "point": "string",
    "evidence": "string",
    "explain": "string",
    "link": "string"
  },
  "grammar_flags": ["string"],
  "model_answer": "string"
}

USER PROMPT (dynamic):
Crime scenario: [crime_description]
Suspects: [suspect_list]
Clues: [clues]
Correct culprit: [culprit]

Student's response:
[student_response]
```

### Scoring Logic

- Parse JSON response; store all fields to the database
- Handle API errors gracefully — show a user-friendly message, allow retry
- Log all API calls with timestamp, scenario ID, student ID (no PII in logs)

### Cost Management

- Estimated cost: very low per submission (< $0.01 per evaluation at typical response lengths)
- Track token usage per submission for monitoring
- Implement a daily/monthly usage cap configurable by admin

---

## 6. Data Models

### User
```
id, email, display_name, role (student | teacher | admin),
school_id, created_at, last_login_at
```

### Scenario
```
id, title, crime_description, suspects (JSON array),
clues (JSON array), correct_culprit, difficulty (1–3),
created_by (user_id), published (bool), created_at, updated_at
```

### Submission
```
id, student_id, scenario_id, response_text,
score_point, score_evidence, score_explain, score_link, total_score,
feedback_json, grammar_flags_json, model_answer,
teacher_override_score (nullable), teacher_override_note (nullable),
submitted_at, ai_evaluated_at
```

### Badge
```
id, name, description, icon_url, trigger_condition
```

### StudentBadge
```
id, student_id, badge_id, awarded_at
```

### School
```
id, name, sso_config (nullable), created_at
```

---

## 7. User Flows

### Student: Complete a Mystery

```
Login → Scenario Library → Select Scenario → Investigate Screen
  → (optional) PEEL Learning Module → Write Screen → Submit
  → AI Evaluation (~5s) → Feedback Screen
  → [Revise & Resubmit] OR [Choose New Scenario] OR [View My Progress]
```

### Teacher: Review Class Performance

```
Login → Teacher Dashboard → Select Class / Scenario
  → View Submission List → Select Individual Student
  → View Submission Detail → (optional) Override Score
  → Export Report
```

### Teacher: Add a New Scenario

```
Login → Scenario Management → New Scenario
  → Fill Form (title, description, suspects, clues, culprit)
  → Preview → Publish
```

---

## 8. Feature List

| # | Feature | Priority | Phase |
|---|---------|----------|-------|
| 1 | Student login (username/password) | Must | 2 |
| 2 | SSO / school credentials login | Should | 2 |
| 3 | Scenario library browse | Must | 3 |
| 4 | Investigate screen (clues + suspects) | Must | 3 |
| 5 | PEEL writing area with guide | Must | 3 |
| 6 | Submit → AI evaluation | Must | 2 |
| 7 | Feedback screen (scores + text + model answer) | Must | 3 |
| 8 | Revise and resubmit | Should | 3 |
| 9 | Student progress profile | Must | 3 |
| 10 | Teacher dashboard — class view | Must | 4 |
| 11 | Teacher dashboard — individual student view | Must | 4 |
| 12 | Score override | Should | 4 |
| 13 | Progress report export | Should | 4 |
| 14 | Scenario creation form | Must | 2 |
| 15 | Publish / unpublish scenarios | Must | 2 |
| 16 | PEEL learning module | Must | 5 |
| 17 | Animated guide character | Should | 5 |
| 18 | Points system | Should | 5 |
| 19 | Badges | Could | 5 |
| 20 | Leaderboard (teacher-configurable) | Could | 5 |
| 21 | Spelling/grammar flags in feedback | Should | 3 |
| 22 | Works on desktop & tablet | Must | throughout |
| 23 | Admin user management | Must | 4 |

---

## 9. Non-Functional Requirements

### Performance
- AI feedback returned within ~5 seconds of submission
- Page load < 2 seconds on standard school broadband

### Security & Privacy
- All student data encrypted at rest and in transit (HTTPS / TLS)
- Access to submissions restricted to the submitting student and their teacher
- No student PII transmitted to AI model (student responses only, not names)
- Compliant with school data protection requirements
- Regular security review before launch (Week 13–14)

### Accessibility
- Accessible on desktop browsers and tablets (iPads commonly used in schools)
- Font sizes and contrast ratios suitable for classroom display
- Accessibility testing scheduled Week 13–14

### Scalability
- Architecture should support multiple schools without per-school deployments
- AI cost per submission should be monitored; admin can cap usage

### Reliability
- Graceful error handling for AI API timeouts or failures
- Submissions should not be lost if AI evaluation fails (store draft, retry)

---

## 10. Delivery Phases

| Phase | Weeks | Deliverables |
|-------|-------|-------------|
| **1 — Getting Started** | 1–2 | Project plan confirmed; design begins; content workshop scheduled with Marissa |
| **2 — Core Platform** | 3–6 | Working login; scenario management (add/edit/publish); AI evaluation connected and tested |
| **3 — Student Experience** | 7–9 | Full student journey live: choose scenario → write → get AI feedback → view progress |
| **4 — Teacher Dashboard** | 10 | Progress tracking, student reporting, scenario management tools live for teachers |
| **5 — Polish & Gamification** | 11–12 | Animated guide character; points and badges; visual design polish; PEEL video module |
| **6 — Testing** | 13–14 | QA; security review; accessibility testing |
| **7 — Trial** | 15 | Selected teachers and students use platform; feedback collected; final adjustments |
| **8 — Launch** | 16 | Platform live for all users; documentation and training materials handed over |

### Content Dependency

At least **10 crime scenarios** are required for launch. These will be created collaboratively with Marissa during a content workshop in **Week 3**. Scenario creation should be unblocked before Week 7 student experience phase.

---

## 11. Success Criteria

The project is considered successful when all of the following are true:

- [ ] Students can log in, complete a mystery, and receive meaningful feedback **without any teacher instructions**
- [ ] AI feedback is rated as **accurate and helpful** by teachers in pre-launch testing
- [ ] Teachers can create a new crime scenario and publish it in **under 5 minutes**
- [ ] Students describe the platform as **"fun"** in user testing
- [ ] No security or privacy concerns — all student data is handled responsibly and in line with school data protection requirements
- [ ] Platform is stable and accessible for launch week

### Key Performance Indicators

| Metric | Target |
|--------|--------|
| Time to create a new scenario | < 5 minutes |
| AI evaluation time per submission | ~5 seconds |
| Weeks to full launch | 16 |
| Minimum scenarios at launch | 10 |

---

## 12. Known Constraints & Risks

| Risk | Impact | Mitigation |
|------|--------|-----------|
| **AI feedback quality** — AI may occasionally score unusual responses imperfectly | Medium | Teachers can review any submission and override scores |
| **Content readiness** — Platform needs ≥10 scenarios to launch | High | Content workshop built into Week 3; block time with Marissa |
| **Solo development** — Single developer; no team buffer | Medium | Vibe coding maintains pace; all code reviewed and tested before use |
| **Internet dependency** — Web app only; no offline mode | Low | Designed for school broadband; tested on typical school networks |
| **Student data privacy** — Responses and scores stored on platform | High | Data encrypted; access restricted; reviewed in Week 13–14 security pass |
| **Ongoing AI costs** — Per-submission API cost | Low | Costs are low per call; estimate based on expected student numbers; admin cap available |

---

## Appendix: Suggested Tech Stack

The following is a suggested starting point — adjust as needed:

| Layer | Suggestion |
|-------|-----------|
| **Frontend** | React (Next.js) — server-side rendering good for initial load performance |
| **Backend / API** | Next.js API routes or Node.js (Express/Fastify) |
| **Database** | PostgreSQL (Supabase or Railway for easy hosted setup) |
| **Auth** | NextAuth.js or Supabase Auth (supports SSO/OAuth for school credentials) |
| **AI** | Anthropic Claude API (`claude-sonnet-4-20250514`) |
| **Hosting** | Vercel (frontend + API) or Railway |
| **File storage** | Not required at MVP; add if scenario images needed later |
| **Email** | Resend or SendGrid for teacher notifications (post-MVP) |

---

*Document generated from: PEEL_Detective_Business_Overview_v3.docx*  
*Spec version: 1.0 — Ready for Claude Code*
