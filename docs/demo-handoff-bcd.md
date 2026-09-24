# B/C/D handoff

## What changed
- **B — Math:** `packages/math` là package thuần v1 với parser/evaluator/equity NLHE heads-up, range/blocker, poker EV/rake, Blackjack infinite-deck EV, casino payout/roulette/sportsbook math và fixed-seed risk simulation. API calculator: `POST /api/math/calculate`.
- **C — Learning:** API fixture cho scenario, attempt scoring và dashboard không cần database.
- **D — Product UI:** `/demo` là vertical slice tiếng Việt có bàn poker 6-max: vị trí, stack, pot, hole cards của Hero và bài úp đối thủ, sau đó answer → result → XP/quest/leaderboard/friends.

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
- Scenario/attempt/dashboard vẫn là fixture demo và chưa được persistence vào database.
- UI dùng inline styles có chủ đích để D thay bằng design system.
