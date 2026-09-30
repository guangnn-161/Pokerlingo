# Pokerlingo advanced training — continuation pipeline

Updated 2026-09-30. User scope: Hi-Lo counting and guide; generated poker decisions graded from calculated EV; GTO tables; Hold’em, Omaha, Short Deck and Stud; a six-player table with five distinct bot styles; publish to main and preserve small Markdown checkpoints.

## Current checkpoint

Implementation complete; final build, CI, preview and public deployment checks remain. Branch `codex/pokerlingo-advanced-training`. PR https://github.com/guangnn-161/Pokerlingo/pull/3. Use this chat's `work/pokerlingo` checkout; do not alter the dirty original D:\Pokerlingo.

## Completed modules and evidence

1. Hi-Lo: `/practice/counting` flash drills (1/2/6 decks, batch 1/3, auto/pause, hide/review), RC/TC quizzes; `/practice/blackjack?counting=1` retains a shoe across rounds and cuts at 75%; `/learn/card-counting` explains tags, normalization and limitations. Five tests cover hidden dealer cards, split accounting, shuffle and count arithmetic. Browser: K = -1/-1.0; 4c 3s Kc = +1/+1.1; live next hand retained shoe 1 and 8 exposed cards.
2. Random EV: `/practice/poker/random`, four variants, random cards/price/range, seed replay, 2,400-sample equity before final street, exact final-street range equity, uncertainty-aware grading. Twelve engine tests. Browser verified all four variants, exact and sampled feedback; Stud mobile shows all seven cards. Six-seat context: four folded opponents, one remaining assumed range.
3. GTO: `/practice/gto`, heads-up Hold’em push/fold only, 2–20 BB options, 169 hands, SB/BB frequencies, exact card-removal dealing probabilities, sampled input equities with attribution, numerical best-response audit. Seven solver tests. Browser 10 BB: 58.5% SB, 37.3% BB, gap 0.00003 BB, 500 iterations; production-build worker rendered all 169 cells. Scope and input uncertainty disclosed.
4. Six-max table: `/practice/poker`, full Hold’em against Atlas (tight aggressive), Nova (loose aggressive), Moss (calling station), Iris (tight passive), Blaze (maniac). Blinds 1/2, 200-chip starting stacks, rotating button, calls/checks/raises/folds/all-ins, reopening, multiway runouts, side pots, odd chips and uncalled returns. Bots receive only own cards and public state. Thirteen tests cover rules, 50 consecutive simulated hands, chip conservation, hidden-information isolation and distinct profile decisions. Browser completed a hand through all four streets and showdown; next hand retained opponent stacks, reloaded empty hero and rotated dealer. Mobile 390 px reviewed.
5. Lobby/navigation and lessons integrated. Guided examples remain at `/practice/poker/guided`.

## Validation and release gate

- PASS: 76 tests (34 math + 42 web), workspace typecheck, diff whitespace review. Project lint is TypeScript, not a separate ESLint suite. Coverage percentage not measured.
- PASS: fresh production build after six-max addition. A CSS compatibility warning was corrected to flex-end; CI will rebuild the final revision.
- TODO: push current work, update PR description, verify latest CI and Vercel preview on the exact new head; merge without bypassing failures; verify production alias and features in browser.
- TODO: save screenshots and final release evidence to this chat's `outputs`, update the user-facing pipeline copy and mark the active goal complete only after every requirement is verified.
- No auth/database changes or migrations in this release. Practice only, no payments or wagers. Bot strategies are heuristics, not full-game GTO.

## Resume procedure

Inspect git status and PR #3 first. Reuse existing checkout. Stop only this checkout's server before rebuilding `.next`. The development server was stopped for final build. Poll the existing build handle if running rather than restarting on timeout. Open a fresh browser tab if the previous session's tab is missing. Use Vercel project `prj_8eilfnM1JHo0sCJVaLEo9KQdgg1t`, team `team_aayAeSDHmNCCuysz1RoENBUG`; production https://pokerlingo-wheat.vercel.app. Do not put temporary preview access tokens into files.

## Checkpoint commits

- 7686d32 counting; 9adaf96 variant engine; 3efead9 solver/data; e87c364 advanced UI (old head passed CI and preview).
- Six-max engine/tests and UI/docs are separate commits following e87c364. Check git log for their final IDs.

## Primary references

- https://wizardofodds.com/games/blackjack/card-counting/high-low/
- https://www.pokerstars.com/poker/games/omaha/
- https://www.pokerstars.com/poker/games/six-plus/ (flush above full house, straight above trips, A6789)
- https://www.pokerstars.com/poker/games/stud/
- https://www.pokertda.com/view-poker-tda-rules/ (full raise and cumulative short-all-in reopening)
- https://github.com/Julian-cloud-max/holdemmath-data (CC BY 4.0; pinned revision and license in packages/math/data)
- https://proceedings.neurips.cc/paper/2007/file/08d98638c6fcd194a4b1e6992063e944-Paper.pdf
