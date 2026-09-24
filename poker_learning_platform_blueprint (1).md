# Quy trình xây dựng web học Poker, Blackjack và game theory: EV, GTO và bàn luyện tập

> Phiên bản 2 — mở rộng từ NLHE trainer thành nền tảng học **decision-making under uncertainty** cho poker và blackjack. Tài liệu này lấy *The Theory of Poker* của David Sklansky làm trục tư duy; cuốn sách bàn về các ý tưởng áp dụng cho nhiều biến thể, gồm draw, stud, hold'em, lowball và razz, chứ không chỉ NLHE. [Thông tin xuất bản/tóm tắt phạm vi](https://books.google.com/books/about/The_Theory_of_Poker.html?id=7HJtinI6u6sC)

## 0. Trạng thái triển khai hiện tại — cập nhật 24/09/2026

Tài liệu này vừa là product blueprint vừa là hợp đồng làm việc. Các đoạn bên dưới mô tả **mục tiêu**; bảng này mới là trạng thái code đã có trong repository tại commit `2ba317c`.

| Khu vực | Trạng thái thực tế | Ghi chú bàn giao |
|---|---|---|
| A — Platform | Đã có monorepo pnpm, Next.js/Vercel, Neon PostgreSQL, Drizzle, GitHub OAuth, profile API, health check và rate limit | Production đang chạy. Preview dùng biến `DATABASE_URL_PREVIEW`; migration vẫn chỉ do A chạy. |
| B — Math | Đã có package `@pokerlingo/math` **demo** và test đơn vị cơ bản | Có pot odds/call EV, edge roulette, overround và gợi ý Blackjack đơn giản; chưa có evaluator, range parser hay solver. |
| C — Learning | Đã có contract Zod + fixture API **demo** | Có scenario/attempt/dashboard mock; chưa có persistence, admin publish, XP ledger, daily scheduler hoặc scoring thật. |
| D — Product/social | Đã có vertical slice `/demo` tiếng Việt | Happy path demo: chọn action → xem EV loss → xem XP/quest/leaderboard/friends mock. Chưa có design system, social mutation hoặc privacy enforcement. |

**Quy tắc đọc tài liệu:** không coi mock data, score hay leaderboard demo là dữ liệu sản phẩm. Khi thay demo bằng production code, giữ DTO tại `@pokerlingo/contracts/demo` hoặc thực hiện thay đổi có version/changelog.

## 1. Mục tiêu sản phẩm

Xây dựng một web app giúp người học **ra quyết định có lý do định lượng**, thay vì học thuộc chart hay chơi theo cảm giác. Sản phẩm có hai nhánh game khác bản chất:

- **Poker:** game thông tin không hoàn hảo, có đối kháng; EV phụ thuộc range, vị trí, betting tree và chiến lược đối thủ.
- **Blackjack:** game gần như thông tin hoàn hảo về rules/shoe composition; nội dung học là expected value, basic strategy, card counting simulation và risk management — không phải GTO đối kháng.

MVP vẫn bắt đầu với No-Limit Hold'em (NLHE) cash game 6-max, nhưng kiến trúc không được khóa vào NLHE.

Người học có thể:

- học khái niệm: range, equity, pot odds, implied odds, fold equity, EV;
- luyện xử lý spot theo street (preflop, flop, turn, river);
- xem đáp án và cách tính EV từng action;
- đối chiếu lựa chọn của mình với chiến lược tham chiếu GTO;
- theo dõi các lỗi lặp lại để có lộ trình luyện tập cá nhân.
- luyện blackjack theo ruleset bàn cụ thể, tính EV hit/stand/double/split và nhận feedback theo basic strategy.

> Định vị: công cụ giáo dục và mô phỏng quyết định, không phải công cụ hỗ trợ chơi theo thời gian thực tại bàn poker.

## 2. Phạm vi và nguyên tắc thiết kế

### 2.1. Product scope theo tầng

| Tầng | Poker | Blackjack | Mục tiêu |
|---|---|---|---|
| Foundation | hand ranking, pot odds, range/combo | card values, house rules, expected value | xác suất và EV |
| Core practice | NLHE preflop + postflop spot tĩnh | basic strategy drill | ra quyết định nhanh, giải thích được |
| Advanced | GTO reference, exploit, multi-street tree | shoe composition, counting simulator | mô hình hóa assumptions |
| Expert | solver import cho game tree hẹp | EV deviations theo count/rules | nghiên cứu/huấn luyện sâu |

### 2.2. MVP nên làm gì

1. Học preflop cơ bản: open, call, 3-bet, fold theo vị trí và effective stack.
2. Practice mode bằng các tình huống được tạo sẵn / sinh ngẫu nhiên có kiểm soát.
3. EV calculator cho các tình huống heads-up đơn giản.
4. Range editor dạng ma trận 13×13.
5. Dashboard về accuracy, EV loss và các lỗi phổ biến.
6. Blackjack basic strategy practice, với ruleset hiển thị rõ (deck count, dealer soft-17, double/split/surrender).

### 2.3. Chưa làm ở MVP

- Không tự viết solver GTO hoàn chỉnh cho postflop; chi phí tính toán và độ phức tạp rất lớn.
- Không có real-time hand assistance, screen scraping hay kết nối poker client.
- Không làm đa biến thể poker, tournament ICM phức tạp, multiway solver.
- Không hứa hẹn “GTO tuyệt đối” nếu dữ liệu chỉ là approximation/chart tham chiếu.
- Không đưa ra “blackjack winning system”; house edge và EV phải được trình bày trung thực theo ruleset/số deck.

### 2.4. Nguyên tắc sản phẩm

- **Explainable first:** mỗi đáp án phải có lý do, không chỉ đúng/sai.
- **Tách engine khỏi UI:** logic poker là module độc lập, test được bằng unit test.
- **Provenance rõ ràng:** mọi chart/solution có version, assumptions và nguồn.
- **Progressive difficulty:** từ pot odds và equity một hand đến range-vs-range, sau đó là tree quyết định.
- **Game-specific truth:** không áp khái niệm GTO của poker sang blackjack; từng game engine phải có rules và rubric riêng.

## 3. Khung kiến thức từ *The Theory of Poker*

