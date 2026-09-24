# B/C/D demo handoff

## What changed
- **B — Math:** `packages/math` là package thuần, có pot odds/EV, roulette edge, sportsbook overround và basic Blackjack recommendation.
- **C — Learning:** API fixture cho scenario, attempt scoring và dashboard không cần database.
- **D — Product UI:** `/demo` là vertical slice tiếng Việt: answer → result → XP/quest/leaderboard/friends.

## Contract
- DTO demo nằm ở `@pokerlingo/contracts/demo`.
- API: `GET /api/demo/scenario`, `POST /api/demo/attempt`, `GET /api/demo/dashboard`.
- Tất cả response demo có ý nghĩa educational; không dùng để hỗ trợ chơi theo thời gian thực.

## Run locally
```bash
pnpm install
pnpm dev
# mở http://localhost:3000/demo
```

## Known limits
- Không lưu attempt/XP/friendship vào Postgres.
- Math chỉ là demo minh họa; chưa có card evaluator, range parser, solver hay scheduler.
- UI dùng inline styles có chủ đích để D thay bằng design system.
