# B/C/D handoff

## What changed
- **B — Math:** `packages/math` là package thuần v1 với parser/evaluator/equity NLHE heads-up, range/blocker, poker EV/rake, Blackjack infinite-deck EV, casino payout/roulette/sportsbook math và fixed-seed risk simulation. API calculator: `POST /api/math/calculate`.
- **C — Learning:** API fixture cho scenario, attempt scoring và dashboard không cần database.
- **D — Product UI:** `/demo` is an English, drill-first preflop trainer: hand/table → decision → immediate feedback → replay → range/pot-odds study → knowledge check. It includes a six-max table, Hero cards, villain card backs, a training path and fixture XP/quest/leaderboard.

## Contract
- DTO demo nằm ở `@pokerlingo/contracts/demo`.
- API: `GET /api/demo/scenario`, `POST /api/demo/attempt`, `GET /api/demo/dashboard`.
- Calculator B: `POST /api/math/calculate`; mọi kết quả có engine version, ruleset, method, assumptions và warnings.
- Tất cả response demo có ý nghĩa educational; không dùng để hỗ trợ chơi theo thời gian thực.

Xem [math-engine.md](math-engine.md) để biết request shape, phép tính hỗ trợ, assumptions và giới hạn hiện tại.

## Run locally
```bash
pnpm install
pnpm dev
# mở http://localhost:3000/demo
```

## Known limits
- Không lưu attempt/XP/friendship vào Postgres.
- Poker hiện chỉ hỗ trợ Hold'em heads-up; không có multiway equity, solver, finite-shoe Blackjack hoặc resplit Blackjack.
- Scenario/attempt/dashboard are still fixtures with no database persistence; quick-check answers, correct streak and replay state live only in the browser.
- Additional drills, multi-street boards, a range editor, timed mode and spaced-review scheduling are product directions only; there is no scenario engine or persistence for them yet.
