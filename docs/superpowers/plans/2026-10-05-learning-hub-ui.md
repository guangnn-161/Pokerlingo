# Learning Hub UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver authenticated Learning Hub pages for server-persisted scenarios, Daily Challenge, quests and progress.

**Architecture:** Add narrow client components under `apps/web/components/training` that consume existing Learning API contracts through a typed fetch layer. Server route pages enforce authentication and compose those components; existing trainer and library pages stay independent. Shared CSS extends the current Pokerlingo design system without introducing a component library.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Zod, Vitest, existing Pokerlingo CSS.

**Spec:** `docs/superpowers/specs/2026-10-05-learning-hub-ui-design.md`

## Global Constraints

- Keep all score, EV, answers, XP, quest and mastery decisions server-side.
- Require authentication for every `/training` route; public trainers remain unchanged.
- Parse API response data with Zod before rendering it.
- Use `cache: "no-store"` and disable mutation controls while a request is pending.
- Never expose solution fields before a successful attempt response.
- A Daily response with `isFirstAttempt: false` is labelled practice and cannot promise XP.
- Reuse current dark-green/paper visual language and support keyboard and screen-reader operation.

## Review Focus

- A malformed or unexpected API response must show a retryable error, not crash the route; cover this in Task 1's fetch-layer tests.
- An unauthenticated visitor must be redirected before a Learning component fetches private data; cover this in Task 2's server-page test.
- A scenario action must not submit twice during an in-flight request; cover pending state in Task 3's state test.
- A Daily Challenge absent for the selected game must render a neutral empty state; cover `DAILY_NOT_FOUND` in Task 4.
- Feedback must be absent before submit and must label a later Daily attempt as practice; cover view-model derivation in Tasks 3 and 4.

---

## File structure

| File | Responsibility |
| --- | --- |
| `packages/contracts/src/learning.ts` | Public Zod schema for Daily result shared by server and UI. |
| `apps/web/lib/training-client.ts` | Typed no-store request functions and normalized API error class. |
| `apps/web/lib/training-state.ts` | Pure game labels, action choices and feedback/quest view models. |
| `apps/web/components/training/*.tsx` | Focused presentational and interactive Training components. |
| `apps/web/app/training/**/page.tsx` | Authenticated route pages and composition only. |
| `apps/web/components/app-shell.tsx` | Learning Hub navigation item and active-path rule. |
| `apps/web/app/globals.css` | Responsive Learning Hub layout and accessible feedback states. |

### Task 1: Create typed Learning UI data boundary

**Files:**
- Modify: `packages/contracts/src/learning.ts`
- Create: `apps/web/lib/training-client.ts`
- Create: `apps/web/lib/training-state.ts`
- Create: `apps/web/lib/training-state.test.ts`

**Interfaces:**
- Produces `dailyAttemptResultSchema` with `attemptId`, `puzzleId`, `isFirstAttempt`, `selectedAction`, `bestAction`, `evLossBb`, `score`, `mistakeTag`, `explanationMd`, `assumptions`, `engineVersion` and `calculationMethod`.
- Produces `TrainingApiError { status: number; code: string }` and request functions `getProgress()`, `getScenarios(game)`, `submitScenario(request)`, `getDaily(game)`, `submitDaily(request)`.
- Produces pure `gameLabel`, `actionLabel`, `scenarioFeedback` and `dailyFeedback` functions consumed by UI components.

- [ ] **Step 1: Write failing state tests**

Add tests that assert `gameLabel("nlhe")` is `"NL Hold'em"`, an action with size has a readable label, scenario feedback is absent before a result exists, and a Daily result with `isFirstAttempt: false` has the literal practice label.

- [ ] **Step 2: Run the state tests to verify they fail**

Run: `pnpm --filter @pokerlingo/web test -- training-state.test.ts`

Expected: FAIL because no Training UI state module exists.

- [ ] **Step 3: Add the Daily result contract and typed client boundary**

Implement the schema in `packages/contracts/src/learning.ts`. Implement request helpers that set `cache: "no-store"`, parse `{ data }` envelopes and result schemas, and convert invalid payloads or non-OK responses into `TrainingApiError` without copying server solution data into request state.

- [ ] **Step 4: Implement pure view-model helpers**

