# Advanced training — continuation pipeline

User objective: blackjack card-counting practice and instruction; random poker practice graded by computed EV; a genuine GTO table; Hold’em, Omaha, Short Deck and Seven-card Stud. User confirmed all four variants and delegated the choice of a reasonable GTO model.

Branch: `codex/pokerlingo-advanced-training`, based on production merge `ff191e8`. Worktree is the existing `work/pokerlingo` checkout in this chat. Preserve the original checkout at D:\Pokerlingo. Earlier redesign is live at https://pokerlingo-wheat.vercel.app.

## Checkpoints

1. VERIFIED LOCALLY — Hi-Lo flash drills, true-count quizzes, persistent-shoe blackjack table, instructions. Five engine tests cover tags, hidden cards, split accounting, shuffle and normalization. Browser verified single-card and three-card quizzes, auto deal/pause, persistent live shoe and mobile layout.
2. IMPLEMENTED — Four variant evaluators and randomized EV exercises. Runtime cards/board/price/range, deterministic seed replay, exact complete-board results and 2,400-sample earlier-street equity. Close decisions are excluded from accuracy. Browser checked Hold’em river and Omaha/Short Deck/Stud earlier-street EV feedback. 12 new engine tests pass.
3. IMPLEMENTED — Heads-up push/fold solver, exact blocker weights and 169-hand table. Regret matching with independent best-response gap audit; 7 solver tests pass. Browser 10 BB result: 58.5% SB shove coverage, 37.3% BB call coverage, 0.00003 BB gap after 500 iterations. Sampled input equity uncertainty is disclosed separately; no full-game GTO claim.
4. READY FOR PREVIEW — Navigation, lobby and three lessons integrated. All 63 tests, workspace typecheck, project lint command and production build pass (lint currently runs TypeScript). GTO desktop/mobile and counting/Stud mobile reviewed with no page overflow; GTO scrolls internally. Production build generates all new routes. Next: preview, CI and public deployment. Coverage percentage not measured; no new database/auth changes.

## Validation gate

Meaningful engine tests, full workspace typecheck, production build, browser UI checks for each requirement, CI and deployed smoke checks. Completion is not proven by tests of only a subset. Keep goal active until all four checkpoints are implemented and verified.

## Sources and assumptions

- Hi-Lo: https://wizardofodds.com/games/blackjack/card-counting/high-low/ (tags 2–6 +1, 7–9 zero, T–A −1; running count / remaining decks).
- Omaha: https://www.pokerstars.com/poker/games/omaha/ (exactly two hole cards and three board cards).
- Short Deck: https://www.pokerstars.com/poker/games/six-plus/ — flush above full house, straight above trips, A6789 low straight.
- Stud: https://www.pokerstars.com/poker/games/stud/ — individual seven-card hands, best five, no community board.
- Solver reference: https://proceedings.neurips.cc/paper/2007/file/08d98638c6fcd194a4b1e6992063e944-Paper.pdf
- Sampled equity inputs: https://github.com/Julian-cloud-max/holdemmath-data (CC BY 4.0; attribution/license and pinned commit in packages/math/data/README.md). Only equities reused; solver implemented here.

Engine checkpoints: counting 7686d32, four variants 9adaf96, solver 3efead9. Browser verified K count −1/−1.0; three-card 4c 3s Kc gives +1/+1.1; live count +2/+0.3 and next hand retains shoe 1 with 8 exposed cards. Dev server stopped before successful production build. Next: commit UI/docs, push PR, wait for CI and preview verification, merge and verify production. Preserve progress in this file and the user-facing copy under outputs. Do not modify the dirty original D:\Pokerlingo checkout.
