# C — Learning System

Implemented scope:
- versioned learning scenarios with draft/reviewed/published lifecycle
- persistent attempts with scenario version snapshots
- EV-loss based scoring adapter and mistake tagging
- XP ledger with idempotency protection
- mastery aggregation
- quest templates and user quest initialization
- daily puzzle publication helper and daily puzzle read API
- authenticated learning APIs for scenarios, attempts, progress, and daily puzzle state

Before merging:
1. Run `pnpm db:generate` and `pnpm db:migrate`.
2. Seed the included learning scenarios/quests.
3. Replace the temporary content-reference scoring adapter with B's approved math engine adapter once B's contract is available.
4. Connect D's learning dashboard and daily-puzzle UI to the new routes.
5. Add integration tests against a test Postgres database.

Security/product notes:
- Only published scenarios are learner-visible.
- Attempts store the scenario version used for grading.
- XP writes are idempotent by source/user.
- Daily puzzle solution/reference fields should be stripped from the response until the first submission/reveal flow is implemented.
