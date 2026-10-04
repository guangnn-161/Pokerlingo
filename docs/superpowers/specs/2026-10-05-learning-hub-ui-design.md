# Learning Hub UI Design

## Purpose

Make Pokerlingo's released learning engine visible and useful to signed-in learners. A learner must be able to find a daily challenge, complete a scenario, receive EV feedback only after submitting, and understand their XP, mastery and quests without interacting with raw API routes.

Public poker, blackjack, GTO and counting trainers remain usable without an account. Learning Hub pages require an authenticated account because their progress is server-persisted.

## Information architecture

Add **Learning Hub** to the primary sidebar and use `/training` as the entry point.

| Route | Purpose |
| --- | --- |
| `/training` | Overview: XP, level, mastery, active daily/weekly/recovery quests, and primary actions. |
| `/training/daily` | Today's game-scoped Daily Challenge, game selector, answer flow and post-submit feedback. |
| `/training/scenarios` | Published scenario browser filtered by game; one scenario is shown at a time for an action choice and result. |
| `/training/progress` | Detailed progress: XP, mastery, attempts, EV-loss average and quest states. |

The existing `/learn` remains the reading library; cards on it may link to `/training/scenarios` but its lesson content is not duplicated.

## Component boundaries

`TrainingGate` is a server component responsible only for redirecting an unauthenticated visitor to `/login`.

`LearningDashboard` fetches `GET /api/learning/progress` on the client and renders metric cards, quest rows and loading/error states.

`ScenarioTrainer` fetches `GET /api/learning/scenarios?game=<game>`, renders only prompt data, creates one browser-generated submission ID when an answer is chosen, and sends it to `POST /api/learning/attempt`. It never calculates score, EV or a correct action in the browser.

`DailyTrainer` fetches `GET /api/learning/daily?game=<game>`. It sends each user answer to `POST /api/learning/daily`; a response with `isFirstAttempt: false` is labelled practice and never promises extra XP.

Shared presentation components render game filters, action buttons, score feedback, quest progress bars and accessible empty/error states. They accept contract-shaped props and do not fetch or mutate data themselves.

## Data and interaction rules

- The learner sees no answer, EV, explanation, assumptions or engine metadata until the relevant POST succeeds.
- Loading, unauthenticated, no-content and invalid-response states have explicit visible copy. A missing Daily Challenge is an empty state, not an error screen.
- Fetches use `cache: "no-store"`; each mutation disables action buttons while pending and re-fetches progress after success.
- A submitted scenario is not automatically replayed with a new ID. The learner must intentionally select **Try another scenario**. A Daily retry uses a new ID and is labelled practice according to the returned `isFirstAttempt` value.
- Game labels use existing contract keys and human names: NL Hold'em, Omaha, Short Deck, Stud and Blackjack where data exists. The UI gracefully shows zero scenarios for a selected game.
- No client persistence is used for XP, quest or result truth. Browser state is only transient screen state.

## Visual direction and accessibility

Reuse Pokerlingo's existing dark green, paper, chips and table visual language from `globals.css`. The Learning Hub is a clear editorial dashboard: a large current action at the top, progress cards next, then quests and supporting links.

All action controls are semantic buttons, expose disabled/pending state, have visible focus treatment, and work with keyboard navigation. Status updates use an `aria-live` region. Feedback uses text and numbers rather than colour alone.

## Error handling

`401` redirects to login. `404 DAILY_NOT_FOUND` becomes a Daily empty state. `422 ACTION_NOT_SCORABLE`, malformed JSON and unexpected failures become an inline retryable error without revealing solution data. API result payloads are parsed against existing Zod contracts before use.

## Verification

- Unit tests cover game label/filter mapping, feedback state derivation and the rule that pre-submit data contains no solution fields.
- Component tests cover prompt rendering, disabled submit, success feedback, practice retry labelling, no-daily empty state and progress error state.
- Route-contract tests use mocked fetch payloads shaped like the public contracts; database behaviour remains covered by the existing PostgreSQL CI suite.
- Release gate runs `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` and the deployed smoke check for `/training`, `/training/daily` and `/training/scenarios` while authenticated.

## Out of scope

Scenario authoring, admin scheduling tools, social leaderboards, push notifications, payments, and changes to EV/scoring/database rules are not part of this UI release.
