# Learning Daily — C ownership checkpoint

This branch implements the Learning Daily remediation scope from the 2026-10-03 implementation plan.

## Guarantees
- Learner scenario responses contain prompt data only.
- Scoring data is server-only and returned only after a valid submission.
- Scenario revisions are immutable and attempts reference the revision ID.
- Standard submissions are idempotent on (userId, submissionId) and execute attempt, mastery, quest progress and XP in one transaction.
- Daily puzzles are scoped by game and canonical UTC date; first daily submission is replay-safe.
- Daily/weekly quests use canonical UTC periods; recovery quests are created only for matching mistakes.
- Database changes are represented by the Drizzle migration and journal. Vercel applies migrations and idempotent seed data before the production web build, so the deployed app and its Learning schema advance together.

## Verification
CI provisions disposable PostgreSQL, applies migrations and seed data, then runs lint, typecheck, tests and build.

Rollback is forward-only: do not delete learner attempts, mastery, quest or XP records.

## Learner routes

The public practice tables and reading library remain available without a sign-in. The Learning Hub is a protected record of a learner's own practice:

- `/training` — overview of level, XP, mastery, quests and links to active practice.
- `/training/daily` — the selected game's Daily Challenge. The first recorded answer receives the Daily score; later answers are labelled **Practice attempt — XP unchanged**.
- `/training/scenarios` — published, scored decision scenarios. Reference actions, EV and explanations appear only after a successful submission.
- `/training/progress` — the learner's persisted summary and active quest progress.

All scoring, EV, XP, mastery and quest decisions are calculated on the server. The browser sends only the learner's selected action and never receives a scenario solution before submission.
