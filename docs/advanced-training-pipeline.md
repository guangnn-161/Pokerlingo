# Pokerlingo advanced training — continuation pipeline

Updated 2026-09-30. User scope: Hi-Lo counting and guide; generated poker decisions graded from calculated EV; GTO tables; Hold’em, Omaha, Short Deck and Stud; a six-player table with five distinct bot styles; publish to main and preserve small Markdown checkpoints.

## Current checkpoint

COMPLETE: implementation, tests, merge and public-browser verification have passed. PR https://github.com/guangnn-161/Pokerlingo/pull/3 merged into main at `4d8bbfa3d5ac563d533071a813cdf69056ccd9ca`. Production https://pokerlingo-wheat.vercel.app is READY on that merge commit. This is the current continuation pipeline; `redesign-pipeline.md` preserves the earlier redesign checkpoint.

Use this chat's `work/pokerlingo` checkout; do not alter the dirty original D:\Pokerlingo. No required implementation or release work remains for the completed scope. Extend it only from a new user request, keeping small independent commits and updating this file after each meaningful verification.

## Completed modules and evidence

1. Hi-Lo: `/practice/counting` flash drills (1/2/6 decks, batch 1/3, auto/pause, hide/review), RC/TC quizzes; `/practice/blackjack?counting=1` retains a shoe across rounds and cuts at 75%; `/learn/card-counting` explains tags, normalization and limitations. Five tests cover hidden dealer cards, split accounting, shuffle and count arithmetic. Browser: K = -1/-1.0; 4c 3s Kc = +1/+1.1; live next hand retained shoe 1 and 8 exposed cards.
2. Random EV: `/practice/poker/random`, four variants, random cards/price/range, seed replay, 2,400-sample equity before final street, exact final-street range equity, uncertainty-aware grading. Twelve engine tests. Browser verified all four variants, exact and sampled feedback; Stud mobile shows all seven cards. Six-seat context: four folded opponents, one remaining assumed range.
3. GTO: `/practice/gto`, heads-up Hold’em push/fold only, 2–20 BB options, 169 hands, SB/BB frequencies, exact card-removal dealing probabilities, sampled input equities with attribution, numerical best-response audit. Seven solver tests. Browser 10 BB: 58.5% SB, 37.3% BB, gap 0.00003 BB, 500 iterations; production-build worker rendered all 169 cells. Scope and input uncertainty disclosed.
4. Six-max table: `/practice/poker`, full Hold’em against Atlas (tight aggressive), Nova (loose aggressive), Moss (calling station), Iris (tight passive), Blaze (maniac). Blinds 1/2, 200-chip starting stacks, rotating button, calls/checks/raises/folds/all-ins, reopening, multiway runouts, side pots, odd chips and uncalled returns. Bots receive only own cards and public state. Thirteen tests cover rules, 50 consecutive simulated hands, chip conservation, hidden-information isolation and distinct profile decisions. Browser completed a hand through all four streets and showdown; next hand retained opponent stacks, reloaded empty hero and rotated dealer. Mobile 390 px reviewed.
5. Lobby/navigation and lessons integrated. Guided examples remain at `/practice/poker/guided`.

## Validation and release gate

- PASS: 76 tests (34 math + 42 web), workspace typecheck, diff whitespace review. Project lint is TypeScript, not a separate ESLint suite. Coverage percentage not measured.
- PASS: fresh production build after six-max addition. Final PR head `a00710d860c7eb2afb69e0205d4363770d8bbda3`: GitHub CI run `36622503572` SUCCESS; Vercel preview `dpl_FVk5Fm9gboP9rXAW1kRVmGv1dR5L` READY. A CSS compatibility warning was corrected to flex-end before the final commit.
- PASS: PR #3 merged with an expected-head check; remote main verified at the merge SHA above. Production deployment `dpl_HmQ79KyNDwg94dvy6odzeKUr3zkK` reports READY, target production, matching merge SHA, and alias `pokerlingo-wheat.vercel.app` without alias errors.
- PASS: final public-browser checks below and screenshots saved in this chat's `outputs`; active implementation goal completed.
- No auth/database changes or migrations in this release. Practice only, no payments or wagers. Bot strategies are heuristics, not full-game GTO.

