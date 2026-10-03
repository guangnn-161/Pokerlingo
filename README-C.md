# Learning Daily — C ownership checkpoint

This branch implements the Learning Daily remediation scope from the 2026-10-03 implementation plan.

## Guarantees
- Learner scenario responses contain prompt data only.
- Scoring data is server-only and returned only after a valid submission.
- Scenario revisions are immutable and attempts reference the revision ID.
- Standard submissions are idempotent on (userId, submissionId) and execute attempt, mastery, quest progress and XP in one transaction.
- Daily puzzles are scoped by game and canonical UTC date; first daily submission is replay-safe.
- Daily/weekly quests use canonical UTC periods; recovery quests are created only for matching mistakes.
- Database changes are represented by the Drizzle migration and journal; production builds do not run migrations.

## Verification
CI provisions disposable PostgreSQL, applies migrations and seed data, then runs lint, typecheck, tests and build.

Rollback is forward-only: do not delete learner attempts, mastery, quest or XP records.