Implement the exported state functions in `apps/web/lib/training-state.ts`; accept existing contract types and use no React state or fetch calls.

- [ ] **Step 5: Verify and commit**

Run: `pnpm --filter @pokerlingo/web test -- training-state.test.ts && pnpm typecheck`

Commit: `feat(training): add typed learning client boundary`

### Task 2: Add protected Training shell, overview and progress page

**Files:**
- Create: `apps/web/app/training/layout.tsx`
- Create: `apps/web/app/training/page.tsx`
- Create: `apps/web/app/training/progress/page.tsx`
- Create: `apps/web/components/training/training-dashboard.tsx`
- Create: `apps/web/components/training/progress-summary.tsx`
- Modify: `apps/web/components/app-shell.tsx`
- Modify: `apps/web/app/globals.css`
- Test: `apps/web/lib/training-state.test.ts`

**Interfaces:**
- Consumes `getProgress(): Promise<ProgressSummary>` from Task 1.
- Produces protected `/training` and `/training/progress` pages, `TrainingDashboard` and `ProgressSummary` client components.

- [ ] **Step 1: Write failing quest progress view-model tests**

Add literal fixtures for an active quest, completed quest and empty mastery; assert percentage is capped at 100, completed text is distinct, and recovery cadence has a human-readable label.

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @pokerlingo/web test -- training-state.test.ts`

Expected: FAIL because progress view-model helpers do not exist.

- [ ] **Step 3: Add protected pages and dashboard components**

`app/training/layout.tsx` calls `getCurrentUser()` and redirects unauthenticated visitors to `/login`. The overview uses `TrainingDashboard` with metric cards, quest rows and links to Daily/Scenarios; `/progress` uses `ProgressSummary` with the detailed same source of truth.

- [ ] **Step 4: Add Learning Hub navigation and responsive styling**

Insert `/training` in `AppShell` navigation and make `/training/*` active. Add only `training-*` CSS selectors for cards, progress bars, skeleton/loading, empty, error and mobile grids.

- [ ] **Step 5: Verify and commit**

Run: `pnpm --filter @pokerlingo/web test -- training-state.test.ts && pnpm lint && pnpm build`

Commit: `feat(training): add protected learning dashboard`

### Task 3: Build Scenario Practice UI

**Files:**
- Create: `apps/web/app/training/scenarios/page.tsx`
- Create: `apps/web/components/training/scenario-trainer.tsx`
- Modify: `apps/web/lib/training-state.ts`
- Modify: `apps/web/lib/training-state.test.ts`
- Modify: `apps/web/app/globals.css`

**Interfaces:**
- Consumes `getScenarios(game)` and `submitScenario({ revisionId, action, submissionId })` from Task 1.
- Produces `ScenarioTrainer` with explicit loading, no-scenarios, ready, pending, feedback and retry states.

- [ ] **Step 1: Write failing submission-state tests**

Add tests for a generated submission lifecycle: ready input exposes no feedback; pending input disables all action buttons; successful attempt exposes score, EV loss and explanation; reset chooses a new scenario state and clears feedback.

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @pokerlingo/web test -- training-state.test.ts`

Expected: FAIL because scenario state derivation is absent.

- [ ] **Step 3: Implement ScenarioTrainer**

Fetch scenarios after the learner selects a game. Render prompt state as safe JSON-derived rows rather than HTML. Use `crypto.randomUUID()` once per explicit action click, block duplicate submission while pending, then render only the returned attempt feedback. Give **Try another scenario** a fresh local state rather than replaying a request.

- [ ] **Step 4: Style and make controls accessible**

Use semantic action buttons with `aria-pressed`, an `aria-live="polite"` result panel and a visible error with retry action. Add scenario-specific styles using existing panel and button tokens.

- [ ] **Step 5: Verify and commit**

Run: `pnpm --filter @pokerlingo/web test -- training-state.test.ts && pnpm typecheck && pnpm build`

Commit: `feat(training): add scenario practice interface`

### Task 4: Build Daily Challenge UI

**Files:**
- Create: `apps/web/app/training/daily/page.tsx`
- Create: `apps/web/components/training/daily-trainer.tsx`
- Modify: `apps/web/lib/training-state.ts`
- Modify: `apps/web/lib/training-state.test.ts`
- Modify: `apps/web/app/globals.css`

**Interfaces:**
- Consumes `getDaily(game)` and `submitDaily({ game, action, submissionId })` from Task 1.
- Produces `DailyTrainer` with game selection, no-puzzle state, one scoring attempt and labelled practice retry.

- [ ] **Step 1: Write failing Daily state tests**

Test `DAILY_NOT_FOUND` maps to an empty-state model, a first response uses a scored-result label, and a later response uses the literal `Practice attempt — XP unchanged` label.

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @pokerlingo/web test -- training-state.test.ts`

Expected: FAIL because Daily view-state derivation is incomplete.

- [ ] **Step 3: Implement DailyTrainer**

Load exactly one selected-game Daily prompt. Generate one submission ID per action click. On `DAILY_NOT_FOUND`, show the selected game and a link to scenarios. On a response, render feedback; expose **Practice another action** only after a result and clearly label non-first responses.

- [ ] **Step 4: Verify styling, accessibility and no-answer boundary**

Use action buttons, an `aria-live` feedback region and no reference fields in prompt state. Keep result details unmounted until a parsed mutation result is present.

- [ ] **Step 5: Verify and commit**

Run: `pnpm --filter @pokerlingo/web test -- training-state.test.ts && pnpm lint && pnpm build`

Commit: `feat(training): add daily challenge interface`

### Task 5: Connect learning entry points and run release verification

**Files:**
- Modify: `apps/web/app/learn/page.tsx`
- Modify: `apps/web/app/page.tsx`
- Modify: `README-C.md`
- Test: existing web and package test suites

**Interfaces:**
- Consumes route paths from Tasks 2–4.
- Produces visible links from the lobby and Learning Library to `/training`, `/training/daily` and `/training/scenarios`.

- [ ] **Step 1: Add visible Learning Hub entry links**

Link the home learning teaser and library header to the Training Hub while preserving the existing reading-library filters and trainer links.

- [ ] **Step 2: Document learner-facing routes**

Update `README-C.md` with authentication expectations, the four Training routes and the Daily practice-retry rule; do not document server-only solution data.

- [ ] **Step 3: Run complete verification**

Run: `pnpm lint && pnpm typecheck && pnpm test && pnpm build && git diff --check main...HEAD`

Expected: all checks pass; PostgreSQL-backed migration tests run in CI when a local database is unavailable.

- [ ] **Step 4: Review the browser flow and commit**

Verify `/training`, `/training/daily` and `/training/scenarios` redirect when signed out and render stable authenticated loading, empty and result states. Commit: `feat(training): surface learning hub across Pokerlingo`.

## Plan self-review

- Spec coverage: Tasks 2–4 implement all four routes and the authenticated interaction rules; Task 5 surfaces them; Task 1 protects contracts and parsing.
- Interface consistency: every component uses the Task 1 request boundary; no component reaches the database or scoring library.
- Review Focus coverage: Task 1 covers invalid payloads, Task 2 gate/progress, Task 3 pending/pre-submit state, Task 4 Daily absence/practice response, and Task 5 route-level flow.
- Scope: authoring, social features, notifications, payments and scoring changes remain excluded.

## Execution record — 2026-10-05

**Status:** Completed and released to `main` in commit `f36760e`.

- Data boundary and view-model tests: `e9f25c1`.
- Protected dashboard, quest and progress screens: `06ede2b`.
- Scenario Practice screen: `c490ee5`.
- Daily Challenge screen: `dec4217`.
- Lobby/library entry points and learner-route documentation: `ffe9cb1`.
- Review fixes for Daily reload reveal, game-switch request races and action sizing: `f36760e`.

Validation recorded after the final review fixes:

- `pnpm lint` and `pnpm typecheck` passed.
- All web tests passed: 57 tests in 7 files.
- Production web build passed.
- GitHub Actions passed for `f36760e`: https://github.com/guangnn-161/Pokerlingo/actions/runs/37230513520.
- The public `/training` route returns `307 /login` without an authenticated session, confirming the release route and server-side gate are active.

The local database migration suite cannot run on this workstation while PostgreSQL is absent at port 5432. The release CI runs that database-backed validation with a disposable PostgreSQL service.