## Resume procedure

Read this checkpoint, inspect git status and fetch main before starting a new module. PR #3 is already merged; do not recreate or repeat its release work. Reuse the existing checkout. Local servers have been stopped; no server is required merely to read the checkpoint. Stop only this checkout's server before rebuilding `.next`. Poll an existing build handle if running rather than restarting on timeout. Open a fresh browser tab if the previous session's tab is missing. Use Vercel project `prj_8eilfnM1JHo0sCJVaLEo9KQdgg1t`, team `team_aayAeSDHmNCCuysz1RoENBUG`; production https://pokerlingo-wheat.vercel.app. Do not put temporary preview access tokens into files.

For the next user-requested feature: implement one small module, run the relevant checks, commit, update this Markdown checkpoint, then proceed to the next module. Preserve scope distinctions: the live bot table is six-max Hold'em; the four variants are EV exercises; GTO solves restricted heads-up push/fold. Do not describe it as a full six-max GTO solver.

## Final public verification

- `/practice/poker`: all six seats and five bot styles rendered; cards dealt and player actions enabled. Desktop/mobile full-hand checks already passed locally; latest preview settled a multiway all-in pot of 601 chips. Public screenshot: `outputs/pokerlingo-six-max-public.jpg` in the chat workspace.
- `/practice/poker/random`: public Hold'em turn spot generated cards, opponent range and price, then graded Fold from calculated equity 5.29%, call 30 BB into a 33 BB pot, call EV -26.67 BB. 2,400 samples; displayed sampling margin about ±0.56 BB. Local checks cover all four variants and exact/sampled modes; latest preview also verified exact Omaha feedback.
- `/practice/gto`: production worker rendered 169 cells and reached the numerical target.
- `/practice/counting`: exposed Ts, running -1, true -1.0; both answers graded correct on production.
- `/practice/blackjack?counting=1`: 3 exposed cards during play, 4 after revealing the dealer hole card, 7 after the next deal; shoe 1 retained across rounds.
- `/learn/poker-variants` and `/learn/card-counting`: formulas, worked examples, rule/model explanations and source links loaded on production. `/practice/poker/guided` shows 9 curated exercises. `/math` poker and blackjack panels loaded with model explanations.
- Vercel server-runtime scan across new practice routes reported no errors in the checked one-hour window. This is separate from browser interaction evidence; no claim of live-auth validation.

## Checkpoint commits

- 7686d32 counting; 9adaf96 variant engine; 3efead9 solver/data; e87c364 advanced UI (old head passed CI and preview).
- `b950dbf` six-max engine/tests; `a00710d` six-seat UI/docs. Merge `4d8bbfa` publishes all modules on main.

## Primary references

- https://wizardofodds.com/games/blackjack/card-counting/high-low/
- https://www.pokerstars.com/poker/games/omaha/
- https://www.pokerstars.com/poker/games/six-plus/ (flush above full house, straight above trips, A6789)
- https://www.pokerstars.com/poker/games/stud/
- https://www.pokertda.com/view-poker-tda-rules/ (full raise and cumulative short-all-in reopening)
- https://github.com/Julian-cloud-max/holdemmath-data (CC BY 4.0; pinned revision and license in packages/math/data)
- https://proceedings.neurips.cc/paper/2007/file/08d98638c6fcd194a4b1e6992063e944-Paper.pdf

## Learning Daily remediation (2026-10-03)

Learning Daily is an additive learning pipeline. Deploy the Drizzle migration before application code that references the new revision tables; seed only approved fixtures. Production Vercel builds must not execute migrations. For rollback, deploy a forward-compatible fix and preserve learner records.

The learner API is authenticated and Zod-validated. Scenario GETs expose prompt-only revisions; solution data is returned only after submission. Standard attempts are idempotent by learner/submission ID and transactionally update mastery, quests and XP. Daily puzzle state uses game-scoped canonical UTC periods and a single first-attempt score. CI uses disposable PostgreSQL to validate migration and integration behavior.