*The Theory of Poker* nên là **xương sống tư duy**, không phải một nguồn chart để sao chép. Các lesson được tổ chức theo ý tưởng: expected value, deception/bluffing, raising, slow play, position, psychology, heads-up play, game theory, implied odds, free card và semi-bluff. [Tóm tắt mục lục/chủ đề](https://books.google.com/books/about/The_Theory_of_Poker.html?id=7HJtinI6u6sC)

| Nguyên lý | Bài học tương tác trong web | Áp dụng |
|---|---|---|
| Fundamental Theorem | “Nếu nhìn thấy bài/range thật, action nào có EV cao nhất?” rồi quay lại bài toán range | mọi poker variant |
| EV và pot odds | calculator + compare fold/call/raise | poker, blackjack |
| Deception | chọn value/bluff/mixed line khiến đối thủ khó phản ứng đúng | poker |
| Position & free card | replay action tree theo thứ tự hành động | flop games, stud |
| Implied / reverse implied odds | sensitivity lab cho stack, future bets và range | poker |
| Semi-bluff | tách fold equity và showdown equity | poker |
| Game theory | frequency/mixing/exploitability dưới assumptions cố định | poker, game tree hẹp |

Diễn giải sản phẩm của Fundamental Theorem: người học được rèn cách ra quyết định gần với quyết định tối ưu nếu biết thông tin ẩn; **range construction, blocker, sizing và chiến lược cân bằng** là công cụ để xấp xỉ điều đó. Đây là một khung sư phạm, không phải định lý toán học đủ để tự giải mọi spot.

## 4. Hành trình người dùng

```mermaid
flowchart TD
  A[Chọn bài học hoặc chế độ luyện] --> B[Nhận poker spot]
  B --> C[Chọn action và size]
  C --> D[Engine tính EV và chấm điểm]
  D --> E[Giải thích: range, equity, pot odds]
  E --> F[Lưu lỗi và cập nhật dashboard]
  F --> G[Đề xuất bài luyện kế tiếp]
```

Ví dụ: người học ở BTN, stack 100bb, mở 2.5bb; BB 3-bet 10bb; hero cầm AQs. Web yêu cầu chọn fold/call/4-bet. Sau khi trả lời, web hiển thị range 3-bet giả định của BB, equity của AQs trước range đó, pot trước quyết định, EV của từng line và lời giải thích ngắn.

## 5. Kiến trúc tổng thể

```mermaid
flowchart TD
  UI[Web client: Next.js] --> API[Backend API]
  API --> AUTH[Auth và hồ sơ học viên]
  API --> PRACTICE[Practice / chấm điểm]
  API --> ENGINE[Poker engine]
  API --> CONTENT[Content & scenario service]
  ENGINE --> CALC[Game-specific EV engines]
  CONTENT --> DB[(PostgreSQL)]
  PRACTICE --> DB
  AUTH --> DB
  ENGINE --> SOL[Reference charts / solver exports]
```

### 5.1. Stack gợi ý

| Lớp | Lựa chọn | Vai trò |
|---|---|---|
| Frontend | Next.js + TypeScript + Tailwind | UI nhanh, SSR, typed codebase |
| Backend | Next.js route handlers hoặc NestJS/FastAPI | API, auth, practice workflow |
| Database | PostgreSQL + Drizzle | người dùng, hand, kết quả luyện |
| Cache / queue | Redis (khi cần) | cache equity, job nặng |
| Poker math | TypeScript module hoặc Python microservice | evaluator, equity Monte Carlo, EV |
| Deploy | Vercel + managed PostgreSQL / Docker | MVP dễ triển khai |

Nếu team mạnh Python/data hơn frontend, dùng **FastAPI** cho engine/API và Next.js chỉ làm client là cấu trúc rất hợp lý.

## 6. Domain model: nói cùng một “ngôn ngữ game”

Tách phần **generic** khỏi luật từng game. Đây là điều quyết định liệu thêm Omaha/Blackjack về sau có làm vỡ codebase hay không.

| Abstraction | Trách nhiệm |
|---|---|
| `GameDefinition` | deck, rank rules, player count, dealing, legal actions, terminal condition |
| `Ruleset` | cấu hình có version: blinds/rake hoặc deck/S17/DAS/surrender |
| `State` | trạng thái hiện tại theo game: poker state hoặc blackjack round/shoe state |
| `EVEngine` | đánh giá action dưới ruleset và assumptions |
| `ScenarioGenerator` | tạo spot hợp lệ, có seed và learning tags |
| `Scorer` | so action người học với solution/reference phù hợp game |

Các đối tượng poker cốt lõi:

| Đối tượng | Trường quan trọng |
|---|---|
| `Hand` | 2 lá hero, board, game type |
| `Range` | combo, weight (0–1), notation như `AKs`, `TT+` |
| `PlayerState` | position, stack, invested chips, range |
| `Action` | fold, check, call, bet, raise, all-in; size |
| `GameState` | street, pot, blind, board, players, action history |
| `Scenario` | state ban đầu, mục tiêu học, đáp án/assumptions |
| `Attempt` | action người học, thời gian trả lời, điểm, EV loss |
| `SolutionReference` | chart/solver export, version, rake, stack, sizing |

**Đơn vị quy ước:** lưu tiền theo `bb` (big blind) trong engine. Chỉ chuyển thành chips/currency ở UI. Cách này tránh lỗi làm tròn và giúp so sánh scenario nhất quán.

Với blackjack, lưu stake theo **đơn vị cược gốc** (`unit`), không dùng bb. `BlackjackRules` tối thiểu gồm số deck, penetration, dealer hits/stands soft 17, blackjack payout, double-after-split, split limit, surrender, hole-card/no-hole-card và insurance. Không tồn tại một basic strategy đúng cho mọi ruleset.

## 7. Engine tính toán: phần quan trọng nhất

### 7.1. Poker equity engine

Đầu vào: hero hand/range, villain range, board hiện có.

Đầu ra: win %, tie %, equity và số sample hoặc số combo đã enumerate.

Hai chế độ:

- **Exact enumeration:** dùng khi số board runout/combo còn đủ nhỏ; kết quả chính xác.
- **Monte Carlo:** sample ngẫu nhiên khi range hoặc multiway lớn; trả cả sai số ước lượng và seed để tái lập.

Điều kiện bắt buộc:

- không cho phép lá bài trùng giữa hand, board và combo range;
- normalize trọng số combo sau khi loại blocker;
- cache theo hash của `heroRange + villainRange + board + rules`.

### 7.2. Poker: công thức EV nền tảng

Với quyết định call một bet, đặt:

- `P`: pot hiện tại trước bet;
- `B`: số tiền đối thủ bet;
- `C`: phần tiền hero phải bỏ thêm để call;
- `E`: equity của hero khi showdown;

Khi không còn betting ở các street sau:

\[
EV_{call}=E(P+B+C)-C
\]

Nếu hero có thể bet và đối thủ fold với xác suất `F`, khi bị call hero có equity `E` và cần risk `R` để win pot hiện tại `P`:

\[
EV_{bet}=F\cdot P+(1-F)\cdot[E(P+R+V)-R]
\]

Trong đó `V` là phần đối thủ call. UI phải hiển thị assumptions (fold frequency, range khi call, rake), vì EV không có ý nghĩa nếu người dùng không biết các giả định này.

### 7.3. Poker: decision tree EV

Đừng hard-code công thức theo từng màn hình. Biểu diễn một spot bằng cây:

```text
Node: game state
 ├─ action: fold  → terminal payoff
 ├─ action: call  → showdown hoặc state street kế tiếp
 └─ action: raise → opponent response distribution → state kế tiếp
```

Mỗi node có actor, legal actions, action size, probability (nếu là đối thủ/bot) và transition. Hàm `evaluate(node)` tính EV đệ quy; terminal node dùng chip delta hoặc equity × pot. MVP chỉ cần cây nông, heads-up và response distribution định nghĩa sẵn.

### 7.4. Poker: rake và rule configuration

Tạo `GameRules` versioned: blind, ante, rake %, rake cap, stack depth, table size, allowed sizings. Không trộn rake vào UI hay câu hỏi. Một thay đổi rake có thể khiến một spot sát biên đổi từ call sang fold.

### 7.5. Blackjack EV engine

Blackjack engine dùng `BlackjackState` gồm player hand, dealer upcard, shoe composition (hoặc infinite-deck approximation), allowed actions và ruleset. Mỗi action trả về:

\[
EV(action\mid state, ruleset)=\sum_{c\in remaining\ cards}P(c)\times EV(nextState_c)
\]

- **Exact finite-deck:** enumerate hoặc dynamic programming theo thành phần shoe; phù hợp backend/job cache.
- **Basic-strategy table:** precompute từ engine cho từng ruleset phổ biến; phù hợp drill thời gian thực.
- **Counting simulator:** hiển thị running count, true count, penetration và bet-sizing *chỉ như mô phỏng giáo dục*; tách rõ bet spread/risk of ruin khỏi action strategy.

Rubric nên giải thích: action đúng, EV chênh lệch theo unit, rules khiến action thay đổi, và vì sao total “soft/hard/pair” quan trọng. Không dùng equity/range/GTO vocabulary trong blackjack UI nếu không cần.

## 8. GTO: triển khai đúng kỳ vọng

GTO không phải một nút “tính GTO”. Với NLHE postflop, equilibrium phụ thuộc stack, positions, bet-size tree, rake, board và abstraction.

### Giai đoạn 1 — Reference strategy

- Nhập preflop charts đã kiểm chứng hoặc tự xây chart có assumptions rõ.
- Lưu strategy theo combo-weight, ví dụ `A5s: 4bet 35%, call 65%`.
- Chấm theo **EV loss**, không chấm đơn giản “đúng/sai”: action mixed vẫn có thể tốt.

### Giai đoạn 2 — Solver export integration

- Import/export từ solver bên ngoài dưới dạng CSV/JSON chuẩn hóa.
- Một solution phải chứa metadata: solver, version, positions, stack, rake, board, tree sizing, convergence/exploitability nếu có.
- UI hiển thị action frequency và EV action, đồng thời gắn nhãn “reference solution under these assumptions”.

### Giai đoạn 3 — Narrow custom solving (tùy chọn)

Chỉ solve các game abstraction rất nhỏ: heads-up, fixed board, 2–3 sizes, limited depth. Chạy job async, queue và cache kết quả. Không cố làm solver tổng quát trước khi product có nhu cầu thật.

## 9. Các màn hình cần có

### 9.1. Learning path

Lộ trình bài học:

1. Hand ranking, position, pot construction.
2. Outs, equity, pot odds, required equity.
3. Range notation, combo counting, blockers.
4. Preflop open/defend/3-bet/4-bet.
5. Flop c-bet, turn barrel, river bluff-catch.
6. GTO concepts: frequency, indifference, mixed strategy, EV loss.

Mỗi lesson gồm giải thích ngắn, ví dụ tương tác và quiz 3–8 câu.

### 9.2. Poker practice table

Giao diện bàn 6-max/heads-up tối giản: vị trí, stack, pot, board, action log, hole cards của hero và thanh action.

- Action chỉ hiện những lựa chọn hợp lệ.
- Bet slider có các preset: 25%, 33%, 50%, 75%, 100%, 150% pot.
- Đồng hồ là tuỳ chọn; không nên dùng ở beginner mode.
- Sau khi answer, reveal kết quả theo 3 lớp: quyết định → EV → range/logic.

### 9.3. Poker EV lab

Người học tự nhập pot, bet, range, board và giả định fold frequency. Hiển thị:

- required equity / pot odds;
- equity tính được;
- EV fold, call, raise;
- sensitivity chart: EV thay đổi khi equity hoặc fold equity thay đổi.

### 9.4. Range editor

Ma trận 169 hand classes, click/drag để chọn, slider weight, notation parser (`22+`, `A2s-A5s`, `KQo+`). Với back-end, phải expand thành **1,326 combos** để xử lý blocker chính xác.

### 9.5. Blackjack trainer

- Bàn blackjack với dealer upcard, player hand, shoe/rules drawer và hit/stand/double/split/surrender/insurance chỉ khi hợp lệ.
- Beginner mode: basic strategy feedback ngay sau answer.
- Explanation mode: breakdown EV của mọi legal action; mô phỏng lần chia tiếp theo.
- Rules comparison: cùng một hand dưới H17 vs S17, 1 deck vs 6 decks, DAS/no-DAS để học rằng chart phụ thuộc luật.
- Counting mode: true-count conversion, deck estimation và simulation có variance; tuyệt đối không hứa kết quả thực tế.

### 9.6. Dashboard

- số spot đã làm, accuracy theo topic/street/position;
- EV loss trung bình (bb/decision);
- lỗi lặp lại: over-fold BB, call quá nhiều river, bluff thiếu blocker;
- mastery và đề xuất 10 spot tiếp theo.

## 10. Poker variants: roadmap và engine rules

| Variant | Khác biệt luật / engine | Khi triển khai |
|---|---|---|
| NLHE | 2 hole cards, dùng 0–2 hole cards + board | MVP |
| Limit Hold'em | bet size/cap cố định | sau NLHE core |
| Pot-Limit Omaha (PLO) | 4 hole cards, **bắt buộc dùng đúng 2** | phase 2; combo engine mới |
| Omaha Hi-Lo | high/low split, qualifying low | phase 3 |
| Short Deck | deck 36 lá, thứ tự hand/rule draw thay đổi | phase 3 |
| Seven-Card Stud | upcards, dead cards, bring-in | phase 3 |
| Razz | low-hand ranking, exposed cards | phase 3 |
| 5-Card Draw / 2-7 Triple Draw | draw actions, discard, hand ranking riêng | phase 4 |

Mỗi variant cần là một `GameDefinition` riêng, kèm test cho evaluator, dealing, action legality và state transition. Không tạo chung một “poker evaluator” rồi thêm cờ `variant`; đó là cách dễ tạo lỗi rules tinh vi nhất, đặc biệt với Omaha và lowball.

## 11. Thiết kế dữ liệu tối thiểu

```sql
users(id, email, created_at)
scenarios(id, title, difficulty, rules_version, initial_state_json, explanation_md)
scenario_actions(id, scenario_id, action_json, ev_bb, grade_label)
attempts(id, user_id, scenario_id, selected_action_json, ev_loss_bb, score, created_at)
ranges(id, owner_id, name, combo_weights_json, version)
solution_references(id, scenario_id, metadata_json, strategy_json, source_url)
learning_progress(id, user_id, topic, mastery, last_practiced_at)
game_definitions(id, key, version, metadata_json)
blackjack_rulesets(id, key, rules_json, engine_version)
blackjack_attempts(id, user_id, ruleset_id, state_json, selected_action, ev_loss_unit, created_at)
```

JSON phù hợp với game state/action tree thay đổi nhanh; các cột hay query (`user_id`, `scenario_id`, `topic`, `created_at`) cần index bình thường.

## 12. API tối thiểu

| Endpoint | Mục đích |
|---|---|
| `GET /api/scenarios?topic=&difficulty=` | lấy scenario luyện tập |
| `POST /api/attempts` | nộp action, nhận điểm/EV/explanation |
| `POST /api/ev/calculate` | tính equity/EV trong EV lab |
| `POST /api/ranges/parse` | parse notation thành combo-weight |
| `POST /api/blackjack/evaluate` | EV và explanation cho một blackjack state |
| `GET /api/blackjack/drills?ruleset=` | lấy hand luyện blackjack |
| `GET /api/progress/me` | dashboard cá nhân |
| `POST /api/admin/scenarios` | tạo/import scenario (admin) |

Response của calculation phải bao gồm `assumptions`, `engine_version`, `calculation_method` và `warnings`; tránh trả một số EV trần trụi.

## 13. Quy trình xây dựng theo sprint

### Sprint 0 — Curriculum & math specification (3–5 ngày)

- Chốt: NLHE cash 6-max, đơn vị bb, 100bb default, rake model, ngôn ngữ UI.
- Viết 20 scenario mẫu trên giấy/JSON; xác định input, answer, explanation.
- Viết test cases thủ công cho pot odds, equity, fold/call EV.
- Chọn nguồn chart/solver export hợp pháp và ghi metadata.
- Viết learning map từ *The Theory of Poker* → module → drill → skill đo được; không sao chép nguyên văn nội dung sách.
- Chốt blackjack ruleset đầu tiên: đề xuất 6-deck, S17, DAS, late surrender, 3:2 payout; engine phải cho phép thay đổi.

**Done khi:** team có PRD ngắn, schema scenario và 20 spot có expected result.

### Sprint 1 — Foundation (1 tuần)

- Khởi tạo Next.js, TypeScript, lint/format/test, auth và PostgreSQL.
- Xây domain types: cards, hand, range, action, game state.
- Làm card parser và hand evaluator.
- Tạo seed 20 scenario.

**Done khi:** một scenario load được từ database, UI render được bàn và legal actions.

### Sprint 2 — Poker math engine (1–2 tuần)

- Implement exact equity cho heads-up và Monte Carlo fallback.
- Implement pot odds, required equity, call EV, bet EV.
- Tạo deterministic tests: known board, known range, tie cases, blockers.
- Benchmark và cache.

**Done khi:** engine trả đúng kết quả cho toàn bộ golden tests, có display assumptions.

### Sprint 2B — Blackjack engine & trainer (1 tuần)

- Implement blackjack state, legal actions, dealer-play resolution và exact/DP EV cho một ruleset.
- Precompute basic-strategy reference từ chính engine.
- Build drill table, result screen và test rules variations.

**Done khi:** mọi hand trong basic strategy table có explanation và regression test theo ruleset version.

### Sprint 3 — Practice loop & explanations (1 tuần)

- Bàn luyện tập, action sizing, submit attempt.
- Server chấm EV loss so với best/mixed reference action.
- Trang result và explanation Markdown.
- Lưu attempt và basic dashboard.

**Done khi:** người dùng hoàn tất 10 hand liên tiếp, xem được lỗi và tiến độ.

### Sprint 4 — Range editor & preflop GTO reference (1–2 tuần)

- Range grid + notation parser + blockers.
- Import preflop strategy reference có metadata.
- Chấm mixed strategy theo expected EV/frequency tolerance.
- Filter drill theo position và spot.

**Done khi:** có thể luyện open/defend/3-bet theo position, xem range overlay sau answer.

### Sprint 5 — Quality, analytics, beta (1 tuần)

- Event tracking: scenario seen, action selected, result viewed, retry.
- Rate limit, validation, error states, accessibility, mobile layout.
- Review 100 scenario về poker logic và wording.
- Beta 10–20 users; đo completion rate, repeat practice, EV loss reduction.

## 14. Chấm điểm và adaptive learning

Một công thức score đơn giản:

\[
score = 100 - a\times EVLoss_{bb} - b\times TimePenalty
\]

Không dùng score thay cho feedback. Lưu thêm `mistake_tag` như `pot_odds`, `range_construction`, `blocker`, `overbluff`, `underdefend`. Bộ chọn scenario tiếp theo ưu tiên:

1. tag có mastery thấp;
2. spot cùng chủ đề nhưng đơn giản hơn nếu sai nặng;
3. variation gần giống nếu người học vừa sai sát biên;
4. spaced repetition cho spot từng làm sai.

## 15. Test và kiểm định tính đúng đắn

### Unit tests bắt buộc

- parser card/range; không có duplicate card;
- số combos: pair = 6, suited = 4, offsuit = 12;
- pot odds và required equity;
- evaluator: win/loss/tie ở tất cả hand rank;
- blocker làm loại combo đúng;
- deterministic Monte Carlo với fixed seed.
- blackjack: dealer soft/hard 17, natural payout, split/double/surrender legality, finite-shoe card removal.

### Integration tests

- load scenario → action → result → attempt được lưu;
- action bất hợp lệ bị từ chối ở server;
- solution reference mismatch rules version bị cảnh báo;
- scenario có pot/stack không bảo toàn bị reject lúc publish.

### Poker QA checklist

- Pot gồm đúng tất cả chip đã committed chưa?
- `to call` có trừ phần hero đã invested chưa?
- Rake xuất hiện ở đúng thời điểm/chỉ áp dụng khi flop theo rules chưa?
- Equity có tính range sau blocker chưa?
- Lời giải có cùng assumptions với engine không?

### Blackjack QA checklist

- Ruleset có hiện ngay trong scenario và đi vào cache key không?
- Dealer hole-card/no-hole-card, S17/H17 và 3:2/6:5 payout có xử lý riêng không?
- Sau split, split aces và double-after-split có theo đúng rules không?
- EV table có được regenerate khi engine/rules version đổi không?

## 16. Bảo mật, đạo đức và pháp lý

- Chỉ cho phép **study mode**, không thiết kế tích hợp hỗ trợ quyết định khi đang chơi tiền thật.
- Có age gate, điều khoản sử dụng, cảnh báo rủi ro cờ bạc và link hỗ trợ nếu phù hợp thị trường.
- Không lưu dữ liệu thanh toán/card không cần thiết.
- Người dùng có thể export/delete lịch sử học của họ.
- Kiểm tra license trước khi phân phối chart, database hand hoặc solver output của bên thứ ba.

## 17. Metrics để biết sản phẩm có ích

| Nhóm | Chỉ số |
|---|---|
| Activation | hoàn tất lesson đầu + 10 spot đầu |
| Learning | EV loss trung bình giảm theo tuần/topic |
| Engagement | practice sessions/tuần, retry rate |
| Quality | calculation error rate, scenario report rate |
| Retention | D1/D7/D30 retention |

Không dùng win-rate poker tiền thật làm metric trung tâm: nó bị nhiễu bởi variance và không cần thiết cho mục tiêu học.

## 18. Cấu trúc code mục tiêu sau demo

Repository hiện có `apps/web`, `packages/contracts`, `packages/db` và `packages/math`. Các package bên dưới là cấu trúc mục tiêu để B/C/D mở rộng dần; chưa được hiểu là đã tồn tại hoặc đã deploy. Khi tạo mới, giữ engine thuần TypeScript, không phụ thuộc React/DB.

```text
apps/web/                 # Next.js pages và components
apps/api/                 # API nếu tách deployment
packages/poker-core/      # cards, range, evaluator, equity, EV tree
packages/blackjack-core/  # shoe, rules, dealer policy, EV DP, simulation
packages/game-core/       # shared GameDefinition, scenario, scoring contracts
packages/scenario-schema/ # Zod schema và scenario validator
packages/ui/              # table, range-grid, action bar
data/scenarios/           # JSON scenario versioned
data/strategies/          # licensed reference charts / solver exports
docs/                     # assumptions, content authoring guide
```

`poker-core` và `blackjack-core` không được import React/DB. Đây là điều giúp engine test được, tái sử dụng được ở API/worker và tránh biến logic toán thành code UI khó sửa.

## 19. Thứ tự ưu tiên thực tế

Làm theo thứ tự này:

1. **Core curriculum từ The Theory of Poker** + preflop drills + explanation chất lượng.
2. **EV Lab** cho pot odds, equity và fold equity.
3. **Blackjack basic-strategy trainer** cho một ruleset minh bạch.
4. Postflop scenario tĩnh có strategy reference và ruleset comparison blackjack.
5. Adaptive learning + dashboard.
6. PLO trước, rồi các variants còn lại; solver export/import chỉ sau đó.

Nếu chỉ có một developer, MVP tốt nhất là: 60 NLHE preflop scenario, 40 blackjack basic-strategy scenario, một ruleset mỗi game, EV Lab heads-up, range chart reference và dashboard. Đừng bắt đầu bằng solver hoặc PLO; nội dung đúng, feedback tốt và practice loop mới là thứ khiến người học quay lại.

## 20. Tiêu chí “sẵn sàng ra beta”

- 100 scenario đã được reviewer poker kiểm tra.
- 95%+ scenario có explanation và assumptions đầy đủ.
- Golden test cover card/range/equity/EV quan trọng; không có lỗi chip conservation.
- Người dùng mới có thể hoàn thành practice đầu tiên trong dưới 3 phút.
- Mỗi answer đều nói rõ action tốt hơn bao nhiêu `bb EV`, thay vì chỉ hiện màu xanh/đỏ.
- Blackjack scenario hiển thị `unit EV` và đủ ruleset; người học không thể nhầm chart của một luật là chân lý chung.

## 21. Nguồn học liệu và cách dùng có trách nhiệm

1. David Sklansky, *The Theory of Poker* — dùng để thiết kế curriculum khái niệm và dạng bài; phải mua/được cấp phép để sử dụng nguyên văn hoặc tái bản minh họa. [Mô tả sách](https://books.google.com/books/about/The_Theory_of_Poker.html?id=7HJtinI6u6sC)
2. Survey GTO poker — dùng cho phần giải thích giới hạn của Nash equilibrium, abstraction và multi-player poker, không coi là nguồn chart. [A Survey on Game Theory Optimal Poker](https://arxiv.org/abs/2401.06168)
3. Tự sinh scenario và explanation bằng engine/reference có version; lưu nguồn mọi chart/solver output và kiểm tra license trước khi phân phối.

Không đưa toàn văn, bài tập gốc, bảng chart có bản quyền hoặc khẳng định nội dung suy diễn là quan điểm trực tiếp của Sklansky. Mỗi lesson cần ghi nhãn: “inspired by a concept”, “derived calculation” hoặc “solver/reference result”.

## 22. Pipeline triển khai đầy đủ trên Vercel

### 22.1. Kiến trúc deploy

```mermaid
flowchart TD
  DEV[Developer branch] --> PR[Pull request]
  PR --> CI[GitHub Actions: lint, test, build]
  CI --> PV[Vercel Preview]
  PV --> QA[QA / review]
  QA --> MAIN[Merge main]
  MAIN --> MIGRATE[Run DB migration once]
  MIGRATE --> PROD[Vercel Production]
  PROD --> DB[(Managed PostgreSQL)]
  PROD --> REDIS[(Redis / queue)]
  REDIS --> WORKER[External compute worker]
```

Vercel host **web Next.js, API route handlers, authentication và thao tác database ngắn**. Equity Monte Carlo lớn, precompute Blackjack finite-deck, solver import hoặc job tạo scenario đi qua queue đến worker Docker/FastAPI riêng. Cách chia này phù hợp với Vercel Functions, vốn phù hợp cho API và có giới hạn thời gian/memory theo plan; không dùng function request để chạy job lâu. [Vercel Functions](https://vercel.com/docs/functions)

### 22.2. Monorepo chuẩn để Vercel nhận ngay

```text
.
├─ apps/
│  └─ web/                         # Next.js app; build từ repository root
│     ├─ app/
│     ├─ app/api/
│     ├─ lib/
│     └─ package.json
├─ packages/
│  ├─ contracts/                    # Zod DTO: auth, game, learning, social, demo
│  ├─ db/                           # Drizzle schema + migrations
│  └─ math/                         # B: pure demo math package + unit tests
├─ .github/workflows/ci.yml
├─ package.json
├─ pnpm-workspace.yaml
├─ vercel.json
├─ turbo.json                       # chỉ khi dùng Turborepo
├─ .env.example
└─ README.md
```

Thiết lập Vercel Project:

| Setting | Giá trị |
|---|---|
| Git repository | repo GitHub của dự án |
| Framework preset | Next.js |
| Root Directory | repository root (để pnpm workspace resolve packages) |
| Install command | `pnpm install --no-frozen-lockfile` |
| Build command | `pnpm --filter @pokerlingo/web build` |
| Production branch | `main` |
| Node version | pin bằng `.nvmrc` hoặc `engines.node` |

Vercel tự tạo Preview Deployment cho branch/PR và Production Deployment khi merge vào production branch. `apps/web/vercel.json` là source of truth cho install/build commands hiện tại. [Git deployments](https://vercel.com/docs/git) [Preview environments](https://vercel.com/docs/deployments/environments)

### 22.3. Package scripts hiện tại và mục tiêu

```json
{
  "scripts": {
    "dev": "pnpm --filter @pokerlingo/web dev",
    "lint": "pnpm --filter @pokerlingo/web lint",
    "typecheck": "pnpm -r typecheck",
    "test": "pnpm -r test",
    "build": "pnpm --filter @pokerlingo/web build",
    "db:generate": "pnpm --filter @pokerlingo/db generate",
    "db:migrate": "pnpm --filter @pokerlingo/db migrate",
    "db:seed": "pnpm --filter @pokerlingo/db seed"
  },
  "packageManager": "pnpm@9.15.4",
  "engines": { "node": ">=20.11.0" }
}
```

Các lệnh trên là trạng thái hiện tại. Mục tiêu sau khi có lockfile ổn định là chuyển install CI/Vercel sang `--frozen-lockfile`; không commit `.env*` thật, `.vercel/` hay output build.

### 22.4. Biến môi trường

Tạo `.env.example` không chứa secret:

```bash
# public
NEXT_PUBLIC_APP_URL=http://localhost:3000

# required server-only
DATABASE_URL=
AUTH_SECRET=
AUTH_URL=http://localhost:3000
AUTH_GITHUB_ID=
AUTH_GITHUB_SECRET=

# Preview only: Neon branch, never production credentials
DATABASE_URL_PREVIEW=

# rate limit hiện tại
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# roadmap operations (chưa cấu hình)
CRON_SECRET=
SENTRY_DSN=
```

Tạo ba bộ giá trị tách biệt trong Vercel: **Development**, **Preview**, **Production**. Preview phải dùng database/Redis riêng hoặc database branch; không cho PR dùng production credentials. Chỉ biến có tiền tố `NEXT_PUBLIC_` mới được gửi xuống browser. [Vercel Environment Variables](https://vercel.com/docs/environment-variables)

### 22.5. `vercel.json` tối thiểu

```json
{
  "framework": "nextjs",
  "installCommand": "pnpm install --no-frozen-lockfile",
  "buildCommand": "pnpm --filter @pokerlingo/web build"
}
```

Đây là cấu hình đang chạy. Chỉ thêm `crons` khi đã có route cron thật; endpoint phải kiểm tra `CRON_SECRET` trước khi làm việc. Vercel Cron gọi function theo lịch qua cấu hình project. [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs)

Không đặt migration, seed lớn, worker hay solver trong `buildCommand`. Một build có thể chạy cho mỗi preview và có thể bị retry; chạy side effect ở đây gây migration lặp hoặc thay dữ liệu production.

### 22.6. CI hiện tại và hardening tiếp theo

`.github/workflows/ci.yml`:

```yaml
name: CI
on:
  pull_request:
  push:
    branches: [main]

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9.15.4 }
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --no-frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm test
      - run: pnpm build
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/pokerlingo
```

CI hiện kiểm tra lint, typecheck, test và production build. **Chưa xác nhận branch protection**; trước khi có nhiều người cùng code, A cần bật require CI xanh + review và ngừng push trực tiếp vào `main`. Vercel Git integration là lớp deploy, GitHub Actions là lớp chặn sớm.

### 22.7. Database migration không downtime

Quy tắc deploy theo thứ tự:

1. Viết migration **additive**: thêm table/column nullable/index mới, không xóa/rename ngay.
2. Merge `main`; hiện chạy `pnpm db:migrate` **một lần** từ môi trường kiểm soát có production `DATABASE_URL`. Khi CI/CD được harden, A có thể thêm script `db:migrate:deploy` riêng thay vì chạy migration trong Vercel Build Step.
3. Deploy application có thể đọc/ghi cả schema cũ và mới.
4. Backfill bằng worker idempotent nếu cần.
5. Chỉ ở release sau mới remove schema cũ.

Migrations không chạy trên Preview và không chạy automatic trong Vercel Build Step. Production database cần connection pooling/serverless-compatible driver vì API instances scale ngang.

### 22.8. Compute queue pipeline

| Request | Vercel route handler | Queue/worker | Kết quả client |
|---|---|---|---|
| EV Lab nhỏ | tính trực tiếp, timeout ngắn | không cần | JSON ngay |
| Equity/range lớn | validate + tạo job | exact/Monte Carlo | polling hoặc SSE |
| Import solver | upload metadata | parse, validate, normalize | job status |
| Blackjack precompute | enqueue theo ruleset version | DP/generate table | cache reference |
| Scenario generation | enqueue batch | validate + publish draft | admin notification |

Mỗi job có `id`, `type`, `payload_version`, `idempotency_key`, `status`, `attempts`, `result_ref`, `created_at` và `trace_id`. Worker xác thực bằng service token khác với user session token. Worker lưu kết quả vào Postgres/object storage; không trả output lớn qua URL query string.

### 22.9. Health, observability và rollback

- `GET /api/health` hiện kiểm tra version app và DB reachability; khi có queue mới bổ sung queue reachability. Không lộ secret.
- Structured logs: `request_id`, `user_id` đã hash (nếu cần), `scenario_id`, `engine_version`, `duration_ms`, `error_code`.
- Error tracking: Sentry hoặc provider tương đương cho browser, route handler và worker. **Chưa kết nối ở bản hiện tại.**
- Monitor: function error rate, p95 latency, DB connection failures, queue depth, failed-job rate, EV calculation timeout.
- Rollback app: chọn deployment Vercel trước đó và promote lại; database migration additive giúp code cũ vẫn chạy.
- Rollback data: scenario/strategy/reference luôn versioned, publish bằng trạng thái `draft → reviewed → published`, không overwrite dữ liệu đã dùng để chấm attempt.

### 22.10. Checklist đưa lên production lần đầu

- [ ] GitHub repo có `main` protected và CI passing. (CI có; branch protection chưa xác minh.)
- [x] Vercel Project đã kết nối repo và build từ repository root bằng pnpm workspace.
- [x] Production và Preview có connection database tách qua `DATABASE_URL` / `DATABASE_URL_PREVIEW`.
- [x] Migration foundation đã chạy trên Production; migration domain mới vẫn phải additive và do A chạy.
- [x] `/api/health` trả 200 trên Production.
- [ ] Xác nhận backup, pooling và retention của Production Neon trước khi có dữ liệu người dùng thật.
- [x] GitHub OAuth callback và rate limit cho login/profile đã được cấu hình.
- [ ] Xác minh Preview URL từ một PR thật.
- [ ] Rate limit cho EV calculate, admin import và API public khi các route thật được thêm.
- [ ] Cron endpoint kiểm tra secret; worker token không lộ sang client.
- [ ] Tắt source-map/public log chứa sensitive payload nếu không cần.
- [ ] Có alert cho error spike, DB failure và queue backlog.

### 22.11. Luồng làm việc mỗi ngày

1. Tạo branch `feat/... ` hoặc `fix/...`.
2. Chạy local: `pnpm lint && pnpm typecheck && pnpm test`.
3. Mở PR; CI chạy và Vercel tạo Preview URL.
4. QA test scenario/EV assumptions trên Preview với dữ liệu preview.
5. Approve → merge `main`.
6. Pipeline migration (nếu có) chạy một lần, sau đó Vercel Production deploy.
7. Smoke test: login, load drill, submit attempt, EV Lab và health endpoint.

Vercel có thể build/deploy theo Git hoặc CLI; với production workflow của dự án này, Git + Preview PR là luồng mặc định để có traceability. [Vercel Deployments](https://vercel.com/docs/deployments)

## 23. Tài khoản, tiến trình và social learning

### 23.1. Login và profile

Hệ thống cần có tài khoản từ đầu, vì XP, streak, daily puzzle, bạn bè và leaderboard đều cần identity đáng tin cậy.

| Khả năng | Thiết kế đề xuất |
|---|---|
| Đăng nhập | **Hiện tại:** GitHub OAuth. Google OAuth và email magic link là mở rộng tùy chọn, chưa cấu hình. |
| Session | HTTP-only secure cookie; session server-side hoặc JWT ngắn hạn có rotation |
| Profile | handle duy nhất, display name, avatar, timezone, level và privacy setting |
| Account safety | email verification, rate limit login, revoke session, audit log |
| Age/safety | age gate, export/xóa dữ liệu và self-exclusion khỏi social prompts |

Không dùng email làm tên trên bảng xếp hạng. Mặc định profile và lịch sử học là private; người dùng chủ động bật quyền cho bạn bè hoặc public leaderboard.

### 23.2. XP, level và mastery

Tách ba thước đo để không biến việc học thành grind:

| Chỉ số | Ý nghĩa | Nguồn |
|---|---|---|
| XP | mức độ tham gia tích lũy | lesson, drill, quest, daily puzzle |
| Level | mốc trải nghiệm/mở khóa nội dung | XP threshold cố định |
| Mastery | mức độ hiểu một chủ đề | accuracy, EV loss, spaced repetition |

XP chỉ đến từ hoàn thành có giới hạn, không mua được và không phụ thuộc “thắng tiền” giả lập. First attempt có giá trị hơn retry; daily/quest có cap. Server tính và append XP ledger; client không bao giờ tự gửi XP hay rank.

### 23.3. Daily puzzle, quest và streak

Daily puzzle là một scenario chuẩn hóa: mọi người thấy cùng puzzle trong 24 giờ. Dùng puzzle date + game + ruleset version để chọn/seed scenario; freeze solution, rules và scoring khi publish.

| Cơ chế | Quy tắc |
|---|---|
| First attempt | tính bảng daily; answer khóa sau submit |
| Review | mở lời giải, EV và replay sau submit/khi daily kết thúc |
| Scoring | ưu tiên EV loss; time chỉ là tie-breaker nhẹ |
| Fairness | không trả solution/reference cho client trước submit |
| Retry | phục vụ học, không thay điểm daily |
| Timezone | leaderboard theo UTC; UI đổi sang local timezone |

Quest dùng template versioned:

| Loại | Ví dụ | Hoàn thành khi |
|---|---|---|
| Daily | Làm 5 spot pot odds | 5 first-attempt hợp lệ |
| Daily | Giải daily puzzle | có first attempt |
| Weekly | 20 drill với EV loss dưới ngưỡng | đủ sample và metric đạt |
| Weekly | Hoàn tất lesson house edge | quiz + reflection đạt |
| Recovery | Ôn 3 lỗi blocker | spaced-repetition hoàn tất |

Không phạt XP hoặc tạo FOMO nếu mất streak. Streak freeze chỉ là reminder/recovery, không bán và không gắn với tiền.

### 23.4. Friends và leaderboard

Luồng: search handle → gửi request → accept/decline/block. Block phải ẩn profile, leaderboard friends và ngăn request mới; không cho tìm bằng email/phone.

Có ba bảng xếp hạng tách riêng:

1. Daily puzzle: EV-loss normalized trong puzzle ngày đó.
2. Weekly learning: XP có cap + số quest hoàn thành, tránh người có nhiều thời gian luôn thắng.
3. Friends: progress/mastery chỉ của bạn bè đã consent.

Leaderboard theo season 4 tuần, snapshot điểm hàng ngày để audit. Chỉ hiện handle, display name/avatar được phép và level; không hiện lịch sử cược hoặc dữ liệu nhạy cảm.

### 23.5. Data model và API

~~~sql
profiles(user_id PK, handle UNIQUE, display_name, avatar_url, timezone, visibility)
xp_ledger(id, user_id, source_type, source_id, xp_delta, idempotency_key UNIQUE, created_at)
user_levels(user_id PK, level, cumulative_xp, updated_at)
mastery_scores(user_id, topic_key, score, sample_count, updated_at)
daily_puzzles(id, puzzle_date, game_key, scenario_id, solution_version, publish_at, close_at)
daily_puzzle_attempts(id, puzzle_id, user_id, ev_loss, duration_ms, is_first_attempt, created_at)
quest_templates(id, cadence, key, rules_json, xp_reward, version, active)
user_quests(id, user_id, template_id, period_start, progress_json, status, completed_at)
friendships(id, requester_id, addressee_id, status, created_at, responded_at)
user_blocks(blocker_id, blocked_id, created_at)
leaderboard_snapshots(id, board_key, period_key, user_id, rank, score, metadata_json)
~~~

Các unique constraint: một first-score cho mỗi puzzle/user; một quest active cho mỗi user/template/period; friendship canonical theo cặp user. Mutation XP/quest/daily chạy transactionally.

| Endpoint | Quyền | Chức năng |
|---|---|---|
| GET /api/daily-puzzle | signed-in | lấy state puzzle, không trả solution |
| POST /api/daily-puzzle/attempts | signed-in | chấm first attempt server-side |
| GET /api/quests/me | signed-in | quest và progress |
| POST /api/friends/requests | signed-in | gửi request theo handle |
| POST /api/friends/requests/:id/respond | target | accept/decline |
| GET /api/leaderboards/:board | theo privacy | đọc snapshot, pagination |

Score, EV loss, XP, rank và completion phải server-side. Thêm rate limit, idempotency key, CSRF, bot protection và anomaly flag để review; không auto-ban chỉ vì làm nhanh.

## 24. Học phần toán học nhà cái và rủi ro

Đây là học phần consumer education, không phải casino lobby: không nạp tiền, affiliate link, dự đoán thắng hay lời hứa đánh bại nhà cái. Luôn nhắc rằng EV dài hạn không dự báo kết quả của một phiên riêng lẻ.

### 24.1. Khung toán học chung

Với outcome ròng x_i và xác suất p_i:

\[
EV = \sum_i p_i x_i
\]

\[
House\ Edge = -EV_{player}, \qquad RTP = 1 - House\ Edge
\]

\[
Variance = \sum_i p_i(x_i-EV)^2
\]

\[
Expected\ Loss = Total\ Turnover \times House\ Edge
\]

House edge/RTP là kỳ vọng theo luật đã nêu, không phải phần trăm đảm bảo cho một cá nhân. Variance giải thích tại sao kết quả ngắn hạn có thể khác xa EV.

### 24.2. Curriculum theo game

| Module | Học gì | Lab | Rủi ro cần nêu |
|---|---|---|---|
| Roulette | zero, payout table, edge | European vs American | martingale không đổi EV |
| Blackjack | ruleset, action EV, RTP | S17/H17, deck, payout | basic strategy không bảo đảm thắng |
| Baccarat | probability, commission, side bets | banker/player/tie | side bet thường edge/variance khác |
| Craps | line bets, odds, probability tree | edge map từng bet | cùng bàn có bet chất lượng khác nhau |
| Slots | RTP, volatility, hit rate | session simulation | RTP không nghĩa máy sắp trả |
| Lottery | combinatorics, jackpot EV | probability + rollover | jackpot không đổi odds trúng |
| Sportsbook | implied probability, overround/vig | odds ↔ probability | market odds không là xác suất khách quan |
| Poker | rake, fee, variance | break-even win-rate | poker không có house edge kiểu casino |

Không hard-code house edge chung. Calculator phải lấy payout table/rules. Chẳng hạn roulette wheel một zero có edge 1/37 ≈ 2.70%, còn hai zero là 2/38 ≈ 5.26%, với payout chuẩn và không có rule đặc biệt.

### 24.3. Risk lab và content governance

Risk Lab nhận bankroll giả định, bet size, số round, RTP/edge và variance rồi Monte Carlo để hiển thị:

- distribution kết quả session: median và percentile, không chỉ mean;
- expected turnover, expected loss và khoảng kết quả thường gặp;
- xác suất chạm loss limit theo stop rule mô tả rõ;
- so sánh fixed stake với tăng stake sau thua;
- sensitivity khi đổi payout/rules/edge.

Không hiện bet size tối ưu để thắng hay chiến lược bảo đảm. Với game EV âm và infinite play, risk of ruin phụ thuộc bankroll/stop rule; không trình bày như tỷ lệ chắc chắn khi assumptions thiếu.

Mỗi calculator lưu game version, rules/payout table, công thức, nguồn, test vectors và ngày review. Hiển thị mục What would change this result?: deck, zero, payout, commission, volatility hoặc operator RTP. Nội dung phải được probability/statistics review; enumeration cho state nhỏ và fixed-seed Monte Carlo cho state lớn.

Nguồn học liệu: house edge/RTP là các góc nhìn của return model; variance mô tả độ phân tán kết quả. [Giải thích edge, RTP và variance](https://sacstat.org/house-edge/) Với Blackjack, engine phải xuất phát từ ruleset: một infinite-deck ruleset công bố house edge khoảng 0.5094% khi basic strategy được dùng. [Expected return theo ruleset](https://wizardofodds.com/games/blackjack/player-expected-return/)

### 24.4. Màn hình và thứ tự triển khai

1. Casino Math home: map module, disclaimer, learning objective.
2. Game explainer: luật, payoff table, EV derivation và risk.
3. Calculator: input giới hạn, assumptions rõ, export calculation sheet.
4. Simulation Lab: histogram/session paths, seed và sample count.
5. Quiz + daily educational puzzle: diễn giải EV/risk, không thi chọn kèo.

Triển khai social foundation cùng auth ở Sprint 1; XP/daily quest sau practice loop; friends/leaderboard sau khi server-side scoring ổn định. Casino Math MVP gồm roulette, Blackjack rule comparison, sportsbook overround và poker rake; thêm game mới chỉ khi có versioned rules và test suite.

## 25. Phân công infrastructure cho 4 người

### 25.1. Nguyên tắc chia việc

Không chia theo từng trang web, vì như vậy cả 4 người sẽ cùng sửa database, API và component chung. Chia theo bounded context và khóa các hợp đồng giao tiếp trước:

| Người | Ownership duy nhất | Không tự sửa |
|---|---|---|
| A — Platform | repo, auth, database, migration, deployment, security | logic EV/scoring và UI feature |
| B — Math engine | poker/blackjack/casino math, calculator, test vectors | schema auth, UI page |
| C — Learning system | scenario, curriculum, daily puzzle, quest, XP/mastery rules | calculator internals, auth plumbing |
| D — Product/social UI | Next.js screens, design system, friends, leaderboard, dashboard | migration, engine formula |

Mọi người có thể đề xuất thay đổi ở phần khác qua issue/PR, nhưng owner phải approve. Một file migration chỉ có A tạo; một public contract chỉ thay đổi qua PR có A + owner liên quan review.

### 25.2. Package contract chung — trạng thái v0.1

Trước khi chia code, cả team cùng tạo và freeze v0.1:

~~~text
packages/contracts/
  auth.ts          # CurrentUser, Permission, profile visibility
  game.ts          # GameDefinition, Ruleset, GameState, Action, CalculationResult
  learning.ts      # Scenario, Attempt, DailyPuzzle, Quest, XPEvent, MasteryScore
  social.ts        # FriendRequest, Friendship, LeaderboardEntry
  api.ts           # Zod request/response DTOs + error shape
  demo.ts          # DTO fixture: scenario, attempt result, dashboard
packages/math/
  src/index.ts     # B: pure demo calculations
apps/web/app/api/demo/
  scenario/        # C: fixture scenario
  attempt/         # C: fixture scoring
  dashboard/       # C/D: fixture progression + social
~~~

Quy ước bắt buộc:

- TypeScript strict; Zod là nguồn schema cho request/response.
- API trả lỗi thống nhất: code, message, requestId, details an toàn.
- Bản production dùng integer hoặc decimal string cho money/chip; số float hiện diện trong **fixture demo** chỉ để minh họa EV và phải được thay trước khi persistence.
- Server tự tính score, XP, EV loss, ranking và quest progress.
- Thay đổi breaking contract phải tăng version, update mock và có migration plan.

### 25.3. Người A — Platform, Auth, Data và Vercel

**Mục tiêu:** tạo nền mà ba người còn lại có thể chạy local, test và deploy Preview ngay.

| Hạng mục | Deliverable |
|---|---|
| Monorepo | pnpm workspace, lint, typecheck, test, shared contracts |
| Identity | GitHub OAuth, session database và current-user middleware; Google/magic link để sau |
| Data | PostgreSQL + Drizzle, migration workflow, seed dev |
| Security | rate limit cho login/profile và validation; audit log/CSRF hardening để sau |
| Deploy | GitHub Actions, Vercel Preview/Production, env validation, health endpoint |
| Observability | health endpoint hiện có; requestId, Sentry và structured logging để sau |

**API nền tảng bàn giao:** GET /api/me, GET /api/health, profile read/update, auth callback/logout. A tạo các bảng users, profiles, sessions, audit_logs và migration scaffold cho các domain khác; C/D gửi schema proposal thay vì tự tạo migration.

**Definition of done của A hiện tại:** clone repo → `pnpm install` → `pnpm dev` chạy; GitHub login được khi OAuth secrets/callback đúng; CI lint/typecheck/test/build xanh; Production và Preview dùng DB tách qua `DATABASE_URL` / `DATABASE_URL_PREVIEW`. Preview từ PR và branch protection cần được kiểm tra lại khi team bắt đầu dùng PR thật.

### 25.4. Người B — Game Mathematics và Calculator API

**Mục tiêu:** poker, blackjack và casino math là pure, testable packages; web không chứa công thức.

**Trạng thái demo đã bàn giao:** `packages/math` có `requiredEquity`, `callEvBb`, `rouletteHouseEdge`, `sportsbookOverround` và `blackjackBasicStrategy`, kèm test `packages/math/src/index.test.ts`. `ENGINE_VERSION` được trả ra từ API scenario. Đây là nền pure/testable để B thay thế từng hàm, không phải engine poker hoàn chỉnh.

| Hạng mục | Deliverable |
|---|---|
| Poker core | card/range parser, evaluator, equity, pot odds, EV tree đơn giản |
| Blackjack core | ruleset, legal action, dealer policy, basic-strategy/EV engine |
| Casino math | payout table evaluator, house edge/RTP/variance, simulation interface |
| API | validate input → calculate → trả assumptions, method, engineVersion |
| Quality | golden test vectors, fixed-seed simulation, benchmarks |

**Việc tiếp theo của B:** thêm card/range parser, reject duplicate card, ruleset version và test vector; sau đó tạo `/api/math/*` thật. Không thay đổi DTO demo đang được C/D tiêu thụ nếu chưa có changelog/migration path.

**Definition of done:** mỗi engine chạy bằng unit test không cần DB/UI; endpoint trả cùng kết quả với test vector; request invalid/card duplicate bị reject; result luôn kèm ruleset/assumptions.

### 25.5. Người C — Learning System, Content và Gamification

**Mục tiêu:** biến engine thành lộ trình học, scenario và progression có thể quản trị.

**Trạng thái demo đã bàn giao:** `@pokerlingo/contracts/demo` mô tả Scenario, AttemptResult và Dashboard; `/api/demo/scenario`, `/api/demo/attempt`, `/api/demo/dashboard` trả fixture không cần database. Attempt hiện chỉ chấm `fold/call/raise` của một spot AQs và tuyệt đối không ghi XP/attempt vào DB.

| Hạng mục | Deliverable |
|---|---|
| Content model | scenario JSON/Zod, tags, difficulty, explanation markdown, versioning |
| Admin flow | draft → reviewed → published, import/export seed scenario |
| Practice scoring | attempt workflow gọi engine/reference, EV loss, mistake tags |
| Daily puzzle | scheduler, publish/freeze/close, first attempt và answer reveal |
| Quests/XP | template rules, idempotent XP events, level thresholds, mastery update |
| Casino Math lessons | lesson, quiz, calculator explanation và safety disclaimer |

**Việc tiếp theo của C:** chuyển fixture thành repository/service có schema proposal gửi A; implement draft → reviewed → published, first attempt, idempotency key và XP ledger transactionally. C không được coi dashboard mock là leaderboard thật.

**Definition of done:** admin publish một scenario; user làm attempt và nhận explanation + EV loss; daily puzzle không lộ solution trước submit; XP ledger idempotent; daily/weekly quest chạy được với test theo period.

### 25.6. Người D — Product UI, Social và Dashboard

**Mục tiêu:** biến các API thành trải nghiệm mượt, mobile-friendly và có privacy.

**Trạng thái demo đã bàn giao:** `/demo` là client page tiếng Việt gọi đúng ba API fixture, cho phép chọn action và hiển thị result, XP/quest, leaderboard/friends. Home có link vào demo. UI cố ý dùng inline styles để D thay bằng design system; các nút demo không tạo friend request hay dữ liệu người dùng.

| Hạng mục | Deliverable |
|---|---|
| Design system | layout, cards, buttons, table, loading/error/empty states |
| Core screens | home, learning path, practice table, result, EV Lab, Blackjack trainer |
| Progress UI | profile, XP/level, quest panel, streak, mastery dashboard |
| Social | search handle, friend request, friend list, block/report UI |
| Leaderboard | daily/weekly/friends boards, season selector, privacy labels |
| Accessibility | keyboard action controls, color-independent feedback, responsive layout |

**Việc tiếp theo của D:** tách component/design token, thêm responsive layout và loading/error/empty state, sau đó thay mock API bằng client thật. Friend request, block/report và privacy labels chỉ bật khi C/A có mutation server-side tương ứng.

**Definition of done:** toàn bộ happy path demo được với mock; component test cho action/empty/error states; integration smoke test cho login → drill → result → quest → leaderboard/friend request; không expose private profile data.

### 25.7. Kế hoạch 4 tuần và điểm ghép code

Kế hoạch dưới đây là **roadmap sau demo**, không phải bảng trạng thái hoàn thành. Mốc đã đạt là “vertical slice demo không persistence”; chưa đạt vertical slice production vì chưa có user-scoped attempt → scoring thật → XP/quest/database.

| Tuần | A — Platform | B — Math | C — Learning | D — UI/social | Mốc ghép |
|---|---|---|---|---|---|
| 0 | repo/CI/env | interfaces + test vectors | content schema + 20 scenario | wireframe + UI tokens | freeze contracts v0.1 |
| 1 | auth/profile/DB | poker core + EV API | scenario publish + attempt spec | practice table mock | vertical slice 1 |
| 2 | rate limit/logging | Blackjack + casino calc MVP | scoring + XP + quest | result, dashboard, XP | vertical slice 2 |
| 3 | preview/prod hardening | benchmark + edge tests | daily puzzle scheduler | friends + leaderboard | beta candidate |
| 4 | observability/rollback | bug/perf fixing | content QA + 100 spot | accessibility/mobile QA | release candidate |

Vertical slice 1 phải chạy được: user login → lấy một scenario → chọn action → nhận một result mock/real. Vertical slice 2 phải chạy được end-to-end: attempt → server scoring → XP/quest → dashboard. Chỉ sau đó mới bật leaderboard và friends.

### 25.8. Git workflow để gửi code cho nhau mà không bị vỡ

1. Branch theo owner: feat/platform-auth, feat/math-poker-core, feat/learning-daily, feat/ui-practice. Mỗi PR chỉ giải một issue.
2. Không commit trực tiếp main. Rebase/merge main mỗi ngày trước khi mở PR.
3. CI bắt buộc: format, lint, typecheck, unit test; integration test cho endpoint thay đổi.
4. PR thay đổi contract cần changelog ngắn: breaking/non-breaking, consumer affected, migration/rollout.
5. Mỗi owner review tối thiểu một PR của phần phụ thuộc trước khi merge; A review migration/deploy; B review formula/scoring; D review accessibility/UI.
6. Feature flag các feature chưa hoàn chỉnh: daily puzzle, leaderboard, friends, casino-math labs. Merge code dở được nếu default off và test xanh.
7. Sử dụng mock fixtures versioned trong packages/contracts/fixtures. Không hard-code response mẫu riêng trong từng page.

### 25.9. Handoff template cho từng PR

Mỗi PR/nhóm code gửi cho nhau phải kèm:

~~~md
## What changed
- ...

## Contract
- Added/changed DTO:
- Backward compatible: yes/no

## Run locally
- pnpm ...

## Test evidence
- unit:
- integration:
- preview URL:

## Migration / env / feature flag
- ...

## Known limits
- ...
~~~

Đây là cách để một người có thể nhận phần việc dang dở của người khác mà không cần đọc lại toàn bộ codebase. Mọi handoff cũng phải có owner tiếp theo và issue link.

