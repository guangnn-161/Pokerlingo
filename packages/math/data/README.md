# Preflop equity input

`preflop-equity.json` is the HoldemMath preflop matchup dataset, downloaded from https://github.com/Julian-cloud-max/holdemmath-data at commit `7c72b1261f08c63cf8366120dc531631935c21cd` on 2026-09-29. Attribution: **HoldemMath — https://holdemmath.com/**. Data license: CC BY 4.0 (see LICENSE-DATA and https://creativecommons.org/licenses/by/4.0/).

169 hand classes; 14,365 unordered pairs; upstream reports 20,000 Monte Carlo runouts per pair. Integer permille values are normalized by their row sum. Equal-class equity is set to 0.5 and opposite directions are complementary. These transformations enforce the symmetry of the zero-sum game; sampling error remains. A single equity estimate has a worst-case standard error about 0.35 percentage points, excluding rounding. This is not a simultaneous guarantee over the entire matrix.

Only the equity data is reused. Pokerlingo computes exact class-pair dealing probabilities with card removal, then solves the two-player push/fold game itself. The displayed best-response gap measures convergence **within the sampled payoff model**, not error against exact full NLHE. No limps, non-all-in raises, postflop play, rake, antes or ICM are modeled. Stack includes posted blinds (0.5/1 BB). SB folding yields −0.5 BB, BB folding to a shove yields +1 BB to SB, a called shove yields S×(2q−1) BB to SB.

Algorithm background: Zinkevich et al., *Regret Minimization in Games with Incomplete Information*, https://proceedings.neurips.cc/paper/2007/file/08d98638c6fcd194a4b1e6992063e944-Paper.pdf. Our implementation uses regret matching+ and linear averaging; it checks the actual best-response gap rather than inferring convergence from iteration count.

Independent qualitative reference: https://www.holdemresources.net/hune. No charts from that site are copied.
