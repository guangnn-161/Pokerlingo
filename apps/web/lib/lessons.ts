export type Lesson = {
  id: string;
  game: "Poker" | "Blackjack" | "Foundations";
  title: string;
  subtitle: string;
  minutes: number;
  formula: string;
  sections: { title: string; paragraphs: string[] }[];
  example: { title: string; text: string };
  quiz: { question: string; options: string[]; correct: number; why: string };
  sources: { label: string; url: string }[];
};
const probability = {
  label: "MIT OpenCourseWare · Probability and Statistics",
  url: "https://ocw.mit.edu/courses/18-05-introduction-to-probability-and-statistics-spring-2022/",
};
const bj = {
  label: "Wizard of Odds · Basic strategy calculator",
  url: "https://wizardofodds.com/games/blackjack/strategy/calculator/",
};
const rules = {
  label: "Wizard of Odds · Rule variations",
  url: "https://wizardofodds.com/games/blackjack/rule-variations/",
};
export const lessons: Lesson[] = [
  {
    id: "push-fold-gto",
    game: "Poker",
    title: "Read a GTO table without losing the context",
    subtitle:
      "A heads-up equilibrium is a strategy for a precisely defined game.",
    minutes: 7,
    formula: "Nash gap = best-response gain for SB + best-response gain for BB",
    sections: [
      {
        title: "Start with the action tree",
        paragraphs: [
          "In our heads-up push/fold game, the small blind chooses all-in or fold. Facing all-in, the big blind chooses call or fold. There are no limps, smaller raises or postflop decisions. The blinds are 0.5 and 1 BB, no ante and no rake; effective stack includes those posted blinds.",
          "The table is a solution to that restricted game. The 20 BB setting does not claim that open-shoving is the best first action in unrestricted poker: a fuller game offers other actions.",
        ],
      },
      {
        title: "Read frequencies and EV separately",
        paragraphs: [
          "The 13×13 table groups 1,326 hands into 169 classes. Pairs have six physical combinations, suited classes four, and offsuit classes twelve. A 50% frequency says to choose the action half the time across instances, not that your equity is 50%.",
          "EV in the selected-hand panel is relative to folding at this decision. It compares the aggressive action against the calculated opposing range, accounting for blockers. Mixed strategies can arise when actions have essentially equal value. Avoid treating rounded percentages as exact prescriptions.",
        ],
      },
      {
        title: "How this solver is checked",
        paragraphs: [
          "Both players repeatedly update their strategies using action regrets. The app averages the strategies and independently asks how much each player could gain by choosing a best response against the other player’s fixed strategy. The sum of those gains is the Nash gap.",
          "A small gap supports convergence within the payoff model. Our payoff matrix is sampled, not an exhaustive enumeration of every runout. Numerical convergence and input accuracy are separate: more solver iterations cannot repair sampling error in the equities.",
        ],
      },
      {
        title: "Use it as a learning reference",
        paragraphs: [
          "Choose a stack, calculate, then compare the small-blind and big-blind tables. Click strong and weak hands and look at EV against folding. Notice how posting a big blind changes the price of a call. Compare several stacks instead of memorizing one chart as universal.",
          "Random postflop drills use explicit twelve-hand teaching ranges and their own EV calculation. They do not use this preflop equilibrium as an answer key. A model can be internally correct and still be the wrong model for an actual opponent or betting structure.",
        ],
      },
    ],
    example: {
      title: "A 5 BB shove facing the big blind",
      text: "Both players started with 5 BB. The big blind already posted 1 BB, so calling costs 4 more. With no ante or rake the final pot is 10 BB. If equity against the shove range is 45%, call EV relative to folding is 0.45 × 10 − 4 = +0.5 BB.",
    },
    quiz: {
      question:
        "The table gives A5s a 40% shove frequency. What does that percentage mean?",
      options: [
        "A5s wins 40% of showdowns",
        "Shove in about 40% of those situations under this model",
        "40% of the pot belongs to A5s",
      ],
      correct: 1,
      why: "It is an action frequency. Showdown equity and EV are different quantities.",
    },
    sources: [
      {
        label: "HoldemResources · Heads-up push/fold model",
        url: "https://www.holdemresources.net/hune",
      },
      {
        label: "Zinkevich et al. · Counterfactual regret minimization",
        url: "https://proceedings.neurips.cc/paper/2007/file/08d98638c6fcd194a4b1e6992063e944-Paper.pdf",
      },
      {
        label: "HoldemMath · Equity dataset (CC BY 4.0)",
        url: "https://github.com/Julian-cloud-max/holdemmath-data",
      },
    ],
  },
  {
    id: "poker-variants",
    game: "Poker",
    title: "Four games, different ways to make a hand",
    subtitle:
      "Hold’em, Omaha, Short Deck and Seven-card Stud in the random trainer.",
    minutes: 9,
    formula: "Call EV = equity × final pot − additional call",
    sections: [
      {
        title: "Texas Hold’em",
        paragraphs: [
          "You receive two private cards and share a five-card board. Make the best five-card hand from all seven; you may use both, one or neither hole card. A strong board can cause a split pot even when the private cards look different.",
          "Our random drills cover flop, turn and river decisions facing an all-in. The twelve displayed opponent combinations form an explicit equally weighted range. Future board cards are sampled without replacement.",
        ],
      },
      {
        title: "Omaha",
        paragraphs: [
          "Four private cards give you more combinations, but you must use exactly two of them and exactly three board cards. Four hearts in your hand do not make a flush with just one heart on the board. A royal-flush board is not automatically your royal flush.",
          "The evaluator checks every legal two-plus-three combination. The drill begins after an opponent’s final all-in; it does not simulate a pot-limit raise tree or label its ranges as optimal PLO strategy.",
        ],
      },
      {
        title: "Short Deck (6+)",
        paragraphs: [
          "Remove ranks 2–5, leaving 36 cards. This trainer follows the PokerStars 6+ ranking convention: flush beats full house, straight beats three of a kind, and A–6–7–8–9 is the lowest straight. Other rooms can use different rankings.",
          "The smaller deck changes runout probabilities. The calculator draws only from the 36-card deck and uses these rankings for both players; it does not reuse standard Hold’em equity figures.",
        ],
      },
      {
        title: "Seven-card Stud",
        paragraphs: [
          "Each player builds an individual seven-card hand; there is no shared board. In the standard deal, the first two cards and the seventh card are private, with four upcards in between. Your best five of seven determine showdown strength.",
          "Our fifth-, sixth- and seventh-street exercises show the opponent’s known upcards. Every combination in the opponent range contains those same upcards. Each player receives their own remaining cards without replacement. The scenario fixes the opponent’s final all-in at two units, so there is no later betting.",
        ],
      },
      {
        title: "Use the model you can actually see",
        paragraphs: [
          "Each new spot draws new cards, a price and an opponent distribution. The engine then computes equity and compares call EV with folding. It never chooses a preferred answer before generating the hand. A wide range and a made-hand-heavy range can make the same hand play differently.",
          "River and seventh-street answers enumerate the displayed range exactly. Earlier streets use seeded Monte Carlo. When the EV difference is smaller than sampling uncertainty, the trainer marks the spot too close to grade and excludes it from accuracy. These ranges are teaching assumptions, not predictions about a particular player.",
        ],
      },
    ],
    example: {
      title: "The same price, different equity",
      text: "A pot of 24 units includes the opponent’s bet; calling costs 8. At 20% equity, call EV is 0.20 × 32 − 8 = −1.6. At 35% equity, it is +3.2. Which equity applies depends on the actual cards, the variant’s rules and the opponent range.",
    },
    quiz: {
      question:
        "In Omaha, the board contains five spades and you hold only one spade. Can you use the board’s flush?",
      options: [
        "Yes, any five cards count",
        "No, you must use exactly two hole cards",
        "Only if your spade is an ace",
      ],
      correct: 1,
      why: "Exactly two hole cards are required. With only one spade in your hand you cannot make a spade flush.",
    },
    sources: [
      {
        label: "PokerStars · Omaha rules",
        url: "https://www.pokerstars.com/poker/games/omaha/",
      },
      {
        label: "PokerStars · 6+ rules",
        url: "https://www.pokerstars.com/poker/games/six-plus/",
      },
      {
        label: "PokerStars · Stud rules",
        url: "https://www.pokerstars.com/poker/games/stud/",
      },
    ],
  },
  {
    id: "card-counting",
    game: "Blackjack",
    title: "Track the shoe, not a lucky streak",
    subtitle: "Learn Hi-Lo with running-count and true-count exercises.",
    minutes: 8,
    formula: "True count = running count ÷ unseen decks",
    sections: [
      {
        title: "Recognize three groups",
        paragraphs: [
          "Hi-Lo assigns +1 to ranks 2 through 6, zero to 7 through 9, and −1 to tens, face cards and aces. Start at zero after a shuffle. Add each exposed card once, including other hands and the dealer’s cards when revealed.",
          "A complete deck has twenty positive tags and twenty negative tags, so its total is zero. Cancel a low card against a high card mentally. Never count a face-down card as if you knew its rank.",
        ],
      },
      {
        title: "Normalize the count",
        paragraphs: [
          "A running count describes the exposed cards. A positive count means low cards have been removed disproportionately. Divide by decks still unseen to express concentration. Running +6 with 3 decks unseen gives true +2; the same running +6 with 1.5 decks unseen gives +4.",
          "This trainer uses exact unseen-card totals divided by 52, including a hidden dealer hole card, and grades true count to one decimal. Real-table deck estimation is a separate skill. Integer conversion methods differ across index systems: do not mix rounding conventions.",
        ],
      },
      {
        title: "A practice routine",
        paragraphs: [
          "Begin with single-card batches at a slow pace. Pause after several cards, hide the current cards, enter both counts and check the explanation. Move to three-card batches after you stop making tag errors. Review the exposed-card history to find the first missed sign.",
          "Next use Count a live shoe at the blackjack table. The shoe survives between rounds and shuffles at the 75% cut card. Keep tracking while making normal play decisions. A split moves the original cards; it does not expose those cards a second time. The table reveals the dealer hand when a round ends.",
        ],
      },
      {
        title: "Separate counting from decisions",
        paragraphs: [
          "The count summarizes composition, not the next card. It neither guarantees a win nor specifies an exact advantage by itself. Rules, penetration, decisions and bet sizes all affect return and variance. This exercise uses fixed practice bets and grades count arithmetic separately from basic strategy.",
          "Our basic-strategy coach does not apply count-based index deviations. A fresh independent shuffle destroys information from the previous shoe. Switch to live-shoe mode when practicing retention across hands; the ordinary table deliberately starts a fresh shoe each round.",
        ],
      },
    ],
    example: {
      title: "Six exposed cards",
      text: "Start at 0. The sequence 4♠, K♦, 7♣, 2♥, A♠, 6♦ gives +1, 0, 0, +1, 0, +1. Running count is +1. If 2.5 decks remain unseen, true count is +0.4. A card already on the table never changes the count simply because you look at it again.",
    },
    quiz: {
      question:
        "Running count −6 with 2.5 unseen decks: what is the true count to one decimal?",
      options: ["−2.4", "−15.0", "+2.4"],
      correct: 0,
      why: "Divide −6 by 2.5. Keep the negative sign; do not multiply by the remaining decks.",
    },
    sources: [
      {
        label: "Wizard of Odds · Hi-Lo method",
        url: "https://wizardofodds.com/games/blackjack/card-counting/high-low/",
      },
    ],
  },
  {
    id: "pot-odds",
    game: "Poker",
    title: "What is a call really worth?",
    subtitle: "Translate a price in chips into the equity you need.",
    minutes: 5,
    formula: "Required equity = call / (pot before call + call)",
    sections: [
      {
        title: "Start at the decision, not the start of the hand",
        paragraphs: [
          "Let P be the pot already available, including your opponent’s latest bet. Let C be the additional amount you must call. A call puts P + C in the middle. Your earlier contributions are sunk costs: they belong to the pot and do not make a losing call profitable.",
          "If you always reach showdown after calling, your expected net gain is qP − (1 − q)C, where q is your equity. Set that expression to zero and solve: q = C / (P + C). Folding has zero additional EV at this decision point.",
        ],
      },
      {
        title: "Know when the formula is enough",
        paragraphs: [
          "This comparison directly fits a river call or an all-in with no future betting. Before the river, a non-all-in call may face more bets. Raw equity is not the same as equity you can actually realize.",
          "Implied odds add potential future winnings; reverse implied odds add potential future losses. Rake reduces the pot you can win. Do not hide these effects inside a falsely precise percentage.",
        ],
      },
    ],
    example: {
      title: "A 25 BB bet into a 50 BB pot",
      text: "The pot is now 75 BB. Calling costs 25 BB, making the final pot 100 BB. You need 25%. With 30% equity and no rake, call EV is 0.30 × 100 − 25 = +5 BB.",
    },
    quiz: {
      question:
        "The pot is 30 BB including the opponent’s bet. You must call 10 BB. What equity breaks even?",
      options: ["20%", "25%", "33.3%"],
      correct: 1,
      why: "10 / (30 + 10) = 25%. Do not divide the call by the current pot alone.",
    },
    sources: [probability],
  },
  {
    id: "equity-outs",
    game: "Poker",
    title: "From outs to equity",
    subtitle: "Count the cards that help—and the assumptions you are making.",
    minutes: 6,
    formula: "P(hit by river) = 1 − ((47 − outs)/47) × ((46 − outs)/46)",
    sections: [
      {
        title: "Count clean outs",
        paragraphs: [
          "An out is an unseen card that improves your hand to a winner. With two hole cards and three flop cards visible, 47 cards are unseen. A four-card flush draw has nine remaining cards of that suit. But a card that makes your flush can still lose to a better flush or a later full house.",
          "With one card to come on the turn, eight clean outs give 8/46 = 17.39%. With nine outs on the flop, the complement of missing twice is 1 − (38/47)(37/46) = 34.97%. This counts hitting at least once, not automatically winning at showdown.",
        ],
      },
      {
        title: "Equity includes the whole range",
        paragraphs: [
          "Heads-up equity is P(win) + ½P(tie). It evaluates all ways your hand can win, lose or tie against an opponent’s hand or weighted range. The opponent’s known cards, if exposed, also reduce the unseen-card pool.",
          "The rule of four on the flop and two on the turn are shortcuts, not exact formulas. Two-card odds are relevant only if both cards are available for the price you are evaluating. Use the Math Lab for a hand-vs-hand estimate with explicit board cards.",
        ],
      },
    ],
    example: {
      title: "A draw that misses more often than it hits",
      text: "At 34.97% equity, a 5 BB call into a 15 BB pot returns about +1.99 BB under the clean-outs, no-rake all-in model. Winning most hands is not required for a profitable call.",
    },
    quiz: {
      question:
        "With nine clean outs and only the river to come, your hit probability is approximately…",
      options: ["19.6%", "35.0%", "36.0%"],
      correct: 0,
      why: "Nine of 46 unseen cards help: 9/46 ≈ 19.6%. The two-card chance does not apply on the turn.",
    },
    sources: [probability],
  },
  {
    id: "ranges-blockers",
    game: "Poker",
    title: "Think in combinations",
    subtitle:
      "A range is a collection of possible hands, not one guessed hand.",
    minutes: 6,
    formula: "Pair: C(4,2) = 6 · Suited: 4 · Offsuit: 12",
    sections: [
      {
        title: "Count what can actually be there",
        paragraphs: [
          "There are 1,326 unordered two-card combinations in a 52-card deck. We often group them into 169 starting-hand classes: 13 pairs, 78 suited classes and 78 offsuit classes. These classes are not equally frequent.",
          "A pocket pair has six combinations. A specific suited non-pair hand such as AKs has four; AKo has twelve. If you hold an ace, only three aces remain, so the opponent has three possible AA combinations instead of six.",
        ],
      },
      {
        title: "Weight the range with the action",
        paragraphs: [
          "Position, stack depth and the betting sequence inform which combinations belong in an opponent’s range. Some hands may take an action only part of the time. Weight each surviving combination, then normalize after removing blockers.",
          "A blocker is useful only in relation to the range it removes. Blocking value hands can help a bluff; blocking hands that would fold can hurt it. One attractive blocker does not establish a bluff by itself. The opening exercises use a stated teaching policy rather than solver frequencies.",
        ],
      },
    ],
    example: {
      title: "Holding A♠ against a possible AA range",
      text: "The six initial AA combinations shrink to A♥A♦, A♥A♣ and A♦A♣. Card removal changes the available combinations; it does not prove that the opponent cannot have aces.",
    },
    quiz: {
      question:
        "How many combinations does a pocket pair have before any blockers are known?",
      options: ["4", "6", "12"],
      correct: 1,
      why: "Choose two of the four suits: 4 × 3 / 2 = 6.",
    },
    sources: [probability],
  },
  {
    id: "expected-value",
    game: "Foundations",
    title: "Good decisions. Uncertain outcomes.",
    subtitle:
      "Use expected value to evaluate the process, not a single result.",
    minutes: 5,
    formula: "E[X] = Σ pᵢxᵢ",
    sections: [
      {
        title: "Average the net outcomes",
        paragraphs: [
          "Expected value is the probability-weighted average of net gains and losses. If a game wins 2 units with probability 0.4 and loses 1 unit otherwise, its EV is 0.4 × 2 − 0.6 × 1 = +0.2 units. That does not mean any individual play returns 0.2.",
          "Use net profit, not a mix of gross payouts and net losses. A returned stake is not profit. In poker, evaluate new money committed at the decision point. In blackjack, express returns per original stake so doubling and splitting remain comparable.",
        ],
      },
      {
        title: "A useful decision can still lose",
        paragraphs: [
          "A positive-EV poker call can lose this hand; a negative-EV call can win it. Review your estimate of the opponent’s range and the information available when you acted. Do not rewrite that information after seeing the cards.",
          "In blackjack, every legal move in a difficult spot can have negative EV. The best move is the least negative. Basic strategy reduces expected losses under a ruleset; it does not imply an overall player advantage.",
        ],
      },
    ],
    example: {
      title: "Calling with 30% equity",
      text: "With 75 BB available and 25 BB to call, the net outcomes are +75 on a win and −25 on a loss. EV = 0.30 × 75 − 0.70 × 25 = +5 BB. This is the same as 0.30 × 100 − 25.",
    },
    quiz: {
      question:
        "An action wins 3 units 25% of the time and loses 1 unit otherwise. What is its EV?",
      options: ["−0.25 units", "0 units", "+0.75 units"],
      correct: 1,
      why: "0.25 × 3 − 0.75 × 1 = 0. A fair expectation still permits large short-run swings.",
    },
    sources: [probability],
  },
  {
    id: "bluff-math",
    game: "Poker",
    title: "The price of a bluff",
    subtitle:
      "Find the fold frequency a pure bluff needs before adding a story.",
    minutes: 5,
    formula: "Break-even folds = bet / (pot + bet)",
    sections: [
      {
        title: "Two outcomes, one threshold",
        paragraphs: [
          "For a pure bluff with no winning equity when called, let P be the pot, B the bet and f the probability the opponent folds. A fold wins P; a call loses B. The bluff’s EV is fP − (1 − f)B. Set it to zero to find f = B/(P + B).",
          "A half-pot bluff needs more than one-third folds; a pot-sized bluff needs more than half. Larger bets can cause more folds, but that response is an assumption to estimate—not a consequence of the formula.",
        ],
      },
      {
        title: "Distinguish a bluff from a semi-bluff",
        paragraphs: [
          "A semi-bluff can also win when called. Its EV must include that showdown equity, the opponent’s matching contribution and future action. The simple pure-bluff formula leaves those out.",
          "Minimum defense frequency is often written P/(P + B), the complement of the pure-bluff threshold. It is a simplified indifference benchmark, not a command to defend that frequency in every real spot. Ranges, position, future streets and opponent tendencies matter.",
        ],
      },
    ],
    example: {
      title: "Betting 10 into 20",
      text: "At a 40% fold rate and zero equity when called: 0.40 × 20 − 0.60 × 10 = +2 BB. At only 25% folds, the same bluff is worth −2.5 BB.",
    },
    quiz: {
      question:
        "A pot-sized pure bluff with no equity needs the opponent to fold more than…",
      options: ["25%", "33.3%", "50%"],
      correct: 2,
      why: "B = P, so B/(P + B) = 1/2.",
    },
    sources: [probability],
  },
  {
    id: "blackjack-strategy",
    game: "Blackjack",
    title: "Learn the decision, not the outcome",
    subtitle:
      "Hard totals, soft totals and pairs each ask a different question.",
    minutes: 6,
    formula: "Best action = arg maxₐ E[net return | hand, upcard, rules]",
    sections: [
      {
        title: "Read your hand correctly",
        paragraphs: [
          "A soft hand has an ace currently counted as 11. A + 6 is soft 17; add a ten and it becomes hard 17 because the ace must count as 1. A hard hand has no such cushion. Pairs can create a separate splitting decision.",
          "Start with the dealer’s upcard and the rules. In a multi-deck S17 game, hard 12 hits against a dealer 3 but stands against 4. Soft 18 can double against 6 when legal, stand against 8 and hit against 9. The same total alone does not determine the action.",
        ],
      },
      {
        title: "Why the rules must travel with the chart",
        paragraphs: [
          "S17 means the dealer stands on soft 17; H17 means the dealer hits it. Double-after-split and late-surrender rules also change decisions. A chart from a different ruleset can recommend a different move.",
          "Our table deals from six decks, allows at most two split hands and gives split aces one extra card. The coach uses a multi-deck, total-dependent reference. It does not make card-counting or composition-dependent adjustments. The separate EV lab uses an infinite-deck model and may differ near close decisions.",
        ],
      },
    ],
    example: {
      title: "A dealer 6 is not permission to stand on everything",
      text: "With hard 11, doubling adds one equal stake and takes exactly one card. With hard 16, standing avoids extra bust risk. A strategy decision depends on your hand as well as the weak dealer upcard.",
    },
    quiz: {
      question: "You have A + 6, then draw a ten. Your hand is…",
      options: ["Busted at 27", "Hard 17", "Soft 17"],
      correct: 1,
      why: "The ace changes from 11 to 1: 1 + 6 + 10 = 17. There is no ace still counted as 11.",
    },
    sources: [bj],
  },
  {
    id: "house-edge",
    game: "Blackjack",
    title: "Small rules. Real differences.",
    subtitle: "Understand payout, house edge and the cost of repeated play.",
    minutes: 6,
    formula: "Expected loss = total original wagers × house edge",
    sections: [
      {
        title: "Read the payout before the cards",
        paragraphs: [
          "On a 10-unit original bet, a 3:2 natural pays 15 units of profit; 6:5 pays 12. That is a 3-unit difference each time you receive a paying natural. Ordinary winning hands and split 21s pay even money at our table.",
          "Rule changes shift the expectation. There is no one house-edge percentage for all blackjack. Number of decks, soft-17 policy, payouts, splitting, surrender and the player’s decisions all matter. A payout comparison alone does not produce the entire game’s edge.",
        ],
      },
      {
        title: "Use expected loss as an average, not a forecast",
        paragraphs: [
          "House edge measures the house’s expected gain relative to the stated betting basis. If the edge is 0.5% per original wager, 200 rounds at 10 units imply 200 × 10 × 0.005 = 10 units of expected loss. The 0.5% here is an illustration, not a certified edge for our rules.",
          "Changing a bet progression does not remove a negative per-unit expectation. More wagering generally increases expected loss when the edge is positive. A player can finish ahead or far behind the expected amount over a short session.",
        ],
      },
    ],
    example: {
      title: "One natural, two payout rules",
      text: "Both games return the 10-unit stake. The 3:2 game also pays 15 units; the 6:5 game pays 12. Compare the 15 and 12 as net profit, not 25 and 12.",
    },
    quiz: {
      question:
        "At an assumed 1% edge, what is the expected loss on 100 original bets of 10 units?",
      options: ["1 unit", "10 units", "100 units"],
      correct: 1,
      why: "100 × 10 × 0.01 = 10. This is an expectation, not a guaranteed session result.",
    },
    sources: [rules],
  },
  {
    id: "variance-rake",
    game: "Foundations",
    title: "The average is not the journey",
    subtitle: "Variance explains swings. Rake changes the average itself.",
    minutes: 6,
    formula: "Var(X) = E[X²] − E[X]²",
    sections: [
      {
        title: "Measure the spread",
        paragraphs: [
          "Two strategies can have the same expected return and very different variability. Variance measures the average squared deviation from the mean; its square root is standard deviation, expressed in the original units.",
          "For n independent, identically distributed rounds with mean μ and standard deviation σ, the sum has mean nμ and standard deviation √nσ. Poker results are not always independent or identically distributed: player pools, stakes, strategy and fatigue can change.",
        ],
      },
      {
        title: "Separate fees from random swings",
        paragraphs: [
          "Rake is a cost taken from poker pots. If 5% rake is capped at 3 BB, a 100 BB eligible pot pays 3 BB rather than 5 BB. At the same showdown equity, a smaller net pot makes a marginal call less attractive.",
          "Variance can make a losing strategy look successful for a while. Fees can turn a small pre-rake edge negative. Track assumptions and decision quality across many observations; a short winning streak is weak evidence of an edge.",
        ],
      },
    ],
    example: {
      title: "A fair ±1 game",
      text: "Win 1 with probability 1/2 and lose 1 otherwise. The mean is zero, E[X²] is 1 and variance is 1. After 100 independent rounds, expected total is 0 while standard deviation is 10 units.",
    },
    quiz: {
      question:
        "An eligible 100 BB pot has 5% rake capped at 3 BB. How much rake is taken?",
      options: ["3 BB", "5 BB", "8 BB"],
      correct: 0,
      why: "min(100 × 0.05, 3) = 3 BB. The cap limits the fee.",
    },
    sources: [probability],
  },
];
