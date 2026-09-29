# Advanced training — continuation pipeline

User objective: blackjack card-counting practice and instruction; random poker practice graded by computed EV; a genuine GTO table; Hold’em, Omaha, Short Deck and Seven-card Stud. User confirmed all four variants and delegated the choice of a reasonable GTO model.

Branch: `codex/pokerlingo-advanced-training`, based on production merge `ff191e8`. Worktree is the existing `work/pokerlingo` checkout in this chat. Preserve the original checkout at D:\Pokerlingo. Earlier redesign is live at https://pokerlingo-wheat.vercel.app.

## Checkpoints

1. IMPLEMENTED; final production/mobile QA pending — Hi-Lo flash drills, true-count quizzes, persistent-shoe blackjack table, instructions. Verify count tags, hidden-card exclusion, split-card accounting, shoe reset, true-count normalization and browser interaction.
2. TODO — Variant evaluators and randomized EV exercises. Cards/board/price/opponent distribution generated at runtime; grade from evaluator, not a stored answer. Handle ties, blockers, equity uncertainty and legal hand construction. Four variants with rules and practice.
3. TODO — Heads-up push/fold equilibrium solver and 169-hand table. Explicit stack, blinds, no rake, allowed actions, payoff-model accuracy and exploitability/convergence. No full-tree GTO claims. Independent equilibrium tests.
4. TODO — Integrate navigation/library/math, test end to end and responsive, deployment preview, then production consistent with user's existing publish workflow. Update this file and the copy in outputs at every checkpoint.

## Validation gate

Meaningful engine tests, full workspace typecheck, production build, browser UI checks for each requirement, CI and deployed smoke checks. Completion is not proven by tests of only a subset. Keep goal active until all four checkpoints are implemented and verified.

## Sources and assumptions

- Hi-Lo: https://wizardofodds.com/games/blackjack/card-counting/high-low/ (tags 2–6 +1, 7–9 zero, T–A −1; running count / remaining decks).
- Omaha: https://www.pokerstars.com/poker/games/omaha/ (exactly two hole cards and three board cards).
- Need verify Short Deck and Stud rule conventions and solver references before implementation.

Checkpoint 1: counting engine, flash page, live-shoe mode and guide implemented. Tests PASS 44 total (5 new counting tests); workspace typecheck PASS. Browser verified single K count −1, true −1.0, positive live count +2/+0.3 and next hand retains shoe 1 with 8 exposed cards. Final mobile/build pending. Next: four variant evaluators and randomized EV exercises. Dev server session 79694 at 127.0.0.1:3100; browser tab 6.
